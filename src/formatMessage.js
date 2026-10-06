function formatAmount(amount) {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('vi-VN')}₫`;
}

/**
 * Tạo nội dung tin nhắn markdown cho giao dịch tiền vào.
 */
export function formatIncomingMessage(data) {
  const lines = [
    '💰 *Tiền vào*',
    `Ngân hàng: ${data.gateway ?? '—'}`,
    `Số tiền: ${formatAmount(data.transferAmount)}`,
    `Thời gian: ${data.transactionDate ?? '—'}`,
    `Nội dung: ${data.content ?? '—'}`,
  ];

  if (data.code) {
    lines.push(`Mã thanh toán: ${data.code}`);
  }

  if (data.referenceCode) {
    lines.push(`Mã GD: ${data.referenceCode}`);
  }

  if (data.accountNumber) {
    lines.push(`STK: ${data.accountNumber}`);
  }

  return lines.join('\n');
}
