# Release Checklist

This checklist is the operational gate for staging and production promotion.
Use it alongside `ROADMAP.md`, not instead of it.

## Runtime Contract

- Use Node 22+ for all release preparation and extraction tasks.
- Use Java 21+ when running emulator-backed governance integration tests.
- Ensure `.env` or CI secrets provide the required `VITE_*` variables before running verification.
- Treat `npm run verify-release` as the single local release gate.

## Local Verification

Run this before pushing a meaningful release-bound change:

```bash
npm run verify-release
```

This currently performs:

1. `npm run validate-firebase-config`
2. `npm run build`
3. `npm run validate-protected-data`
4. `npm run test-governance-integration`

`npm run validate-protected-data` now checks both per-file shape/count and
cross-file integrity, including:

- `directory.json` person ids resolving into `person-details.json` and `person-family.json`
- `person-photos.json` paths resolving into `photo-catalog.json`
- `sources.json` ids resolving into `source-usage.json`
- `source-usage.json` person ids resolving into `person-details.json`

The build step also regenerates:

- `photo-catalog.json`
- `directory.json`
- `sources.json`
- `source-usage.json`

If the release changes RootsMagic-derived data, also run:

```bash
npm run extract-person-photos
npm run extract-person-family
npm run extract-person-details
npm run verify-release
```

## Staging Promotion Gate

After local verification, deploy through the normal `staging` branch flow and confirm the staging site before any `staging -> main` promotion.

Required staging smoke checks:

1. Sign in as an invited family member and confirm the app reaches the authenticated shell without console-visible blocking errors.
2. Open directory/search and confirm search results load from the JSON-backed member directory.
3. Open at least one profile with extracted details, relationships, and photos visible in-app.
4. Open at least one profile with no linked photo and confirm the profile still reads cleanly without any missing-frame or broken-layout behavior.
5. Use Browse by Surname, drill into one surname, open a profile, and confirm Back returns to the same surname list instead of a legacy exported page.
6. Open the family tree for a known connected person and confirm navigation, layout, and person selection still work.
7. Open the Sources experience and confirm source list, source detail, linked people, and linked places render from JSON-backed data.
8. If a source shows `Open external record`, confirm it opens the real provider/archive URL rather than a hosted RootsMagic export page.
9. From Sources, open a linked relative and confirm the profile loads fully in-app with the expected Back to Sources behavior.
10. Open a photo from a profile and confirm the modal/gallery path works without routing the user to raw media URLs.
11. If admin-related code changed, verify the affected admin workflow on staging:
   invite, feedback, submissions, evidence review, photo uploads, profile overrides, or media links.
12. Confirm the changed flow behaves acceptably on both desktop and mobile-width layouts.
13. Governance read-only smoke check:
    - As admin, set `app_config/governance.mode` to `historical_read_only`
    - Confirm browse surfaces still load (profile, tree, sources/research, places, gallery, analytics)
    - Confirm contribution writes are blocked (feedback, submissions, uploads, profile presentation edit, photo notes/tags)
    - Confirm governance mode save + `governance_audit` append still succeed
    - Return mode to `normal` after verification

## Recommended Manual Test Plan For The Current JSON-First Migration

Use this specific pass before the first production promotion of the recent
staging-only migration work:

1. Sign in as a normal invited user and verify the home screen shows search plus Explore cards without any empty iframe area.
2. Search for a person with a photo and open the profile.
   Confirm the header photo, structured details, family section, and photo grid all render in-app.
3. Search for a person without a linked photo and open the profile.
   Confirm the profile still renders details/family cleanly with no blank embedded-content region.
4. Use Browse by Surname.
   Open one surname group, open a person, then Back.
   Confirm you land back in that surname group.
5. Use Browse by Surname for a `<No Surname>` record.
   Confirm the list and profile still behave normally.
6. Open Sources, expand a source, and use a linked relative chip.
   Confirm the linked profile opens in-app and Back returns to Sources.
7. If a source shows `Open external record`, open it and confirm the destination is an external provider/archive page, not `FamilyTreeMedia/Total Family/...`.
8. Open Photo Gallery, open a photo, then open a linked person from the lightbox if available.
   Confirm the person profile opens and Back returns to Gallery context.
9. Open Family Tree, select a known person node, open the profile, then Back.
   Confirm the tree view restores correctly.
10. On mobile-width staging, repeat:
   search -> profile
   surname browse -> profile -> back
   sources -> linked relative -> back
11. If you use profile editing in staging, edit `nickname` or `profileNote`, save, reopen the same profile, and confirm the change persists and displays correctly in the JSON-backed profile.
12. If evidence upload or moderation changed, submit one standalone evidence artifact and one Suggest-a-Change attachment, then confirm pending admin review, review outcome notification, contributor history, and approved profile Evidence rendering.

## Production Promotion Gate

Promote to production only when all of the following are true:

- Local `npm run verify-release` passed on the release candidate.
- Staging deploy passed in GitHub Actions.
- Required staging smoke checks passed for the changed surfaces.
- The release PR is `staging -> main`.
- Docs are updated for any changed operator workflow, schema contract, or user-visible behavior.

## Known Remaining Legacy Dependencies

No RootsMagic HTML export is intentionally used in the main authenticated runtime path now.

Continue watching these as migration-adjacent inputs instead:

- exported family sheets under `FamilyTreeMedia/Total Family/` still exist as source material and may still influence generated artifacts
- directory, source, and profile changes should still get staging smoke coverage because the data ultimately originates from RootsMagic exports and extraction scripts

## Search Quality Regression Checklist

Run these representative queries whenever search scoring, index building, or directory data changes. Each should return results consistent with the description below.

| Query | Expected result |
|-------|----------------|
| `Fuhr` | All 40+ Fuhr-surname members near the top; no truncation |
| `fuhr` | Same as `Fuhr` — lowercase must be treated identically |
| `August Fuhr` | August Fuhr (1852–1922) as the top result |
| `Quad Cities` | People whose life events include Rock Island, Moline, East Moline, Davenport, or Bettendorf |
| `Rock Island` | People with a Rock Island event place |
| `1920` | People born or died in 1920; results should be plentiful |
| A known nickname (e.g. `Bud`, `Jake`) | The person known by that nickname at or near the top |
| A two-word first-last query (e.g. `August Fuhr`) | Exact-name match first, partial matches below |
| A first name only (e.g. `August`) | All people named August; those with the Fuhr surname should score highly |
| An unusual maiden name present in the archive | The person identified by that name |
