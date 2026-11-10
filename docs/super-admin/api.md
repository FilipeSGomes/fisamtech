# Super Admin — API

All routes under `/api/admin/*` require session cookie `fisam_admin_session`, except login.

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/api/admin/auth/login` | public | sets cookie |
| POST | `/api/admin/auth/logout` | session | revokes session |
| GET | `/api/admin/auth/me` | session | current user |
| GET/POST | `/api/admin/auth/mfa/setup` | session | TOTP enroll |
| GET | `/api/admin/dashboard` | `dashboard:read` | KPIs |
| GET/POST | `/api/admin/leads` | `leads:read` / `leads:create` | list/create |
| GET/PATCH | `/api/admin/leads/:id` | `leads:read` / `leads:update` | detail/update |

Public lead capture remains `POST /api/leads` (no admin session).
