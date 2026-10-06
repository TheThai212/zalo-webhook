/**
 * Xác thực API Key từ SePay (Authorization: Apikey <key>).
 */
export function verifySepayApiKey(req) {
  const expected = process.env.SEPAY_API_KEY;
  if (!expected) {
    return { ok: false, status: 500, message: 'SEPAY_API_KEY chưa được cấu hình' };
  }

  const header = req.headers.authorization ?? '';
  const match = header.match(/^(?:Apikey|Bearer)\s+(.+)$/i);
  const provided =
    match?.[1]?.trim() ||
    String(req.headers['x-api-key'] ?? '').trim() ||
    '';

  if (!provided || provided !== expected) {
    console.error('[auth] fail header=', header ? '(present)' : '(missing)');
    return { ok: false, status: 401, message: 'Unauthorized' };
  }

  return { ok: true };
}
