# Visual refresh — 14 October 2026

## Direction
Premium B2B technology identity using the official FISAM TECH logo, navy surfaces, champagne-gold accents, restrained architecture diagrams and generous editorial spacing.

## Changes
- Brand-led dark header, larger official logo and responsive navigation.
- Homepage headline as the single H1, clear technical offer and existing CTA routes.
- Conceptual architecture illustration; not a live dashboard or fabricated performance metric.
- Service-card hierarchy, a structured delivery process, founder presentation and cleaner footer.
- Updated hero and illustration translations across all six supported locales.
- Removed internal hosting note from the public footer.
- Retained payment APIs, provider routing, qualification forms and region/currency behavior.
- Reduced-motion support and responsive layouts.

## Verification
- Production build: passed (113 generated pages).
- Existing Vitest suite: 4 tests passed.
- Browser smoke: six locale homepages return HTTP 200, one H1, no desktop horizontal overflow or JavaScript page errors.
- Primary PT-BR CTA navigates to the visible qualification form.
- Responsive widths checked: 320, 390, 768, 1024 and 1440 px.
- Mobile navigation opens and closes with Escape.
- Founder photo loads when scrolled into view; mobile region selector opens and closes.
- git diff --check: passed.

## Preview
http://localhost:3100/pt-br

Local project changes only. No deployment, DNS change or public-site update performed.

## Typography and interactive architecture follow-up
- Oxanium for headings, IBM Plex Sans for readable body copy, IBM Plex Mono for technical annotations.
- Eight unchanged WOFF2 Latin/Latin Extended subsets and three original font licenses stored in public/fonts.
- Application, API/integration, data and operations nodes reveal localized descriptions on hover, focus or tap.
- Active connections and nodes highlight; Escape restores the introductory hint. Buttons expose pressed state and a live description panel.
- Final production build passed after the interactive change.
- Browser verification: all four hover descriptions, keyboard focus/Escape, mobile touch on Data, all six languages at 320/390/768/1440 px; no overflow or page errors.
- Font families loaded successfully with zero external Google Fonts requests.
