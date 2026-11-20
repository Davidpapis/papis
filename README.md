# papis.app — Web Oficial (Astro + Tailwind CSS v4 + Keystatic)

Web corporativa, catálogo de soluciones y generador de leads de **papis.app** (Marbella, Costa del Sol) construida con **Astro**, **Tailwind CSS v4**, **Keystatic CMS**, arquitectura **SEO + GEO** y estándares de **Design Engineering**.

## Comandos principales

```bash
# Desarrollo local (web + panel CMS en /keystatic)
npm run dev

# Comprobación de tipos y esquemas Astro + Zod
npm run lint

# Build de producción (SSG + endpoints Vercel)
npm run build
```

## Panel de edición sin código (`/keystatic`)

En desarrollo local (`npm run dev`), abre `http://localhost:4321/keystatic` para editar:
- **Ajustes Generales y Contacto** (`siteSettings`): teléfono, WhatsApp, email, zonas de servicio, redes `sameAs` y textos legales.
- **Páginas Principales**: Portada (escenas del Hero), Pilar 1 (Web/SEO/GEO), Pilar 2 (Software Empresas), Pilar 3 (Servicio Técnico) y Contacto.
- **Colecciones**: Proyectos del portfolio (`/proyectos/[slug]`) y Preguntas Frecuentes GEO (`FAQPage` JSON-LD).

## Variables de entorno (`.env`)

Consulta `.env.example` para configurar opcionalmente `GEMINI_API_KEY` (Asistente Virtual IA) y `RESEND_API_KEY` / `CONTACT_WEBHOOK_URL` (envío de leads del formulario).
