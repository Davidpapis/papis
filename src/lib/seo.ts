import siteSettings from '../content/singletons/site-settings.json';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function buildLocalBusinessSchema() {
  const socialLinks = (siteSettings.socialLinks ?? []) as Array<{
    network: string;
    url: string;
  }>;
  const sameAs = socialLinks
    .map((item) => item.url)
    .filter((url) => Boolean(url && url.startsWith('http')));

  return {
    '@type': 'ProfessionalService',
    '@id': `${siteSettings.domain}/#organization`,
    name: siteSettings.brandName,
    url: siteSettings.domain,
    email: siteSettings.email,
    telephone: siteSettings.phoneDisplay,
    description: siteSettings.defaultSeoDescription,
    priceRange: '€€',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Marbella',
      addressRegion: 'Málaga',
      addressCountry: 'ES',
    },
    areaServed: (siteSettings.serviceAreas ?? ['Marbella', 'Costa del Sol']).map((name) => ({
      '@type': 'City',
      name,
    })),
    serviceType: [
      'Diseño y Desarrollo Web a Medida',
      'Posicionamiento SEO Local y GEO (Generative Engine Optimization)',
      'Desarrollo de Software ERP y CRM para Empresas',
      'Software de Gestión Inmobiliaria',
      'Software de Gestión para Academias de Baile',
      'Servicio Técnico Informático a Domicilio',
      'Clases Particulares de Informática y Móvil',
    ],
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function buildWebSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${siteSettings.domain}/#website`,
    url: siteSettings.domain,
    name: siteSettings.brandName,
    inLanguage: 'es-ES',
    publisher: {
      '@id': `${siteSettings.domain}/#organization`,
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteSettings.domain}${item.url}`,
    })),
  };
}

export function buildServiceSchema(params: {
  name: string;
  description: string;
  url: string;
  serviceType: string;
}) {
  return {
    '@type': 'Service',
    name: params.name,
    serviceType: params.serviceType,
    description: params.description,
    url: `${siteSettings.domain}${params.url}`,
    provider: {
      '@id': `${siteSettings.domain}/#organization`,
    },
    areaServed: (siteSettings.serviceAreas ?? ['Marbella']).map((name) => ({
      '@type': 'City',
      name,
    })),
  };
}

export function buildFaqSchema(faqs: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildCreativeWorkSchema(params: {
  name: string;
  description: string;
  url: string;
  datePublished: string;
  image?: string;
}) {
  return {
    '@type': 'CreativeWork',
    name: params.name,
    description: params.description,
    url: `${siteSettings.domain}${params.url}`,
    datePublished: params.datePublished,
    creator: {
      '@id': `${siteSettings.domain}/#organization`,
    },
    ...(params.image ? { image: params.image } : {}),
  };
}

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
