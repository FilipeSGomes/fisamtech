# Super Admin — Architecture

## Overview

Modular monolith inside the existing Next.js app. Private UI under `/pt-br/super-admin`, APIs under `/api/admin/*`.

```text
Browser → Middleware (locale + admin session gate)
       → RSC pages / Client forms
       → /api/admin/* (zod + requirePermission)
       → src/lib/super-admin services
       → pg (Supabase Postgres pooler)
```

## Packages / folders

| Path | Responsibility |
|---|---|
| `src/lib/super-admin/auth` | password, session, MFA |
| `src/lib/super-admin/rbac` | roles, permissions, authorize |
| `src/lib/super-admin/audit` | append-only audit events |
| `src/lib/super-admin/crm` | leads, companies, contacts, opportunities |
| `src/lib/super-admin/proposals` | proposals, versions, PDF, money math |
| `src/components/super-admin` | shell UI |
| `src/app/[locale]/super-admin` | pages |
| `src/app/api/admin` | HTTP boundary |
| `private/branding` | letterhead (not publicly served) |

## Security posture

- AuthZ always on server.
- Public lead capture remains unauthenticated.
- Admin cookies HttpOnly; sessions revocable.
- Audit for sensitive mutations.
- Documents generated server-side; private storage paths.

## Evolution

WhatsApp Business, e-sign, and AI assistant are **out of scope** until contracts exist. Integration ports can be added later without rewriting CRM core.
