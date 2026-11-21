import { config, fields, collection, singleton } from '@keystatic/core';

/**
 * Configuración del panel CMS Keystatic para papis.app.
 * Reglas aplicadas (keystatic-clean-multilang-ux):
 * - Uso estricto de fields.text() (nunca fields.string()).
 * - Etiquetas y ayudas en lenguaje natural de negocio en español de España.
 * - Validaciones de longitud sincronizadas con los esquemas Zod de Astro.
 */
export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: {
      name: 'papis.app · Panel de Contenido',
    },
    navigation: {
      'Configuración Global': ['siteSettings'],
      'Páginas Principales': [
        'home',
        'pillarWeb',
        'pillarSoftware',
        'pillarTechSupport',
        'contactPage',
      ],
      'Colecciones Editables': ['projects', 'faqs', 'knowledge'],
    },
  },
  singletons: {
    siteSettings: singleton({
      label: 'Ajustes Generales y Contacto',
      path: 'src/content/singletons/site-settings',
      format: { data: 'json' },
      schema: {
        brandName: fields.text({
          label: 'Nombre comercial de la marca',
          description: 'Aparece en el logotipo, pie de página y datos estructurados de Google',
          validation: { length: { min: 2, max: 60 } },
        }),
        domain: fields.text({
          label: 'Dominio principal de la web',
          description: 'URL completa sin barra final (ej: https://papis.app)',
          validation: { length: { min: 8, max: 120 } },
        }),
        phoneDisplay: fields.text({
          label: 'Teléfono visible para clientes',
          description: 'Número que aparece en botones de llamada y pie de página',
          validation: { length: { min: 9, max: 25 } },
        }),
        whatsappNumber: fields.text({
          label: 'Número de WhatsApp (solo dígitos con prefijo)',
          description: 'Sin signos ni espacios, ej: 34600123456',
          validation: { length: { min: 9, max: 16 } },
        }),
        email: fields.text({
          label: 'Correo electrónico de contacto',
          description: 'Dirección principal donde llegan las consultas de clientes',
          validation: { length: { min: 5, max: 120 } },
        }),
        city: fields.text({
          label: 'Ciudad y zona principal',
          description: 'Se usa en el SEO local y en el pie de página (ej: Marbella, Costa del Sol)',
          validation: { length: { min: 3, max: 80 } },
        }),
        serviceAreas: fields.array(
          fields.text({
            label: 'Localidad cubierta',
            validation: { length: { min: 2, max: 60 } },
          }),
          {
            label: 'Zonas de servicio presencial',
            description: 'Ciudades donde atiendes presencialmente (se inyectan en Schema.org)',
            itemLabel: (props) => props.value || 'Nueva localidad',
          }
        ),
        defaultSeoTitle: fields.text({
          label: 'Título SEO por defecto (Google)',
          description: 'Se usa si una página no define uno propio (máx. 60 caracteres)',
          validation: { length: { min: 15, max: 60 } },
        }),
        defaultSeoDescription: fields.text({
          label: 'Descripción corta para Google por defecto',
          description: 'Resumen que aparece bajo el título en buscadores (140-160 caracteres)',
          multiline: true,
          validation: { length: { min: 60, max: 160 } },
        }),
        legalOwner: fields.text({
          label: 'Titular legal (Aviso Legal y RGPD)',
          description: 'Nombre y apellidos o razón social para los textos legales',
          validation: { length: { min: 2, max: 120 } },
        }),
        legalNoticeNote: fields.text({
          label: 'Datos fiscales adicionales (NIF / domicilio fiscal)',
          description: 'Completa aquí tu NIF y dirección fiscal cuando quieras publicarlo',
          multiline: true,
        }),
        socialLinks: fields.array(
          fields.object({
            network: fields.text({
              label: 'Red social o perfil',
              description: 'Ej: LinkedIn, Instagram, GitHub, Google Maps',
              validation: { length: { min: 2, max: 40 } },
            }),
            url: fields.text({
              label: 'Enlace completo del perfil',
              description: 'URL completa empezando por https://',
              validation: { length: { min: 10, max: 200 } },
            }),
          }),
          {
            label: 'Redes sociales y perfiles externos (sameAs)',
            description: 'Ayudan a Google y a la IA a verificar tu marca',
            itemLabel: (props) => props.fields.network.value || 'Nuevo perfil',
          }
        ),
      },
    }),

    home: singleton({
      label: 'Portada (Inicio)',
      path: 'src/content/singletons/home',
      format: { data: 'json' },
      schema: {
        seo: fields.object(
          {
            title: fields.text({
              label: 'Título para Google (Portada)',
              description: 'Entre 50 y 60 caracteres con la palabra clave principal delante',
              validation: { length: { min: 20, max: 60 } },
            }),
            description: fields.text({
              label: 'Descripción corta para Google (Portada)',
              description: 'Entre 140 y 160 caracteres orientada a que el usuario haga clic',
              multiline: true,
              validation: { length: { min: 80, max: 160 } },
            }),
          },
          { label: 'SEO de la Portada' }
        ),
        heroSlides: fields.array(
          fields.object({
            pillar: fields.select({
              label: 'Pilar de servicio',
              options: [
                { label: 'Web y SEO/GEO (Azul)', value: 'web' },
                { label: 'Software Empresas (Esmeralda)', value: 'software' },
                { label: 'Servicio Técnico (Naranja)', value: 'tecnico' },
              ],
              defaultValue: 'web',
            }),
            indexLabel: fields.text({
              label: 'Número de orden',
              description: 'Ej: 01, 02, 03',
              validation: { length: { min: 2, max: 4 } },
            }),
            shortTitle: fields.text({
              label: 'Etiqueta corta de la barra inferior',
              validation: { length: { min: 3, max: 30 } },
            }),
            kicker: fields.text({
              label: 'Antetítulo sobre el titular',
              validation: { length: { min: 5, max: 80 } },
            }),
            title: fields.text({
              label: 'Titular principal de la escena',
              description: 'Propuesta de valor clara y directa (máx. 80 caracteres)',
              validation: { length: { min: 10, max: 85 } },
            }),
            description: fields.text({
              label: 'Subtítulo descriptivo',
              multiline: true,
              validation: { length: { min: 20, max: 200 } },
            }),
            primaryCta: fields.text({
              label: 'Texto del botón principal',
              description: 'Ej: Quiero mi Web',
              validation: { length: { min: 3, max: 40 } },
            }),
            secondaryCta: fields.text({
              label: 'Texto del botón secundario',
              description: 'Ej: Ver Diseño Web',
              validation: { length: { min: 3, max: 40 } },
            }),
            serviceHref: fields.text({
              label: 'Ruta de destino del botón secundario',
              description: 'Ej: /paginas-web, /software-empresas o /servicio-tecnico',
              validation: { length: { min: 2, max: 60 } },
            }),
          }),
          {
            label: 'Escenas del Hero interactivo (3 pilares)',
            itemLabel: (props) => props.fields.shortTitle.value || 'Escena Hero',
          }
        ),
        pillarsIntro: fields.object(
          {
            kicker: fields.text({
              label: 'Antetítulo de la sección de pilares',
              validation: { length: { min: 3, max: 80 } },
            }),
            heading: fields.text({
              label: 'Título de la sección de pilares (H2)',
              validation: { length: { min: 10, max: 90 } },
            }),
            description: fields.text({
              label: 'Introducción breve',
              multiline: true,
              validation: { length: { min: 20, max: 260 } },
            }),
          },
          { label: 'Bloque Resumen de los 3 Pilares' }
        ),
        aboutBlock: fields.object(
          {
            kicker: fields.text({
              label: 'Antetítulo "Sobre papis.app"',
              validation: { length: { min: 3, max: 80 } },
            }),
            heading: fields.text({
              label: 'Titular de cercanía y diferenciación (H2)',
              validation: { length: { min: 10, max: 95 } },
            }),
            body: fields.text({
              label: 'Texto de presentación directa',
              multiline: true,
              validation: { length: { min: 40, max: 600 } },
            }),
            highlights: fields.array(
              fields.object({
                value: fields.text({
                  label: 'Cifra o dato destacado',
                  validation: { length: { min: 1, max: 20 } },
                }),
                label: fields.text({
                  label: 'Explicación corta del dato',
                  validation: { length: { min: 3, max: 60 } },
                }),
              }),
              {
                label: 'Indicadores de confianza (3 datos)',
                itemLabel: (props) =>
                  `${props.fields.value.value || ''} — ${props.fields.label.value || ''}`,
              }
            ),
          },
          { label: 'Bloque Confianza y Trato Directo' }
        ),
      },
    }),

    pillarWeb: singleton({
      label: 'Página Pilar 1: Diseño Web, SEO y GEO',
      path: 'src/content/singletons/pillar-web',
      format: { data: 'json' },
      schema: {
        seo: fields.object(
          {
            title: fields.text({
              label: 'Título para Google (Páginas Web)',
              description: '50-60 caracteres con keyword transaccional delante',
              validation: { length: { min: 20, max: 60 } },
            }),
            description: fields.text({
              label: 'Descripción corta para Google (Páginas Web)',
              multiline: true,
              validation: { length: { min: 80, max: 160 } },
            }),
          },
          { label: 'SEO de Páginas Web' }
        ),
        kicker: fields.text({
          label: 'Antetítulo de página',
          validation: { length: { min: 5, max: 90 } },
        }),
        h1: fields.text({
          label: 'Titular principal de la página (H1)',
          validation: { length: { min: 15, max: 95 } },
        }),
        intro: fields.text({
          label: 'Párrafo de entrada orientado a conversión',
          multiline: true,
          validation: { length: { min: 40, max: 360 } },
        }),
        ctaLabel: fields.text({
          label: 'Texto del botón de llamada a la acción',
          validation: { length: { min: 4, max: 50 } },
        }),
      },
    }),

    pillarSoftware: singleton({
      label: 'Página Pilar 2: Software a Medida',
      path: 'src/content/singletons/pillar-software',
      format: { data: 'json' },
      schema: {
        seo: fields.object(
          {
            title: fields.text({
              label: 'Título para Google (Software Empresas)',
              validation: { length: { min: 20, max: 60 } },
            }),
            description: fields.text({
              label: 'Descripción corta para Google (Software Empresas)',
              multiline: true,
              validation: { length: { min: 80, max: 160 } },
            }),
          },
          { label: 'SEO de Software Empresas' }
        ),
        kicker: fields.text({
          label: 'Antetítulo de página',
          validation: { length: { min: 5, max: 90 } },
        }),
        h1: fields.text({
          label: 'Titular principal de la página (H1)',
          validation: { length: { min: 15, max: 95 } },
        }),
        intro: fields.text({
          label: 'Párrafo de entrada orientado a empresas',
          multiline: true,
          validation: { length: { min: 40, max: 360 } },
        }),
        ctaLabel: fields.text({
          label: 'Texto del botón de llamada a la acción',
          validation: { length: { min: 4, max: 50 } },
        }),
      },
    }),

    pillarTechSupport: singleton({
      label: 'Página Pilar 3: Servicio Técnico a Domicilio',
      path: 'src/content/singletons/pillar-tech-support',
      format: { data: 'json' },
      schema: {
        seo: fields.object(
          {
            title: fields.text({
              label: 'Título para Google (Servicio Técnico)',
              validation: { length: { min: 20, max: 60 } },
            }),
            description: fields.text({
              label: 'Descripción corta para Google (Servicio Técnico)',
              multiline: true,
              validation: { length: { min: 80, max: 160 } },
            }),
          },
          { label: 'SEO de Servicio Técnico' }
        ),
        kicker: fields.text({
          label: 'Antetítulo de página',
          validation: { length: { min: 5, max: 90 } },
        }),
        h1: fields.text({
          label: 'Titular principal de la página (H1)',
          validation: { length: { min: 15, max: 95 } },
        }),
        intro: fields.text({
          label: 'Párrafo de entrada cercano y directo',
          multiline: true,
          validation: { length: { min: 40, max: 360 } },
        }),
        ctaLabel: fields.text({
          label: 'Texto del botón de llamada a la acción',
          validation: { length: { min: 4, max: 50 } },
        }),
      },
    }),

    contactPage: singleton({
      label: 'Página de Contacto',
      path: 'src/content/singletons/contact-page',
      format: { data: 'json' },
      schema: {
        seo: fields.object(
          {
            title: fields.text({
              label: 'Título para Google (Contacto)',
              validation: { length: { min: 20, max: 60 } },
            }),
            description: fields.text({
              label: 'Descripción corta para Google (Contacto)',
              multiline: true,
              validation: { length: { min: 80, max: 160 } },
            }),
          },
          { label: 'SEO de Contacto' }
        ),
        kicker: fields.text({
          label: 'Antetítulo de respuesta rápida',
          validation: { length: { min: 5, max: 90 } },
        }),
        h1: fields.text({
          label: 'Titular principal de contacto (H1)',
          validation: { length: { min: 5, max: 80 } },
        }),
        intro: fields.text({
          label: 'Subtítulo de confianza',
          multiline: true,
          validation: { length: { min: 20, max: 260 } },
        }),
      },
    }),
  },

  collections: {
    projects: collection({
      label: 'Proyectos del Portfolio',
      slugField: 'title',
      path: 'src/content/projects/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Título del proyecto',
            description: 'Nombre claro y descriptivo del caso de éxito',
            validation: { length: { min: 5, max: 90 } },
          },
          slug: {
            label: 'Dirección URL (slug)',
            description: 'En minúsculas y separado por guiones (ej: erp-gestion-inmobiliaria)',
          },
        }),
        client: fields.text({
          label: 'Cliente o tipo de cliente',
          validation: { length: { min: 2, max: 80 } },
        }),
        location: fields.text({
          label: 'Ubicación del proyecto',
          description: 'Ej: Marbella, Málaga',
          validation: { length: { min: 2, max: 80 } },
        }),
        year: fields.text({
          label: 'Año de entrega',
          description: 'Ej: 2026',
          validation: { length: { min: 4, max: 4 } },
        }),
        pillar: fields.select({
          label: 'Pilar al que pertenece',
          options: [
            { label: 'Diseño Web & SEO/GEO', value: 'web' },
            { label: 'Software a Medida', value: 'software' },
            { label: 'Servicio Técnico a Domicilio', value: 'tecnico' },
          ],
          defaultValue: 'web',
        }),
        deviceType: fields.select({
          label: 'Marco visual de presentación',
          options: [
            { label: 'Navegador Web', value: 'browser' },
            { label: 'Panel / Dashboard', value: 'dashboard' },
            { label: 'Servicio a Domicilio', value: 'home' },
          ],
          defaultValue: 'browser',
        }),
        urlPreview: fields.text({
          label: 'Texto de barra superior del marco',
          description: 'Dominio o etiqueta corta (ej: goldenmile-estates.es)',
          validation: { length: { min: 3, max: 80 } },
        }),
        imageKey: fields.select({
          label: 'Imagen principal optimizada',
          options: [
            { label: 'Portal Inmobiliario de Lujo', value: 'portfolio-luxury-web' },
            { label: 'ERP Gestión Inmobiliaria', value: 'portfolio-erp-inmobiliaria' },
            { label: 'Software Academia de Baile', value: 'portfolio-academia-baile' },
            { label: 'Servicio Técnico en Marbella', value: 'servicio-tecnico-marbella' },
          ],
          defaultValue: 'portfolio-luxury-web',
        }),
        imageAlt: fields.text({
          label: 'Texto alternativo de la imagen (SEO y accesibilidad)',
          description: 'Describe qué se ve en la foto para Google y lectores de pantalla',
          validation: { length: { min: 10, max: 180 } },
        }),
        summary: fields.text({
          label: 'Resumen ejecutivo (tarjeta del listado)',
          multiline: true,
          validation: { length: { min: 30, max: 260 } },
        }),
        challenge: fields.text({
          label: 'El reto inicial del cliente',
          multiline: true,
          validation: { length: { min: 20, max: 400 } },
        }),
        solution: fields.text({
          label: 'Solución implementada',
          multiline: true,
          validation: { length: { min: 20, max: 400 } },
        }),
        deliverables: fields.array(
          fields.text({
            label: 'Entregable',
            validation: { length: { min: 3, max: 90 } },
          }),
          {
            label: 'Entregables clave del proyecto',
            itemLabel: (props) => props.value || 'Nuevo entregable',
          }
        ),
        metrics: fields.array(
          fields.object({
            value: fields.text({
              label: 'Resultado medido',
              description: 'Ej: 99/100, -68%, +165%',
              validation: { length: { min: 1, max: 20 } },
            }),
            label: fields.text({
              label: 'Qué mide esa cifra',
              description: 'Ej: Core Web Vitals, Ahorro semanal',
              validation: { length: { min: 2, max: 45 } },
            }),
          }),
          {
            label: 'Métricas de resultado (máx. 3)',
            itemLabel: (props) =>
              `${props.fields.value.value || ''} — ${props.fields.label.value || ''}`,
          }
        ),
        featured: fields.checkbox({
          label: 'Destacar este proyecto en la portada',
          defaultValue: true,
        }),
        socialImpact: fields.checkbox({
          label: 'Proyecto de compromiso social / subvencionado',
          description: 'Muestra un distintivo especial de compromiso social en la tarjeta y ficha',
          defaultValue: false,
        }),
        externalUrl: fields.text({
          label: 'Enlace web en vivo (opcional)',
          description: 'URL pública verificable del proyecto (ej: https://aaarm.vercel.app)',
        }),
        order: fields.integer({
          label: 'Orden de aparición',
          description: 'Número menor aparece primero (1, 2, 3...)',
          defaultValue: 1,
        }),
        content: fields.markdoc({
          label: 'Explicación ampliada del caso (opcional)',
          description: 'Detalle adicional en formato artículo para posicionar mejor la ficha',
          extension: 'md',
        }),
      },
    }),

    faqs: collection({
      label: 'Preguntas Frecuentes (SEO + GEO)',
      slugField: 'question',
      path: 'src/content/faqs/*',
      format: { data: 'json' },
      schema: {
        question: fields.slug({
          name: {
            label: 'Pregunta frecuente (tal como pregunta el cliente)',
            description: 'Usa lenguaje natural de búsqueda para que ChatGPT y Google la citen',
            validation: { length: { min: 10, max: 140 } },
          },
          slug: {
            label: 'Identificador URL (slug)',
            description: 'En minúsculas y con guiones',
          },
        }),
        pillar: fields.select({
          label: 'Sección donde aparece esta pregunta',
          options: [
            { label: 'Portada (General)', value: 'general' },
            { label: 'Pilar 1: Páginas Web y SEO/GEO', value: 'web' },
            { label: 'Pilar 2: Software a Medida', value: 'software' },
            { label: 'Pilar 3: Servicio Técnico a Domicilio', value: 'tecnico' },
          ],
          defaultValue: 'general',
        }),
        answer: fields.text({
          label: 'Respuesta completa y citable (60-100 palabras)',
          description: 'Autocontenida, tono directo y mencionando Marbella / Costa del Sol cuando aplique',
          multiline: true,
          validation: { length: { min: 40, max: 800 } },
        }),
        order: fields.integer({
          label: 'Orden de aparición',
          defaultValue: 1,
        }),
      },
    }),

    knowledge: collection({
      label: 'Base de Conocimiento (Asistente IA)',
      slugField: 'title',
      path: 'src/content/knowledge/*',
      format: { data: 'json' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Tema o título de la ficha',
            description: 'Ej: Precios y plazos orientativos, Servicio Técnico a Domicilio',
            validation: { length: { min: 4, max: 100 } },
          },
          slug: {
            label: 'Identificador de archivo (slug)',
            description: 'En minúsculas y con guiones (ej: precios-y-plazos)',
          },
        }),
        category: fields.select({
          label: 'Categoría del conocimiento',
          options: [
            { label: 'General', value: 'General' },
            { label: 'Web y SEO/GEO', value: 'Web y SEO/GEO' },
            { label: 'Software Empresas', value: 'Software Empresas' },
            { label: 'Servicio Técnico', value: 'Servicio Técnico' },
            { label: 'Precios y Plazos', value: 'Precios y Plazos' },
          ],
          defaultValue: 'General',
        }),
        content: fields.text({
          label: 'Información real que usará el Asistente IA',
          description: 'Escribe datos claros y reales. El asistente responderá basándose solo en estas fichas.',
          multiline: true,
          validation: { length: { min: 20, max: 2500 } },
        }),
        enabled: fields.checkbox({
          label: 'Ficha activa para el Asistente IA',
          defaultValue: true,
        }),
        order: fields.integer({
          label: 'Orden de prioridad',
          defaultValue: 1,
        }),
      },
    }),
  },
});
