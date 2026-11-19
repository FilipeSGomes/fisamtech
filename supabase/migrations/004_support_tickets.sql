-- Central de atendimento — chamados de suporte (portal público /chamados)

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  status text not null default 'open',
  priority text not null,
  subject text not null,
  description text not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text not null,
  company_name text,
  company_cnpj text,
  locale text not null default 'pt-br',
  status_history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_ticket_number_idx
  on support_tickets (ticket_number);

create index if not exists support_tickets_requester_email_idx
  on support_tickets (lower(requester_email));

create index if not exists support_tickets_created_at_idx
  on support_tickets (created_at desc);

create index if not exists support_tickets_status_idx
  on support_tickets (status);