-- FISAM TECH SUPER ADMIN — foundation (additive, non-destructive)
-- Apply after 001_initial.sql and 002_whistleblowing.sql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- IAM
-- ---------------------------------------------------------------------------

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null,
  email_normalized text not null,
  name text not null,
  password_hash text not null,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'invited')),
  mfa_secret text,
  mfa_enabled boolean not null default false,
  mfa_enrolled_at timestamptz,
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  created_by uuid references admin_users (id) on delete set null,
  unique (email_normalized)
);

create table if not exists admin_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default ''
);

create table if not exists admin_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default ''
);

create table if not exists admin_role_permissions (
  role_id uuid not null references admin_roles (id) on delete cascade,
  permission_id uuid not null references admin_permissions (id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists admin_user_roles (
  user_id uuid not null references admin_users (id) on delete cascade,
  role_id uuid not null references admin_roles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references admin_users (id) on delete set null,
  primary key (user_id, role_id)
);

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references admin_users (id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip text,
  user_agent text,
  mfa_verified_at timestamptz
);

create index if not exists admin_sessions_user_id_idx on admin_sessions (user_id);
create index if not exists admin_sessions_expires_at_idx on admin_sessions (expires_at);

create table if not exists admin_invites (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  role_codes text[] not null default '{}',
  token_hash text not null unique,
  invited_by uuid references admin_users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz
);

create table if not exists admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references admin_users (id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  result text not null default 'success'
    check (result in ('success', 'failure', 'denied')),
  correlation_id text,
  ip text,
  user_agent text,
  context jsonb not null default '{}'::jsonb
);

create index if not exists admin_audit_logs_created_at_idx
  on admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_idx
  on admin_audit_logs (actor_user_id);
create index if not exists admin_audit_logs_action_idx
  on admin_audit_logs (action);

-- ---------------------------------------------------------------------------
-- CRM entities
-- ---------------------------------------------------------------------------

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  legal_name text not null,
  trade_name text,
  tax_id text,
  tax_id_normalized text,
  country text,
  website text,
  notes text,
  created_by uuid references admin_users (id) on delete set null,
  unique (tax_id_normalized)
);

create index if not exists companies_legal_name_idx on companies (legal_name);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid references companies (id) on delete set null,
  name text not null,
  email text,
  email_normalized text,
  phone text,
  phone_normalized text,
  role_title text,
  notes text,
  created_by uuid references admin_users (id) on delete set null
);

create index if not exists contacts_email_normalized_idx on contacts (email_normalized);
create index if not exists contacts_company_id_idx on contacts (company_id);

-- Extend leads (additive)
alter table leads add column if not exists status text;
alter table leads add column if not exists owner_id uuid references admin_users (id) on delete set null;
alter table leads add column if not exists company_id uuid references companies (id) on delete set null;
alter table leads add column if not exists contact_id uuid references contacts (id) on delete set null;
alter table leads add column if not exists email_normalized text;
alter table leads add column if not exists phone_normalized text;
alter table leads add column if not exists next_action_at timestamptz;
alter table leads add column if not exists next_action_note text;
alter table leads add column if not exists lost_reason text;
alter table leads add column if not exists lost_notes text;
alter table leads add column if not exists utm jsonb not null default '{}'::jsonb;
alter table leads add column if not exists service_interest text;

update leads set status = 'NEW' where status is null;
update leads set email_normalized = lower(trim(email))
  where email_normalized is null and email is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_status_check'
  ) then
    alter table leads
      add constraint leads_status_check
      check (status in (
        'NEW','CONTACTED','QUALIFIED','DIAGNOSIS','PROPOSAL',
        'NEGOTIATION','WON','LOST'
      ));
  end if;
end $$;

alter table leads alter column status set default 'NEW';
alter table leads alter column status set not null;

