# Super Admin — Testing

## Automated (current)

```bash
npm test
```

Covers:

- Money math (cents, line totals)
- Password hash/verify
- RBAC `hasPermission`

## Manual smoke (Phase 1)

1. Public `/pt-br/qualify` creates lead → appears in Super Admin leads.
2. Unauthenticated `/pt-br/super-admin/dashboard` redirects to login.
3. `GET /api/admin/leads` without cookie → 401.
4. Login → dashboard KPIs reflect DB counts.
5. SUPER_ADMIN without MFA sees banner and `/mfa` enrollment.

## Planned E2E (Phases 3–5)

Scenarios 1–10 from the product mission (proposal PDF, concurrent numbering, webhook idempotency, session revoke).
