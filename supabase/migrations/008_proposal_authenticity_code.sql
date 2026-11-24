-- Persist proposal PDF electronic-signature authenticity metadata for public validation.

alter table proposal_documents
  add column if not exists authenticity_code text,
  add column if not exists signer_name text,
  add column if not exists signer_email text,
  add column if not exists signed_at timestamptz;

create unique index if not exists proposal_documents_authenticity_code_uidx
  on proposal_documents (authenticity_code)
  where authenticity_code is not null;

create index if not exists proposal_documents_authenticity_code_idx
  on proposal_documents (authenticity_code);
