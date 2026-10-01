# Compliance & pending checklist

**Do not claim GDPR / UK GDPR / ePrivacy certification until legal review.**

## Ready in code (structure)

- [x] Privacy / terms / cookies pages per locale
- [x] Cookie banner: necessary vs optional analytics
- [x] Payment processors called out (Stripe, Mercado Pago)
- [x] Honest founder vs client framing
- [x] No invented testimonials/metrics

## Pending (founder / counsel)

- [ ] Legal review of privacy + terms for EU/UK/US/LATAM
- [ ] Refund policy for Technical Discovery
- [ ] International jurisdiction clause
- [ ] DPA / subprocessors list
- [ ] Live Stripe keys + webhook endpoints
- [ ] Per-country Mercado Pago credentials (BR first; AR/MX/CO/CL/PE/UY)
- [ ] Supabase project + run `supabase/migrations/001_initial.sql`
- [ ] Resend domain verification
- [ ] DNS cutover Pages → Vercel (explicit authorization required)
- [ ] Replace LATAM Discovery price hypotheses after validation

## Tracking plan (analytics events)

`page_view`, `cta_clicked`, `locale_changed`, `currency_changed`, `qualification_started`, `qualification_submitted`, `checkout_started`, `checkout_redirected`, `payment_success`, `payment_pending`, `payment_failed`, `booking_unlocked`, `booking_opened`, `partners_started`, `partners_submitted`, `cookie_accepted`, `cookie_rejected`
