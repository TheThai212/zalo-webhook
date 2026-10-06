const STICKERS_IN = [
  '85ce339f0fdae684bfcb',
  'aa457508494da013f95c',
  '4bd131b80dfde4a3bdec',
  '2b4aec28d16d3833617c',
];

const STICKERS_OUT = [
  'd8005b6c66298f77d638',
  '4b8d7c2a406fa931f07e',
  'e34c622e5e6bb735ee7a',
];

/**
 * Chọn ngẫu nhiên sticker theo loại giao dịch.
 * @param {string} transferType
 * @returns {string|null}
 */
export function pickTransferSticker(transferType) {
  const list =
    transferType === 'in'
      ? STICKERS_IN
      : transferType === 'out'
        ? STICKERS_OUT
        : null;
  if (!list?.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}
