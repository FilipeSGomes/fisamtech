-- Service contracts generated from Super Admin (from proposal or manual items)

create table if not exists service_contracts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number_year integer not null,
  number_seq integer not null,
  number_display text not null unique,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ISSUED', 'SIGNED', 'CANCELLED')),
  proposal_id uuid references proposals (id) on delete set null,
  company_id uuid references companies (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  opportunity_id uuid references opportunities (id) on delete set null,
  client_legal_name text not null,
  client_tax_id text,
  client_address text,
  client_rep_name text not null,
  client_rep_title text,
  project_name text not null,
  currency text not null default 'BRL',
  payment_terms text not null default '50% na assinatura e 50% na entrega/aceite',
  term_months integer not null default 12,
  start_on date,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  signed_city text not null default 'Embu Guaçu - SP',
  signed_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  notes text,
  storage_key text,
  pdf_bytes bytea,
  content_type text not null default 'application/pdf',
  byte_size integer,
  checksum_sha256 text,
  created_by uuid references admin_users (id) on delete set null,
  unique (number_year, number_seq)
);

create index if not exists service_contracts_created_at_idx on service_contracts (created_at desc);
create index if not exists service_contracts_company_id_idx on service_contracts (company_id);
create index if not exists service_contracts_proposal_id_idx on service_contracts (proposal_id);
create index if not exists service_contracts_status_idx on service_contracts (status);

create table if not exists service_contract_number_counters (
  year integer primary key,
  last_value integer not null default 0
);

insert into admin_permissions (code, description) values
  ('contracts:read', 'Ver contratos de prestação de serviços'),
  ('contracts:create', 'Gerar contratos de prestação de serviços'),
  ('contracts:update', 'Atualizar contratos de prestação de serviços')
on conflict (code) do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
cross join admin_permissions p
where r.code = 'SUPER_ADMIN'
  and p.code in ('contracts:read', 'contracts:create', 'contracts:update')
on conflict do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in ('contracts:read', 'contracts:create', 'contracts:update')
where r.code in ('ADMIN', 'SALES')
on conflict do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code = 'contracts:read'
where r.code in ('FINANCE', 'VIEWER')
on conflict do nothing;

drop trigger if exists service_contracts_updated_at on service_contracts;
create trigger service_contracts_updated_at before update on service_contracts
  for each row execute function set_updated_at();
