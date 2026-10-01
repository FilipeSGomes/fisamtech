# PIKA — Inventário + Arquitetura de produção proposta

**Status:** decisões v1 fechadas — **sem migração executada**  
**Stack:** Vercel + Next.js + **Supabase (Postgres)** + Stripe + Mercado Pago  
**Data:** 2026-10-01

### Decisões confirmadas (2026-10-01)

| # | Decisão | Detalhe |
|---|---|---|
| 1 | Sem Railway na v1 | API/webhooks na Vercel |
| 2 | Sim, precisa de base | **Supabase Postgres** (não reinventar; é Postgres gerenciado) |
| 3 | Locale por localização | Geo sugere idioma/moeda; seletor manual sempre disponível |
| 4 | Manter `/parceiros/` | BR intacto; intl = framing adaptado (ver § Parceiros) |
| 5 | Google Calendar atual | Appointment Scheduling gateado pós-pagamento |

---

## A. Inventário da aplicação atual

### Framework / runtime
| Item | Valor |
|---|---|
| Framework | **Nenhum** — HTML estático |
| Linguagem | HTML5 + CSS3 + JavaScript ES5/ES6 vanilla |
| Build process | **Inexistente** (sem `package.json`, sem bundler, sem CI) |
| Testes | `node --test main.test.js` (unitário do JS) |
| Dependências npm | **Nenhuma** |
| Variáveis de ambiente | **Nenhuma** (sem `.env*`) |
| Container / Dockerfile | **Não** |
| GitHub Actions | **Não** (sem `.github/`) |

### Deploy / domínio / DNS
| Item | Valor |
|---|---|
| Hosting | **GitHub Pages** (`server: GitHub.com`, Fastly CDN) |
| Repo | `FilipeSGomes/fisamtech` (público) |
| Source Pages | branch `main`, path `/`, build_type `legacy` |
| Domínio custom | `fisamtech.com` (CNAME file + Pages verified) |
| HTTPS | Forçado; cert GitHub até ~2026-11-25 |
| DNS A | `185.199.108–111.153` (GitHub Pages) |
| DNS NS | `ns1/ns2.dns-parking.com` (zona Hostinger/parking) |
| www | CNAME → `fisamtech.com` |
| Email | MX Hostinger (`mx1/mx2.hostinger.com`); SPF Hostinger |
| Deploy trigger | push em `main` → rebuild Pages automático |

### Dependências específicas do GitHub Pages
1. Arquivo raiz `CNAME` com `fisamtech.com`
2. Site 100% estático (sem SSR, sem API routes)
3. URLs com `.html` e pastas (`cases.html`, `parceiros/`)
4. Sem `.nojekyll` (não usa Jekyll features — ok hoje)
5. Sem 404 custom (`custom_404: false`)
6. Domínio verificado + HTTPS no GitHub Pages

**Implicação:** qualquer backend (webhooks, DB, secrets) **não cabe** no Pages. Migração de domínio para Vercel exige trocar DNS A/CNAME e desativar Pages (ou manter Pages só como fallback temporário).

### Rotas públicas atuais
| Rota | Tipo |
|---|---|
| `/` | Landing BR |
| `/cases.html` | Cases |
| `/parceiros/` | Programa parceiros |
| `/privacidade.html` | LGPD |
| `/termos.html` | Termos |
| `/robots.txt`, `/sitemap.xml` | SEO |
| `/main.js`, `/styles.css`, `/images/*`, favicons | Assets |

### APIs internas
**Nenhuma.** Contato = links externos.

### Integrações externas (somente links)
| Integração | Uso |
|---|---|
| Google Calendar Appointment | CTA diagnóstico gratuito |
| WhatsApp (`wa.me/5511979562271`) | CTA / partners form |
| Mailto `contato@fisamtech.com` | Contato |
| Subdomínios produtos | quote, fnrh, fintrack, kontrolla, fisamtour |

### Assets relevantes
- Design tokens em `DESIGN.md` + `styles.css` (Apple-like)
- Imagens otimizadas (webp) + PNGs fonte grandes (~1.8–2.1 MB) ainda no repo
- PDFs de canvas/business (não servidos como produto crítico)

### O que **não** existe hoje
- i18n / hreflang
- Checkout / Stripe / Mercado Pago
- Postgres / leads / CRM
- Analytics
- Webhooks
- Secrets / env
- Formulário de qualificação na home (só partners → WA)

---

## B. Arquitetura de produção proposta (aprovada em princípio)

### Diagrama

