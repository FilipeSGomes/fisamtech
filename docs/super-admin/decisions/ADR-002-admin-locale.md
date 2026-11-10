# ADR-002 — Super Admin em português (pt-BR) com prefixo de locale

## Status

Accepted — 2026-11-10

## Context

O site usa `localePrefix: always`. Expor `/super-admin` sem locale quebraria o middleware intl.

## Decision

- Rotas em `/[locale]/super-admin/**`.
- Copy e labels do módulo **somente em pt-BR** na v1.
- Redirecionar `/en/super-admin` (e demais) → `/pt-br/super-admin` para evitar seis traduções do backoffice.

## Consequences

- Um único conjunto de strings; menor custo.
- Usuário internacional da equipe usa o painel em português.
