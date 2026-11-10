# Super Admin — Data Model

## Existing (preserved)

- `leads`, `payments`, `bookings`, `events`, `whistleblowing_reports`

## Added in `003_super_admin_foundation.sql`

### IAM
- `admin_users`, `admin_roles`, `admin_permissions`, `admin_role_permissions`, `admin_user_roles`
- `admin_sessions`, `admin_invites`

### CRM
- Extended `leads` columns
- `companies`, `contacts`
- `opportunities`, `crm_activities`

### Proposals (foundation)
- `proposal_templates`, `proposals`, `proposal_versions`, `proposal_items`, `proposal_documents`
- `proposal_number_seq` (transactional yearly sequence)

### Audit
- `admin_audit_logs` (append-only by app convention)

Financial amounts use `numeric(14,2)`. Timestamps are `timestamptz` (UTC).

See migration file for exact DDL.
