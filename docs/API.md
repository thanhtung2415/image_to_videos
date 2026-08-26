# API

Base URL local: `http://localhost:4000/api`

## Health

### GET `/health`

Kiem tra API dang song.

### GET `/health/ready`

Kiem tra MongoDB, queue, storage va provider config truoc khi demo/deploy.

## Auth

### POST `/auth/register`

Body:

```json
{
  "name": "Nguyen Van A",
  "email": "demo@example.com",
  "password": "123456"
}
```

### POST `/auth/login`

Body:

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

### GET `/auth/me`

Header:

```txt
Authorization: Bearer <token>
```

### POST `/auth/verify-email`

Xac minh email bang token duoc gui qua email mock/provider.

### POST `/auth/forgot-password`

Gui token reset mat khau qua email mock/provider.

### POST `/auth/reset-password`

Dat lai mat khau bang reset token.

## Projects

### GET `/projects`

Lay danh sach video project cua user dang dang nhap.

### POST `/projects`

Tao project va generation job.

Form data:

| Field | Mo ta |
| --- | --- |
| title | Tieu de video |
| prompt | Mo ta chuyen dong |
| duration | 3, 5, 8 hoac 10 |
| resolution | 1280x720, 720x1280 hoac 1024x1024 |
| generationMode | `ffmpeg` hoac `ai` |
| provider | `replicate`, `fal`, `runway`, `luma` khi dung AI |
| model | Model id cua provider khi dung AI |
| image | File JPG, PNG hoac WEBP |

### GET `/projects/:id`

Lay thong tin project va job moi nhat de cap nhat trang thai.

### GET `/projects/:id/events`

SSE endpoint de theo doi trang thai job theo thoi gian thuc.

## Providers

### GET `/providers`

Lay danh sach AI providers, trang thai cau hinh va model capabilities.

Provider `fal` se enabled khi backend co `FAL_API_KEY` hoac `FAL_KEY`.

## Pricing

### GET `/pricing/plans`

Lay danh sach goi credit do backend tinh va quan ly.

## Promotions

### GET `/promotions/active`

Lay danh sach promotion dang hieu luc.

### POST `/promotions/register`

Dang ky promotion va nhan credit bonus neu hop le.

Body:

```json
{
  "code": "WELCOME10"
}
```

## Payments

### POST `/payments/checkout`

Tao checkout session. Ban hien tai ho tro provider `mock`.

Body:

```json
{
  "planCode": "standard",
  "idempotencyKey": "standard-unique-request-id"
}
```

### POST `/payments/webhooks/:provider`

Nhan webhook tu payment provider va luu raw event vao `payment_events`.

## Credits

### GET `/credits/wallet`

Lay so du credit wallet.

### GET `/credits/transactions`

Lay lich su giao dich credit.

## Notifications

### GET `/notifications`

Lay danh sach notification gan nhat.

### PATCH `/notifications/:id/read`

Danh dau notification da doc.

## Admin

Can user role `admin`.

### GET `/admin/overview`

Lay thong ke tong quan user, project, job, payment va content report.

### GET `/admin/audit-logs`

Lay audit logs gan nhat.

### GET `/admin/provider-health`

Lay trang thai health cua cac AI provider.

### GET `/admin/reports/summary?days=30`

Bao cao tong hop theo khoang thoi gian: user moi, video thanh cong/that bai, credit phat hanh/su dung, doanh thu va promotion.

### GET `/admin/cost-summary`

Lay tong hop cost/credit theo provider.

### GET `/admin/video-costs`

Lay cau hinh credit cost cho FFmpeg va AI.

### PATCH `/admin/video-costs`

Cap nhat cau hinh credit cost.

Body:

```json
{
  "ffmpegBaseCredits": 5,
  "aiDefaultBaseCredits": 20,
  "extraSecondCredits": 5
}
```

### GET `/admin/users?search=demo`

Tim kiem va liet ke user.

### GET `/admin/users/:id`

Lay chi tiet user, transaction gan nhat va project gan nhat.

### PATCH `/admin/users/:id`

Cap nhat name, role hoac status cua user.

### POST `/admin/users/:id/credits`

Cong hoac tru credit thu cong. `amount` co the am de tru credit.

Body:

```json
{
  "amount": 10,
  "reason": "Admin adjustment"
}
```

### GET `/admin/videos?status=failed`

Lay danh sach video de admin kiem tra ket qua, failed cases va trang thai xu ly. Co the bo query `status` de xem tat ca.

### GET `/admin/pricing-plans`

Lay toan bo goi credit, bao gom goi inactive.

### POST `/admin/pricing-plans`

Tao goi credit moi.

Body:

```json
{
  "code": "starter",
  "name": "Starter",
  "credits": 50,
  "price": 25000,
  "currency": "VND",
  "active": true,
  "sortOrder": 5
}
```

### PATCH `/admin/pricing-plans/:id`

Cap nhat goi credit, thuong dung de bat/tat goi hoac doi gia.

### GET `/admin/payments?status=paid`

Lay danh sach payment, co the loc theo status.

### GET `/admin/coupons`

Lay danh sach coupon.

### POST `/admin/coupons`

Tao coupon moi.

Body:

```json
{
  "code": "SALE20",
  "type": "percent",
  "value": 20,
  "maxUses": 100
}
```

### GET `/admin/promotions`

Lay danh sach promotion va thong ke dang ky.

### POST `/admin/promotions`

Tao promotion moi.

Body:

```json
{
  "name": "New user bonus",
  "code": "WELCOME10",
  "creditBonus": 10,
  "maxRegistrations": 100,
  "startsAt": "2026-08-26T00:00:00.000Z",
  "endsAt": "2026-09-10T00:00:00.000Z",
  "conditions": "One registration per user"
}
```

## Account

### PATCH `/account/profile`

Cap nhat ho ten user dang dang nhap.

### PATCH `/account/password`

Doi mat khau user dang dang nhap.

### GET `/account/export`

Export du lieu ca nhan cua user dang dang nhap.

### DELETE `/account`

Soft delete tai khoan user dang dang nhap.

## Refund

### POST `/payments/:id/refund`

Admin refund mot payment da thanh toan.

Body:

```json
{
  "reason": "Customer request",
  "idempotencyKey": "refund-payment-id-001"
}
```
