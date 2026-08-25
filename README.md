# Image To Videos

Website chuyen anh thanh video ngan theo SRS v2.0. Ban hien tai la Commercial MVP: co dang ky, dang nhap, credit co ban, upload anh, tao video MP4 bang FFmpeg va hien thi video ket qua tren trinh duyet.

## Kien truc

| Thanh phan | Cong nghe |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas hoac MongoDB local |
| Storage | Local trong dev, Cloudinary khi cau hinh env |
| Video engine | FFmpeg |
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
FRONTEND_URL=http://localhost:5173
PUBLIC_BACKEND_URL=http://localhost:4000
```

4. Chay backend:

```bash
npm run dev:backend
```

5. Chay frontend o terminal khac:

```bash
npm run dev:frontend
```

Frontend mac dinh chay tai `http://localhost:5173`, backend tai `http://localhost:4000`.

## Luong chuc nang

1. Nguoi dung dang ky hoac dang nhap.
2. He thong cap san 20 credits cho tai khoan moi.
3. Nguoi dung upload anh JPG, PNG hoac WEBP toi da 5MB.
4. Backend tru 5 credits va tao generation job.
5. FFmpeg tao video MP4 tu anh.
6. Video duoc luu local neu chua cau hinh Cloudinary.
7. Frontend tu cap nhat trang thai job va hien video khi hoan tat.

## Deploy goi y

| Thanh phan | Dich vu goi y |
| --- | --- |
| Frontend | Vercel hoac Netlify |
| Backend | Render hoac Railway |
| Database | MongoDB Atlas |
| Storage | Cloudinary |

Khi deploy backend, can cau hinh day du cac bien trong `apps/backend/.env.example`. Khong dua file `.env` that len GitHub.

