# PIKA — Auditoria do site atual (fisamtech.com)

**Data:** 2026-10-01  
**Fonte:** repositório local + produção `https://fisamtech.com`  
**Stack atual:** HTML estático + CSS + JS vanilla · GitHub Pages (`CNAME: fisamtech.com`)

---

## 1. Mapa de páginas

| URL pública | Arquivo | Idioma | Função |
|---|---|---|---|
| `/` | `index.html` | pt-BR | Landing comercial Brasil |
| `/cases.html` | `cases.html` | pt-BR | Cases + experiência do fundador |
| `/parceiros/` | `parceiros/index.html` | pt-BR | Programa de parceria / MVP |
| `/privacidade.html` | `privacidade.html` | pt-BR | Política LGPD (resumo) |
| `/termos.html` | `termos.html` | pt-BR | Termos de uso (resumo) |
| `/robots.txt` | `robots.txt` | — | Allow all + sitemap |
| `/sitemap.xml` | `sitemap.xml` | — | 5 URLs |

**Não existem:** páginas de serviço isoladas, checkout, qualificação, i18n, cookie policy dedicada, FAQ page, blog.

---

## 2. Componentes / seções (homepage)

1. Header sticky (brand + nav + WhatsApp CTA)
2. Hero (`#inicio`) — proposta de valor + 2 CTAs
3. Processo / credenciais / metodologia / capabilities (`#processo`, `#servicos`)
4. Clientes e produtos (`#clientes`)
5. Fundador + planos de preço (`#fundador`, `#planos`)
6. CTA final / booking (`#contato`)
7. Footer (empresa, links, contato)
8. Cookie banner (accept-only)

---

## 3. CTAs mapeados

| Local | Texto | Destino | Tipo |
|---|---|---|---|
| Hero primary | Agendar diagnóstico gratuito | `calendar.app.google/Gzv4jkEqaAniaBKr5` | Calendar (livre) |
| Hero secondary | Conversar pelo WhatsApp | `wa.me/5511979562271` | WhatsApp |
| Nav | WhatsApp | mesmo | WhatsApp |
| Contato | Escolher horário → | Google Calendar | Calendar (livre) |
| Cases CTA | Agendar diagnóstico → | Google Calendar | Calendar (livre) |
| Footer / mailto | contato@fisamtech.com | email | Email |

**Problema comercial internacional:** CTA principal = “gratuito” + Calendar aberto sem qualificação nem pagamento.

---

## 4. Formulários

| Form | Página | Campos | Destino |
|---|---|---|---|
| Cookie accept | todas | — | `localStorage` |
| Partners | `/parceiros/` | nome, whatsapp, ideia, problema, estágio | WhatsApp pré-preenchido |
| Contact form | previsto em `main.js` (`.contact-form`) | nome, whatsapp, mensagem | Formspree-like fetch + fallback WA |

**Homepage atual não renderiza `.contact-form`.** Contato é só Calendar + WhatsApp + email.

---

## 5. Links externos críticos

- Google Calendar Appointment: `https://calendar.app.google/Gzv4jkEqaAniaBKr5`
- WhatsApp: `+55 11 97956-2271`
- Email: `contato@fisamtech.com`
- Produtos: `quote.fisamtech.com`, `kontrolla.app`, `fnrh.fisamtech.com`, `fintrack.fisamtech.com`, `fisamtour.com`, `ponto.fisamtour.com`

---

## 6. Integrações

| Sistema | Status |
|---|---|
| Google Calendar | Link externo (sem gate) |
| WhatsApp Business | Link direto |
| Mercado Pago | **Ausente** |
| Stripe | **Ausente** |
| CRM | **Ausente** |
| Email transacional | **Ausente** |
| Form backend | Código preparado; form não está na home |
| Analytics (GA/GTM/Plausible) | **Ausente** |
| Consent CMP (GDPR) | Banner simples LGPD only |

---

## 7. SEO atual

**Presente**
- `<title>`, meta description, keywords (home)
- Canonical em home e cases
- Open Graph (title, description, type, url, image)
- JSON-LD `ProfessionalService` (home) e `WebPage` (cases)
- `robots.txt` + `sitemap.xml`
- Imagens WebP otimizadas para perfil/fundador

**Ausente / frágil**
- Sem hreflang
- Sem Twitter/X cards
- Sem FAQ schema
- Sem Service schema por oferta
- Sitemap só 5 URLs; sem lastmod dinâmico
- Keywords meta pouco impacto
- `areaServed: Brasil` no schema
- Sem páginas de intenção comercial (`/software-architecture`, etc.)
- Legal pages sem canonical/OG

---

