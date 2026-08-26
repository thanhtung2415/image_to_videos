# Acceptance Tests

Dung file nay de kiem tra nhanh truoc khi nop va khi demo. Cac buoc ben duoi bam sat yeu cau User/Admin, Credit, Promotion, Payment va Video.

## Chuan bi

```bash
npm install
npm run seed
npm run verify:submission
npm run check
```

Chay cac terminal rieng:

```bash
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

Mo `http://localhost:5173`.

## User acceptance

| ID | Test | Expected result |
| --- | --- | --- |
| AC01 | Register user moi khong nhap promotion | Wallet `availableCredit = 0`, `reservedCredit = 0` |
| AC02 | Tao video khi credit = 0 | Backend tu choi va hien loi khong du credit |
| AC03 | Mua goi credit mock | Payment `paid`, wallet tang, co transaction `purchase` |
| AC04 | Tao video FFmpeg | Trang thai di qua queued/processing/uploading/completed, xem duoc MP4 |
| AC05 | Tao video AI khi co token/quota | Video AI completed; neu provider het quota thi hien loi ro va khong crash |
| AC06 | Job failed/cancelled | Credit reserved duoc release ve wallet |
| AC07 | Xem history | User thay video history va credit transaction history |
| AC08 | Profile | User xem ho so, cap nhat ten va doi mat khau hop le |
| AC09 | Promotion | User dang ky promotion hop le duoc cong credit bonus |
| AC10 | Promotion duplicate | User dang ky lai cung promotion bi tu choi |

## Admin acceptance

| ID | Test | Expected result |
| --- | --- | --- |
| AC11 | Admin list/search user | Tim theo name/email, loc status/role |
| AC12 | Admin user detail | Xem thong tin user, transactions va projects gan nhat |
| AC13 | Lock/unlock user | Locked user bi tu choi login/auth request |
| AC14 | Manual credit adjustment | Cong/tru credit co confirm, khong am wallet, co transaction `manual_adjustment` |
| AC15 | Credit packages | Tao/sua/bat/tat package; user chi thay package active |
| AC16 | Payment management | Xem payment theo status va refund payment mock |
| AC17 | Promotion management | Tao/bat/tat promotion, xem registrations va tong credit granted |
| AC18 | Video management | Loc video theo status, xem detail: user, prompt, image, output, engine, provider, model, cost, error |
| AC19 | Settings | Doi video cost, upload limit va default provider; backend luu vao `settings` |
| AC20 | Reports | From/To filter tra ve user, video, credit, revenue va promotion tu MongoDB |

## Evidence can chup

1. Login/register.
2. User wallet 0 credit ban dau.
3. Mock payment hoac promotion thanh cong.
4. Form upload anh/prompt.
5. Video processing.
6. Video completed va play MP4.
7. Credit transactions.
8. Admin reports From/To.
9. Admin user detail va adjust credit.
10. Admin video detail.
11. Admin promotion registrations.
12. MongoDB Atlas collections/data.

## Production acceptance

He thong duoc xem la san sang demo online khi:

- Frontend deploy co URL cong khai.
- Backend deploy co URL cong khai.
- Worker dang chay neu `QUEUE_MODE=redis`.
- `/api/health/ready` tra ve `ready: true`.
- MongoDB Atlas, Redis va Cloudinary dung env production.
- FFmpeg tao duoc MP4 va hien tren trinh duyet.
- AI provider hoat dong khi token/quota kha dung; neu khong kha dung thi FFmpeg van demo binh thuong.
