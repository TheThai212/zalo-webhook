import 'dotenv/config';
import express from 'express';
import { verifySepayApiKey } from './sepayAuth.js';
import { hasProcessed, markProcessed } from './dedup.js';
import { formatIncomingMessage } from './formatMessage.js';
import { sendZaloMessage } from './zalo.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/webhook/sepay', async (req, res) => {
  try {
    const auth = verifySepayApiKey(req);
    if (!auth.ok) {
      return res.status(auth.status).json({ success: false, message: auth.message });
    }

    const data = req.body;
    if (!data?.id) {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    if (await hasProcessed(data.id)) {
      return res.json({ success: true });
    }

    if (data.transferType === 'in') {
      const text = formatIncomingMessage(data);
      try {
        await sendZaloMessage(text);
      } catch (err) {
        console.error('[zalo]', err.message);
        return res.status(500).json({ success: false, message: 'Zalo send failed' });
      }
    }

    await markProcessed(data.id);
    return res.json({ success: true });
  } catch (err) {
    console.error('[webhook]', err);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on :${PORT}`);
});
