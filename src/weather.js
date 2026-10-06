/** WMO weather codes: drizzle / rain / thunderstorm / freezing rain */
const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);

const WMO_LABELS = {
  0: 'Trời quang',
  1: 'Chủ yếu quang đãng',
  2: 'Mây rải rác',
  3: 'Nhiều mây',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày',
  56: 'Mưa phùn đóng băng nhẹ',
  57: 'Mưa phùn đóng băng dày',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  66: 'Mưa đóng băng nhẹ',
  67: 'Mưa đóng băng to',
  71: 'Tuyết nhẹ',
  73: 'Tuyết vừa',
  75: 'Tuyết dày',
  77: 'Hạt tuyết',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào mạnh',
  85: 'Mưa tuyết nhẹ',
  86: 'Mưa tuyết mạnh',
  95: 'Giông',
  96: 'Giông kèm mưa đá nhẹ',
  99: 'Giông kèm mưa đá mạnh',
};

/**
 * @param {number} mm
 * @returns {'none'|'light'|'moderate'|'heavy'}
 */
export function rainIntensity(mm) {
  const n = Number(mm) || 0;
  if (n <= 0) return 'none';
  if (n <= 2) return 'light';
  if (n <= 10) return 'moderate';
  return 'heavy';
}

export function rainIntensityLabel(level) {
  switch (level) {
    case 'light':
      return 'mưa nhỏ';
    case 'moderate':
      return 'mưa vừa';
    case 'heavy':
      return 'mưa lớn';
    default:
      return null;
  }
}

/**
 * Lấy dự báo hiện tại Hà Nội (hoặc lat/lon từ env).
 */
export async function fetchHanoiWeather() {
  const lat = process.env.WEATHER_LAT || '21.0285';
  const lon = process.env.WEATHER_LON || '105.8542';
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set(
    'current',
    'temperature_2m,weather_code,precipitation,precipitation_probability',
  );
  url.searchParams.set('timezone', 'Asia/Ho_Chi_Minh');

  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP ${response.status}`);
  }

  const data = await response.json();
  const current = data?.current;
  if (!current) {
    throw new Error('Open-Meteo thiếu current');
  }

  const weatherCode = Number(current.weather_code) || 0;
  const precipitation = Number(current.precipitation) || 0;
  const precipProb = current.precipitation_probability;
  const intensity = rainIntensity(precipitation);
  const isRain = precipitation > 0 || RAIN_CODES.has(weatherCode);
  // Có mưa theo mã WMO nhưng mm=0 → vẫn ghi nhận (ít nhất "mưa nhỏ")
  const intensityLabel =
    rainIntensityLabel(intensity) ?? (isRain ? 'mưa nhỏ' : null);

  return {
    location: 'Hà Nội',
    temperature: current.temperature_2m,
    weatherCode,
    weatherLabel: WMO_LABELS[weatherCode] ?? `Mã ${weatherCode}`,
    precipitation,
    precipitationProbability:
      precipProb === undefined || precipProb === null ? null : Number(precipProb),
    intensity: isRain && intensity === 'none' ? 'light' : intensity,
    intensityLabel,
    isRain,
    time: current.time ?? null,
  };
}
