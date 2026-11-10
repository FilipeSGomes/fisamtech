# ADR-003 — Estender tabela `leads` em vez de criar `crm_leads`

## Status

Accepted — 2026-11-10

## Context

Já existe `leads` populada por `/api/leads`. Duplicar criaria sincronização frágil.

## Decision

Estender `leads` com colunas CRM (`status`, `owner_id`, normalizações, `company_id`, etc.) via migration aditiva. Manter contrato público de `POST /api/leads`.

## Consequences

- Histórico preservado.
- Formulários públicos continuam gravando na mesma tabela.
- Status default `NEW` para linhas existentes.
