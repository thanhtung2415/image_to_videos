# API

Base URL local: `http://localhost:4000/api`

## Auth

### POST `/auth/register`

Body:

```json
{
  "name": "Nguyen Van A",
  "email": "demo@example.com",
  "password": "123456"
}
```

### POST `/auth/login`

Body:

```json
{
  "email": "demo@example.com",
  "password": "123456"
}
```

### GET `/auth/me`

Header:

```txt
Authorization: Bearer <token>
```

## Projects

### GET `/projects`

Lay danh sach video project cua user dang dang nhap.

### POST `/projects`

Tao project va generation job.

Form data:

| Field | Mo ta |
| --- | --- |
| title | Tieu de video |
| prompt | Mo ta chuyen dong |
| duration | 3, 5, 8 hoac 10 |
| resolution | 1280x720, 720x1280 hoac 1024x1024 |
| image | File JPG, PNG hoac WEBP |

### GET `/projects/:id`

Lay thong tin project va job moi nhat de cap nhat trang thai.

