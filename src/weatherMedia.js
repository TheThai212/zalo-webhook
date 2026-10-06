const STICKERS_RAIN = [
  '0766c704fa41131f4a50',
  'e5689347af02465c1f13',
  '79bc8ce7b0a259fc00b3',
];

const STICKERS_DRY = [
  '6b238608ba4d53130a5c',
  'd6718bf5b7b05eee07a1',
  '3a4ebae286a76ff936b6',
];

/**
 * Chọn ngẫu nhiên sticker theo mưa / không mưa.
 * @param {boolean} isRain
 * @returns {string}
 */
export function pickWeatherSticker(isRain) {
  const list = isRain ? STICKERS_RAIN : STICKERS_DRY;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}