```
                    fisamtech.com
                          │
                       VERCEL
                          │
         ┌────────────────┼────────────────┐
         │                │                │
      Next.js          Route           Edge/CDN
      (App Router)     Handlers        (assets)
         │                │
         │         ┌──────┴──────┐
         │         │             │
      Checkout   Postgres     Webhooks
      UI/API       │          /api/webhooks/*
         │         │             │
    ┌────┴────┐    │        ┌────┴────┐
    │         │    │        │         │
 Mercado   Stripe  │     Stripe      MP
  Pago     EUA/UE  │
 Brasil            │
                   └── leads, payments,
                       bookings, proposals,
                       events
```

### Stack (sua escolha)

| Camada | Tecnologia | Papel |
|---|---|---|
| Frontend + API | **Next.js (App Router) na Vercel** | Site i18n, SEO, checkout UI, API routes, webhooks |
| DB | **Supabase Postgres** | leads, payments, bookings, proposals, tracking, idempotência |
| Pagamentos BR | **Mercado Pago** | BRL |
| Pagamentos intl | **Stripe** | USD / EUR / GBP |
| Email | Resend ou Postmark (via Vercel) | confirmações / briefing |
| Calendar | **Google Appointment Scheduling atual** pós `payment_approved` | booking gateado |
| CRM | fase 2 (HubSpot/Notion/API) | sync de status |

### Por que precisa de base (e por que Supabase)

Sem persistência server-side, o funil quebra em:

- webhook chega duas vezes → risco de double-unlock / estados inconsistentes
- lead + país + moeda + pagamento + meeting status não têm fonte da verdade
- briefing interno e follow-up ficam só no e-mail da caixa pessoal

**Supabase** = Postgres gerenciado + dashboard + RLS opcional. Na v1 usamos só o **Postgres** (via connection string na Vercel). Auth/Realtime/Storage do Supabase ficam disponíveis depois se precisarem — sem Railway.

Mínimo de tabelas v1: `leads`, `payments`, `bookings`, `events` (tracking).

### Locale por localização (não forçar)

1. Vercel envia `x-vercel-ip-country` no request
2. Middleware mapeia país → locale/moeda sugeridos (`US→en/USD`, `BR→pt-BR/BRL`, `GB→en/GBP`, `ES→es/EUR`, …)
3. Cookie `NEXT_LOCALE` / `CURRENCY` se o usuário já escolheu manualmente → **não sobrescrever**
4. Banner discreto na 1ª visita: “Continue in English (USD)?” com troca fácil
5. `/` redireciona para locale sugerido **apenas** se não houver preferência salva

### Parceiros — BR vs internacional

| Mercado | Tratamento |
|---|---|
| `pt-BR` | Manter `/pt-br/parceiros` (programa atual: ideia → pitch → MVP equity/tech) |
| Intl (`en`, `es`, `fr`, `de`, `pt-PT`) | Página adaptada: **“Build with FISAM” / co-build for founders** — mesmo funil de inscrição, copy sem jargão BR; CTA secundário, não competir com Technical Discovery |
| Nav intl | Link “Partners” só se houver fit; senão, footer only |

Redirect: `/parceiros/` → `/pt-br/parceiros` (301).

### Google Calendar — o que temos hoje serve?

**Sim**, para a etapa de agendamento.

Verificado: o link atual (`calendar.app.google/Gzv4jkEqaAniaBKr5`) já oferece Appointment Scheduling com timezone do visitante (ex.: New York Time).

Uso na v1:

1. **Não** expor o link na homepage internacional
2. Após `payment_approved`, página `/book?token=…` (token assinado, uso único/expirável) mostra o embed/link do Google
3. Briefing = dados do formulário de qualificação (não depende do Calendar)
4. Timezones US/EU/BR funcionam no próprio Google

Limitações aceitas na v1: sem API nativa “já pagou”; gate é nosso. Evolução futura (Cal.com + API) só se precisar webhook de `meeting_booked` automático.

### Por que **não** Railway no início
Para o volume inicial (discovery $99, dezenas/centenas de leads):

- Webhooks Stripe/MP cabem em **Vercel Route Handlers**
- Jobs leves: Vercel Cron ou fila mínima
- Secrets: Environment Variables na Vercel
- Connection pooling Postgres: driver serverless (`@neondatabase/serverless` ou Prisma Accelerate)

**Railway só se aparecer:** workers longos, filas pesadas, rate limits de serverless, ou necessidade de processo sempre-on. Até lá, um só deploy (Vercel) reduz ops.

### Responsabilidades no monorepo Next.js

