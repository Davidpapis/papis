import type { APIRoute } from 'astro';
import { sendTelegramMessage } from '../../lib/telegram';

export const prerender = false;

interface ContactPayload {
  name?: string;
  contact?: string;
  service?: string;
  subject?: string;
  message?: string;
  website?: string;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json().catch(() => ({}))) as ContactPayload;

    // Honeypot silencioso contra spam automatizado
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return new Response(JSON.stringify({ ok: true, id: `lead-${Date.now()}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const contact = typeof body.contact === 'string' ? body.contact.trim().slice(0, 160) : '';
    const service =
      typeof body.service === 'string' && ['web', 'software', 'tecnico'].includes(body.service)
        ? body.service
        : 'web';
    const subject =
      typeof body.subject === 'string' && body.subject.trim().length > 0
        ? body.subject.trim().slice(0, 180)
        : 'Consulta desde papis.app';
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

    if (name.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Indícanos tu nombre para poder dirigirnos a ti.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const isValidPhone = contact.replace(/\D/g, '').length >= 9;

    if (!isValidEmail && !isValidPhone) {
      return new Response(
        JSON.stringify({
          error: 'Introduce un teléfono válido (9 dígitos) o un correo electrónico.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      name,
      contact,
      service,
      subject,
      message,
    };

    const deliveredVia: string[] = [];

    const telegramOk = await sendTelegramMessage(
      [
        `📩 Nuevo lead en papis.app (${lead.service})`,
        `👤 Nombre: ${lead.name}`,
        `📞 Contacto: ${lead.contact}`,
        `📌 Asunto: ${lead.subject}`,
        `📝 Mensaje: ${lead.message || '(Sin mensaje adicional)'}`,
      ].join('\n')
    );
    if (telegramOk) deliveredVia.push('telegram');

    const webhookUrl = import.meta.env.CONTACT_WEBHOOK_URL?.trim();
    if (webhookUrl) {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      if (resp.ok) deliveredVia.push('webhook');
    }

    const resendKey = import.meta.env.RESEND_API_KEY?.trim();
    const toEmail = import.meta.env.CONTACT_TO_EMAIL?.trim();
    const fromEmail =
      import.meta.env.CONTACT_FROM_EMAIL?.trim() || 'papis.app <onboarding@resend.dev>';

    if (resendKey && toEmail) {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [toEmail],
          subject: `[papis.app] Nuevo lead (${lead.service}): ${lead.name}`,
          text: [
            `Nueva solicitud desde papis.app`,
            `ID: ${lead.id}`,
            `Fecha: ${lead.createdAt}`,
            `Nombre: ${lead.name}`,
            `Contacto: ${lead.contact}`,
            `Pilar: ${lead.service}`,
            `Asunto: ${lead.subject}`,
            `Mensaje:\n${lead.message || '(Sin mensaje adicional)'}`,
          ].join('\n'),
        }),
      });
      if (resp.ok) deliveredVia.push('email');
    }

    return new Response(JSON.stringify({ ok: true, id: lead.id, deliveredVia }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error en /api/contact:', err);
    return new Response(
      JSON.stringify({
        error: 'No hemos podido registrar tu solicitud. Escríbenos directamente por WhatsApp.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
