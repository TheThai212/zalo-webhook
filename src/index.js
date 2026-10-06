import 'dotenv/config';
import express from 'express';
import { verifySepayApiKey } from './sepayAuth.js';
import { hasProcessed, markProcessed } from './dedup.js';
import { formatIncomingMessage, formatOutgoingMessage } from './formatMessage.js';
import { sendZaloMessage, sendZaloSticker } from './zalo.js';
import { startWeatherJob, runWeatherNotify } from './weatherJob.js';
import { pickTransferSticker } from './transferMedia.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

/** Gửi thử thời tiết — tách biệt hoàn toàn khỏi SePay. */
app.post('/weather/test', async (_req, res) => {
  try {
    const result = await runWeatherNotify();
    return res.json({
      success: true,
      isRain: result.data.isRain,
      stickerId: result.stickerId,
    });
  } catch (err) {
    console.error('[weather] test failed:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/** Khóa chống trùng: id thật dùng id; test SePay (id=0) dùng referenceCode. */
function getDedupKey(data) {
  const id = data?.id;
  if (id === 0 || id === '0' || data?.code === 'SEPAYTEST') {
    return `test:${data.referenceCode || data.content || Date.now()}`;
  }
  return String(id);
}

/**
 * Parse body linh hoạt: JSON hoặc x-www-form-urlencoded.
 * Dùng raw để tránh express.json() trả HTML 400 khi SePay gửi lệch Content-Type.
 */
function parseSepayBody(req) {
  const ct = String(req.headers['content-type'] || '').toLowerCase();
  const raw = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : typeof req.body === 'string'
      ? req.body
      : '';

  console.log('[webhook] content-type=', ct);
  console.log('[webhook] raw=', raw.slice(0, 800));

  if (!raw.trim()) {
    return {};
  }

  // Ưu tiên JSON nếu body trông như JSON
  if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
    return JSON.parse(raw);
  }

  if (ct.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }

  if (ct.includes('application/json')) {
    return JSON.parse(raw);
  }

  // fallback
  try {
    return JSON.parse(raw);
  } catch {
    return Object.fromEntries(new URLSearchParams(raw));
  }
}

app.post(
  '/webhook/sepay',
  express.raw({ type: '*/*', limit: '1mb' }),
  async (req, res) => {
    try {
      const auth = verifySepayApiKey(req);
      if (!auth.ok) {
        return res.status(auth.status).json({ success: false, message: auth.message });
      }

      let data;
      try {
        data = parseSepayBody(req);
      } catch (err) {
        console.error('[webhook] parse error:', err.message);
        return res.status(400).json({ success: false, message: 'Invalid body' });
      }

      // SePay có thể gửi id dạng số hoặc chuỗi
      const id = data?.id ?? data?.transaction_id;
      if (id === undefined || id === null || id === '') {
        console.error('[webhook] missing id, keys=', Object.keys(data || {}));
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }

      data.id = id;

      // "Gửi thử" của SePay luôn dùng id=0 → dedup theo referenceCode để mỗi lần test vẫn gửi Zalo
      const dedupKey = getDedupKey(data);
      console.log('[webhook] dedupKey=', dedupKey);

      if (await hasProcessed(dedupKey)) {
        console.log('[webhook] skip duplicate, no Zalo send');
        return res.json({ success: true });
      }

      if (data.transferType === 'in' || data.transferType === 'out') {
        const text =
          data.transferType === 'out'
            ? formatOutgoingMessage(data)
            : formatIncomingMessage(data);
        try {
          console.log('[webhook] sending Zalo...', data.transferType);
          await sendZaloMessage(text);
          console.log('[webhook] Zalo ok');
          try {
            const stickerId = pickTransferSticker(data.transferType);
            if (stickerId) {
              console.log('[webhook] transfer sticker=', stickerId);
              await sendZaloSticker(stickerId);
            }
          } catch (stickerErr) {
            console.error('[zalo] transfer sticker failed:', stickerErr.message);
          }
        } catch (err) {
          console.error('[zalo]', err.message);
          return res.status(500).json({ success: false, message: 'Zalo send failed' });
        }
      }

      await markProcessed(dedupKey);
      return res.json({ success: true });
    } catch (err) {
      console.error('[webhook]', err);
      return res.status(500).json({ success: false, message: 'Internal error' });
    }
  },
);

app.listen(PORT, () => {
  console.log(`Listening on :${PORT}`);
  try {
    startWeatherJob();
  } catch (err) {
    console.error('[weather] start failed:', err.message);
  }
});
