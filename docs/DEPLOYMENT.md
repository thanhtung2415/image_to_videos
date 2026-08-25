# Deployment

## Frontend - Vercel

1. Tao project Vercel tu GitHub repo.
2. Chon root directory: `apps/frontend`.
3. Them environment variable:

```txt
VITE_API_URL=https://your-backend.onrender.com/api
```

4. Deploy.

## Backend - Render

Co the dung `render.yaml` trong repo de tao:

- `image-to-videos-api`
- `image-to-videos-worker`

Bien moi truong can cau hinh:

```txt
NODE_ENV=production
MONGODB_URI=
JWT_SECRET=
ADMIN_EMAILS=
FRONTEND_URL=
PUBLIC_BACKEND_URL=
QUEUE_MODE=redis
REDIS_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
FAL_API_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

## Database

Dung MongoDB Atlas, tao database user va allow IP theo dich vu deploy.

## Redis

Dung Upstash Redis hoac Redis Cloud. Gan `REDIS_URL` cho ca API va worker.

## Storage

Dung Cloudinary. Khi backend co du 3 bien Cloudinary, video output tu FFmpeg va video AI remote tu fal.ai se duoc upload len Cloudinary.

## Email

Neu co SMTP provider, cau hinh `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Neu bo trong, backend se dung email mock va in noi dung email ra log.

## Production checklist

- Khong commit `.env`.
- `JWT_SECRET` phai la chuoi dai va random.
- `FRONTEND_URL` phai dung domain frontend deploy.
- `PUBLIC_BACKEND_URL` phai dung domain backend deploy.
- Bat `QUEUE_MODE=redis` khi deploy.
- Kiem tra `/api/health` va `/api/health/ready` sau khi deploy backend.

## Local storage lifecycle

Neu chay local/dev va luu file trong `apps/backend/uploads`, co the don file cu:

```bash
npm run cleanup:local
```

Mac dinh xoa file cu hon 7 ngay. Co the doi bang `LOCAL_FILE_MAX_AGE_DAYS`.