## 8. Analytics / tracking

Nenhum script de analytics. Nenhum event tracking. Cookie banner não diferencia necessários vs marketing.

---

## 9. Checkout / calendário

- Sem checkout.
- Calendário público sem pagamento prévio.
- Sem timezone awareness no site (assume Brasil).
- Sem briefing pré-call.

---

## 10. Imagens

| Asset | Uso | Nota |
|---|---|---|
| `perfil-small.png` | logo header/footer | OK |
| `perfil-512.webp` | OG / schema | OK |
| `filipefundador.webp/.png` | seção fundador | PNG fonte ~1.8MB (webp OK) |
| `PERFIL.png` | legal pages | ~1.8MB — não otimizado |
| `logo-fundo.webp` | possível bg | presente |
| Stock / product shots | — | **Ausentes** (copy-first, bom) |

---

## 11. Cases / prova social

**Clientes FISAM TECH (declarados):** SigaBR, 637 Tennis Club  
**Produtos próprios:** Kontrolla, FNRH, FinTrack, FISAM Tour, Ponto, FISAM Quote  
**Experiência prévia do fundador (explicitamente marcada):** Bradesco, B3, Itaú, Banco Next, Capgemini Engineering, Gerdau  

**Framing atual está correto** — não apresenta banks como clientes da empresa. Manter e reforçar no internacional.

**Gaps:** formato Problem → Outcome incompleto; métricas qualitativas apenas (aceitável); cases BR-centric (DETRAN, tennis) precisam de framing transferível.

---

## 12. Textos / posicionamento

- Tom: técnico, sóbrio, Apple-like (DESIGN.md)
- Foco: sistemas críticos, diagnóstico primeiro
- Preços BR em BRL: 4.990 / 9.990 / 14.990 / sob consulta
- Mercado declarado: Brasil / São Paulo
- README desatualizado (ainda fala em PME + WhatsApp/planilhas)

---

## 13. Políticas legais

| Doc | Escopo | Lacunas |
|---|---|---|
| Privacidade | LGPD resumida | Sem base legal detalhada, retenção, subprocessadores, DPA, GDPR rights |
| Termos | BR, foro Embu-Guaçu | Sem refund, discovery session, payment terms, intl jurisdiction |
| Cookies | 1 parágrafo | Sem categorias, sem opt-in marketing, sem CMP |

**Não afirmar conformidade GDPR/UK GDPR/ePrivacy sem revisão jurídica.**

---

## 14. Design system

- Cores Apple-inspired: ink `#1d1d1f`, action `#0066cc`, canvas `#f5f5f7`
- Tipografia: SF Pro Display/Text (fallback system)
- Reveal animations + prefers-reduced-motion
- Mobile-aware CSS presente

---

## 15. Testes existentes

`main.test.js` — unit tests para reveal, partners form, WhatsApp builders. Sem E2E, sem a11y automatizado, sem Lighthouse CI.

---

## 16. Problemas encontrados (priorizados)

### P0 — Bloqueiam operação internacional
1. Site monolíngue pt-BR; zero i18n/hreflang
2. Sem payment layer / Stripe / pricing internacional
3. Calendar aberto (lead não qualificado, sem monetização da discovery)
4. Hosting GitHub Pages — sem server para webhooks
5. Sem qualification form no funil principal
6. Compliance só LGPD; inadequado para US/EU marketing

### P1 — Credibilidade / conversão
7. CTA “gratuito” desalinha com posicionamento high-end
8. Sem seletor idioma/moeda
9. Sem FAQ internacional
10. Sem páginas de serviço com SEO de intenção
11. Schema `areaServed: Brasil` limita percepção
12. Tracking inexistente — impossível otimizar funil
13. Legal pages visualmente inconsistentes (nav antiga)

### P2 — Qualidade / ops
14. README desatualizado
15. Imagens PNG pesadas ainda referenciadas em legal
16. Contact form code dead no JS da home
17. Sem email templates / CRM
18. Sem idempotência de pagamento (N/A hoje)

### P3 — Manutenção
19. Strings hardcoded em HTML
20. Preços hardcoded em HTML
21. Sem config central

---

## 17. O que preservar (não destruir)

- Framing honesto de experiência do fundador vs clientes
- Cases reais (SigaBR, 637, produtos)
- Identidade visual sóbria (enterprise, não “agency”)
- URLs atuais (`/`, `/cases.html`, `/parceiros/`, `/privacidade.html`, `/termos.html`) via redirects
- CNPJ, email, WhatsApp BR para mercado brasileiro
- Cookie consent mínimo (evoluir, não remover)
- Método “diagnóstico antes do código”
