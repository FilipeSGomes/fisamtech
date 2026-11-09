# FISAM TECH Payments (`@fisamtech/payments`)

Isolated Payment Service used by the Next.js site.

## Public API

```ts
// Config / routing (safe to import on server; pricing is not secret)
import {
  resolveRoute,
  PRICES,
  SUPPORTED_CURRENCIES,
  LATAM_MP_COUNTRIES,
  formatMoney,
} from "@fisamtech/payments";

// Server-only
import {
  createPaymentSession,
  verifyStripeWebhook,
  verifyMercadoPagoWebhook,
} from "@fisamtech/payments/server";

// Client UI
import { FisamCheckout } from "@fisamtech/payments/client";
```

## How the site mounts checkout

1. Qualification posts lead → receives `leadId`
2. Checkout page calls `POST /api/checkout/create` (thin route → `createPaymentSession`)
3. Page renders:

```tsx
<FisamCheckout
  session={session}
  serviceLabel="Technical Discovery"
  termsUrl={`/${locale}/terms`}
  privacyUrl={`/${locale}/privacy`}
/>
```

4. Webhooks call `verifyStripeWebhook` / `verifyMercadoPagoWebhook` → site DB → booking unlock

## Secrets

Never import `*/server` into Client Components. Public keys only via `NEXT_PUBLIC_*`.
