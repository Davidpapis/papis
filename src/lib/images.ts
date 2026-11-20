import type { ImageMetadata } from 'astro';
import heroWeb from '../assets/images/hero-web.webp';
import heroSoftware from '../assets/images/hero-software.webp';
import heroTecnico from '../assets/images/hero-tecnico.webp';
import portfolioLuxuryWeb from '../assets/images/portfolio-luxury-web.webp';
import portfolioErpInmobiliaria from '../assets/images/portfolio-erp-inmobiliaria.webp';
import portfolioAcademiaBaile from '../assets/images/portfolio-academia-baile.webp';
import servicioTecnicoMarbella from '../assets/images/servicio-tecnico-marbella.webp';
import avatarIa from '../assets/images/avatar-ia.webp';

export const HERO_IMAGES = {
  web: heroWeb,
  software: heroSoftware,
  tecnico: heroTecnico,
} as const;

export const PROJECT_IMAGES: Record<
  | 'portfolio-luxury-web'
  | 'portfolio-erp-inmobiliaria'
  | 'portfolio-academia-baile'
  | 'servicio-tecnico-marbella',
  ImageMetadata
> = {
  'portfolio-luxury-web': portfolioLuxuryWeb,
  'portfolio-erp-inmobiliaria': portfolioErpInmobiliaria,
  'portfolio-academia-baile': portfolioAcademiaBaile,
  'servicio-tecnico-marbella': servicioTecnicoMarbella,
};

export const AVATAR_IMAGE = avatarIa;
