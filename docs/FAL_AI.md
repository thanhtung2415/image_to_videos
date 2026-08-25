# fal.ai setup

Project da co adapter cho `blackforestlabs/flux-3/image-to-video`.

## 1. Lay API key

1. Dang nhap fal.ai.
2. Vao dashboard/API keys.
3. Tao hoac copy API key.
4. Khong commit key len GitHub.

## 2. Cau hinh backend

Trong `apps/backend/.env`, them mot trong hai bien:

```txt
FAL_API_KEY=your_fal_key
```

Hoac:

```txt
FAL_KEY=your_fal_key
```

## 3. Chay local

```bash
npm run dev:backend
npm run dev:frontend
```

Neu dung Redis worker:

```bash
npm run dev:worker
```

## 4. Tao video AI

1. Dang nhap frontend.
2. Upload anh.
3. Chon `Engine: AI provider`.
4. Chon provider `fal`.
5. Tao video.

## 5. Luu video output

- Neu cau hinh Cloudinary, video fal.ai se duoc upload ve Cloudinary.
- Neu chua cau hinh Cloudinary, he thong se hien URL video remote tu fal.ai.

## 6. Loi thuong gap

| Loi | Cach xu ly |
| --- | --- |
| AI provider chua duoc cau hinh | Them `FAL_API_KEY` hoac `FAL_KEY` vao backend `.env` |
| fal.ai generation failed | Kiem tra quota, billing, prompt, anh upload |
| Khong co video URL | Kiem tra logs backend va request id trong `generation_jobs` |

