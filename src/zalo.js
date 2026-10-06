/**
 * Gửi tin nhắn văn bản tới Zalo Bot API (sendMessage).
 */
export async function sendZaloMessage(text) {
  const token = process.env.ZALO_BOT_TOKEN;
  const chatId = process.env.ZALO_CHAT_ID;

  if (!token) {
    throw new Error('ZALO_BOT_TOKEN chưa được cấu hình');
  }
  if (!chatId) {
    throw new Error('ZALO_CHAT_ID chưa được cấu hình');
  }

  const url = `https://bot-api.zaloplatforms.com/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'markdown',
    }),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    const detail = body ? JSON.stringify(body) : `HTTP ${response.status}`;
    throw new Error(`Zalo sendMessage thất bại: ${detail}`);
  }

  return body;
}
