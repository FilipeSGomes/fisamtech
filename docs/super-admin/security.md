# Super Admin — Security

## Controls implemented (Phase 1)

- Password hashing: scrypt (`node:crypto`)
- Opaque session tokens; only SHA-256 hash stored
- Cookie `fisam_admin_session`: HttpOnly, SameSite=Lax, Secure in production
- Session revocation (logout / revoke all)
- Login rate limiting via failed_login_count + lockout
- RBAC permission checks on `/api/admin/*`
- Resource owner checks for leads (SALES)
- MFA TOTP required path for SUPER_ADMIN (AES-GCM encrypted secret at rest)
- Robots disallow for `/super-admin` and `/api/admin`
- Audit log for login and sensitive lead mutations
- Letterhead stored under `private/branding` (not public)

## Pending / Phase 5

- CSRF double-submit or SameSite=strict for mutation forms if needed
- Full invite flow with single-use tokens
- Document signed URLs / private object storage
- Penetration test checklist against OWASP ASVS L2 areas
- Dependency audit gate in CI
