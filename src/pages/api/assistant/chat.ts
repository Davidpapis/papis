import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

interface ChatMessageInput {
  role: 'user' | 'model';
  text: string;
}

interface KnowledgeDoc {
  title: string;
  category: string;
  content: string;
  enabled?: boolean;
  order?: number;
}

// Carga directa desde los archivos JSON editables en Keystatic (src/content/knowledge/)
const knowledgeModules = import.meta.glob<{ default: KnowledgeDoc }>(
  '../../../content/knowledge/*.json',
  { eager: true }
);

function buildSystemInstruction(): string {
  const activeEntries = Object.values(knowledgeModules)
    .map((mod) => mod.default)
    .filter((entry) => entry && entry.enabled !== false && entry.content?.trim().length > 0)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  const kbBlock = activeEntries
    .map(
      (entry, idx) =>
        `[${idx + 1}] (${entry.category}) ${entry.title}:\n${entry.content.trim()}`
    )
    .join('\n\n');

  return `Eres el asistente virtual oficial de papis.app (agencia tecnológica y servicio técnico en Marbella, España).

INSTRUCCIONES OBLIGATORIAS:
1. Responde siempre en español de España, con tono cercano, profesional, directo y sin humo.
2. Responde basándote EXCLUSIVAMENTE en la BASE DE CONOCIMIENTO proporcionada a continuación.
3. Si el usuario pregunta por un dato que no figura en la base de conocimiento, dilo con honestidad sin inventar cifras ni promesas e invítale a usar el formulario o WhatsApp.
4. Respuestas claras y concisas (2-4 párrafos breves o viñetas cortas).

BASE DE CONOCIMIENTO ACTIVA:
${kbBlock}`;
}

function classifyGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid') || raw.includes('401')) {
    return 'La clave API de Gemini no es válida o está mal copiada. Revísala en Google AI Studio y en Vercel.';
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return 'La clave API no tiene permisos para Gemini API (verifica en Google AI Studio que la clave esté activa sin restricciones de dominio/IP).';
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('quota')) {
    return 'Se ha alcanzado el límite temporal de consultas de la API de Gemini. Inténtalo en un minuto o escríbenos por WhatsApp.';
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return 'Ningún modelo compatible de Gemini respondió para esta clave API. Verifica en Google AI Studio qué modelos tiene habilitados tu proyecto.';
  }
  return 'No hemos podido conectar con el asistente ahora mismo. Escríbenos por WhatsApp y te atendemos al instante.';
}

async function discoverAvailableModels(ai: GoogleGenAI): Promise<string[]> {
  try {
    const pager = await ai.models.list();
    const names: string[] = [];
    for await (const m of pager) {
      const name = typeof m.name === 'string' ? m.name.replace(/^models\//, '') : '';
      const actions = Array.isArray(m.supportedActions) ? m.supportedActions : [];
      const supportsGenerate =
        actions.length === 0 || actions.includes('generateContent');
      if (
        name &&
        supportsGenerate &&
        name.startsWith('gemini-') &&
        !name.includes('embedding') &&
        !name.includes('imagen') &&
        !name.includes('veo') &&
        !name.includes('tts') &&
        !name.includes('audio')
      ) {
        names.push(name);
      }
    }
    // Priorizar modelos flash rápidos y recientes
    return names.sort((a, b) => {
      const score = (n: string) =>
        (n.includes('flash') ? 0 : 10) + (n.includes('lite') ? 2 : 0) + (n.includes('exp') ? 5 : 0);
      return score(a) - score(b);
    });
  } catch (err) {
    console.error('Error listando modelos Gemini:', err);
    return [];
  }
}

export const POST: APIRoute = async ({ request }) => {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.papisapp?.trim() ||
    import.meta.env.GEMINI_API_KEY?.trim() ||
    import.meta.env.papisapp?.trim();

  const preferredModel =
    process.env.GEMINI_MODEL?.trim() ||
    import.meta.env.GEMINI_MODEL?.trim() ||
    'gemini-flash-latest';

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'El asistente IA necesita configurar GEMINI_API_KEY en el servidor. Mientras tanto, escríbenos por WhatsApp.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { messages?: ChatMessageInput[] };
  const sanitized = (Array.isArray(body.messages) ? body.messages : [])
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.trim().length > 0
    )
    .map((m) => ({ role: m.role, parts: [{ text: m.text.trim().slice(0, 1500) }] }))
    .slice(-14);

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: 'Escribe una consulta para el asistente.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();
  const staticCandidates = Array.from(
    new Set([
      preferredModel,
      'gemini-flash-latest',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3-flash-preview',
    ])
  );

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const systemInstruction = buildSystemInstruction();
      let lastError: unknown = null;

      const tryModel = async (modelName: string): Promise<'ok' | 'fatal' | 'retry'> => {
        try {
          const result = await ai.models.generateContentStream({
            model: modelName,
            contents: sanitized,
            config: {
              systemInstruction,
            },
          });

          for await (const chunk of result) {
            if (chunk.text) send({ text: chunk.text });
          }
          send({ done: true });
          return 'ok';
        } catch (err) {
          lastError = err;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`Error Gemini con modelo ${modelName}:`, msg);
          if (
            msg.includes('API_KEY_INVALID') ||
            msg.includes('API key not valid') ||
            msg.includes('PERMISSION_DENIED') ||
            msg.includes('401') ||
            msg.includes('403')
          ) {
            return 'fatal';
          }
          return 'retry';
        }
      };

      for (const modelName of staticCandidates) {
        const status = await tryModel(modelName);
        if (status === 'ok') {
          controller.close();
          return;
        }
        if (status === 'fatal') {
          send({ error: classifyGeminiError(lastError) });
          controller.close();
          return;
        }
      }

      // Autodescubrimiento: consulta a la API qué modelos tiene habilitados esta clave
      const discovered = (await discoverAvailableModels(ai)).filter(
        (m) => !staticCandidates.includes(m)
      );
      for (const modelName of discovered.slice(0, 4)) {
        const status = await tryModel(modelName);
        if (status === 'ok') {
          controller.close();
          return;
        }
        if (status === 'fatal') break;
      }

      send({ error: classifyGeminiError(lastError) });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
};
