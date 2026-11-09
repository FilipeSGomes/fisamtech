# Compliance & pending checklist

**Do not claim GDPR / UK GDPR / ePrivacy certification until legal review.**

## Ready in code (structure)

- [x] Privacy / terms / cookies pages per locale
- [x] Cookie banner: necessary vs optional analytics
- [x] Payment processors called out (Stripe, Mercado Pago)
- [x] Honest founder vs client framing
- [x] No invented testimonials/metrics
- [x] **Programa de Compliance / Integridade** — page `/[locale]/compliance` (i18n en, pt-br, pt-pt, es, fr, de); footer link; sitemap
- [x] **Código de Ética e Conduta** — conteúdo público + exportável em `docs/CODIGO_ETICA_FISAM_TECH.md` (vigência 09/11/2026; Compliance Officer: Filipe Godinho Gomes)
- [x] **Canal de Denúncias** — page `/[locale]/denuncia` + `WhistleblowingForm` + `POST /api/denuncia` + email template `whistleblowing_alert`
- [x] Migration `supabase/migrations/002_whistleblowing.sql` (`whistleblowing_reports`) with DB degrade fallback (mesmo padrão de leads)
- [x] Política anticorrupção, conflito de interesses, setor público/licitações, brindes/hospitalidade, LGPD (link `/privacy`), não-retaliação

## Pending (founder / counsel)

- [ ] Legal review of privacy + terms for EU/UK/US/LATAM
- [ ] Legal review / assinatura formal do Código de Ética FISAM TECH (PDF assinado, se exigido pelo Due Diligence)
- [ ] Aplicar migration `002_whistleblowing.sql` no Supabase de produção
- [ ] Refund policy for Technical Discovery
- [ ] International jurisdiction clause
- [ ] DPA / subprocessors list
- [ ] Live Stripe keys + webhook endpoints
- [ ] Per-country Mercado Pago credentials (BR first; AR/MX/CO/CL/PE/UY)
- [ ] Supabase project + run `supabase/migrations/001_initial.sql`
- [ ] Resend domain verification (necessário para e-mail real de alerta de denúncias)
- [ ] DNS cutover Pages → Vercel (explicit authorization required)
- [ ] Replace LATAM Discovery price hypotheses after validation
- [ ] Processo interno de triagem/SLA do Canal de Denúncias (prazo de resposta, registro de apuração)

## Due Diligence — Companhia Águas de Joinville (evidências no site)

Para declarar **Sim** a programa de compliance/integridade e canal de denúncias:

| Evidência | URL / artefato |
| --- | --- |
| Programa / Código de Ética | `https://fisamtech.com/pt-br/compliance` |
| Canal de Denúncias | `https://fisamtech.com/pt-br/denuncia` |
| Markdown anexável | `docs/CODIGO_ETICA_FISAM_TECH.md` |
| Privacidade / LGPD | `https://fisamtech.com/pt-br/privacy` |

## Tracking plan (analytics events)

`page_view`, `cta_clicked`, `locale_changed`, `currency_changed`, `qualification_started`, `qualification_submitted`, `checkout_started`, `checkout_redirected`, `payment_success`, `payment_pending`, `payment_failed`, `booking_unlocked`, `booking_opened`, `partners_started`, `partners_submitted`, `cookie_accepted`, `cookie_rejected`
