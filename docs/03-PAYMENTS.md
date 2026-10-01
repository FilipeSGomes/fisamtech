# Payments architecture — dual embedded checkout

**Status:** implemented in `@fisamtech/payments`  
**Updated:** 2026-10-01 (founder-confirmed)

## Flow

```
FISAMTECH.COM → country/currency
  LATAM (MP Checkout Transparente — in-site):
    BR → BRL → MLB
    AR → ARS → MLA
    MX → MXN → MLM
    CO → COP → MCO
    CL → CLP → MLC
    PE → PEN → MPE
    UY → UYU → MLU
  US / UK / Eurozone → Stripe Checkout Embedded (in-site):
    US → USD
    UK → GBP
    Eurozone → EUR
→ Payment Service (@fisamtech/payments)
→ payment OK (webhook)
→ Calendar unlock
```

## Constraint

Mercado Pago Checkout Transparente is officially available for **AR, BR, CL, CO, MX, PE, UY only**.  
**Never** route US or Europe to Mercado Pago.

## Hypothesis LATAM Discovery prices

Editable in `packages/payments/src/config/index.ts` → `PRICES.technical_discovery`.

| Currency | Amount (minor units) | Note |
|---|---|---|
| USD | 9900 | TEST |
| EUR | 9900 | TEST |
| GBP | 8900 | TEST |
| BRL | 499000 | BR entry aligned |
| ARS | 12000000 | HYPOTHESIS |
| MXN | 199000 | HYPOTHESIS |
| COP | 45000000 | HYPOTHESIS |
| CLP | 9900000 | HYPOTHESIS |
| PEN | 39900 | HYPOTHESIS |
| UYU | 420000 | HYPOTHESIS |

**TODO (founder):** replace LATAM hypothesis amounts after market validation. Do not FX-convert from BRL.

## Package path

`packages/payments` → workspace name `@fisamtech/payments`
