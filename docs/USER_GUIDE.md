# User Guide

## Demo accounts

Chay `npm run seed:demo` de tao tai khoan mau.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | 123456 |
| User | user@example.com | 123456 |

## User flow

1. Dang ky hoac dang nhap.
2. Khi dang ky, co the nhap promotion code hop le de nhan credit bonus.
3. Neu tai khoan moi chua co credit, vao `Credit packages` de mua goi mock hoac nhap promotion code.
4. Trong `Tao video moi`, nhap tieu de, prompt, thoi luong, ty le.
5. Chon `FFmpeg stable` de demo on dinh hoac `AI provider` de tao video co chuyen dong bang Replicate/fal.ai.
6. Upload anh JPG, PNG hoac WEBP.
7. Bam `Tao video`.
8. Theo doi status trong `Video da tao`.
9. Khi status la `completed`, xem video tren trinh duyet hoac bam `Download`.
10. User co the xem `Credit history`, notification, export data, cap nhat ho so va doi mat khau.

## Admin flow

1. Dang nhap bang tai khoan admin.
2. Xem `30 day report` de theo doi user, video, credit, revenue va promotion.
3. Dung `User management` de tim user, doi role/status hoac cong/tru credit thu cong.
4. Dung `Credit package management` de tao/bat/tat goi credit.
5. Dung `Payment management` de xem payment va refund payment mock.
6. Dung `Video review` de loc video failed/completed/queued.
7. Dung `Video cost settings` de doi credit cost cho FFmpeg/AI.
8. Dung `Coupon management` va `Promotion management` de tao ma giam gia/khuyen mai.
9. Dung `Content reports` de review, resolve hoac dismiss report.

## Suggested screenshots for report

1. Login/register screen.
2. User dashboard before creating video.
3. Upload image and create video form.
4. Processing/queued status.
5. Completed video with player and download button.
6. Credit history after generation.
7. Admin overview and 30 day report.
8. Admin user management and credit adjustment.
9. Admin promotion or credit package management.
10. MongoDB Atlas collections/data explorer.

## Common demo issue

Neu frontend mo duoc nhung hien `Failed to fetch`, thuong la backend chua chay hoac MongoDB Atlas dang chan IP. Hay mo MongoDB Atlas `Network Access` va them IP hien tai, sau do chay lai backend.
