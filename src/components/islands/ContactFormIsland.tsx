import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { ArrowRight, CheckCircle2, Loader2, MessageCircle, Phone } from 'lucide-react';
import { PILLAR_PALETTES, type PillarId } from '../../lib/theme';

interface ContactFormIslandProps {
  phoneDisplay: string;
  whatsappNumber: string;
  email: string;
  city: string;
}

interface QuickNeedOption {
  id: PillarId;
  title: string;
  subtitle: string;
  defaultSubject: string;
  defaultMessage: string;
}

const QUICK_NEEDS: QuickNeedOption[] = [
  {
    id: 'web',
    title: 'Necesito una Web',
    subtitle: 'Diseño a medida, carga instantánea y SEO + GEO para captar clientes.',
    defaultSubject: 'Diseño y Desarrollo Web a Medida',
    defaultMessage:
      'Hola, quiero presupuesto para una página web rápida, autogestionable y posicionada en Google e IA.',
  },
  {
    id: 'software',
    title: 'Quiero un Software para mi empresa',
    subtitle: 'ERP, CRM o aplicación privada para inmobiliaria, academia o tu sector.',
    defaultSubject: 'Software de Gestión Empresarial a Medida',
    defaultMessage:
      'Hola, busco un software a medida para organizar y automatizar la gestión de mi empresa.',
  },
  {
    id: 'tecnico',
    title: 'Necesito un técnico en casa',
    subtitle: 'Reparación de ordenador, clases particulares o configuración móvil en Marbella.',
    defaultSubject: 'Servicio Técnico o Clases a Domicilio',
    defaultMessage:
      'Hola, necesito concertar una visita técnica o clase particular a domicilio en Marbella.',
  },
];

