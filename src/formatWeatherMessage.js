/**
 * Format tin nhắn markdown thời tiết.
 */
export function formatWeatherMessage(data) {
  const temp =
    data.temperature === undefined || data.temperature === null
      ? '—'
      : `${Math.round(Number(data.temperature))}°C`;

  const lines = [
    `🌤 *Thời tiết ${data.location ?? 'Hà Nội'}*`,
    `Nhiệt độ: ${temp}`,
    `Trạng thái: ${data.weatherLabel ?? '—'}`,
  ];

  if (
    data.precipitationProbability !== undefined &&
    data.precipitationProbability !== null &&
    !Number.isNaN(data.precipitationProbability)
  ) {
    lines.push(`Xác suất mưa: ${Math.round(data.precipitationProbability)}%`);
  }

  if (data.isRain && data.intensityLabel) {
    const mm = Number(data.precipitation) || 0;
    lines.push(`Mưa: ${data.intensityLabel} (~${mm.toLocaleString('vi-VN')} mm)`);
  }

  if (data.time) {
    const d = new Date(data.time);
    const stamp = Number.isNaN(d.getTime())
      ? data.time
      : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    lines.push(`Cập nhật: ${stamp}`);
  }

  return lines.join('\n');
}
