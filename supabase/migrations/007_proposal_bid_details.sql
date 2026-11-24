-- Optional bidding / termo de referência text stored with the commercial proposal.
-- The same object is copied into proposal_versions.snapshot by the application.
alter table proposals
  add column if not exists bid_details jsonb not null default '{}'::jsonb;