```
app/
  [locale]/              # en, pt-BR, pt-PT, es, fr, de
  api/
    checkout/create        # cria sessão (Stripe ou MP)
    webhooks/stripe
    webhooks/mercadopago
    leads/                 # qualification
    booking/unlock         # libera calendar token pós-pagamento
lib/
  config/                  # languages, currencies, prices, providers
  payments/                # PaymentProvider abstraction
  db/                      # Postgres client + schema
  analytics/               # event helpers
  email/                   # templates
```

### Pricing / gateway (config, não código)

| Mercado | Moeda | Gateway | Serviço entrada |
|---|---|---|---|
| Brasil | BRL | Mercado Pago | Technical Discovery (preço BR em config) |
| EUA | USD | Stripe | Technical Discovery `$99` (teste) |
| UK | GBP | Stripe | `£89` (teste) |
| Eurozone + ES/PT/FR/DE | EUR | Stripe | `€99` (teste) |

Preços em tabela config (`PRICES[service][currency]`). **Nunca** converter BRL→USD na UI.

### Funil técnico

```
Landing → Qualification (API lead) → Checkout create
  → Provider redirect → Webhook payment_approved
  → Persist payment + unlock booking token
  → Calendar → Internal briefing email → Proposal (manual/CRM)
```

Regras:
- Pagamento confirmado **só** via webhook assinado
- Idempotência por `provider + transaction_id`
- Frontend nunca “confirma” pagamento sozinho

### SEO / URLs

- Internacional: `/en/...`, `/pt-br/...`, `/pt-pt/...`, `/es/...`, `/fr/...`, `/de/...`
- Preservar URLs BR legadas com redirects 301:
  - `/` → `/pt-br` (ou manter `/` como pt-BR default)
  - `/cases.html` → `/pt-br/cases`
  - `/parceiros/` → `/pt-br/parceiros`
  - `/privacidade.html`, `/termos.html` → equivalentes
- hreflang + sitemap multilíngue + canonical por locale

### Migração de domínio (checklist — executar só após build verde)

1. Deploy Next.js na Vercel (preview)
2. Postgres provisionado + schema migrations
3. Stripe + MP em modo test + webhooks apontando para preview/prod
4. Redirects das URLs antigas testados
5. Trocar DNS: apontar `fisamtech.com` para Vercel (A/CNAME Vercel)
6. Adicionar domínio na Vercel + SSL
7. Desativar GitHub Pages custom domain (evitar conflito de cert/DNS)
8. Remover ou arquivar dependência do arquivo `CNAME` do Pages
9. Manter MX/SPF Hostinger intactos (email não muda)
10. Monitorar 48h: 404s, webhooks, checkout

### Variáveis de ambiente necessárias (produção)

```
DATABASE_URL
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_WEBHOOK_SECRET
RESEND_API_KEY (ou equivalente)
BOOKING_SECRET                 # assina tokens de calendar unlock
NEXT_PUBLIC_SITE_URL
```

Nenhuma dessas existe hoje — todas novas.

### Riscos da migração

| Risco | Mitigação |
|---|---|
| Downtime DNS | TTL baixo antes do cutover; preview validado |
| SEO drop | 301s 1:1 + sitemap + hreflang no dia 1 |
| Pages + Vercel conflito | desligar custom domain no Pages no cutover |
| Webhook miss | retry providers + tabela idempotente |
| Email MX | não tocar NS MX Hostinger |

---

## C. Próximo passo

Decisões v1 fechadas. Aguardando ordem explícita para:

1. Scaffold Next.js no repo (sem cutover de DNS / Pages ainda no ar)
2. Schema Supabase mínimo
3. i18n + geo middleware
4. Funil Discovery + abstração Stripe/MP
5. Gate do Google Calendar pós-pagamento

Cutover de `fisamtech.com` Pages → Vercel só com autorização separada.

---

## D. Payment routing update (2026-10-01) — dual embedded

Implemented as **`@fisamtech/payments`** (`packages/payments`).

| Country | Currency | Gateway |
|---|---|---|
| BR | BRL | Mercado Pago Transparent (MLB) |
| AR | ARS | Mercado Pago Transparent (MLA) |
| MX | MXN | Mercado Pago Transparent (MLM) |
| CO | COP | Mercado Pago Transparent (MCO) |
| CL | CLP | Mercado Pago Transparent (MLC) |
| PE | PEN | Mercado Pago Transparent (MPE) |
| UY | UYU | Mercado Pago Transparent (MLU) |
| US | USD | Stripe Embedded |
| GB | GBP | Stripe Embedded |
| Eurozone (ES, PT, FR, DE, …) | EUR | Stripe Embedded |

Site UI mounts `<FisamCheckout />`. API routes are thin wrappers. See `docs/03-PAYMENTS.md`.
