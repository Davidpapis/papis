import type { PillarId } from './theme';

export type Lang = 'es' | 'en';

const ROUTE_PAIRS: [string, string][] = [
  ['/', '/en'],
  ['/paginas-web', '/en/web-design'],
  ['/software-empresas', '/en/custom-software'],
  ['/servicio-tecnico', '/en/tech-support'],
  ['/proyectos', '/en/projects'],
  ['/contacto', '/en/contact'],
];

export function normalizePath(path: string): string {
  if (!path || path === '/') return '/';
  return path.replace(/\/+$/, '') || '/';
}

export function getAlternatePath(currentPath: string, targetLang: Lang): string {
  const norm = normalizePath(currentPath);

  if (targetLang === 'en') {
    if (norm.startsWith('/en')) return norm;
    const match = ROUTE_PAIRS.find(([es]) => es === norm);
    if (match) return match[1];
    if (norm.startsWith('/proyectos/')) return '/en/projects';
    return '/en';
  } else {
    if (!norm.startsWith('/en')) return norm;
    const match = ROUTE_PAIRS.find(([, en]) => en === norm);
    if (match) return match[0];
    return '/';
  }
}

export const NAV_LINKS_EN = [
  { label: 'Home', href: '/en' },
  { label: 'Web', href: '/en/web-design' },
  { label: 'Software', href: '/en/custom-software' },
  { label: 'Tech Support', href: '/en/tech-support' },
  { label: 'Projects', href: '/en/projects' },
  { label: 'Contact', href: '/en/contact' },
] as const;

export interface EnProjectItem {
  id: string;
  title: string;
  client: string;
  location: string;
  year: string;
  pillar: PillarId;
  urlPreview: string;
  imageKey:
    | 'project-aaarm'
    | 'project-gruposerinamar'
    | 'project-cerrajeria24h'
    | 'project-justbanus'
    | 'project-66nunataks'
    | 'project-bobisapp'
    | 'project-laclave'
    | 'servicio-tecnico-marbella';
  imageAlt: string;
  summary: string;
  metrics: { value: string; label: string }[];
  featured: boolean;
  socialImpact?: boolean;
  externalUrl?: string;
}

