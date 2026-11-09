# FISAM TECH

International commercial site — Next.js (App Router) + Vercel-ready + `@fisamtech/payments`.

> **DNS / GitHub Pages:** production domain `fisamtech.com` may still be served by GitHub Pages until you authorize cutover. Deploy Next.js to Vercel separately; do not change DNS yet.

## Stack

- **Next.js 15** App Router + `next-intl` (en, pt-BR, pt-PT, es, fr, de)
- **Supabase Postgres** (schema in `supabase/migrations/`)
- **`@fisamtech/payments`** — Payment Service package (`packages/payments`)
  - Mercado Pago **Checkout Transparente** (LATAM: BR, AR, MX, CO, CL, PE, UY)
  - Stripe **Embedded Checkout** (US / UK / Eurozone)
- Google Appointment Scheduling gated after payment

## Local run

```bash
cp .env.local.example .env.local
# fill keys when ready — empty is OK for UI/build; checkout shows configError
npm install
npm run dev
```

Open http://localhost:3000 → geo/locale redirect.

```bash
npm run build
npm test
```

## Payments package

```
packages/payments/          → @fisamtech/payments
  src/config/               country → currency → provider + PRICES
  src/providers/            MercadoPagoTransparentProvider, StripeEmbeddedProvider
  src/components/FisamCheckout.tsx
  src/server/               createPaymentSession, verify*Webhook
```

**Site mounts checkout:**

```tsx
import { FisamCheckout } from "@fisamtech/payments/client";
// qualification → /api/checkout/create → <FisamCheckout session={...} />
```

API routes under `src/app/api/**` are thin wrappers — no Stripe/MP SDK outside the package.

### Payment matrix

| Country | Currency | Gateway |
|---|---|---|
| BR | BRL | MP Transparent |
| AR | ARS | MP Transparent |
| MX | MXN | MP Transparent |
| CO | COP | MP Transparent |
| CL | CLP | MP Transparent |
| PE | PEN | MP Transparent |
| UY | UYU | MP Transparent |
| US | USD | Stripe Embedded |
| GB | GBP | Stripe Embedded |
| Eurozone | EUR | Stripe Embedded |

LATAM non-BRL Discovery prices are **HYPOTHESIS** placeholders in `packages/payments/src/config` — edit there after validation (never FX from BRL in UI).

## Env vars

See `.env.example`. All placeholders empty for founder to fill (Stripe signup in progress; per-country MP tokens supported).

## Funnel

1. `/[locale]/qualify` → `POST /api/leads`
2. `/[locale]/checkout` → `POST /api/checkout/create` → `<FisamCheckout />`
3. Webhooks `/api/webhooks/stripe|mercadopago` → persist payment → booking token
4. `/[locale]/book?token=` → Google Calendar link

## DNS cutover checklist (DO NOT EXECUTE until authorized)

1. Vercel project green + env vars set
2. Supabase schema applied
3. Stripe + MP test webhooks verified
4. Redirects tested
5. Point `fisamtech.com` DNS to Vercel
6. Disable GitHub Pages custom domain
7. Keep Hostinger MX/SPF intact
8. Monitor 48h

## Docs

- `docs/01-AUDIT.md`
- `docs/02-PRODUCTION-ARCHITECTURE.md`
- `docs/03-PAYMENTS.md`
- `docs/04-COMPLIANCE-CHECKLIST.md`
- `legacy/` — previous static GitHub Pages site
