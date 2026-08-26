# Database

Database chinh la MongoDB. Khi demo local co the dung MongoDB local, khi deploy dung MongoDB Atlas.

## Collections

| Collection | Muc dich |
| --- | --- |
| `users` | Tai khoan, role, trang thai khoa/xoa va credit wallet |
| `video_projects` | Thong tin anh nguon, prompt, output video, trang thai xu ly |
| `generation_jobs` | Job nen de tao video bang FFmpeg hoac AI provider |
| `credit_transactions` | Lich su reserve, capture, release, purchase, refund, manual adjustment, promotion bonus |
| `pricing_plans` | Goi mua credit |
| `payments` | Don mua credit |
| `payment_events` | Su kien webhook/payment raw |
| `coupons` | Ma giam gia khi mua goi credit |
| `promotions` | Chuong trinh khuyen mai tang credit |
| `promotion_registrations` | Lich su user dang ky promotion |
| `settings` | Cau hinh he thong, hien co `video_costs` |
| `notifications` | Thong bao trong app |
| `notification_preferences` | Tuy chon nhan thong bao |
| `content_reports` | Bao cao video loi/khong phu hop |
| `refunds` | Yeu cau hoan tien mock |
| `provider_health` | Trang thai provider AI |
| `cost_events` | Lich su chi phi credit/provider |
| `audit_logs` | Nhat ky hanh dong quan trong |

## Seed data

Chay lenh sau de tao user demo, goi credit, coupon va promotion:

```bash
npm run seed:demo
```

Tai khoan mau:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | 123456 |
| User | user@example.com | 123456 |

## Backup

Chay lenh sau de export cac collection ra JSON:

```bash
npm run backup:db
```

Thu muc backup nam trong `apps/backend/backups` va khong commit len GitHub.
