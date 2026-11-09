-- Whistleblowing / Canal de Denúncias
-- Apply after 001_initial.sql (Supabase SQL editor or migration tooling).

create table if not exists whistleblowing_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  protocol text not null unique,
  category text not null,
  description text not null,
  approximate_date text,
  relation text not null,
  anonymous boolean not null default true,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  locale text not null default 'pt-br',
  status text not null default 'received'
    check (status in ('received', 'reviewing', 'closed')),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists whistleblowing_reports_created_at_idx
  on whistleblowing_reports (created_at desc);

create index if not exists whistleblowing_reports_category_idx
  on whistleblowing_reports (category);

create index if not exists whistleblowing_reports_status_idx
  on whistleblowing_reports (status);
