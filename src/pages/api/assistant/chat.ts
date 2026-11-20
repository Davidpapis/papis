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

// Caché en memoria del modelo más rápido que funcionó para evitar reintentos en cada mensaje
let cachedWorkingModel: string | null = null;

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

  return `Eres el asistente virtual oficial de papis.app (Marbella, España).

REGLAS ESTRICTAS DE ESTILO Y BREVEDAD:
1. Habla en español de España, cercano, directo y como en un chat rápido de WhatsApp.
2. NUNCA sueltes parrafadas largas.
3. Si el usuario solo saluda ("hola", "buenas", etc.), responde en MÁXIMO 1-2 frases cortas (ej: "¡Hola! ¿En qué te puedo ayudar hoy: una web, software para tu empresa o técnico a domicilio en Marbella?") sin soltar todo el catálogo.
4. Para preguntas concretas, responde al grano en máximo 2-3 frases cortas (o 3 viñetas muy breves).
5. Usa EXCLUSIVAMENTE los datos de la BASE DE CONOCIMIENTO. Si un dato no está, dilo en 1 frase e invita a escribir por WhatsApp (+34 652 918 061) o usar el formulario.

BASE DE CONOCIMIENTO:
${kbBlock}`;
}

function classifyGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid') || raw.includes('401')) {
    return 'La clave API de Gemini no es válida o está mal copiada. Revísala en Google AI Studio y en Vercel.';
  }
  if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return 'La clave API no tiene permisos para Gemini API.';
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429') || raw.includes('quota')) {
    return 'Se ha alcanzado el límite temporal de consultas. Inténtalo en un minuto o escríbenos por WhatsApp.';
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return 'Ningún modelo compatible de Gemini respondió para esta clave API.';
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
      const supportsGenerate = actions.length === 0 || actions.includes('generateContent');
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
    // Priorizar modelos flash-lite y flash rápidos (nunca pro/thinking lentos)
    return names.sort((a, b) => {
      const score = (n: string) =>
        (n.includes('flash-lite') ? 0 : n.includes('flash') ? 2 : 20) +
        (n.includes('exp') ? 5 : 0);
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
    'gemini-2.5-flash-lite';

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
    .map((m) => ({ role: m.role, parts: [{ text: m.text.trim().slice(0, 1000) }] }))
    .slice(-10);

  if (sanitized.length === 0) {
    return new Response(JSON.stringify({ error: 'Escribe una consulta para el asistente.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ai = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  // Si ya descubrimos un modelo rápido que funciona, ir directo a él en el primer intento
  const staticCandidates = Array.from(
    new Set(
      [
        cachedWorkingModel,
        preferredModel,
        'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-flash-latest',
      ].filter((m): m is string => Boolean(m))
    )
  );

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const systemInstruction = buildSystemInstruction();
      let lastError: unknown = null;

      const tryModel = async (modelName: string): Promise<'ok' | 'fatal' | 'retry'> => {
        const baseConfig = {
          systemInstruction,
          maxOutputTokens: 220,
          temperature: 0.4,
        };

        // Intentar primero con thinkingBudget: 0 para respuesta instantánea (< 1s)
        for (const withNoThinking of [true, false]) {
          try {
            const result = await ai.models.generateContentStream({
              model: modelName,
              contents: sanitized,
              config: withNoThinking
                ? { ...baseConfig, thinkingConfig: { thinkingBudget: 0 } }
                : baseConfig,
            });

            for await (const chunk of result) {
              if (chunk.text) send({ text: chunk.text });
            }
            cachedWorkingModel = modelName;
            send({ done: true });
            return 'ok';
          } catch (err) {
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);
            // Si el modelo no soporta thinkingConfig, reintentar sin esa opción
            if (withNoThinking && (msg.includes('thinking') || msg.includes('INVALID_ARGUMENT'))) {
              continue;
            }
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
        }
        return 'retry';
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

      const discovered = (await discoverAvailableModels(ai)).filter(
        (m) => !staticCandidates.includes(m)
      );
      for (const modelName of discovered.slice(0, 3)) {
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
