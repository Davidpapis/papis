import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';
import { sendTelegramMessage } from '../../../lib/telegram';

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

  return `Eres David Tech, la IA de David Papis en papis.app (Marbella). Tu objetivo es resolver todas las dudas con una conversación real, cercana y humana, como si chatearas por WhatsApp con un cliente que te acaba de escribir.

PERSONALIDAD Y TONO (MUY IMPORTANTE):
1. Español de España natural, tuteo cercano, amable y directo. Cero lenguaje corporativo, cero frases de robot.
2. PROHIBIDO sonar a bot o centralita: nunca digas "Como asistente virtual...", ni sueltes listas numeradas tipo menú ("¿Qué deseas: 1 Web, 2 Software, 3 Técnico?") cuando alguien solo saluda.
3. TRATO POR NOMBRE: Si el usuario todavía no te ha dicho su nombre en la conversación, pregúntaselo de forma natural en tu primera respuesta (si solo saluda: "¡Buenas! ¿Cómo te llamas? Cuéntame qué tienes en mente."; si ya te hace una pregunta concreta, respóndele breve y cierra con "Por cierto, ¿cómo te llamas?"). En cuanto te diga su nombre, dirígete a esa persona por su nombre de forma natural durante la charla (sin forzarlo en cada frase, como hablaría una persona real).
4. Responde breve y al grano (2-3 frases naturales por mensaje, nunca parrafadas). Cuando tenga sentido, haz una pregunta corta y útil para entender mejor su caso antes de ofrecerle hablar directo con David por WhatsApp (+34 652 918 061) o dejar sus datos en el formulario.
5. Usa solo hechos reales de la BASE DE CONOCIMIENTO (nunca inventes precios, plazos ni promesas que no estén ahí).
6. SI NO SABES LA RESPUESTA (duda sobre nuestros servicios o tema técnico cuyo dato NO está en la BASE DE CONOCIMIENTO): responde automáticamente con algo muy parecido a esto, incluyendo SIEMPRE el enlace clickable a WhatsApp:
"Pues no sabría qué responderte a eso, mejor háblalo directamente con David en su WhatsApp: [Hablar con David por WhatsApp](https://wa.me/34652918061)"
7. TEMAS AJENOS A LA WEB (OFF-TOPIC): Si te escriben sobre cualquier tema que NO tenga nada que ver con la informática, diseño web, SEO/GEO, software a medida, servicio técnico o los servicios de papis.app (por ejemplo: recetas, fútbol, tiempo, deberes, política, charla general, consejos personales, etc.), responde directamente y con buen humor con esta idea exacta:
"Pues me gustaría mucho hablar contigo, pero tengo otros clientes interesados en hablar de lo que trata nuestra web, así que si no te importa para esos asuntos mejor habla con tu agente de IA, o pídele a David que te cree uno 😉"

BASE DE CONOCIMIENTO:
${kbBlock}`;
}

const CACHED_SYSTEM_INSTRUCTION = buildSystemInstruction();

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
    'gemini-3.5-flash-lite';

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'El asistente IA necesita configurar GEMINI_API_KEY en el servidor. Mientras tanto, escríbenos por WhatsApp.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    messages?: ChatMessageInput[];
    lang?: string;
  };
  const reqLang = body.lang === 'en' ? 'en' : 'es';
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
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
      ].filter((m): m is string => Boolean(m))
    )
  );

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const systemInstruction =
        reqLang === 'en'
          ? `${CACHED_SYSTEM_INSTRUCTION}\n\nIMPORTANT LANGUAGE RULE: The visitor is browsing the ENGLISH version of papis.app (/en). Always reply in natural, warm, concise English (2-3 sentences max), asking their name naturally if not yet provided, using all the exact facts and rates from the knowledge base above. If you don't know the answer to a question, reply: "I wouldn't know how to answer that one, it's best to chat directly with David on WhatsApp: [Chat with David on WhatsApp](https://wa.me/34652918061)". If they ask about anything unrelated to IT, websites, SEO, custom software, or papis.app, reply warmly: "I'd really love to chat with you, but I have other clients interested in talking about what our website is about — so if you don't mind, for those topics it's best to talk to your own AI agent, or ask David to build you one 😉".`
          : CACHED_SYSTEM_INSTRUCTION;
      let lastError: unknown = null;

      const tryModel = async (modelName: string): Promise<'ok' | 'fatal' | 'retry'> => {
        const baseConfig = {
          systemInstruction,
          maxOutputTokens: 280,
          temperature: 0.7,
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

            let replyText = '';
            for await (const chunk of result) {
              if (chunk.text) {
                replyText += chunk.text;
                send({ text: chunk.text });
              }
            }
            cachedWorkingModel = modelName;

            // Enviar a Telegram ANTES de cerrar el stream para que Vercel no corte la petición
            const lastUserMsg =
              sanitized.filter((m) => m.role === 'user').at(-1)?.parts[0]?.text ?? '';
            if (lastUserMsg && replyText.trim()) {
              const turnNumber = sanitized.filter((m) => m.role === 'user').length;
              await sendTelegramMessage(
                `💬 Chat web papis.app (mensaje #${turnNumber})\n\n👤 Visitante:\n${lastUserMsg}\n\n🤖 Asistente:\n${replyText.trim()}`
              );
            }

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
