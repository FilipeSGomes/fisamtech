# FISAM TECH SUPER ADMIN — Architecture Assessment

**Date:** 2026-11-10  
**Repo:** `FilipeSGomes/fisamtech`  
**Live site:** https://www.fisamtech.com  
**Branch of work:** `feat/super-admin`

---

## 1. Arquitetura atual

| Item | Estado encontrado |
|---|---|
| Framework | **Next.js 15.2** (App Router) + React 19 + TypeScript |
| i18n | `next-intl` — locales: `en`, `pt-br`, `pt-pt`, `es`, `fr`, `de` (`localePrefix: always`) |
| Deploy | **Vercel** production (`www.fisamtech.com`); GitHub Pages ainda listado no repo (legado) |
| Persistência | **Supabase Postgres** via `DATABASE_URL` (pooler IPv4) e opcionalmente `@supabase/supabase-js` com service role |
| ORM | **Nenhum** — SQL direto com `pg` + inserts via Supabase client quando service role existe |
| Validação | `zod` nas rotas API |
| Pagamentos | pacote interno `@fisamtech/payments` (MP Transparent LATAM + Stripe Embedded US/UK/EU) |
| E-mail | stub Resend (`RESEND_API_KEY`); templates em `/emails` |
| Auth de usuários | **Inexistente** — nenhum login, sessão ou IAM administrativo |
| UI | CSS global (`globals.css`), tokens `--primary`, Oxanium / IBM Plex; sem biblioteca de UI (sem shadcn/MUI) |
| Testes | Vitest — hoje cobre roteamento de pagamentos |
| Observabilidade | `console.*` + tabela `events`; sem APM |

### Estrutura relevante

```text
src/app/[locale]/…          páginas públicas
src/app/api/**               handlers REST thin
src/lib/db                   acesso Postgres/Supabase
src/lib/config               CONTACT, BUDGET_RANGES, locales
packages/payments            Payment Service
supabase/migrations          001_initial, 002_whistleblowing
```

### Tabelas em produção (verificadas)

`leads`, `payments`, `bookings`, `events`, `whistleblowing_reports`

`leads` já possui: name, email, company, country, locale, currency, role, challenge, budget_range, source, phone, metadata.

**Não existem** tabelas de empresas, contatos, oportunidades, propostas, usuários admin, papéis ou auditoria.

---

## 2. Fluxos existentes

| Fluxo | Rota | Persistência | Notas |
|---|---|---|---|
| Homepage | `/[locale]` | analytics client | CTAs para qualify / cases / WhatsApp |
| Qualificação | `/[locale]/qualify` → `POST /api/leads` | **sim** (`leads`) | depois redireciona checkout |
| Checkout Discovery | `/[locale]/checkout` → `/api/checkout/create` | sessão provedor | Stripe keys frequentemente vazias |
| Webhooks | `/api/webhooks/stripe\|mercadopago` | `payments` + booking token | idempotência por provider+transaction_id |
| Booking | `/[locale]/book?token=` | `bookings` | Google Calendar gateado |
| Parceiros | `/[locale]/parceiros` | **não** | abre WhatsApp com texto; sem lead DB |
| Denúncia | `/[locale]/denuncia` → `/api/denuncia` | `whistleblowing_reports` | canal compliance (fora do CRM) |
| Legal | privacy/terms/cookies/compliance | estático | CNPJ `59.897.573/0001-02` |

### Requisito crítico confirmado

`POST /api/leads` **não** depende de sessão administrativa. Deve permanecer assim.

---

## 3. Pontos de integração

| Integração | Status |
|---|---|
| Supabase Postgres | Ativo (pooler) |
| Supabase Auth | **Não usado** |
| Mercado Pago | Código pronto; tokens parciais na Vercel |
| Stripe | Código pronto; keys frequentemente ausentes |
| Resend | Stub até `RESEND_API_KEY` |
| Google Calendar | Link público pós-pagamento |
| WhatsApp | Link `wa.me` apenas |

---

## 4. Riscos identificados

