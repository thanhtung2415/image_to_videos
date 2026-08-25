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
| image | File JPG, PNG hoac WEBP |

### GET `/projects/:id`

Lay thong tin project va job moi nhat de cap nhat trang thai.

### GET `/projects/:id/events`

SSE endpoint de theo doi trang thai job theo thoi gian thuc.

## Providers

### GET `/providers`

Lay danh sach AI providers, trang thai cau hinh va model capabilities.

## Pricing

### GET `/pricing/plans`

Lay danh sach goi credit do backend tinh va quan ly.

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

### GET `/admin/cost-summary`

Lay tong hop cost/credit theo provider.

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

## Account

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