export default function ContactFormIsland({
  phoneDisplay,
  whatsappNumber,
  email,
  city,
}: ContactFormIslandProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [selectedNeed, setSelectedNeed] = useState<PillarId>('web');
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [subject, setSubject] = useState(QUICK_NEEDS[0].defaultSubject);
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Lee parámetros de la URL (?servicio=software&asunto=...) para pre-rellenar
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('servicio') as PillarId | null;
    const subjectParam = params.get('asunto');
    if (serviceParam && ['web', 'software', 'tecnico'].includes(serviceParam)) {
      const matched = QUICK_NEEDS.find((n) => n.id === serviceParam);
      setSelectedNeed(serviceParam);
      if (matched) {
        setSubject(subjectParam || matched.defaultSubject);
        setMessage(matched.defaultMessage);
      }
    } else if (subjectParam) {
      setSubject(subjectParam);
    }
  }, []);

  // Sincroniza el color de acento global con la necesidad seleccionada
  useEffect(() => {
    const p = PILLAR_PALETTES[selectedNeed];
    const root = document.documentElement;
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-secondary', p.secondary);
    root.style.setProperty('--accent-rgb', p.rgb);
    root.style.setProperty('--accent-soft', p.softBg);
  }, [selectedNeed]);

  const formPalette = PILLAR_PALETTES[selectedNeed];
  const phoneHref = `tel:${phoneDisplay.replace(/\s+/g, '')}`;

  const handleQuickSelect = (option: QuickNeedOption) => {
    setSelectedNeed(option.id);
    setSubject(option.defaultSubject);
    setMessage(option.defaultMessage);
    setSubmitted(false);
    setError(null);
    nameInputRef.current?.focus();
  };

  const buildWhatsAppHref = () => {
    const text = [
      `Hola papis.app, soy ${name.trim() || 'un nuevo cliente'}.`,
      `Necesidad: ${subject || formPalette.label}`,
      contact.trim() ? `Contacto: ${contact.trim()}` : '',
      message.trim() ? `Detalles: ${message.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const trimmedContact = contact.trim();

    if (trimmedName.length < 2) {
      setError('Indícanos tu nombre para poder dirigirnos a ti.');
      return;
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact);
    const isValidPhone = trimmedContact.replace(/\D/g, '').length >= 9;

    if (!isValidEmail && !isValidPhone) {
      setError('Introduce un teléfono válido (9 dígitos) o un correo electrónico.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          contact: trimmedContact,
          service: selectedNeed,
          subject: subject.trim() || formPalette.label,
          message: message.trim(),
          website,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data?.error === 'string'
            ? data.error
            : 'No pudimos enviar tu solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.'
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error de conexión al enviar tu solicitud. Escríbenos por WhatsApp.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Selector rápido de 3 pilares */}
      <div
        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3"
        role="radiogroup"
        aria-label="Selecciona el servicio que necesitas"
      >
        {QUICK_NEEDS.map((option) => {
          const palette = PILLAR_PALETTES[option.id];
          const isSelected = selectedNeed === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => handleQuickSelect(option)}
              className="pressable relative overflow-hidden rounded-2xl p-[1.5px] text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${palette.accent}, ${palette.secondary}, rgba(255,255,255,0.22))`
                  : 'rgba(255,255,255,0.09)',
                boxShadow: isSelected
                  ? `0 0 32px -10px rgba(${palette.rgb}, 0.65)`
                  : 'none',
              }}
            >
              <div
                className="flex h-full flex-col justify-between rounded-[14.5px] p-5 sm:p-6"
                style={{
                  backgroundColor: isSelected ? '#0F131B' : '#0D0F14',
                  backgroundImage: isSelected
                    ? `radial-gradient(280px circle at 15% 10%, rgba(${palette.rgb}, 0.16), transparent 70%)`
                    : 'none',
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold tracking-[0.1em]">
                      <span className="text-slate-300">{palette.divisionPrefix} </span>
                      <span style={{ color: palette.accent }}>{palette.divisionHighlight}</span>
                    </span>
                    <span
                      className="text-xs font-medium"
                      style={{ color: isSelected ? palette.accent : '#64748B' }}
                    >
                      {isSelected ? 'Seleccionado' : 'Elegir'}
                    </span>
                  </div>

                  <h2 className="mt-4 font-display text-lg sm:text-xl font-semibold text-white">
                    {option.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{option.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Formulario + Canal directo */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <div
          className="lg:col-span-7 rounded-2xl border bg-[#0D0F14]/95 p-6 sm:p-8"
          style={{ borderColor: `rgba(${formPalette.rgb}, 0.28)` }}
        >
          {submitted ? (
            <div className="flex h-full flex-col items-start justify-center py-6" aria-live="polite">
              <CheckCircle2
                className="w-10 h-10"
                style={{ color: formPalette.accent }}
                aria-hidden="true"
              />
              <h3 className="mt-4 font-display text-2xl font-bold text-white">
                Solicitud lista, {name.trim()}
              </h3>
              <p className="mt-2 max-w-lg text-sm sm:text-base leading-relaxed text-slate-300">
                Hemos registrado tu consulta sobre{' '}
                <span className="font-medium text-white">{subject}</span>. Te contactaremos en{' '}
                <span className="text-white">{contact}</span> hoy mismo. Si prefieres acelerar la
                respuesta ahora, envíanos este resumen por WhatsApp en un toque.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={buildWhatsAppHref()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="beam-button beam-button-solid"
                >
                  <span className="beam-button-inner text-white px-5 py-2.5 text-sm font-semibold min-h-[44px]">
                    <MessageCircle className="w-4 h-4" />
                    Abrir resumen en WhatsApp
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setContact('');
                    setMessage('');
                  }}
                  className="pressable rounded-xl border border-white/10 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white cursor-pointer"
                >
                  Enviar otra consulta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    Cuéntanos en 30 segundos qué quieres lograr
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Presupuesto claro y sin compromiso · Trato directo en Marbella
                  </p>
                </div>
                <span className="text-xs font-medium" style={{ color: formPalette.accent }}>
                  {formPalette.label}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tu nombre
                  </label>
                  <input
                    ref={nameInputRef}
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Carlos Martínez"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#080A0F] px-4 py-3 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="contact-info" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Teléfono o email
                  </label>
                  <input
                    id="contact-info"
                    name="contact"
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="600 000 000 o tu@empresa.es"
                    className="w-full rounded-xl border border-white/[0.1] bg-[#080A0F] px-4 py-3 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Servicio seleccionado
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#080A0F] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-slate-300 mb-1.5">
                  ¿Cómo podemos ayudarte?
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Cuéntanos brevemente tu negocio, proyecto o el problema técnico que tienes..."
                  className="w-full resize-none rounded-xl border border-white/[0.1] bg-[#080A0F] px-4 py-3 text-base sm:text-sm text-white placeholder:text-slate-500 focus:border-white/30 focus:outline-none"
                />
              </div>

              <div aria-live="polite">
                {error && (
                  <p role="alert" className="text-xs font-medium text-rose-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="beam-button beam-button-solid w-full sm:w-auto disabled:opacity-60"
                >
                  <span className="beam-button-inner text-white px-6 py-3.5 text-sm sm:text-[15px] font-semibold min-h-[48px]">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enviando solicitud...
                      </>
                    ) : (
                      <>
                        Empezar mi proyecto hoy
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </button>

                <p className="text-xs text-slate-400">
                  Sin spam. Te respondemos por teléfono o WhatsApp.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Canal directo inmediato */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0D0F14]/95 p-6 sm:p-8">
          <div>
            <p className="text-xs font-medium text-slate-400">
              Atención inmediata en Marbella y Costa del Sol
            </p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-white">
              ¿Prefieres hablar ahora mismo?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Muchas veces una llamada de 5 minutos o un audio por WhatsApp ahorra días de correos.
              Escríbenos o llámanos y te damos una orientación honesta al momento.
            </p>

            <div className="mt-7 space-y-4 border-t border-white/[0.08] pt-6">
              <a
                href={phoneHref}
                className="pressable group flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#080A0F] px-4 py-4 hover:border-white/25"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] text-white">
                    <Phone className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Llamada directa</p>
                    <p className="font-mono-tabular text-base font-semibold text-white">
                      {phoneDisplay}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
              </a>

              <a
                href={buildWhatsAppHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="pressable group flex items-center justify-between rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-4 hover:border-emerald-400/50"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-300/80">WhatsApp directo</p>
                    <p className="text-base font-semibold text-white">
                      Escribir por WhatsApp ahora
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </a>
            </div>
          </div>

          <div className="mt-7 border-t border-white/[0.08] pt-5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>{city}</span>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${email}`} className="text-slate-300 hover:text-white">
              {email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
