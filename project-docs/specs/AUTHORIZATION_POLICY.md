# Authorization Policy

Policy version: `permissionGovernanceV1`

This policy defines the first governance model for the family archive. It separates historical browsing from contribution and collaboration writes so the archive can enter historical read-only mode without making profiles, tree views, sources, places, photos, or research browsing unavailable.

## Global Modes

| Mode | Historical browsing | Contribution and collaboration writes | Admin governance |
| --- | --- | --- | --- |
| `normal` | Enabled | Enabled according to role capability | Enabled for admins |
| `historical_read_only` | Enabled | Paused for all roles | Enabled for admins |

Historical browsing includes profile viewing, search, surname browsing, photo viewing, tree exploration, cited sources, place pages, research library, and analytics.

Contribution and collaboration writes include feedback, suggested changes, profile photo uploads, evidence uploads, profile presentation edits, photo notes, and photo tags.

## Roles

| Role | Intent |
| --- | --- |
| `viewer` | Invited family member who can browse the archive but not contribute changes |
| `contributor` | Standard invited family member who can browse and submit moderated contributions |
| `moderator` | Trusted reviewer role for content queues; first UI pass remains admin-centered |
| `admin` | Full governance, user management, review, and configuration authority |

Legacy `user` role values are treated as `contributor` for backward compatibility.

## Capability Matrix

| Capability | Viewer | Contributor | Moderator | Admin |
| --- | --- | --- | --- | --- |
| Browse historical core | Yes | Yes | Yes | Yes |
| Submit feedback | No | Yes | Yes | Yes |
| Suggest corrections | No | Yes | Yes | Yes |
| Upload profile photos | No | Yes | Yes | Yes |
| Upload evidence | No | Yes | Yes | Yes |
| Edit profile presentation notes | No | Yes | Yes | Yes |
| Add photo notes | No | Yes | Yes | Yes |
| Tag people in photos | No | Yes | Yes | Yes |
| Moderate content queues | No | No | Yes | Yes |
| Manage users | No | No | No | Yes |
| Manage archive mode | No | No | No | Yes |
| Manage manual media/admin photo notes | No | No | No | Yes |

Effective authorization is the intersection of role capability and global mode. A contributor has the ability to upload evidence in `normal` mode, but the same upload is denied while `historical_read_only` is active.

## Data Contracts

Global mode is stored at `app_config/governance`:

```json
{
  "mode": "normal",
  "policyVersion": "permissionGovernanceV1",
  "updatedAt": "ISO-8601 timestamp",
  "updatedBy": "admin@example.com"
}
```

Governance changes are appended to `governance_audit`:

```json
{
  "action": "mode_change",
  "before": { "mode": "normal" },
  "after": { "mode": "historical_read_only" },
  "actorEmail": "admin@example.com",
  "actorName": "Admin Name",
  "changedAt": "ISO-8601 timestamp"
}
```

Role changes use the same audit collection with `action: "role_change"` and include `targetEmail`.

## Enforcement

Enforcement exists in three places:

- Frontend capability checks disable or block affected actions with clear user messaging.
- Firestore rules deny collaboration creates while historical read-only mode is active and restrict review/governance writes by role.
- Cloud Functions check the governance policy before backend profile presentation edits.

Storage upload rules also check the global mode before allowing new profile photo or evidence artifact files.

## Automated Verification

Run `npm run test-governance-integration` to execute the emulator-backed read-only-mode harness. It verifies:

- historical browsing reads remain available for profile/tree/sources/places/gallery/analytics surfaces
- collaboration writes are denied in Firestore and Storage during `historical_read_only`
- `savePersonProfileEdit` callable returns `failed-precondition` with a read-only message
- admin governance writes (`app_config/governance`, `governance_audit`) remain permitted in read-only mode
