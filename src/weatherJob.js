import cron from 'node-cron';
import { fetchHanoiWeather } from './weather.js';
import { formatWeatherMessage } from './formatWeatherMessage.js';
import { pickWeatherSticker } from './weatherMedia.js';
import { sendZaloMessage, sendZaloSticker } from './zalo.js';

/**
 * Chạy một lần: sticker (best-effort) rồi text.
 * Ném lỗi nếu fetch hoặc gửi text thất bại (caller bắt).
 */
export async function runWeatherNotify() {
  console.log('[weather] fetching...');
  const data = await fetchHanoiWeather();
  const text = formatWeatherMessage(data);
  const stickerId = pickWeatherSticker(data.isRain);

  try {
    console.log('[weather] sticker=', stickerId, 'isRain=', data.isRain);
    await sendZaloSticker(stickerId);
  } catch (err) {
    console.error('[weather] sticker failed:', err.message);
  }

  console.log('[weather] sending text...');
  await sendZaloMessage(text);
  console.log('[weather] ok');
  return { data, stickerId };
}

function getCronExpressions() {
  // WEATHER_CRON có thể là một biểu thức hoặc nhiều biểu thức cách nhau bởi dấu phẩy
  const raw = process.env.WEATHER_CRON;
  if (raw && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  // Mặc định: thứ 3 8:00 và 14:00 (Asia/Ho_Chi_Minh)
  return ['0 8 * * 2', '0 14 * * 2'];
}

/**
 * Đăng ký cron. Lỗi start chỉ log — không crash app.
 * Mặc định bật trừ khi WEATHER_ENABLED=false.
 */
export function startWeatherJob() {
  const enabled = String(process.env.WEATHER_ENABLED ?? 'true').toLowerCase();
  if (enabled === 'false' || enabled === '0' || enabled === 'off') {
    console.log('[weather] disabled (WEATHER_ENABLED=false)');
    return [];
  }

  const timezone = process.env.WEATHER_TZ || 'Asia/Ho_Chi_Minh';
  const expressions = getCronExpressions();
  const tasks = [];

  for (const expression of expressions) {
    if (!cron.validate(expression)) {
      console.error('[weather] invalid cron:', expression);
      continue;
    }

    const task = cron.schedule(
      expression,
      async () => {
        try {
          await runWeatherNotify();
        } catch (err) {
          console.error('[weather] job failed:', err.message);
        }
      },
      { timezone },
    );

    tasks.push(task);
    console.log(`[weather] cron scheduled: "${expression}" tz=${timezone}`);
  }

  return tasks;
}
