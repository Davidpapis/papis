/**
 * Helper ligero para enviar notificaciones a Telegram desde los endpoints de Vercel.
 * Usa un timeout corto (2.5s) para nunca bloquear al visitante si Telegram tarda.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token =
    process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    import.meta.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim() ||
    import.meta.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);

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
    return resp.ok;
  } catch (err) {
    console.error('Error enviando notificación a Telegram:', err);
    return false;
  } finally {
    clearTimeout(timer);
  }
}
