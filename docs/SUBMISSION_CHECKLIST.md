# Submission Checklist

## Source code

- Frontend source: `apps/frontend`
- Backend source: `apps/backend`
- Root scripts and package files: `package.json`, `package-lock.json`
- Deployment config: `render.yaml`, `apps/frontend/vercel.json`
- Do not submit `.env`, `node_modules`, `dist`, `uploads`, `backups`

Create clean source zip:

```bash
npm run zip:submission
```

The zip is created in `submissions` and contains only tracked source files from the latest commit.

## Database

- Run seed data: `npm run seed:demo`
- Run backup: `npm run backup:db`
- Submit generated JSON backup from `apps/backend/backups`
- Include MongoDB Atlas screenshots of main collections if required

## Documents

- API document: `docs/API.md`
- Architecture document: `docs/ARCHITECTURE.md`
- Database document: `docs/DATABASE.md`
- Deployment guide: `docs/DEPLOYMENT.md`
- User guide: `docs/USER_GUIDE.md`
- Internal SRS is not stored in this GitHub repository

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@example.com | 123456 |
| User | user@example.com | 123456 |

## Demo screenshots

1. Login/register screen.
2. User dashboard with credit balance.
3. Promotion code or credit package purchase.
4. Upload image and prompt form.
5. Video processing status.
6. Completed MP4 video in browser.
7. Credit transaction history.
8. Admin 30 day report.
9. Admin user management and manual credit adjustment.
10. Admin video review or content reports.
11. Admin promotion/package settings.
12. MongoDB Atlas collections or database backup.

## Demo video flow

1. Login as user.
2. Add credit using promotion or mock package.
3. Upload image.
4. Select Replicate AI for moving video or FFmpeg for stable fallback.
5. Generate video.
6. Show status until completed.
7. Play result MP4 and show download button.
8. Login as admin and show management/report screens.

## Final check

```bash
npm run check
```

Backend ready endpoint:

```bash
curl http://localhost:4000/api/health/ready
```
