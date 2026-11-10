# Super Admin — Architecture

## Overview

Modular monolith inside the existing Next.js app. Private UI under `/pt-br/super-admin`, APIs under `/api/admin/*`.

## Layers

1. UI — App Router RSC pages + client forms (`sa-*` CSS)
2. Route handlers — `/api/admin/**` with `requireAdminApi`
3. Domain services — `src/lib/super-admin/{auth,rbac,crm,proposals,identity,audit}`
4. Persistence — `adminQuery` / `withAdminTransaction` via `pg` pooler
5. Audit — append-only `admin_audit_logs`

## Domains delivered

| Domain | Status |
|---|---|
| Identity / sessions / MFA | Phase 1 |
| RBAC | Phase 1 |
| Leads CRM | Phase 1–2 |
| Companies / contacts / opportunities | Phase 2 |
| Proposals + PDF + send registry | Phase 3 |
| Users / roles / audit / settings KPIs | Phase 4 |
| Hardening tests + docs | Phase 5 |

## Constraints

- AuthZ always server-side (`requirePermission` + ownership)
- No secrets in repo; bootstrap via env only
- Additive SQL migrations only
- Do not pull `pg` into client components (constants split into `*-status` / `workflow` modules)
