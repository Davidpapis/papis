import siteSettings from '../content/singletons/site-settings.json';

export type KnowledgeCategory =
  | 'General'
  | 'Web y SEO/GEO'
  | 'Software Empresas'
  | 'Servicio Técnico'
  | 'Precios y Plazos';

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: KnowledgeCategory;
  content: string;
  enabled: boolean;
}

export const DEFAULT_KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: 'kb-identidad',
    title: 'Quiénes somos y zona de actuación',
    category: 'General',
    enabled: true,
    content: `${siteSettings.brandName} es una agencia tecnológica y marca personal con sede en Marbella (Málaga). Atendemos presencialmente en ${siteSettings.serviceAreas.join(', ')}, y desarrollamos proyectos web y de software en remoto para toda España y clientes internacionales.`,
  },
  {
    id: 'kb-web-seo-geo',
    title: 'Diseño Web a Medida, SEO y GEO',
    category: 'Web y SEO/GEO',
    enabled: true,
    content:
      'Creamos páginas web a medida en HTML estático ultrarrápido (objetivo 99-100/100 en Core Web Vitals y carga inferior a 0.8s), seguridad blindada con SSL, panel autogestionable Keystatic para editar textos, fotos y proyectos sin tocar código. Incluimos SEO técnico local y GEO (Generative Engine Optimization) mediante datos estructurados JSON-LD y FAQs citables para que Google, ChatGPT, Gemini y Perplexity recomienden el negocio del cliente.',
  },
  {
    id: 'kb-software-empresas',
    title: 'Software a Medida (ERP, CRM, SaaS) y Sectores',
    category: 'Software Empresas',
    enabled: true,
    content:
      'Desarrollamos software de gestión a medida para empresas sin licencias abusivas por usuario. Soluciones listas para adaptar: 1) Software de Gestión Inmobiliaria (propiedades, alquileres, fianzas, cobros, CRM y automatizaciones). 2) Software de Gestión de Academias de Baile (alumnos, grupos, niveles, cuotas mensuales, asistencia desde móvil y cuadrante de profesores). 3) Desarrollo desde cero para clínicas, constructoras, logística, hostelería o comercio.',
  },
  {
    id: 'kb-servicio-tecnico',
    title: 'Servicio Técnico Informático y Clases a Domicilio',
    category: 'Servicio Técnico',
    enabled: true,
    content:
      'Vamos directamente a casa del cliente en Marbella y alrededores con cita rápida (habitualmente en menos de 24 horas). Ofrecemos reparación y puesta a punto de ordenadores Mac y Windows (limpieza, SSD, RAM, virus), clases particulares personalizadas sin tecnicismos, formación práctica para manejar iPhone y Android, seguridad frente a phishing/estafas online y resolución de problemas diarios (Wi-Fi, impresoras, Smart TV, copias de seguridad).',
  },
  {
    id: 'kb-plazos-presupuestos',
    title: 'Cómo pedir presupuesto, plazos y contacto directo',
    category: 'Precios y Plazos',
    enabled: true,
    content: `Presupuestos cerrados y sin compromiso tras una breve llamada o WhatsApp. Plazos orientativos: web corporativa a medida entre 2 y 4 semanas; software empresarial a medida primera versión operativa en 4 a 8 semanas; servicio técnico a domicilio en menos de 24 horas laborables en Marbella. Teléfono y WhatsApp directo: ${siteSettings.phoneDisplay}. Correo: ${siteSettings.email}.`,
  },
];
