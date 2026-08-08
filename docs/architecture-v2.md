# Architecture V2

## Modules
- Authentication / RBAC: Supabase Auth + profiles.role
- Media: metadata, private files, versions
- Workflow: 9-state, two-stage state machine in `src/constants/workflow.ts`
- Review: assignments, plain-language review topics, comments, decisions
- AI Screening: Typhoon server route only; no state transition permission
- Library: only APPROVED media is public/searchable
- Audit: immutable event-oriented `audit_logs`
- QA Analytics: submissions, turnaround time, approval rate, reuse/download events

## Trust boundaries
Browser input is untrusted. Role/owner/assignee must be resolved server-side. Typhoon API key and Supabase service role are server-only. Uploaded document text is also untrusted AI input and is wrapped as document data; prompt injection inside documents must never become an instruction.

## Workflow
DRAFT -> PENDING -> IN_REVIEW -> ACADEMIC_REVIEW -> APPROVED
                         |                 -> ACADEMIC_REVISION -> ACADEMIC_REVIEW
                         -> REVISION -> PENDING (new version)
                         -> REJECTED
APPROVED -> ARCHIVED -> PENDING (new version)
