# API Documentation

Base URL local: `http://localhost:4000/api`

| Method | URL | Auth | Role | Purpose |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | No | Guest | Register a normal user with 0 initial credit unless a valid promotion code is supplied. |
| POST | `/auth/login` | No | Guest | Login and receive JWT. Locked users are rejected. |
| GET | `/auth/me` | Yes | User/Admin | Read current session user. |
| GET | `/users/me` | Yes | User/Admin | Read profile, role, status and credit wallet. |
| PATCH | `/users/me` | Yes | User/Admin | Update profile fields such as full name/avatar. |
| PATCH | `/users/me/password` | Yes | User/Admin | Change password after checking current password. |
| GET | `/projects` | Yes | User/Admin | List current user's videos. |
| POST | `/projects` | Yes | User/Admin | Upload image, reserve credit and enqueue FFmpeg/AI generation. |
| POST | `/projects/:id/cancel` | Yes | User/Admin | Cancel active generation and release reserved credit. |
| GET | `/projects/:id/events` | Yes | User/Admin | SSE project status stream. |
| GET | `/credits/wallet` | Yes | User/Admin | Read wallet. |
| GET | `/credits/transactions` | Yes | User/Admin | Read current user's credit history. |
| GET | `/pricing/plans` | Yes | User/Admin | List active credit packages. |
| POST | `/payments/checkout` | Yes | User/Admin | Create mock payment and credit purchase transaction. |
| POST | `/payments/:id/refund` | Yes | Admin | Refund a paid mock payment and adjust credit. |
| GET | `/promotions` | Yes | User/Admin | List active promotions. |
| POST | `/promotions/:id/register` | Yes | User/Admin | Register a promotion by id. |
| POST | `/promotions/register` | Yes | User/Admin | Register a promotion by code. |
| GET | `/promotions/my-registrations` | Yes | User/Admin | Read user's promotion registration history. |
| GET | `/admin/users` | Yes | Admin | List/search/filter users with page, limit, search, status and role. |
| GET | `/admin/users/:id` | Yes | Admin | Read user detail, transactions and projects. |
| PATCH | `/admin/users/:id` | Yes | Admin | Update user profile/role/status. |
| PATCH | `/admin/users/:id/status` | Yes | Admin | Lock or unlock a user. |
| POST | `/admin/users/:id/credits/adjust` | Yes | Admin | Add/subtract credit and create manual adjustment transaction. |
| GET | `/admin/videos` | Yes | Admin | Filter videos by status, engine, provider, userId, from and to. |
| GET | `/admin/videos/:id` | Yes | Admin | Read video detail and latest generation job. |
| GET | `/admin/reports/overview` | Yes | Admin | Time-filtered users, videos, credits, payments and promotions report. |
| GET | `/admin/settings` | Yes | Admin | Read videoGeneration, upload and provider settings. |
| PATCH | `/admin/settings` | Yes | Admin | Update settings and write audit log. |
| GET | `/admin/credit-packages` | Yes | Admin | List all credit packages. |
| POST | `/admin/credit-packages` | Yes | Admin | Create a credit package. |
| PATCH | `/admin/credit-packages/:id` | Yes | Admin | Update a credit package. |
| PATCH | `/admin/credit-packages/:id/status` | Yes | Admin | Activate/deactivate a credit package. |
| GET | `/admin/payments` | Yes | Admin | Filter payments by status, from and to. |
| GET | `/admin/promotions` | Yes | Admin | List promotions with registration stats. |
| POST | `/admin/promotions` | Yes | Admin | Create promotion. |
| GET | `/admin/promotions/:id` | Yes | Admin | Read promotion detail. |
| PATCH | `/admin/promotions/:id` | Yes | Admin | Update promotion. |
| PATCH | `/admin/promotions/:id/status` | Yes | Admin | Change promotion status. |
| GET | `/admin/promotions/:id/registrations` | Yes | Admin | Read users registered for a promotion. |

Common errors:

| Status | Meaning |
| --- | --- |
| 400 | Invalid input or business rule failed. |
| 401 | Missing or invalid login session. |
| 402 | Not enough credit. |
| 403 | Locked account or missing admin role. |
| 404 | Resource not found. |
| 409 | Duplicate email, code or promotion registration. |
| 500 | Server error. |