1. **Sem IAM** — qualquer painel novo exige auth do zero.
2. **`SUPABASE_SERVICE_ROLE_KEY` ausente** — app usa `pg` direto; privilégio total no connection string.
3. **Parceiros sem persistência** — perda de funil comercial.
4. **Leads sem status/owner** — tabela mínima; precisa extensão compatível.
5. **IPv6 / pooler** — `db.*` direto falha na Vercel; pooler obrigatório.
6. **E-mail não configurado** — envio de propostas deve marcar `pending_config`, não fingir sucesso.
7. **PDF/letterhead** — asset privado; não servir em `/public`.
8. **i18n no admin** — 6 locales aumentam custo; admin começa em pt-BR.
9. **Multi-tenant** — fora de escopo; modelo single-tenant FISAM TECH.
10. **GitHub Pages legado** — risco de confusão de origem de deploy; produção real é Vercel.

---

## 5. Componentes reutilizáveis

- `src/lib/db` (pool/ssl patterns) — estender, não duplicar.
- `zod` validation nas APIs.
- Design tokens CSS (`--primary`, tipografia).
- `CONTACT` / CNPJ / e-mail institucionais.
- `BUDGET_RANGES` e fontes de lead.
- `sendEmail` stub (estender templates).
- `@fisamtech/payments` inalterado nesta fase.
- Papel timbrado: `private/branding/papel-timbrado-fisam-tech.png`.

---

## 6. Arquitetura recomendada

**Monólito modular no Next.js existente**, namespace privado:

```text
/[locale]/super-admin/**     UI (pt-BR copy; locale prefix mantido)
/api/admin/**                APIs autenticadas
src/lib/super-admin/**       identity, rbac, crm, proposals, audit
supabase/migrations/003+     schema versionado
```

Camadas:

1. UI (React Server Components + client forms)
2. Route handlers `/api/admin/*`
3. Application services (`src/lib/super-admin/*`)
4. Repositories SQL (`pg`)
5. AuthN (sessão opaca + cookie HttpOnly) + AuthZ (RBAC + checagens de recurso)
6. Audit log append-only

**Não** introduzir microsserviços, Redis, Kafka ou segundo banco nesta fase.

### Domínios lógicos

`identity` · `authorization` · `crm` · `companies` · `contacts` · `opportunities` · `proposals` · `documents` · `audit` · `notifications` · `integrations`

---

## 7. Mudanças necessárias

| Área | Mudança |
|---|---|
| Schema | Extender `leads`; criar IAM, CRM, propostas, audit |
| Auth | Login admin + MFA TOTP obrigatório para SUPER_ADMIN |
| Middleware | Gate de sessão para `/super-admin` (exceto login) |
| Formulários | Parceiros → também `POST /api/leads` (origem partners) |
| PDF | Geração server-side com letterhead privado |
| Env | `ADMIN_SESSION_SECRET`, bootstrap vars, storage futuro |
| Docs | `docs/super-admin/*` |

---

## 8. Plano de migração e compatibilidade

1. Migrations **aditivas** (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`).
2. Manter `POST /api/leads` público e estável; enriquecer colunas novas com defaults.
3. Feature flag implícita: rotas `/super-admin` só funcionam com schema + secret.
4. Bootstrap do primeiro SUPER_ADMIN via script CLI (sem auto-signup público).
5. Deploy: branch → preview → produção **somente com autorização explícita**.
6. Rollback: migrations down documentadas; sem DROP destrutivo sem aprovação.

### Fases

| Fase | Entrega |
|---|---|
| 0 | Assessment + ADRs (este documento) |
| 1 | IAM, RBAC, layout, audit, leads read/update básico |
| 2 | CRM completo + integração formulários |
| 3 | Propostas + PDF + versionamento |
| 4 | Users/roles UI + dashboard KPIs |
| 5 | Hardening, testes E2E críticos, ops docs |

---

## Evidências de inspeção

- `package.json` — Next 15, sem auth libs.
- `src/middleware.ts` — só geo/locale; sem auth.
- `supabase/migrations/*` — leads/payments/bookings/events/whistleblowing.
- Produção Postgres inspecionada em 2026-11-10: 5 tabelas públicas listadas acima.
- Letterhead copiado para `private/branding/papel-timbrado-fisam-tech.png` (não público).
