import { useState } from 'react';

const GEO_ENGINES = [
  {
    id: 'google',
    short: 'Google',
    name: 'Google Search & Maps',
    query: '«mejor clínica dental estética en Marbella»',
    result:
      'Ficha técnica verificada, velocidad < 0.8s y arquitectura SEO local posicionada en los primeros resultados.',
    signals: 'Core Web Vitals 99/100 · SEO Técnico · LocalBusiness Schema',
  },
  {
    id: 'chatgpt',
    short: 'ChatGPT',
    name: 'ChatGPT & Perplexity',
    query: '«¿Qué agencia o empresa recomiendas en Marbella para...?»',
    result:
      'Los modelos generativos citan y recomiendan tu marca gracias a entidades estructuradas, respuestas claras y autoridad semántica.',
    signals: 'GEO Semántico · JSON-LD Enlazado · Contenido Citable',
  },
  {
    id: 'gemini',
    short: 'Gemini',
    name: 'Google Gemini & AI Overviews',
    query: '«comparativa de servicios profesionales en Costa del Sol»',
    result:
      'Tu negocio aparece directamente en el resumen generado por IA con servicios, ubicación y contacto listos para llamar.',
    signals: 'AI Overviews Ready · FAQPage Schema · Datos Verificables',
  },
];

export default function GeoSimulatorIsland() {
  const [activeId, setActiveId] = useState<string>('chatgpt');
  const active = GEO_ENGINES.find((e) => e.id === activeId) ?? GEO_ENGINES[1];

  return (
    <div>
      <p className="text-xs font-medium text-slate-400">
        Cómo descubren tu empresa los clientes en 2026
      </p>

      <div
        role="tablist"
        aria-label="Motores de búsqueda e inteligencia artificial"
        className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/[0.07]"
      >
        {GEO_ENGINES.map((engine) => {
          const isSelected = engine.id === activeId;
          return (
            <button
              key={engine.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveId(engine.id)}
              className={`pressable rounded-lg px-2.5 py-2.5 min-h-[40px] text-xs font-medium whitespace-nowrap truncate cursor-pointer ${
                isSelected
                  ? 'bg-blue-500/20 text-white border border-blue-400/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {engine.short}
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-4" aria-live="polite">
        <div className="border-b border-white/[0.08] pb-4">
          <p className="text-xs text-slate-400">Consulta real del cliente en {active.name}</p>
          <p className="mt-1.5 font-mono-tabular text-sm text-blue-300">{active.query}</p>
        </div>

        <div>
          <p className="text-xs text-slate-400">
            Respuesta generada gracias a tu estructura SEO/GEO
          </p>
          <p className="mt-1.5 text-sm sm:text-[15px] leading-relaxed text-white">
            {active.result}
          </p>
        </div>

        <div className="border-t border-white/[0.08] pt-4 text-xs font-mono-tabular text-slate-400">
          {active.signals}
        </div>
      </div>
    </div>
  );
}