export const EN_PROJECTS: EnProjectItem[] = [
  {
    id: 'asociacion-autismo-aaarm',
    title: 'AAAR Marbella — Autism Association Ángel Rivière',
    client: 'Asociación de Autismo Ángel Rivière',
    location: 'Marbella, Costa del Sol',
    year: '2026',
    pillar: 'web',
    urlPreview: 'aaarm.vercel.app',
    imageKey: 'project-aaarm',
    imageAlt: 'Official website of AAAR Marbella Autism Association built by papis.app',
    summary:
      'Official website for this Public Utility non-profit supporting autistic children and over 80 families in Marbella since 2008. Built virtually subsidised as part of our social commitment.',
    metrics: [
      { value: 'Social', label: 'Subsidised project' },
      { value: 'Public', label: 'Utility NGO' },
      { value: 'Marbella', label: 'Since 2008' },
    ],
    featured: true,
    socialImpact: true,
    externalUrl: 'https://aaarm.vercel.app',
  },
  {
    id: 'grupo-serinamar-marbella',
    title: 'Grupo Serinamar — Real Estate & Holiday Rentals',
    client: 'Grupo Serinamar',
    location: 'Marbella · Puerto Banús',
    year: '2026',
    pillar: 'web',
    urlPreview: 'gruposerinamar.vercel.app',
    imageKey: 'project-gruposerinamar',
    imageAlt: 'Grupo Serinamar Marbella corporate website built in Astro',
    summary:
      'Custom Astro corporate website unifying holiday rentals (Guesty), property sales, Just Banús property care and Iberiansun non-resident tax advisory in Marbella since 2000.',
    metrics: [
      { value: 'Astro', label: 'Static HTML speed' },
      { value: '25+ yrs', label: 'Client heritage' },
      { value: 'Live', label: 'Production site' },
    ],
    featured: true,
    externalUrl: 'https://gruposerinamar.vercel.app',
  },
  {
    id: 'cerrajeria-carlos-neira-24h',
    title: 'Cerrajería Carlos Neira — 24/7 Locksmith Marbella',
    client: 'Cerrajería Carlos Neira',
    location: 'Marbella · San Pedro',
    year: '2026',
    pillar: 'web',
    urlPreview: 'cerrajeria24h.vercel.app',
    imageKey: 'project-cerrajeria24h',
    imageAlt: 'Cerrajería Carlos Neira 24h locksmith website in Marbella',
    summary:
      'Ultra-fast mobile-first Astro website built for urgent local SEO in Marbella and San Pedro for master locksmiths established in 1994.',
    metrics: [
      { value: 'Astro', label: 'Instant mobile load' },
      { value: '24/7', label: 'Marbella service' },
      { value: '1994', label: 'Local master shop' },
    ],
    featured: true,
    externalUrl: 'https://cerrajeria24h.vercel.app',
  },
  {
    id: 'bobisapp-erp-inmobiliario',
    title: 'Bobisapp — Custom Real Estate ERP & CRM',
    client: 'Inmobiliaria F. Bobis',
    location: 'Marbella, Costa del Sol',
    year: '2026',
    pillar: 'software',
    urlPreview: 'bobisapp.vercel.app',
    imageKey: 'project-bobisapp',
    imageAlt: 'Bobisapp custom real estate management ERP portal in Marbella',
    summary:
      'Private cloud ERP/CRM in TypeScript built for Inmobiliaria F. Bobis in Marbella: property portfolio, bookings, guest check-in and owner portal with zero per-user fees.',
    metrics: [
      { value: 'ERP/CRM', label: '100% custom' },
      { value: '€0', label: 'Per-user fees' },
      { value: 'Marbella', label: 'Live in production' },
    ],
    featured: true,
    externalUrl: 'https://bobisapp.vercel.app',
  },
  {
    id: 'academia-la-clave-marbella',
    title: 'Academia La Clave (Studio-27) — Dance School SaaS',
    client: 'Academia de Baile La Clave',
    location: 'Marbella, Málaga',
    year: '2026',
    pillar: 'software',
    urlPreview: 'laclave-seven.vercel.app',
    imageKey: 'project-laclave',
    imageAlt: 'Studio-27 SaaS management app for Academia La Clave Marbella',
    summary:
      'Installable PWA web application built in TypeScript to manage dance students, classes, schedules, attendance and monthly fees in Marbella.',
    metrics: [
      { value: 'TypeScript', label: 'Modern SaaS' },
      { value: 'PWA', label: 'Installable app' },
      { value: 'Marbella', label: 'Live in production' },
    ],
    featured: false,
    externalUrl: 'https://laclave-seven.vercel.app',
  },
  {
    id: 'just-banus-property-management',
    title: 'Just Banús — Property Management Marbella',
    client: 'Just Banús (Serinamar Group)',
    location: 'Puerto Banús · Marbella',
    year: '2026',
    pillar: 'web',
    urlPreview: 'justbanus-sepia.vercel.app',
    imageKey: 'project-justbanus',
    imageAlt: 'Just Banús Property Management website in Puerto Banús Marbella',
    summary:
      'Bilingual ES/EN website for dedicated property care, cleaning, laundry, technical maintenance and renovations for international homeowners in Puerto Banús and Nueva Andalucía.',
    metrics: [
      { value: 'EN / ES', label: 'International focus' },
      { value: '24/7', label: 'Property care' },
      { value: 'Live', label: 'Production site' },
    ],
    featured: false,
    externalUrl: 'https://justbanus-sepia.vercel.app',
  },
  {
    id: '66-nunataks-julian-gracia',
    title: '66 Nunataks — Sci-Fi Novel Editorial Website',
    client: 'Julián Gracia Palacín (QUILAK Trilogy)',
    location: 'Spain · Editorial Project',
    year: '2026',
    pillar: 'web',
    urlPreview: '66nunataks.vercel.app',
    imageKey: 'project-66nunataks',
    imageAlt: 'Official editorial website for 66 Nunataks sci-fi novel',
    summary:
      'Immersive editorial launch website for the AI dystopia sci-fi novel 66 Nunataks (Mascarón de Proa), featuring free Chapter 1 reading and instant book purchase.',
    metrics: [
      { value: 'Editorial', label: 'Custom visual' },
      { value: 'Ch. 1', label: 'Online reader' },
      { value: 'Live', label: 'Production site' },
    ],
    featured: false,
    externalUrl: 'https://66nunataks.vercel.app',
  },
  {
    id: 'servicio-tecnico-20-anos-marbella',
    title: '20 Years of Home IT Support (Cabopino to Estepona)',
    client: 'Homeowners & Local Businesses',
    location: 'Cabopino · Marbella · Estepona',
    year: '2026',
    pillar: 'tecnico',
    urlPreview: 'papis.app/en/tech-support',
    imageKey: 'servicio-tecnico-marbella',
    imageAlt: 'David Papis providing home IT support in Marbella',
    summary:
      'Two decades helping residents and expats from Cabopino to Estepona with Apple/Mac, Windows, iPhone transfers, Synology NAS, private lessons for any age and worldwide RustDesk remote support.',
    metrics: [
      { value: '20 yrs', label: 'Local experience' },
      { value: 'RTV', label: 'Marbella TV guest' },
      { value: '< 24h', label: 'Home visits' },
    ],
    featured: false,
  },
];

