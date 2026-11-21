import type { ImageMetadata } from 'astro';
import heroWeb from '../assets/images/hero-web.webp';
import heroSoftware from '../assets/images/hero-software.webp';
import heroTecnico from '../assets/images/hero-tecnico.webp';
import portfolioLuxuryWeb from '../assets/images/portfolio-luxury-web.webp';
import portfolioErpInmobiliaria from '../assets/images/portfolio-erp-inmobiliaria.webp';
import portfolioAcademiaBaile from '../assets/images/portfolio-academia-baile.webp';
import servicioTecnicoMarbella from '../assets/images/servicio-tecnico-marbella.webp';
import projectAaarm from '../assets/images/project-aaarm.webp';
import projectGruposerinamar from '../assets/images/project-gruposerinamar.webp';
import projectCerrajeria24h from '../assets/images/project-cerrajeria24h.webp';
import projectJustbanus from '../assets/images/project-justbanus.webp';
import project66nunataks from '../assets/images/project-66nunataks.webp';
import projectBobisapp from '../assets/images/project-bobisapp.webp';
import projectLaclave from '../assets/images/project-laclave.webp';
import avatarIa from '../assets/images/avatar-ia.webp';

export const HERO_IMAGES = {
  web: heroWeb,
  software: heroSoftware,
  tecnico: heroTecnico,
} as const;

export const PROJECT_IMAGES: Record<
  | 'project-aaarm'
  | 'project-gruposerinamar'
  | 'project-cerrajeria24h'
  | 'project-justbanus'
  | 'project-66nunataks'
  | 'project-bobisapp'
  | 'project-laclave'
  | 'portfolio-luxury-web'
  | 'portfolio-erp-inmobiliaria'
  | 'portfolio-academia-baile'
  | 'servicio-tecnico-marbella',
  ImageMetadata
> = {
  'project-aaarm': projectAaarm,
  'project-gruposerinamar': projectGruposerinamar,
  'project-cerrajeria24h': projectCerrajeria24h,
  'project-justbanus': projectJustbanus,
  'project-66nunataks': project66nunataks,
  'project-bobisapp': projectBobisapp,
  'project-laclave': projectLaclave,
  'portfolio-luxury-web': portfolioLuxuryWeb,
  'portfolio-erp-inmobiliaria': portfolioErpInmobiliaria,
  'portfolio-academia-baile': portfolioAcademiaBaile,
  'servicio-tecnico-marbella': servicioTecnicoMarbella,
};

export const AVATAR_IMAGE = avatarIa;
