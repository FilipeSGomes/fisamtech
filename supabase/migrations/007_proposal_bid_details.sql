-- Optional bidding / termo de referência text stored with the commercial proposal.
-- The same object is copied into proposal_versions.snapshot by the application.
alter table proposals
  add column if not exists bid_details jsonb;

update proposals
  set bid_details = '{}'::jsonb
  where bid_details is null;

alter table proposals
  alter column bid_details set default '{}'::jsonb;

alter table proposals
  alter column bid_details set not null;
