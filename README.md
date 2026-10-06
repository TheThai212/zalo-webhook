# SePay → Zalo Group

Backend Node.js nhận webhook SePay và gửi thông báo tiền vào vào group Zalo.

## Yêu cầu

- Node.js 18+
- **Zalo Bot Token** (tạo qua OA [Zalo Bot Manager](https://docs.zaloplatforms.com/docs/BOT))
- Bot đã được **mời vào group** `zgr-d0a1a6afd9c0309e69d1`
- Tài khoản SePay đã liên kết ngân hàng

## Cài đặt

```bash
npm install
cp .env.example .env
```

Điền `.env`:

```
PORT=3000
ZALO_BOT_TOKEN=<token từ Zalo Bot Manager>
ZALO_CHAT_ID=zgr-d0a1a6afd9c0309e69d1
SEPAY_API_KEY=<key tự tạo, dùng cùng giá trị trên dashboard SePay>
```

Chạy:

```bash
npm start
```

Health check: `GET http://localhost:3000/health`

## Cấu hình SePay Webhook

Dashboard SePay → **Webhooks** → **Thêm webhook**:

| Trường | Giá trị |
| --- | --- |
| URL | `https://<domain-của-bạn>/webhook/sepay` |
| Loại giao dịch | Tiền vào (`In_only`) |
| Xác thực | **Api_Key** |
| Content-Type | JSON |
| API Key | Cùng giá trị với `SEPAY_API_KEY` trong `.env` |

SePay gửi header: `Authorization: Apikey <SEPAY_API_KEY>`.

Endpoint trả đúng `{"success": true}` (HTTP 200) khi nhận thành công.

## Test local với ngrok

```bash
npm start
# terminal khác
ngrok http 3000
```

Dán URL ngrok (ví dụ `https://xxxx.ngrok-free.app/webhook/sepay`) vào dashboard SePay, rồi dùng **Gửi thử** hoặc chuyển khoản nhỏ để kiểm tra.

## Checklist bot trong group

1. Tạo bot trên Zalo Bot Manager, lấy `ZALO_BOT_TOKEN`.
2. Mời bot vào group đích (`zgr-d0a1a6afd9c0309e69d1`).
3. Điền token + chat id vào `.env`.
4. Gọi thử webhook — tin nhắn phải hiện trong group.

Nếu bot chưa ở trong group, `sendMessage` sẽ fail và endpoint trả `500` để SePay retry.

## Luồng xử lý

1. Xác thực API Key
2. Chống trùng theo `id` (lưu tại `data/processed.json`)
3. Chỉ gửi Zalo khi `transferType === "in"`
4. Zalo fail → HTTP 500 (SePay sẽ retry)
5. Thành công → `{"success": true}`