create index if not exists leads_status_idx on leads (status);
create index if not exists leads_owner_id_idx on leads (owner_id);
create index if not exists leads_email_normalized_idx on leads (email_normalized);
create index if not exists leads_company_id_idx on leads (company_id);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company_id uuid references companies (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  lead_id uuid references leads (id) on delete set null,
  owner_id uuid references admin_users (id) on delete set null,
  title text not null,
  service text,
  description text,
  estimated_value numeric(14,2),
  currency text not null default 'BRL',
  stage text not null default 'QUALIFICATION'
    check (stage in (
      'QUALIFICATION','DISCOVERY','PROPOSAL','NEGOTIATION','WON','LOST'
    )),
  probability integer not null default 10
    check (probability >= 0 and probability <= 100),
  expected_close_date date,
  source text,
  next_action_at timestamptz,
  next_action_note text,
  status text not null default 'OPEN'
    check (status in ('OPEN','WON','LOST','CANCELLED')),
  lost_reason text,
  created_by uuid references admin_users (id) on delete set null
);

create index if not exists opportunities_status_idx on opportunities (status);
create index if not exists opportunities_owner_id_idx on opportunities (owner_id);
create index if not exists opportunities_company_id_idx on opportunities (company_id);

create table if not exists crm_activities (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_user_id uuid references admin_users (id) on delete set null,
  lead_id uuid references leads (id) on delete cascade,
  opportunity_id uuid references opportunities (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  activity_type text not null
    check (activity_type in (
      'NOTE','CALL','EMAIL','MEETING','TASK','STATUS_CHANGE','SYSTEM'
    )),
  subject text,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists crm_activities_lead_id_idx on crm_activities (lead_id);
create index if not exists crm_activities_opportunity_id_idx on crm_activities (opportunity_id);
create index if not exists crm_activities_created_at_idx on crm_activities (created_at desc);

-- ---------------------------------------------------------------------------
-- Proposals
-- ---------------------------------------------------------------------------

create table if not exists proposal_templates (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  code text not null unique,
  name text not null,
  description text,
  default_sections jsonb not null default '[]'::jsonb,
  active boolean not null default true
);

create table if not exists proposal_number_counters (
  year integer primary key,
  last_value integer not null default 0
);

create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  number_year integer not null,
  number_seq integer not null,
  number_display text not null unique,
  current_version integer not null default 1,
  status text not null default 'DRAFT'
    check (status in (
      'DRAFT','IN_REVIEW','APPROVED','SENT','VIEWED',
      'ACCEPTED','REJECTED','EXPIRED','CANCELLED'
    )),
  opportunity_id uuid references opportunities (id) on delete set null,
  company_id uuid references companies (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  owner_id uuid references admin_users (id) on delete set null,
  template_id uuid references proposal_templates (id) on delete set null,
  title text not null,
  currency text not null default 'BRL',
  valid_until date,
  created_by uuid references admin_users (id) on delete set null,
  unique (number_year, number_seq)
);

create index if not exists proposals_status_idx on proposals (status);
create index if not exists proposals_owner_id_idx on proposals (owner_id);

create table if not exists proposal_versions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references proposals (id) on delete cascade,
  version integer not null,
  status_at_issue text not null,
  issued_at timestamptz,
  issued_by uuid references admin_users (id) on delete set null,
  snapshot jsonb not null,
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  immutable boolean not null default false,
  unique (proposal_id, version)
);

create table if not exists proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals (id) on delete cascade,
  version integer not null,
  position integer not null default 0,
  description text not null,
  quantity numeric(14,3) not null default 1,
  unit text not null default 'un',
  unit_price numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0
);

create index if not exists proposal_items_proposal_version_idx
  on proposal_items (proposal_id, version);

