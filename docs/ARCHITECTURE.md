# Architecture

## Overview

Project duoc chia thanh 2 app:

| App | Vai tro |
| --- | --- |
| `apps/frontend` | React/Vite UI cho user va admin |
| `apps/backend` | Express API, auth, credit, payment, queue, video generation |

## Runtime flow

1. User dang nhap bang JWT.
2. Frontend upload anh va metadata video qua `POST /api/projects`.
3. Backend validate input, tinh credit cost va reserve credit.
4. Backend tao `video_projects` va `generation_jobs`.
5. Worker xu ly job bang FFmpeg hoac AI provider.
6. Video tao xong duoc upload len Cloudinary neu da cau hinh.
7. Backend cap nhat project `completed`, capture credit va tao notification.
8. Neu job loi/huy, backend release credit ve wallet.
9. Frontend theo doi trang thai bang SSE va polling fallback.

## Main modules

| Module | File chinh |
| --- | --- |
| Auth | `apps/backend/src/routes/authRoutes.js` |
| Account | `apps/backend/src/routes/accountRoutes.js` |
| Project/video | `apps/backend/src/routes/projectRoutes.js` |
| Queue/worker | `apps/backend/src/services/queueService.js`, `apps/backend/src/worker.js` |
| FFmpeg | `apps/backend/src/services/videoService.js` |
| AI providers | `apps/backend/src/services/providers` |
| Credit | `apps/backend/src/services/creditService.js` |
| Payment | `apps/backend/src/services/paymentService.js` |
| Admin | `apps/backend/src/routes/adminRoutes.js` |
| Frontend | `apps/frontend/src/main.jsx` |

## External services

| Service | Purpose |
| --- | --- |
| MongoDB Atlas | Database |
| Upstash Redis | Queue backend khi deploy |
| Cloudinary | Upload anh/video output |
| Replicate/fal.ai | AI image-to-video provider |
| Render/Railway | Backend va worker |
| Vercel/Netlify | Frontend |
