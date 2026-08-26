# Project Report

## Project information

| Item | Value |
| --- | --- |
| Project name | Image To Videos |
| Topic | Website chuyen anh thanh video ngan |
| Subject | Lap trinh ung dung Web |
| Version | Commercial MVP |
| Main stack | React, Vite, Node.js, Express, MongoDB, FFmpeg, Cloudinary, Redis/BullMQ |

## Team members

| Student | Student ID |
| --- | --- |
| Ngo Thanh Tung | 2302700108 |
| Nguyen Bao Anh | 2302700386 |
| Tran Mong Tuyen | 2302700118 |
| Ho Le Duy | 2302700362 |
| Truong Tien Dat | 2302700284 |

## Project objective

He thong cho phep nguoi dung dang ky, dang nhap, mua/nhan credit, upload anh va prompt de tao video MP4 ngan. He thong ho tro FFmpeg lam luong tao video on dinh va AI provider nhu Replicate/fal.ai khi co API key va quota. Admin co the quan ly user, credit, goi credit, payment, promotion, video, report va cau hinh he thong.

## Main user functions

1. Dang ky, dang nhap, dang xuat bang JWT.
2. Tai khoan user moi co 0 credit neu khong dung promotion hop le.
3. Cap nhat ho so, doi mat khau, export du lieu va xoa tai khoan mem.
4. Xem so du credit va lich su giao dich credit.
5. Mua credit bang mock payment hoac nhan credit tu promotion.
6. Upload anh JPG, PNG, WEBP va nhap prompt.
7. Chon thoi luong, ty le, engine FFmpeg hoac AI provider.
8. Theo doi trang thai queued, processing, uploading, completed, failed.
9. Xem video MP4 tren trinh duyet va tai ve.
10. Report video de admin xu ly.

## Main admin functions

1. Xem dashboard va report theo khoang thoi gian.
2. Quan ly user: tim kiem, loc, xem chi tiet, cap nhat role/status, khoa/mo khoa.
3. Cong/tru credit thu cong va ghi lich su giao dich.
4. Xem toan bo credit transaction history va loc theo type/user/time.
5. Quan ly goi credit va payment mock/refund.
6. Quan ly promotion: tao, sua, bat/tat, xem danh sach dang ky.
7. Quan ly video: loc theo status/provider/user, xem anh nguon, video output, prompt, error va job info.
8. Quan ly cau hinh chi phi video, upload limit va provider mac dinh.
9. Xem provider health, cost tracking, audit logs va content reports.

## System architecture

Frontend React/Vite goi Express API qua JWT. Backend validate input, luu du lieu bang MongoDB/Mongoose, xu ly credit theo reserve/capture/release. Video job duoc dua vao queue local khi dev hoac BullMQ/Redis khi deploy. Worker tao video bang FFmpeg hoac AI provider, sau do upload output len Cloudinary neu co cau hinh. Frontend cap nhat trang thai bang SSE va polling fallback.

## Database

Database dung MongoDB. Cac collection chinh:

| Collection | Purpose |
| --- | --- |
| users | Tai khoan, role, status, credit wallet |
| video_projects | Thong tin anh, prompt, status, output video |
| generation_jobs | Trang thai job, provider request id, loi |
| credit_transactions | Lich su purchase, reserve, capture, release, refund, manual adjustment, promotion bonus |
| pricing_plans | Goi credit |
| payments | Payment mock |
| promotions | Chuong trinh khuyen mai |
| promotion_registrations | User da dang ky promotion |
| settings | Cau hinh cost, upload, provider |
| notifications | Thong bao trong app |
| audit_logs | Log hanh dong quan trong |
| content_reports | Report noi dung/video |

## Security and validation

He thong co hash mat khau bang bcrypt, auth bang JWT, middleware phan quyen admin, rate limit, security headers, validate request bang Zod va kiem tra file upload. User khong co API tu thay doi credit/role/status cua minh. Credit duoc thay doi thong qua service co idempotency key va guard khong de wallet am.

## Demo accounts

Chay seed truoc khi demo:

```bash
npm run seed:demo
```

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | Admin123! |
| User | user@example.com | User123! |

## How to run

```bash
npm install
copy apps\backend\.env.example apps\backend\.env
npm run seed:demo
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Verification

```bash
npm run verify:submission
npm run check
```

## Demo evidence

1. Man hinh login/register.
2. User wallet 0 credit ban dau.
3. User mua credit hoac dang ky promotion thanh cong.
4. Form upload anh va prompt.
5. Trang thai video queued/processing/uploading.
6. Video completed, play MP4 va nut download.
7. User credit history.
8. Admin report theo From/To.
9. Admin user management va manual credit adjustment.
10. Admin all credit transaction history.
11. Admin video detail va failed case.
12. Admin promotion registrations.
13. MongoDB Atlas collections hoac database backup.

