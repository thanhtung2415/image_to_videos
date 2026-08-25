# Image To Videos

Website chuyen anh thanh video ngan theo SRS v2.0. Ban hien tai la Commercial MVP: co dang ky, dang nhap, credit wallet, pricing/payment mock, notification, upload anh, tao video MP4 bang FFmpeg va hien thi video ket qua tren trinh duyet.

## Kien truc

| Thanh phan | Cong nghe |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas hoac MongoDB local |
| Storage | Local trong dev, Cloudinary khi cau hinh env |
| Video engine | FFmpeg |
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

## Luong chuc nang

1. Nguoi dung dang ky hoac dang nhap.
2. He thong cap san 20 credits cho tai khoan moi.
3. Nguoi dung upload anh JPG, PNG hoac WEBP toi da 5MB.
4. Backend reserve credits va tao generation job.
5. FFmpeg tao video MP4 tu anh.
6. Khi video thanh cong, backend capture reserved credits.
7. Neu job loi, backend release credits ve vi.
8. Video duoc luu local neu chua cau hinh Cloudinary.
9. Frontend tu cap nhat trang thai job va hien video khi hoan tat.

## Da co theo SRS v2.0

- AI Provider Router/Adapter skeleton cho fal.ai, Runway, Luma.
- Pricing Engine server-side voi cac goi Trial, Standard, Pro, Premium.
- Payment abstraction mock, co Payment va PaymentEvent collections.
- Credit reserve/capture/release va CreditTransaction collection.
- Background queue voi BullMQ/Redis va worker rieng.
- SSE endpoint cho realtime status, frontend van co polling fallback.
- In-app notification va email mock.
- Security headers, rate limit, content moderation co ban, audit log.
- Admin API overview va audit log.

## Deploy goi y

| Thanh phan | Dich vu goi y |
| --- | --- |
| Frontend | Vercel hoac Netlify |
| Backend | Render hoac Railway |
| Database | MongoDB Atlas |
| Storage | Cloudinary |

Khi deploy backend, can cau hinh day du cac bien trong `apps/backend/.env.example`. Khong dua file `.env` that len GitHub.

Huong dan chi tiet nam trong `docs/DEPLOYMENT.md`.

## Con can lam de production that

- Noi API that cho fal.ai, Runway hoac Luma.
- Noi payment that voi payOS hoac Stripe va verify webhook signature.
- Tao admin UI day du.
- Bo sung email provider that nhu Resend/Brevo.
- Deploy frontend/backend online va cau hinh MongoDB Atlas, Cloudinary, Redis.
