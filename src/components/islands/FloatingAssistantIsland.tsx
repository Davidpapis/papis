import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Download,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { PILLAR_PALETTES, type PillarId } from '../../lib/theme';

interface FloatingAssistantIslandProps {
  activeTheme: PillarId;
  phoneDisplay: string;
  whatsappNumber: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  error?: boolean;
}

const QUICK_PROMPTS = [
  'Quiero hacer una web que posicione en Google e IA',
  'Busco un software a medida para mi empresa',
  'Necesito un técnico en casa en Marbella',
  '¿Cuánto tardáis y cómo trabajáis?',
];

const NUDGE_MESSAGES = [
  '¿Tienes alguna duda? Pregúntame 👋',
  'Soy David Tech · Pulsa aquí para hablar',
  '¿Presupuesto o soporte? Te ayudo ahora',
];

const INITIAL_WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: '¡Hola! ¿Cómo estás? Soy David Tech, la IA de David Papis. Voy a resolver todas tus dudas. Para empezar, dime cómo te llamas y en qué puedo echarte una mano hoy.',
};

export default function FloatingAssistantIsland({
  activeTheme,
  phoneDisplay,
  whatsappNumber,
}: FloatingAssistantIslandProps) {
  const palette = PILLAR_PALETTES[activeTheme];
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAvatarAnimating, setIsAvatarAnimating] = useState(false);
  const [animCycleKey, setAnimCycleKey] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [nudgeIdx, setNudgeIdx] = useState(0);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  const scrollEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reproduce el avatar animado 1 ciclo completo (~19s) y lo repite cada 20 segundos de pausa
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let stopTimer: number | null = null;
    let nextTimer: number | null = null;

    const triggerAnim = () => {
      setAnimCycleKey((k) => k + 1);
      setIsAvatarAnimating(true);
      if (stopTimer) window.clearTimeout(stopTimer);
      stopTimer = window.setTimeout(() => {
        setIsAvatarAnimating(false);
        nextTimer = window.setTimeout(triggerAnim, 20000);
      }, 19000);
    };

    const initialTimer = window.setTimeout(triggerAnim, 1500);

    return () => {
      window.clearTimeout(initialTimer);
      if (stopTimer) window.clearTimeout(stopTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, []);

  // Bocadillo sutil sobre el avatar: aparece a los 4s durante 5.5s y reaparece cada 20s si el chat está cerrado
  useEffect(() => {
    if (isOpen || nudgeDismissed) {
      setShowNudge(false);
      return;
    }
    let hideTimer: number | null = null;
    let nextTimer: number | null = null;

    const showCycle = (first = false) => {
      if (!first) setNudgeIdx((i) => (i + 1) % NUDGE_MESSAGES.length);
      setShowNudge(true);
      hideTimer = window.setTimeout(() => {
        setShowNudge(false);
        nextTimer = window.setTimeout(() => showCycle(false), 20000);
      }, 5500);
    };

    const initialTimer = window.setTimeout(() => showCycle(true), 4000);

    return () => {
      window.clearTimeout(initialTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [isOpen, nudgeDismissed]);

  const avatarSrc =
    isAvatarAnimating || isStreaming
      ? `/assets/optimized/avatar-ia-anim.webp?c=${animCycleKey}`
      : '/assets/optimized/avatar-ia-static.webp';

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    'Hola papis.app, quiero pedir información sobre vuestros servicios en Marbella.'
  )}`;

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const isDesktopPointer = window.matchMedia('(pointer: fine)').matches;
    const timer = isDesktopPointer
      ? window.setTimeout(() => inputRef.current?.focus(), 140)
      : 0;
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (timer) window.clearTimeout(timer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    }
  }, [messages, isOpen, isStreaming]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    const modelMsgId = `model-${Date.now() + 1}`;
    const nextHistory = [...messages, userMsg];

    setMessages([...nextHistory, { id: modelMsgId, role: 'model', text: '' }]);
    setInputValue('');
    setIsStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payloadMessages = nextHistory
      .filter((m) => m.id !== 'welcome' && !m.error)
      .map((m) => ({ role: m.role, text: m.text }));

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'No se pudo conectar con el asistente. Escríbenos por WhatsApp.'
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const line = rawEvent.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) throw new Error(parsed.error);
          if (typeof parsed.text === 'string') {
            accumulated += parsed.text;
            setMessages((prev) =>
              prev.map((m) => (m.id === modelMsgId ? { ...m, text: accumulated } : m))
            );
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('No recibimos respuesta. Inténtalo de nuevo o escríbenos por WhatsApp.');
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      const msg =
        err instanceof Error
          ? err.message
          : 'Error de conexión con el asistente IA. Escríbenos por WhatsApp.';
      setMessages((prev) =>
        prev.map((m) => (m.id === modelMsgId ? { ...m, text: msg, error: true } : m))
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleDownloadChat = () => {
    const now = new Date();
    const dateStamp = now.toISOString().slice(0, 10);
    const lines = [
      'CONVERSACIÓN — papis.app (Marbella)',
      `Fecha: ${now.toLocaleString('es-ES')}`,
      `Teléfono / WhatsApp directo: ${phoneDisplay}`,
      'Web: https://papis.app',
      '------------------------------------------------------------',
      '',
      ...messages.map((m) => `${m.role === 'user' ? 'Tú' : 'papis.app'}:\n${m.text}\n`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversacion-papis-app-${dateStamp}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {!isOpen && (
        <div
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3"
          aria-label="Accesos rápidos de contacto y asistente virtual"
        >
          {/* Bocadillo llamativo encima del avatar que aparece periódicamente y abre el chat al pulsar */}
          <div
            aria-live="polite"
            className={`absolute bottom-[calc(100%+12px)] right-0 z-10 transition-all duration-300 ${
              showNudge
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }`}
          >
            <div
              className="relative flex items-center gap-2 rounded-2xl border bg-[#0B0F19]/95 px-3.5 py-2.5 text-xs font-medium text-white shadow-[0_14px_34px_rgba(0,0,0,0.65)] backdrop-blur-xl whitespace-nowrap"
              style={{
                borderColor: `rgba(${palette.rgb}, 0.5)`,
                boxShadow: `0 12px 32px rgba(0,0,0,0.65), 0 0 20px -6px rgba(${palette.rgb}, 0.45)`,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowNudge(false);
                  setIsOpen(true);
                }}
                className="flex items-center gap-2 text-left cursor-pointer hover:text-blue-200 transition-colors"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0"
                />
                <span>{NUDGE_MESSAGES[nudgeIdx]}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNudgeDismissed(true);
                  setShowNudge(false);
                }}
                aria-label="Ocultar aviso"
                className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
              {/* Triángulo apuntando hacia el avatar */}
              <span
                aria-hidden="true"
                className="absolute -bottom-[6px] right-8 h-3 w-3 rotate-45 border-r border-b bg-[#0B0F19]"
                style={{ borderColor: `rgba(${palette.rgb}, 0.5)` }}
              />
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escribir por WhatsApp a papis.app"
            title="WhatsApp directo"
            className="pressable relative flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/50 bg-[#0F241B] text-white shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 shrink-0"
          >
            <span
              aria-hidden="true"
              className="whatsapp-pulse-ring pointer-events-none absolute inset-0 rounded-full border border-emerald-400/70"
            />
            <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => {
              if (!isAvatarAnimating) {
                setAnimCycleKey((k) => k + 1);
                setIsAvatarAnimating(true);
                window.setTimeout(() => setIsAvatarAnimating(false), 19000);
              }
            }}
            aria-label="Abrir consulta interactiva de papis.app"
            title="¿Tienes alguna duda? Pregúntame"
            className="relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white shrink-0 cursor-pointer"
          >
            <div className="avatar-tricolor-wrapper h-[74px] w-[74px] sm:h-[86px] sm:w-[86px]">
              <span aria-hidden="true" className="avatar-ambient-halo" />
              <span className="avatar-beam-ring h-full w-full">
                <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#050507]">
                  <img
                    src={avatarSrc}
                    alt="Abrir asistente virtual de papis.app"
                    width={86}
                    height={86}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover scale-[1.12] select-none"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_16px_rgba(5,5,7,0.68)]"
                  />
                </span>
              </span>

              {/* Badge P> inferior izquierdo (estilo avatar ia.png) */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-0.5 -left-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-[#060910] text-[10px] font-extrabold tracking-tighter text-white shadow-[0_0_12px_rgba(0,0,0,0.9)]"
                style={{
                  borderColor: palette.accent,
                  boxShadow: `0 0 12px rgba(${palette.rgb}, 0.65)`,
                }}
              >
                P<span style={{ color: palette.accent }}>&gt;</span>
              </span>

              {/* Indicador luminoso "En línea" inferior derecho */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0.5 right-0.5 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#060910] p-[2px]"
              >
                <span className="h-full w-full rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </span>
            </div>
          </button>
        </div>
      )}

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs sm:bg-black/30"
            aria-hidden="true"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Asistente virtual IA de papis.app"
            className="fixed inset-x-2.5 bottom-2.5 top-16 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:top-20 z-50 flex w-auto sm:w-[420px] max-h-[calc(100dvh-4.75rem)] flex-col overflow-hidden rounded-2xl border bg-[#0B0D12]/96 backdrop-blur-2xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.95)]"
            style={{ borderColor: `rgba(${palette.rgb}, 0.34)` }}
          >
            <div
              aria-hidden="true"
              className="h-[2px] w-full shrink-0"
              style={{
                background: `linear-gradient(90deg, transparent, ${palette.accent}, ${palette.secondary}, transparent)`,
              }}
            />

            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="avatar-tricolor-wrapper h-12 w-12 shrink-0">
                  <span className="avatar-beam-ring h-full w-full">
                    <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#050507]">
                      <img
                        src={avatarSrc}
                        alt="Asistente papis.app"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover scale-[1.12]"
                      />
                    </span>
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-white truncate">
                    David Tech · papis.app
                  </h2>
                  <p className="text-xs text-slate-400 truncate">
                    {isStreaming ? 'Escribiendo...' : 'En línea · Marbella'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDownloadChat}
                    title="Descargar conversación (.txt)"
                    aria-label="Descargar conversación"
                    className="pressable inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    abortRef.current?.abort();
                    setIsStreaming(false);
                    setMessages([INITIAL_WELCOME]);
                  }}
                  title="Reiniciar conversación"
                  aria-label="Reiniciar conversación"
                  className="pressable inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar asistente virtual"
                  className="pressable inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[86%] min-w-0 break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? 'text-white rounded-br-sm'
                          : msg.error
                            ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200 rounded-bl-sm'
                            : 'border border-white/[0.08] bg-[#12151E] text-slate-200 rounded-bl-sm'
                      }`}
                      style={
                        isUser
                          ? {
                              backgroundColor: `rgba(${palette.rgb}, 0.22)`,
                              border: `1px solid rgba(${palette.rgb}, 0.42)`,
                            }
                          : undefined
                      }
                    >
                      {msg.text || (
                        <span
                          className="inline-flex items-center gap-2 text-xs text-slate-300"
                          aria-label="Escribiendo respuesta"
                        >
                          <span>Escribiendo</span>
                          <span className="typing-dots" aria-hidden="true">
                            <span></span>
                            <span></span>
                            <span></span>
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {messages.length === 1 && (
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] font-medium text-slate-400">Preguntas frecuentes</p>
                  <div className="flex flex-col gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="pressable text-left rounded-xl border border-white/[0.08] bg-[#0F1219] px-3 py-2.5 text-xs text-slate-300 hover:border-white/20 hover:text-white cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={scrollEndRef} />
            </div>

            <div className="border-t border-white/[0.06] bg-[#080A0F]/80 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[11px] text-slate-400 truncate">
                ¿Quieres presupuesto personalizado?
              </span>
              <a
                href={`/contacto?servicio=${activeTheme}`}
                className="inline-flex items-center gap-1 text-xs font-medium hover:underline whitespace-nowrap shrink-0"
                style={{ color: palette.accent }}
              >
                <span>Ir a contacto</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputValue);
              }}
              className="border-t border-white/[0.08] bg-[#080A0F] p-3 shrink-0"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escríbeme lo que necesites..."
                  disabled={isStreaming}
                  className="flex-1 min-w-0 rounded-xl border border-white/[0.1] bg-[#0D1017] px-3.5 py-2.5 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isStreaming || inputValue.trim().length === 0}
                  aria-label="Enviar mensaje"
                  className="pressable inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white disabled:opacity-40 cursor-pointer"
                  style={{ backgroundColor: palette.accent }}
                >
                  {isStreaming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}
    </>
  );
}
