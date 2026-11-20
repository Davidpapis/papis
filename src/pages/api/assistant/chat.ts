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

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
  const model =
    import.meta.env.GEMINI_MODEL?.trim() || process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';

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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const result = await ai.models.generateContentStream({
          model,
          contents: sanitized,
          config: {
            systemInstruction: buildSystemInstruction(),
          },
        });

        for await (const chunk of result) {
          if (chunk.text) send({ text: chunk.text });
        }
        send({ done: true });
      } catch (err) {
        console.error('Error en /api/assistant/chat:', err);
        send({
          error:
            'No hemos podido conectar con el asistente ahora mismo. Escríbenos por WhatsApp y te atendemos al instante.',
        });
      } finally {
        controller.close();
      }
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
