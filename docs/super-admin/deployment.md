# Super Admin — Deployment

## Prerequisites

1. Apply migrations through `003_super_admin_foundation.sql` on Supabase (pooler URL).
2. Set on Vercel / `.env.local`:
   - `DATABASE_URL` (pooler)
   - `ADMIN_SESSION_SECRET` (≥16 chars)
3. Bootstrap first Super Admin (once):

```bash
export ADMIN_BOOTSTRAP_EMAIL="you@fisamtech.com"
export ADMIN_BOOTSTRAP_NAME="Filipe"
export ADMIN_BOOTSTRAP_PASSWORD="********"
npm run admin:bootstrap
```

4. Open `/pt-br/super-admin/login` and enroll MFA.

## Production rules

- Do **not** deploy Super Admin secrets in the repo.
- Do **not** run destructive SQL without explicit approval.
- Prefer feature branch → preview → production with authorization.
- Letterhead path: `private/branding/papel-timbrado-fisam-tech.png` (server-only).

## Rollback

Phase 1 migrations are additive. Rollback of IAM tables requires explicit approval (DROP).
