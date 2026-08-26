# Demo Accounts

Run the database seed before demo:

```bash
npm run seed
```

| Role | Email | Password | Notes |
| --- | --- | --- | --- |
| Admin | admin@example.com | Admin123! | Access admin management, reports, settings, promotions and user credit adjustment. |
| User | user@example.com | User123! | Starts with 0 credit; use mock purchase or promotion before creating video. |

Public registration always creates `role=user`. Admin accounts are created through seed data or by an existing admin.
