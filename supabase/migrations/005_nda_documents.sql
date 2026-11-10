-- Unilateral NDA documents generated from Super Admin

create table if not exists nda_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number_year integer not null,
  number_seq integer not null,
  number_display text not null unique,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ISSUED', 'SIGNED', 'CANCELLED')),
  company_id uuid references companies (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  opportunity_id uuid references opportunities (id) on delete set null,
  client_legal_name text not null,
  client_tax_id text,
  client_address text,
  client_rep_name text not null,
  client_rep_title text,
  project_name text not null,
  signed_city text not null default 'Embu Guaçu - SP',
  signed_on date not null default (timezone('America/Sao_Paulo', now()))::date,
  storage_key text,
  pdf_bytes bytea,
  content_type text not null default 'application/pdf',
  byte_size integer,
  checksum_sha256 text,
  created_by uuid references admin_users (id) on delete set null,
  unique (number_year, number_seq)
);

create index if not exists nda_documents_created_at_idx on nda_documents (created_at desc);
create index if not exists nda_documents_company_id_idx on nda_documents (company_id);
create index if not exists nda_documents_status_idx on nda_documents (status);

create table if not exists nda_number_counters (
  year integer primary key,
  last_value integer not null default 0
);

insert into admin_permissions (code, description) values
  ('ndas:read', 'Ver NDAs'),
  ('ndas:create', 'Gerar NDAs'),
  ('ndas:update', 'Atualizar NDAs')
on conflict (code) do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
cross join admin_permissions p
where r.code = 'SUPER_ADMIN'
  and p.code in ('ndas:read', 'ndas:create', 'ndas:update')
on conflict do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in ('ndas:read', 'ndas:create', 'ndas:update')
where r.code in ('ADMIN', 'SALES')
on conflict do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code = 'ndas:read'
where r.code in ('FINANCE', 'VIEWER')
on conflict do nothing;

drop trigger if exists nda_documents_updated_at on nda_documents;
create trigger nda_documents_updated_at before update on nda_documents
  for each row execute function set_updated_at();