export const EN_FAQS = {
  general: [
    {
      question: 'Where do you provide services in person and remotely?',
      answer:
        'For home IT support and private lessons, we cover the entire strip from Cabopino to Estepona (Cabopino, Marbella, Nueva Andalucía, Puerto Banús, San Pedro Alcántara and Estepona). For web design, custom software and RustDesk remote tech support, we work with clients across Spain, the UK, Europe and worldwide.',
    },
    {
      question: 'How long does it take to build a custom website and how does payment work?',
      answer:
        'A custom high-speed website typically takes 10 to 15 days from kickoff. Payment is split 50% upon accepting the fixed quote and 50% on final delivery once you approve the live site.',
    },
    {
      question: 'Do you speak directly with clients without middlemen?',
      answer:
        'Yes. You always speak directly with David Papis—the person who designs, builds your website or software, or visits your home in Marbella. No account managers or call centres.',
    },
    {
      question: 'Can you build bilingual or multilingual websites (English, Spanish, French, German)?',
      answer:
        'Yes. Every website is architected from day one for clean multilingual SEO with proper hreflang tags. Each additional language is priced at +40% of the base website value.',
    },
  ],
  web: [
    {
      question: 'Why Astro instead of WordPress or Wix?',
      answer:
        'Astro compiles to pure static HTML with near-zero JavaScript overhead, loading in under 0.8 seconds with 99–100/100 Core Web Vitals, rock-solid security (no vulnerable plugins) and a clean self-editable CMS panel.',
    },
    {
      question: 'What are your monthly maintenance and SEO + GEO plans?',
      answer:
        'Maintenance plans are Basic €50/month (uptime & updates), Standard €80/month (+2h/month of changes) and AI/Management €180/month (sites with calculators or AI assistant). SEO Basic is €190/month (includes basic maintenance) and Advanced SEO + GEO + AEO (Google + ChatGPT/Gemini/Perplexity) is €290/month.',
    },
    {
      question: 'Can you migrate my current WordPress or Wix site without losing Google rankings?',
      answer:
        'Yes. Full migration including 301 redirects, SEO preservation and corporate email transfer has a flat fee of +€300.',
    },
  ],
  software: [
    {
      question: 'How much does custom business software (ERP / CRM) cost?',
      answer:
        'Custom cloud web applications start from €6,000 depending on modules, roles and AI integrations. You can start with a lean MVP and add modules progressively—with €0 per-user monthly licence fees forever.',
    },
    {
      question: 'What sectors do you build custom software for?',
      answer:
        'Real estate agencies (like Bobisapp), dance and training academies (like Academia La Clave / Studio-27), clinics, property management, construction or any sector. We study your real workflow and tailor the software to your business.',
    },
    {
      question: 'What happens after delivery and how are backups handled?',
      answer:
        'Every project uses versioned GitHub code, Vercel deployment and Supabase database with automated backups. Delivery includes training, video guides and a 1-month beta phase with fast adjustments (~24h).',
    },
  ],
  tecnico: [
    {
      question: 'What are your hourly rates for home IT support in Marbella?',
      answer:
        'Home visit rates are €45/h in Marbella, €50/h in San Pedro Alcántara and €65/h in Estepona (usually within 24h). Servers and Synology NAS are €100/h, and a complete iPhone-to-iPhone data transfer is a flat €120.',
    },
    {
      question: 'Do you help seniors or beginners with computers and smartphones?',
      answer:
        'Yes—for any age or skill level, with patience and zero jargon. We offer private lesson bundles with 30% to 40% savings depending on hours and area.',
    },
    {
      question: 'Do you repair both Apple (Mac, iPhone, iPad) and Windows?',
      answer:
        'Yes, we specialise in Apple (Mac, iPhone, iPad) and Windows. We also help with common Android issues while being transparent that Apple/Windows is our core speciality. For hardware parts (battery, screen, SSD), we pick up, replace and return your device working at home.',
    },
  ],
};
