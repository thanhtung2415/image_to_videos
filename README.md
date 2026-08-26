# Image To Videos

Website chuyen anh thanh video ngan cho do an lap trinh ung dung web. Ban hien tai la Commercial MVP: co dang ky, dang nhap, credit wallet, pricing/payment mock, promotion, notification, upload anh, tao video MP4 bang FFmpeg/AI va hien thi video ket qua tren trinh duyet.

## Kien truc

| Thanh phan | Cong nghe |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas hoac MongoDB local |
| Storage | Local trong dev, Cloudinary khi cau hinh env |
| Video engine | FFmpeg, Replicate AI, fal.ai |
| Queue | BullMQ + Redis khi `QUEUE_MODE=redis`, fallback local khi dev |
| Auth | JWT |

## Chay local

1. Cai dependency:

```bash
npm install
```

2. Tao file backend env:

```bash
copy apps\backend\.env.example apps\backend\.env
```

3. Sua `apps/backend/.env`, toi thieu can:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/image_to_videos
JWT_SECRET=your_secret
ADMIN_EMAILS=admin@example.com
FRONTEND_URL=http://localhost:5173
PUBLIC_BACKEND_URL=http://localhost:4000
QUEUE_MODE=local
```

4. Chay backend:

```bash
npm run dev:backend
```

5. Chay frontend o terminal khac:

```bash
npm run dev:frontend
```

Kiem tra nhanh truoc khi commit/deploy:

```bash
npm run check
```

Neu muon test queue production-like:

```bash
docker compose up -d
```

Sau do sua backend env:

```bash
QUEUE_MODE=redis
REDIS_URL=redis://127.0.0.1:6379
```

Va chay worker o terminal rieng:

```bash
npm run dev:worker
```

Frontend mac dinh chay tai `http://localhost:5173`, backend tai `http://localhost:4000`.

## Seed demo data

Sau khi MongoDB da chay va `.env` da cau hinh, co the tao tai khoan demo:

```bash
npm run seed:demo
```

Tai khoan:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | 123456 |
| User | user@example.com | 123456 |

Coupon demo: `SALE20`.

Promotion demo: `WELCOME10`.

## Cau hinh AI

FFmpeg la luong demo on dinh. Neu muon tao chuyen dong bang AI, cau hinh them:

```bash
REPLICATE_API_TOKEN=your_replicate_token
FAL_API_KEY=your_fal_key
```

Replicate `minimax/video-01` duoc uu tien cho demo AI neu token kha dung. Fal van duoc giu lai nhung co the can balance/quota.

## Luong chuc nang

1. Nguoi dung dang ky hoac dang nhap.
2. Tai khoan moi co 0 credit neu khong co promotion hop le.
3. Nguoi dung upload anh JPG, PNG hoac WEBP toi da 5MB.
4. Backend reserve credits va tao generation job.
5. Worker tao video bang FFmpeg hoac AI provider.
6. Video output duoc upload len Cloudinary neu da cau hinh storage.
7. Khi video thanh cong, backend capture reserved credits.
8. Neu job loi, backend release credits ve vi.
9. Frontend tu cap nhat trang thai job va hien video khi hoan tat.

## Chuc nang da co

- AI Provider Router/Adapter skeleton cho Replicate, fal.ai, Runway, Luma.
- Replicate Minimax Video-01 adapter that bang `REPLICATE_API_TOKEN`.
- fal.ai FLUX 3 Image to Video adapter that bang `FAL_API_KEY`.
- Video AI tu Replicate/fal.ai se duoc upload ve Cloudinary neu storage da cau hinh.
- Pricing Engine server-side voi cac goi Trial, Standard, Pro, Premium.
- Payment abstraction mock, co Payment va PaymentEvent collections.
- Credit reserve/capture/release va CreditTransaction collection.
- Background queue voi BullMQ/Redis va worker rieng.
- SSE endpoint cho realtime status, frontend van co polling fallback.
- In-app notification va email mock/SMTP.
- Security headers, rate limit, content moderation co ban, audit log.
- User profile update, password change, account export va soft delete.
- Admin dashboard quan ly user, lock/unlock, role, manual credit adjustment.
- Admin tao/sua goi credit, xem payment, tao promotion, coupon, cau hinh video cost, xem report tong hop 30 ngay.
- Admin API overview va audit log.
- Provider health va cost tracking.
- Request logging voi request id.
- Coupon va refund mock.

## Deploy goi y

| Thanh phan | Dich vu goi y |
| --- | --- |
| Frontend | Vercel hoac Netlify |
| Backend | Render hoac Railway |
| Database | MongoDB Atlas |
| Storage | Cloudinary |

Khi deploy backend, can cau hinh day du cac bien trong `apps/backend/.env.example`. Khong dua file `.env` that len GitHub.

Huong dan chi tiet nam trong `docs/DEPLOYMENT.md`.

Huong dan cau hinh AI provider fal.ai nam trong `docs/FAL_AI.md`. Replicate dung bien `REPLICATE_API_TOKEN`.

Mo ta API nam trong `docs/API.md`. Mo ta database nam trong `docs/DATABASE.md`.

## Con can lam de production that

- Noi them API that cho Runway hoac Luma.
- Bo sung adapter that cho Runway hoac Luma.
- Noi payment that voi payOS hoac Stripe va verify webhook signature.
- Bo sung email provider that nhu Resend/Brevo.
- Deploy frontend/backend online va cau hinh MongoDB Atlas, Cloudinary, Redis.
