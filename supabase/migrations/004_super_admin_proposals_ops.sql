-- FISAM TECH SUPER ADMIN — proposals ops + send tracking (additive)

create table if not exists proposal_sends (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  proposal_id uuid not null references proposals (id) on delete cascade,
  version integer not null,
  to_email text not null,
  subject text not null,
  status text not null
    check (status in ('sent', 'pending_config', 'failed')),
  provider text not null default 'resend',
  provider_message_id text,
  error_reason text,
  sent_by uuid references admin_users (id) on delete set null,
  document_id uuid references proposal_documents (id) on delete set null
);

create index if not exists proposal_sends_proposal_id_idx
  on proposal_sends (proposal_id, created_at desc);

-- Optional PDF bytes for environments without durable filesystem (Vercel).
-- Prefer filesystem storage_key when available; bytes used as fallback.
alter table proposal_documents
  add column if not exists pdf_bytes bytea;

create index if not exists contacts_name_idx on contacts (name);
create index if not exists opportunities_lead_id_idx on opportunities (lead_id);
create index if not exists opportunities_stage_idx on opportunities (stage);

-- Invite accept helper index
create index if not exists admin_invites_email_idx on admin_invites (email_normalized);
