export type PillarId = 'web' | 'software' | 'tecnico';

export interface PillarPalette {
  id: PillarId;
  label: string;
  divisionPrefix: string;
  divisionHighlight: string;
  accent: string;
  secondary: string;
  rgb: string;
  softBg: string;
  href: string;
}

export const PILLAR_PALETTES: Record<PillarId, PillarPalette> = {
  web: {
    id: 'web',
    label: 'Web & SEO/GEO',
    divisionPrefix: 'WEB &',
    divisionHighlight: 'APPS',
    accent: '#3B82F6',
    secondary: '#06B6D4',
    rgb: '59, 130, 246',
    softBg: 'rgba(59, 130, 246, 0.12)',
    href: '/paginas-web',
  },
  software: {
    id: 'software',
    label: 'Software Empresas',
    divisionPrefix: 'SOFTWARE &',
    divisionHighlight: 'EMPRESAS',
    accent: '#10B981',
    secondary: '#34D399',
    rgb: '16, 185, 129',
    softBg: 'rgba(16, 185, 129, 0.12)',
    href: '/software-empresas',
  },
  tecnico: {
    id: 'tecnico',
    label: 'Servicio Técnico',
    divisionPrefix: 'SERVICIO',
    divisionHighlight: 'TÉCNICO',
    accent: '#F97316',
    secondary: '#FB923C',
    rgb: '249, 115, 22',
    softBg: 'rgba(249, 115, 22, 0.12)',
    href: '/servicio-tecnico',
  },
};

export const NAV_LINKS = [
  { label: 'Inicio', href: '/' },
  { label: 'Web', href: '/paginas-web' },
  { label: 'Software', href: '/software-empresas' },
  { label: 'Técnico', href: '/servicio-tecnico' },
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Contacto', href: '/contacto' },
] as const;
