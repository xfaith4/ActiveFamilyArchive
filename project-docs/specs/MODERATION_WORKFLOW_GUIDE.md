# Moderation Workflow Guide

This guide keeps the contributor and admin experience consistent across family feedback, photo uploads, suggested changes, evidence uploads, and future moderated contribution surfaces.

## Principles

- Contributors should always know whether their submission was received, pending, approved, declined, resolved, or dismissed.
- Admins should review the smallest meaningful unit independently. For example, an evidence artifact can be approved while a linked proposed correction still needs more review.
- Declines should include a plain-language explanation whenever the contributor needs to understand what to fix or why the artifact was not accepted.
- Approved contributor artifacts should surface only in the intended live destination. Pending and rejected artifacts remain in admin/history surfaces, not public profile sections.
- Notification and history wording should be consistent across contribution types so family members do not have to learn a different status model for each feature.

## Contributor Surfaces

| Contribution type | Entry point | Immediate confirmation | Contributor history | Review notification |
| --- | --- | --- | --- | --- |
| Feedback or question | Feedback modal | Success or retry message | Updates panel when available | Admin resolve/dismiss outcome |
| Suggested factual correction | Suggest a Change | Success or retry message | My Recent Suggestions and Evidence | Admin approve/reject outcome |
| Profile photo upload | Person profile photo upload | Upload progress plus success or retry message | Upload status/history surface | Admin approve/reject outcome |
| Evidence upload | Add Evidence or Suggest a Change evidence attachment | Upload progress plus success or retry message | My Recent Suggestions and Evidence, My Recent Evidence in the modal | Admin approve/reject outcome |

## Admin Surfaces

| Queue | Review unit | Required admin action | History expectation |
| --- | --- | --- | --- |
| Feedback | Message | Resolve or dismiss | Keep reviewer, status, date, and optional context |
| Submissions | Proposed factual correction or photo contribution note | Approve or reject | Keep reviewer, status, date, and explanation when rejected |
| Photo Uploads | One uploaded image | Approve or reject | Keep reviewer, status, date, person context, and rejection note when used |
| Evidence | One image or PDF artifact | Approve or reject artifact; review linked correction separately when present | Keep reviewer, status, date, citation, contributor note, and rejection explanation |

## Evidence-Specific Behavior

Evidence uploads use a separate `evidence_uploads` collection and `evidence/{personId}/{timestamp_filename}` Storage path because source artifacts have different meaning from family photos.

Supported contributor flows:

- **Add Evidence:** attaches a source artifact to an existing profile fact without proposing a data change.
- **Suggest a Change + Evidence:** attaches a source artifact to a proposed correction and records `relatedSubmissionId` so admins can review the artifact and the claim as connected but independent records.

Supported admin outcomes:

- Approve artifact and approve linked correction.
- Approve artifact and reject linked correction.
- Reject artifact and approve linked correction.
- Reject artifact and reject linked correction.

Approved evidence appears in the profile Evidence section only after artifact approval. Rejected or pending evidence must not appear on the public profile.

## Status Language

Use these status meanings across new contribution types:

- `pending`: received and waiting for admin review.
- `approved`: accepted by an admin and eligible to appear in the relevant live surface.
- `rejected`: reviewed and declined, with a contributor-facing explanation when the user can act on it.
- `resolved`: feedback was handled without necessarily changing profile data.
- `dismissed`: feedback was reviewed and closed without action.

## Future Moderated Features

New moderated features, including member additions, should reuse this shape unless there is a strong reason not to:

1. Contributor submits with identity, timestamp, target context, and optional notes.
2. Firestore rules allow create by authorized users and restrict review updates to admins.
3. Admin queue shows pending records with enough context to decide without leaving the page.
4. Admin decline paths require an explanation when the contributor needs outcome clarity.
5. Cloud Functions write contributor notifications when review status changes.
6. Contributor history shows the submitted item and latest status.
7. Public profile/tree surfaces render only approved artifacts or approved records.