create table if not exists proposal_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references proposals (id) on delete cascade,
  version integer not null,
  storage_key text not null,
  content_type text not null default 'application/pdf',
  byte_size integer,
  checksum_sha256 text,
  created_by uuid references admin_users (id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Seed roles / permissions / templates
-- ---------------------------------------------------------------------------

insert into admin_roles (code, name, description) values
  ('SUPER_ADMIN', 'Super Admin', 'Controle total da administração'),
  ('ADMIN', 'Admin', 'Administração operacional autorizada'),
  ('SALES', 'Comercial', 'Leads, oportunidades e propostas'),
  ('FINANCE', 'Financeiro', 'Visualização comercial e financeira'),
  ('VIEWER', 'Viewer', 'Consulta somente leitura')
on conflict (code) do nothing;

insert into admin_permissions (code, description) values
  ('dashboard:read', 'Ver dashboard'),
  ('leads:read', 'Listar/ver leads'),
  ('leads:create', 'Criar leads'),
  ('leads:update', 'Atualizar leads'),
  ('leads:delete', 'Excluir leads'),
  ('leads:export', 'Exportar leads'),
  ('companies:read', 'Ver empresas'),
  ('companies:create', 'Criar empresas'),
  ('companies:update', 'Atualizar empresas'),
  ('contacts:read', 'Ver contatos'),
  ('contacts:create', 'Criar contatos'),
  ('contacts:update', 'Atualizar contatos'),
  ('opportunities:read', 'Ver oportunidades'),
  ('opportunities:create', 'Criar oportunidades'),
  ('opportunities:update', 'Atualizar oportunidades'),
  ('proposals:read', 'Ver propostas'),
  ('proposals:create', 'Criar propostas'),
  ('proposals:update', 'Atualizar propostas'),
  ('proposals:approve', 'Aprovar propostas'),
  ('proposals:send', 'Enviar propostas'),
  ('proposals:export', 'Exportar propostas'),
  ('users:read', 'Ver usuários'),
  ('users:invite', 'Convidar usuários'),
  ('users:update', 'Atualizar usuários'),
  ('users:disable', 'Desativar usuários'),
  ('roles:manage', 'Gerenciar papéis'),
  ('audit:read', 'Ver auditoria'),
  ('settings:manage', 'Gerenciar configurações')
on conflict (code) do nothing;

-- SUPER_ADMIN: all permissions
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
cross join admin_permissions p
where r.code = 'SUPER_ADMIN'
on conflict do nothing;

-- ADMIN: all except roles:manage (still has users)
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code not in ('roles:manage')
where r.code = 'ADMIN'
on conflict do nothing;

-- SALES
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in (
  'dashboard:read',
  'leads:read','leads:create','leads:update','leads:export',
  'companies:read','companies:create','companies:update',
  'contacts:read','contacts:create','contacts:update',
  'opportunities:read','opportunities:create','opportunities:update',
  'proposals:read','proposals:create','proposals:update','proposals:send'
)
where r.code = 'SALES'
on conflict do nothing;

-- FINANCE
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in (
  'dashboard:read',
  'leads:read','leads:export',
  'companies:read','contacts:read',
  'opportunities:read',
  'proposals:read','proposals:export',
  'audit:read'
)
where r.code = 'FINANCE'
on conflict do nothing;

-- VIEWER
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in (
  'dashboard:read',
  'leads:read','companies:read','contacts:read',
  'opportunities:read','proposals:read'
)
where r.code = 'VIEWER'
on conflict do nothing;

insert into proposal_templates (code, name, description, default_sections) values
  ('diagnosis', 'Diagnóstico e consultoria técnica', 'Template para discovery/consultoria', '[]'::jsonb),
  ('software', 'Desenvolvimento de software', 'Template de software', '[]'::jsonb),
  ('architecture', 'Arquitetura e modernização', 'Template de arquitetura', '[]'::jsonb),
  ('integration', 'Integração de sistemas', 'Template de integrações', '[]'::jsonb),
  ('support', 'Sustentação e suporte', 'Template de suporte', '[]'::jsonb),
  ('custom', 'Projeto personalizado', 'Template livre', '[]'::jsonb)
on conflict (code) do nothing;

-- updated_at triggers
drop trigger if exists admin_users_updated_at on admin_users;
create trigger admin_users_updated_at before update on admin_users
  for each row execute function set_updated_at();

drop trigger if exists companies_updated_at on companies;
create trigger companies_updated_at before update on companies
  for each row execute function set_updated_at();

drop trigger if exists contacts_updated_at on contacts;
create trigger contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

drop trigger if exists opportunities_updated_at on opportunities;
create trigger opportunities_updated_at before update on opportunities
  for each row execute function set_updated_at();

drop trigger if exists proposals_updated_at on proposals;
create trigger proposals_updated_at before update on proposals
  for each row execute function set_updated_at();
