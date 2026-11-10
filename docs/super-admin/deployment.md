# Super Admin — Deployment

## Prerequisites

1. Apply migrations through `004_super_admin_proposals_ops.sql` on Supabase (pooler URL).
2. Env:
   - `DATABASE_URL` (pooler IPv4)
   - `ADMIN_SESSION_SECRET` (≥16 chars)
   - Optional: `RESEND_API_KEY` for real proposal e-mail
   - Bootstrap only once: `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_NAME`, `ADMIN_BOOTSTRAP_PASSWORD`
3. Private assets:
   - `private/branding/papel-timbrado-fisam-tech.png`
   - `private/proposals/` (runtime PDFs; gitignored)

## Bootstrap

```bash
npm run admin:bootstrap
```

Denied if any `admin_users` already exist. Then login at `/pt-br/super-admin/login` and enroll MFA.

## Deploy notes

- Feature branch / preview first; production only with explicit approval.
- Serverless FS is ephemeral — PDF bytes also stored in `proposal_documents.pdf_bytes`.
- Public funnel routes (`/api/leads`, checkout, etc.) remain unauthenticated.
