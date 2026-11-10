# Super Admin — API

All routes under `/api/admin/*` require session cookie `fisam_admin_session`, except login and invite acceptance.

| Method | Path | Permission | Notes |
|---|---|---|---|
| POST | `/api/admin/auth/login` | public | Sets HttpOnly session cookie |
| POST | `/api/admin/auth/logout` | session | Revokes current session |
| GET | `/api/admin/auth/me` | session | Current user + roles/permissions |
| POST | `/api/admin/auth/mfa/setup` | session | Enroll/verify TOTP |
| GET | `/api/admin/dashboard` | `dashboard:read` | KPI aggregates |
| GET/POST | `/api/admin/leads` | `leads:read` / `leads:create` | List/create |
| GET/PATCH | `/api/admin/leads/:id` | `leads:read` / `leads:update` | Detail + status/owner/notes |
| POST | `/api/admin/leads/:id/convert` | `opportunities:create` | Lead → company/contact/opportunity |
| GET/POST | `/api/admin/companies` | `companies:read` / `companies:create` | |
| GET/PATCH | `/api/admin/companies/:id` | `companies:read` / `companies:update` | |
| GET/POST | `/api/admin/contacts` | `contacts:read` / `contacts:create` | |
| GET/PATCH | `/api/admin/contacts/:id` | `contacts:read` / `contacts:update` | |
| GET/POST | `/api/admin/opportunities` | `opportunities:read` / `opportunities:create` | |
| GET/PATCH | `/api/admin/opportunities/:id` | `opportunities:read` / `opportunities:update` | Owner checks for SALES |
| GET/POST | `/api/admin/proposals` | `proposals:read` / `proposals:create` | Number allocated transactionally |
| GET/PATCH | `/api/admin/proposals/:id` | `proposals:read` / `proposals:update` | Draft/in-review edits |
| POST | `/api/admin/proposals/:id/transition` | `proposals:update` (+ approve/send as needed) | Workflow validation |
| POST | `/api/admin/proposals/:id/version` | `proposals:update` | Bump immutable copy |
| GET/POST | `/api/admin/proposals/:id/pdf` | `proposals:read` / `proposals:export` | Authenticated download / generate |
| POST | `/api/admin/proposals/:id/send` | `proposals:send` | Resend or `pending_config` |
| GET | `/api/admin/proposals/templates` | `proposals:read` | Active templates |
| GET/PATCH | `/api/admin/users` | `users:read` / `users:update` | List + disable/roles |
| POST | `/api/admin/users/invite` | `users:invite` | Single-use token returned once |
| POST | `/api/admin/users/accept-invite` | public (token) | Create invited user |
| DELETE | `/api/admin/users/:id/sessions` | `users:update` | Revoke all sessions |
| GET/PATCH | `/api/admin/roles` | `users:read` / `roles:manage` | SUPER_ADMIN immutable |
| GET | `/api/admin/audit` | `audit:read` | Paginated audit log |

Owner-scoped resources: SALES may only mutate records they own; ADMIN/SUPER_ADMIN bypass ownership.
