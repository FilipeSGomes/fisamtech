# Super Admin — Data Model

## Existing (preserved)

- `leads`, `payments`, `bookings`, `events`, `whistleblowing_reports`

## IAM

- `admin_users`, `admin_roles`, `admin_permissions`, `admin_role_permissions`
- `admin_user_roles`, `admin_sessions`, `admin_invites`, `admin_audit_logs`

## CRM

- `companies`, `contacts`
- `leads` extended: `status`, `owner_id`, `company_id`, `contact_id`, normalized email/phone, next action, lost reason, UTM, service interest
- `opportunities`, `crm_activities`

## Proposals

- `proposal_templates`, `proposal_number_counters`
- `proposals` (display `FISAM-YYYY-NNNN`, version, workflow status)
- `proposal_versions` (snapshot + totals; immutable after PDF issue)
- `proposal_items` (per version; line totals in cents math)
- `proposal_documents` (`storage_key`, optional `pdf_bytes`)
- `proposal_sends` (sent / pending_config / failed)

## Migrations

1. `001_initial.sql`
2. `002_whistleblowing.sql`
3. `003_super_admin_foundation.sql`
4. `004_super_admin_proposals_ops.sql`
