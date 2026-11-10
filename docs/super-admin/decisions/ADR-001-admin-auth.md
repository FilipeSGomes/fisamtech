# ADR-001 — Autenticação administrativa própria (sessão + Postgres)

## Status

Accepted — 2026-11-10

## Context

Não existe autenticação de usuários no site. Supabase Auth não está configurado (`SUPABASE_SERVICE_ROLE_KEY` frequentemente ausente). O acesso ao banco em produção já ocorre via `DATABASE_URL` (pooler).

## Decision

Implementar IAM administrativo no próprio monólito:

- Credenciais em `admin_users` com hash **scrypt** (`node:crypto`).
- Sessões opacas em `admin_sessions` (token aleatório; apenas hash no banco).
- Cookie `fisam_admin_session` — `HttpOnly`, `Secure` (prod), `SameSite=Lax`.
- MFA TOTP obrigatório para papel `SUPER_ADMIN` após primeiro setup.
- Sem auto-cadastro público; bootstrap via script CLI.

## Alternatives

1. **Supabase Auth** — bom a médio prazo, mas exige service role e projeto Auth ligado; acopla o admin ao provedor ainda incompleto.
2. **NextAuth/Auth.js** — overhead e adapters; pouco ganho com um único tenant interno.

## Consequences

- Controle total sobre sessão/revogação.
- Precisa de `ADMIN_SESSION_SECRET` e disciplina de migrations.
- Futura migração para IdP externo permanece possível (abstrair `getAdminSession`).
