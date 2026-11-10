# Super Admin — Testing

## Automated

```bash
npm test
npm run build
```

Coverage (Vitest):

- Money helpers (`toCents` / line totals)
- Proposal totals aggregation (`computeProposalTotals`)
- Proposal workflow transition guards
- Lead status vocabulary
- RBAC deny / ownership checks
- Password scrypt hash/verify

## Manual smoke

1. Bootstrap: `ADMIN_BOOTSTRAP_*` + `npm run admin:bootstrap`
2. Login `/pt-br/super-admin/login` → enroll MFA if SUPER_ADMIN
3. Create company/contact → opportunity (or convert lead)
4. Create proposal with items → transition DRAFT→IN_REVIEW→APPROVED
5. Generate PDF download via authenticated `/api/admin/proposals/:id/pdf`
6. Send: if Resend missing/misconfigured expect `pending_config` (never fake success)
7. Invite user, accept via `?invite=`, revoke sessions, check audit log
