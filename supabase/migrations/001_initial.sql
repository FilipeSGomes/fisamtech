-- PIKA v1 schema — Supabase Postgres
-- Run in Supabase SQL editor or via migration tooling.

create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  email text not null,
  company text,
  country text,
  locale text not null default 'en',
  currency text not null default 'USD',
  role text,
  challenge text,
  budget_range text,
  source text not null default 'qualification',
  phone text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists leads_email_idx on leads (email);
create index if not exists leads_created_at_idx on leads (created_at desc);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid references leads (id) on delete set null,
  provider text not null check (provider in ('stripe', 'mercadopago')),
  transaction_id text not null,
  status text not null check (status in ('pending', 'approved', 'failed', 'ignored')),
  amount_cents integer,
  currency text,
  service_id text not null default 'technical_discovery',
  raw jsonb not null default '{}'::jsonb,
  unique (provider, transaction_id)
);

create index if not exists payments_lead_id_idx on payments (lead_id);
create index if not exists payments_status_idx on payments (status);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  lead_id uuid not null references leads (id) on delete cascade,
  payment_id uuid references payments (id) on delete set null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  calendar_url text,
  status text not null default 'unlocked' check (status in ('unlocked', 'used', 'expired', 'revoked'))
);

create index if not exists bookings_lead_id_idx on bookings (lead_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  lead_id uuid references leads (id) on delete set null,
  session_id text,
  locale text,
  path text,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists events_name_idx on events (name);
create index if not exists events_created_at_idx on events (created_at desc);

-- Optional: updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_updated_at on leads;
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();

drop trigger if exists payments_updated_at on payments;
create trigger payments_updated_at before update on payments
  for each row execute function set_updated_at();

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at before update on bookings
  for each row execute function set_updated_at();
