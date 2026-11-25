-- Generic electronically signed documents (MFA step-up + public authenticity lookup)

create table if not exists signed_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  original_filename text not null,
  content_type text not null default 'application/pdf',
  pdf_bytes bytea not null,
  checksum_sha256 text not null,
  authenticity_code text not null,
  signer_user_id uuid not null references admin_users(id),
  signer_name text not null,
  signer_email text not null,
  signed_at timestamptz not null,
  mfa_step_up_at timestamptz not null,
  certificate_bytes bytea not null,
  created_at timestamptz not null default now(),
  constraint signed_documents_authenticity_code_len
    check (char_length(authenticity_code) = 16)
);

create unique index if not exists signed_documents_authenticity_code_uidx
  on signed_documents (authenticity_code);

create index if not exists signed_documents_signer_user_id_idx
  on signed_documents (signer_user_id);

create index if not exists signed_documents_created_at_idx
  on signed_documents (created_at desc);

insert into admin_permissions (code, description) values
  ('documents:sign', 'Assinar documentos eletronicamente'),
  ('documents:read', 'Listar e baixar documentos assinados')
on conflict (code) do nothing;

-- SUPER_ADMIN already gets all via cross join; refresh for new codes
insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
cross join admin_permissions p
where r.code = 'SUPER_ADMIN'
  and p.code in ('documents:sign', 'documents:read')
on conflict do nothing;

insert into admin_role_permissions (role_id, permission_id)
select r.id, p.id
from admin_roles r
join admin_permissions p on p.code in ('documents:sign', 'documents:read')
where r.code = 'ADMIN'
on conflict do nothing;
