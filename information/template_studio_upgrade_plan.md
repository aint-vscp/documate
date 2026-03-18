# Template Studio Upgrade Plan

Date: 2026-03-18

## Objectives
- Make template authoring production-grade for legal/business workflows.
- Enforce mandatory on-chain payment before minting.
- Improve trust and auditability around template origin and updates.

## Research Notes
- Tiptap architecture guidance (headless, extension-based) supports modular editor evolution without locking UI.
- Payment lifecycle best practice (create, confirm, track status, avoid double-charge patterns) indicates minting should bind a single creation intent to one payment reference.

## Current Gaps
1. Editor is custom contentEditable without semantic extension model.
2. Payment was previously implicit and not required server-side.
3. No versioning/diff for template revisions.
4. No explicit validation checks for placeholder completeness and conflicting field keys.

## Implemented in This Cycle
1. Mint payment is now mandatory in the studio flow.
2. Client sends on-chain fee transfer and captures `paymentTxHash`.
3. Mint API validates `paymentTxHash` format before creating template.
4. Mint action logs include payment metadata in `AdminLog`.

## Next Implementation Phases
### Phase 1 - Editor Reliability
- Replace ad hoc editor with extension-driven editor (Tiptap StarterKit baseline).
- Add schema guards for headings, lists, tables, and variable placeholders.
- Add autosave draft snapshots with restore points.

### Phase 2 - Template Quality Controls
- Lint placeholders:
  - duplicate keys
  - unsupported field types
  - missing required fields in signature blocks
- Preview validator for legal structure quality (title, parties, effective date, obligations, termination).

### Phase 3 - Versioning and Collaboration
- Add template revisions with immutable revision history.
- Add compare view (diff between revisions).
- Add publish/unpublish workflow with verification checkpoints.

### Phase 4 - Payment Integrity
- Add server-side payment verification against chain RPC before mint finalization.
- Add idempotency key per mint session to prevent duplicate template creation.
- Add explicit payment statuses: INITIATED, CONFIRMED, FAILED.

### Phase 5 - Discovery and Conversion
- Add analytics around template conversion funnel.
- Add taxonomy improvements beyond LEGAL/CREATIVE/ENGINEERING.
- Add recommendation rank blending: verification, sales quality, breach risk signals.

## Acceptance Criteria (Near-Term)
- Minting fails if payment hash is absent.
- Mint success includes payment reference in admin audit logs.
- Author can clearly see payment hash in mint confirmation stage.
- No duplicate template rows for failed payment attempts.
