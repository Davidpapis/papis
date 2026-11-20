/**
 * Helper ligero para enviar notificaciones a Telegram desde los endpoints de Vercel.
 * Registra el motivo exacto en los logs de Vercel si Telegram devuelve error (400/401/403).
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    import.meta.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    import.meta.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    console.warn('Telegram omitido: faltan TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID');
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 3900),
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const errBody = await resp.text().catch(() => '');
      console.error(`Telegram API respondió ${resp.status}:`, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error enviando notificación a Telegram:', err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
