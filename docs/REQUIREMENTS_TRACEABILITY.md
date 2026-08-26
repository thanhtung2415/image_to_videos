# Requirements Traceability

Bang nay dung de doi chieu nhanh source code voi yeu cau trong de thi.

| Requirement | Status | Evidence |
| --- | --- | --- |
| Frontend web responsive | Done | `apps/frontend/src/main.jsx`, `apps/frontend/src/styles.css` |
| Backend API | Done | `apps/backend/src/server.js`, `apps/backend/src/routes` |
| Database | Done | `apps/backend/src/models`, MongoDB/Mongoose |
| Dang ky/dang nhap/dang xuat | Done | `apps/backend/src/routes/authRoutes.js`, `AuthPanel` |
| Password hashing | Done | `bcrypt.hash`, `bcrypt.compare` |
| JWT/session auth | Done | `apps/backend/src/middleware/auth.js` |
| Role user/admin | Done | `User` model va `requireAdmin` middleware |
| User moi co 0 credit | Done | `User` model default va seed demo |
| Upload image va prompt | Done | `apps/backend/src/routes/projectRoutes.js`, `VideoCreator` |
| Tao video tu anh | Done | FFmpeg stable va AI provider adapters |
| Video MP4 hien tren browser | Done | `outputVideo.url`, frontend video player |
| Theo doi processing status | Done | Project status, SSE endpoint va polling fallback |
| Lich su video cua user | Done | `GET /api/projects`, `VideoHistory` |
| Credit wallet va credit history user | Done | `creditRoutes.js`, `PricingPanel` |
| Tu choi khi khong du credit | Done | `reserveCredits` va HTTP 402 |
| Thanh cong moi tru credit | Done | `captureReservedCredits` trong job runner |
| Failed/cancelled release credit | Done | `releaseReservedCredits` trong project/job runner |
| Dang ky promotion | Done | `promotionRoutes.js`, `promotionService.js` |
| Mua goi credit | Done | `paymentRoutes.js`, mock payment service |
| Admin list/search/filter users | Done | `/api/admin/users`, AdminPanel |
| Admin detail/update/lock/unlock user | Done | `/api/admin/users/:id`, status/update routes |
| Admin cong/tru credit thu cong | Done | `/api/admin/users/:id/credits/adjust` |
| Admin xem toan bo credit transactions | Done | `/api/admin/credit-transactions`, AdminPanel |
| Admin quan ly credit packages | Done | `/api/admin/credit-packages`, AdminPanel |
| Admin quan ly payments/refund | Done | `/api/admin/payments`, `/api/payments/:id/refund` |
| Admin quan ly promotions | Done | `/api/admin/promotions`, registrations endpoints |
| Admin quan ly videos/failed cases | Done | `/api/admin/videos`, `/api/admin/videos/:id` |
| Reports user/video/credit/revenue/promotion | Done | `/api/admin/reports/overview` |
| Cau hinh chi phi video | Done | `/api/admin/video-costs`, settings service |
| Input validation | Done | Zod schemas, multer file filter |
| Khong cho user tu sua credit | Done | User profile route chi cho name/avatar/password |
| Docs API/database/install/user guide | Done | `docs/API.md`, `docs/DATABASE.md`, `docs/INSTALLATION.md`, `docs/USER_GUIDE.md` |
| Sample data | Done | `npm run seed:demo` |
| Database backup script | Done | `npm run backup:db` |
| Submission zip | Done | `npm run zip:submission` |

## Notes

- Payment hien tai la mock payment de phu hop demo sinh vien.
- AI provider phu thuoc API key/quota; FFmpeg la luong chinh on dinh.
- SRS va `.env` la tai lieu/noi dung noi bo, khong dua len GitHub.

