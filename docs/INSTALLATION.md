# Installation

## Requirements

- Node.js 20 or newer.
- MongoDB Atlas or local MongoDB.
- Redis/Upstash when `QUEUE_MODE=redis`.
- Cloudinary account for online video storage.
- Replicate or fal.ai API key only when testing AI generation.

## Local setup

```bash
npm install
```

Create `apps/backend/.env` from `apps/backend/.env.example` and fill:

```txt
MONGODB_URI=
JWT_SECRET=
FRONTEND_URL=http://localhost:5173
PUBLIC_BACKEND_URL=http://localhost:4000
QUEUE_MODE=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REPLICATE_API_TOKEN=
FAL_API_KEY=
```

Seed demo data:

```bash
npm run seed
```

Start services in separate terminals:

```bash
npm run dev:backend
npm run dev:worker
npm run dev:frontend
```

Open `http://localhost:5173`.

## Verification

```bash
npm run check
npm run build
```

Use `GET /api/health/ready` to verify database, queue, storage and provider configuration.
