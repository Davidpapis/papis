import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * Colecciones tipadas con Astro Content Collections + Zod.
 * Las validaciones están sincronizadas con keystatic.config.ts para que
 * cualquier campo obligatorio faltante falle en build y nunca en producción.
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(5).max(90),
    client: z.string().min(2).max(80),
    location: z.string().min(2).max(80),
    year: z.string().length(4),
    pillar: z.enum(['web', 'software', 'tecnico']),
    deviceType: z.enum(['browser', 'dashboard', 'home']),
    urlPreview: z.string().min(3).max(80),
    imageKey: z.enum([
      'portfolio-luxury-web',
      'portfolio-erp-inmobiliaria',
      'portfolio-academia-baile',
      'servicio-tecnico-marbella',
    ]),
    imageAlt: z.string().min(10).max(180),
    summary: z.string().min(30).max(260),
    challenge: z.string().min(20).max(400),
    solution: z.string().min(20).max(400),
    deliverables: z.array(z.string().min(3).max(90)).min(1),
    metrics: z
      .array(
        z.object({
          value: z.string().min(1).max(20),
          label: z.string().min(2).max(45),
        })
      )
      .min(1)
      .max(3),
    featured: z.boolean().default(true),
    order: z.number().int().default(1),
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    question: z.string().min(10).max(140),
    pillar: z.enum(['general', 'web', 'software', 'tecnico']),
    answer: z.string().min(40).max(800),
    order: z.number().int().default(1),
  }),
});

export const collections = { projects, faqs };
