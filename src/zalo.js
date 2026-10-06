/**
 * Gửi tin nhắn văn bản tới Zalo Bot API (sendMessage).
 */

function getZaloCredentials() {
  const token = process.env.ZALO_BOT_TOKEN;
  const chatId = process.env.ZALO_CHAT_ID;

  if (!token) {
    throw new Error('ZALO_BOT_TOKEN chưa được cấu hình');
  }
  if (!chatId) {
    throw new Error('ZALO_CHAT_ID chưa được cấu hình');
  }

  return { token, chatId };
}

async function postZalo(method, payload) {
  const { token } = getZaloCredentials();
  const url = `https://bot-api.zaloplatforms.com/bot${token}/${method}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.ok) {
    const detail = body ? JSON.stringify(body) : `HTTP ${response.status}`;
    throw new Error(`Zalo ${method} thất bại: ${detail}`);
  }

  return body;
}

export async function sendZaloMessage(text) {
  const { chatId } = getZaloCredentials();
  return postZalo('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'markdown',
  });
}

/**
 * Gửi sticker tới Zalo Bot API (sendSticker).
 */
export async function sendZaloSticker(stickerId) {
  const { chatId } = getZaloCredentials();
  return postZalo('sendSticker', {
    chat_id: chatId,
    sticker: stickerId,
  });
}
