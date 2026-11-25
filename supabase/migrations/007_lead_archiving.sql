-- Preserve leads and CRM history when removing them from active operations.
alter table leads
  add column if not exists archived_at timestamptz;

create index if not exists leads_archived_at_idx on leads (archived_at);
