# Worklog Consolidated

This file consolidates historical planning/work-tracking notes that were previously split across `task_plan.md`, `findings.md`, and `progress.md`.

---

## task_plan.md

# Task Plan: Release Hardening And JSON-First Continuation

## Goal

Create a clear, enforceable release-hardening path for the current codebase by standardizing local release verification, documenting staging smoke tests, and recording the next bounded JSON-first migration steps.

## Current Phase

Phase 12 complete

## Phases

### Phase 1: Requirements & Discovery

- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure

- [x] Define technical approach
- [x] Decide which release artifacts and scripts to add
- [x] Document decisions with rationale
- **Status:** complete

### Phase 3: Implementation

- [x] Add a standardized local release verification path
- [x] Add a repo release checklist with staging smoke coverage
- [x] Align docs and CI with the new verification flow
- **Status:** complete

### Phase 4: Testing & Verification

- [x] Run the verification path locally
- [x] Confirm workflows still reflect the intended release sequence
- [x] Document test results in progress.md
- **Status:** complete

### Phase 5: Delivery

- [ ] Review touched files
- [ ] Summarize the operational impact
- [ ] Deliver next-step recommendations
- **Status:** complete

### Phase 6: Surname Runtime Migration

- [x] Replace the `surnames.htm` runtime path with an in-app JSON-backed surname directory
- [x] Preserve back-navigation state from profile back into surname browsing
- [x] Remove dead runtime pieces left over from the old surname iframe path
- **Status:** complete

### Phase 7: Next Slice Definition

- [x] Define the bounded path for retiring the legacy profile iframe
- [x] Keep docs and release-watch notes aligned with the new remaining dependency list
- **Status:** complete

### Phase 8: Extraction And Schema Hardening

- [x] Tighten protected-data validation beyond simple count checks
- [x] Add cross-file integrity validation for the current JSON-first runtime
- [x] Document the recommended staging manual test plan before production promotion
- **Status:** complete

### Phase 9: Sources Runtime Polish

- [x] Remove the user-facing action that routes Sources back into hosted RootsMagic export pages
- [x] Keep only true external record links as source actions
- [x] Reflect the behavior in release/test docs
- **Status:** complete

### Phase 12: Profile Name And Edit Reliability Fix

- [x] Fix profile headers so they prefer the structured full name from extracted person details
- [x] Improve profile-edit save errors for backend callable failures
- [x] Align staging and production workflows so Cloud Functions deploy with the frontend
- **Status:** complete

## Key Questions

1. What should count as the single local release gate for this repo?
2. Which smoke checks must stay manual even after JSON-first hardening?
3. Which JSON-backed surfaces still need release polish before production promotion?
4. Which user-facing features still depend on backend callables being deployed alongside Hosting?

## Decisions Made

| Decision | Rationale |
| ---------- | ----------- |
| Add a dedicated `verify-release` path instead of relying on separate ad hoc commands | Makes local release discipline match the operational intent already present in CI |
| Document a manual staging smoke checklist in-repo | Some critical app behavior still needs browser verification even after build-time JSON hardening |
| Keep this slice focused on release hardening, not another large runtime migration | The user asked to continue the current codebase path with bounded slices |
| Raise the root Node engine to 22 | The repo already depends on Node 22-only extraction scripts and CI already runs on Node 22 |
| Replace surname browsing with an in-app JSON-backed directory before touching the profile iframe | It removes a cleanly isolated runtime HTML dependency without destabilizing the more complex profile flow |
| Remove the profile iframe once data coverage is proven for all shipped directory members | Avoids carrying dead legacy HTML once the extracted JSON-backed profile view is sufficient |
| Tighten validation at the artifact-boundary level before pushing this staging-only migration to production | The runtime is now fully JSON-first, so bad joins between artifacts are the main remaining release risk |
| Do not expose `citationUrl` as a user-facing action in the Sources UI | It points to archived RootsMagic export pages, not the intended in-app or external-record experience |
| Prefer `person-details.json` names over shortened directory projections when rendering the profile header | Directory rows may intentionally show shorter name forms, but profiles need the fuller identity record |
| Deploy Cloud Functions in the normal staging/production workflows | Features like profile edits and photo-note generation should not drift behind the frontend deploy path |

## Errors Encountered

| Error | Attempt | Resolution |
| ------- | --------- | ------------ |
| None so far | 1 | Not applicable |

## Notes

- Keep the current codebase and continue hardening forward rather than triggering a rebuild.
- Preserve visibility of remaining legacy RootsMagic HTML dependencies in docs/checklists.
- The main authenticated runtime is now fully JSON-first.
- `citationUrl` remains in source data for traceability, but the runtime should only offer outbound source actions when a true external record URL exists.
- Some user-facing features depend on backend callables and should ship through the same CI/CD path as Hosting, rules, and Storage.

---

## findings.md

## Findings & Decisions

## Requirements

- Continue on the current codebase path rather than rebuilding.
- Finish the remaining JSON-first migration in bounded slices.
- Standardize release validation and staging smoke tests.
- Tighten docs and schema contracts.
- Keep migration work visible in roadmap and operational docs.

## Research Findings

- The repo already runs Node 22 in both deploy workflows, but the root `package.json` engine still says `>=20.19.0`.
- CI currently performs `npm ci`, `npm run build`, and `npm run validate-protected-data`, but there is no single local `verify-release` command.
- Protected artifact validation already covers `directory.json`, `sources.json`, `source-usage.json`, `person-details.json`, `person-family.json`, `person-photos.json`, and `photo-catalog.json`.
- The browser no longer crawls `sources.htm` or `f*.htm` for cited sources.
- Remaining runtime legacy HTML dependencies initially included `surnames.htm` and the legacy profile iframe path.
- The new `verify-release` script correctly blocks local release verification on Node `20.19.5`, which confirms the engine mismatch is now surfaced instead of staying implicit.
- Existing `npm run build` and `npm run validate-protected-data` still pass in this workspace after the release-hardening edits.
- `surnames.htm` has now been removed from the app runtime path; surname browsing is rendered from `directory.json` inside the SPA.
- The dead content iframe used for surname browsing has also been removed.
- All 506 shipped directory members already have extracted details and family data, so the profile iframe was no longer required as a content fallback.
- The legacy profile iframe has now been removed from the runtime path as well.
- The main authenticated runtime no longer intentionally depends on RootsMagic HTML exports.
- The validator has now been tightened to enforce cross-file integrity across directory, details, family, photos, sources, and source-usage artifacts.
- The current artifact set passes those stricter checks cleanly.
- The Sources UI still exposed `citationUrl` as `Open original citation`, which routed users into hosted RootsMagic export pages instead of keeping them in the JSON-first app experience.
- A post-login `What's New` popup is desirable, but it should stay below the next real feature releases in priority.
- A profile-level `View in Family Tree` jump is a meaningful navigation improvement and should sit above low-priority polish items in the roadmap.
- Joan already exists in the extracted data as `Joan Mills` (`personId 489`); the missing surname on her profile came from the app preferring the short directory projection (`name: "Joan", surname: "MILLS"`) over the richer person-details record.
- The deploy workflows were shipping Hosting, rules, and Storage but not Cloud Functions, which leaves callable-backed features like profile edits vulnerable to environment drift.

## Technical Decisions

| Decision | Rationale |
|----------|-----------|
| Add a release checklist doc instead of burying the process only in the roadmap | Operators need a concise execution document, not just historical roadmap notes |
| Add a scripted `verify-release` step and point CI to it | Reduces drift between local release prep and workflow behavior |
| Keep manual staging smoke tests explicit | Search/profile/tree/admin flows still require real UI confirmation |
| Keep the new verification gate strict on Node 22 instead of silently tolerating Node 20 | Failing early is better than allowing a runtime the extraction pipeline does not actually support |
| Reuse the analytics-directory interaction pattern for surname browsing | It keeps the new JSON-backed surname view consistent with the existing UI and minimizes CSS/interaction churn |
| Remove link-based profile rendering before removing link fields from data artifacts | Lets the runtime stop depending on HTML first without forcing a schema change in the same slice |
| Use the release checklist as the home for the staging manual test plan | The operator path should live next to the release gate, not only in ad hoc conversation history |
| Keep `citationUrl` as archival metadata but remove it from the user-facing Sources action area | The app should only present outbound source actions when they lead to a real provider/archive URL |
| Keep the future `What's New` popup near the bottom of the roadmap rather than tying it to the current production push | Recent work was mostly structural hardening, so higher-value feature work should stay ahead of release-announcement polish |
| Track profile-to-tree linking as a near-term navigation improvement instead of a low-priority nice-to-have | It strengthens continuity between the profile-first and tree exploration surfaces without competing with the core roadmap sequence |
| Use the structured details record as the source of truth for profile identity text | Profiles should present the fullest available name even if list views use a shorter display form |
| Add Cloud Functions deployment to both release workflows | Callable-backed features should deploy in lockstep with the frontend and data artifacts |

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| No existing planning files in repo | Created a fresh planning set for this migration/hardening slice |
| Initial workflow patch duplicated the `run` key on deploy steps | Corrected both workflow files and rechecked the YAML snippets |
| `main.js` patch initially missed the exact variable block context | Re-read the file and applied the migration in smaller targeted patches |
| Large generated `catalog-photos` output makes build verification noisy | Let the build complete, then use targeted `rg` checks to confirm runtime dependency removal |
| `Open original citation` in Sources still linked into hosted exported HTML | Remove the action from the UI and keep only `Open external record` when `externalUrl` exists |
| Profile edit save failure surfaced only as a generic frontend error | Improve error messaging and remove workflow drift by deploying Cloud Functions as part of staging/prod releases |

## Resources

- `package.json`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `scripts/validate-protected-data.js`
- `ROADMAP.md`
- `AI_REBUILD_SPEC.md`
- `DATA_SCHEMA_SPEC.md`

## Visual/Browser Findings

- No browser work performed yet in this slice.

---

## progress.md

# Progress Log

## Session: 2026-04-04

### Phase 1: Requirements & Discovery

- **Status:** complete
- **Started:** 2026-04-04
- Actions taken:
  - Reviewed current release-hardening goals from the active migration track.
  - Inspected `package.json`, protected-data validation, and deploy workflows.
  - Confirmed the main remaining gap is lack of a single local release gate and a concise staging smoke checklist.
- Files created/modified:
  - `task_plan.md` (created)
  - `findings.md` (created)
  - `progress.md` (created)

### Phase 2: Planning & Structure

- **Status:** complete
- Actions taken:
  - Chose a bounded hardening slice: local verification + release checklist + CI alignment.
  - Deferred further HTML/runtime migration to a later slice to keep this change operationally focused.
- Files created/modified:
  - `task_plan.md` (updated)
  - `findings.md` (updated)

### Phase 3: Implementation

- **Status:** complete
- Actions taken:
  - Added `scripts/verify-release.js` as the single local release gate.
  - Added `RELEASE_CHECKLIST.md` with local verification, staging smoke tests, and production promotion conditions.
  - Updated `package.json` scripts and raised the root Node engine to 22.
  - Updated deploy workflows to call `npm run verify-release`.
  - Updated `README.md`, `ROADMAP.md`, and `AI_REBUILD_SPEC.md` to reflect the new release-hardening path.
- Files created/modified:
  - `scripts/verify-release.js` (created)
  - `RELEASE_CHECKLIST.md` (created)
  - `package.json` (updated)
  - `README.md` (updated)
  - `.github/workflows/deploy-staging.yml` (updated)
  - `.github/workflows/deploy-production.yml` (updated)
  - `ROADMAP.md` (updated)
  - `AI_REBUILD_SPEC.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)

### Phase 4: Testing & Verification

- **Status:** complete
- Actions taken:
  - Ran `npm run verify-release`; it failed immediately on local Node `20.19.5` as expected.
  - Re-ran `npm run build` and `npm run validate-protected-data` to confirm the non-runtime changes did not break the existing build path.
  - Rechecked both deploy workflows after fixing the accidental duplicate `run` key.
- Files created/modified:
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 6: Surname Runtime Migration

- **Status:** complete
- Actions taken:
  - Added an in-app surname directory panel under `content-display`.
  - Replaced the `Browse by Surname` iframe path with a JSON-backed surname index and surname member list.
  - Preserved return-to-surname behavior when opening a profile from surname browsing.
  - Removed the dead surname runtime iframe and the unused `loadSurnames()` helper.
  - Updated roadmap and release-checklist text so the remaining runtime HTML dependency list now only points to the legacy profile iframe.
- Files created/modified:
  - `index.html` (updated)
  - `src/main.js` (updated)
  - `src/family-data.js` (updated)
  - `src/styles/main.css` (updated)
  - `README.md` (updated)
  - `ROADMAP.md` (updated)
  - `RELEASE_CHECKLIST.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 7: Profile Runtime Migration

- **Status:** complete
- Actions taken:
  - Quantified extracted profile coverage and confirmed all shipped directory members already have structured details and family data.
  - Removed the legacy profile iframe from the person profile view.
  - Switched profile and search photo loading to `personId`-based JSON lookups only.
  - Removed stale CSS and documentation that still described a runtime profile iframe dependency.
  - Updated release/watch documentation to reflect that the authenticated runtime is now fully JSON-first.
- Files created/modified:
  - `index.html` (updated)
  - `src/main.js` (updated)
  - `src/family-data.js` (updated)
  - `src/styles/main.css` (updated)
  - `README.md` (updated)
  - `RELEASE_CHECKLIST.md` (updated)
  - `ROADMAP.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 8: Extraction And Schema Hardening

- **Status:** complete
- Actions taken:
  - Expanded `scripts/validate-protected-data.js` from per-file smoke checks into cross-file integrity validation.
  - Added referential checks between directory, person details, family relationships, photos, sources, and source usage.
  - Updated `RELEASE_CHECKLIST.md` with a concrete manual staging test plan focused on the JSON-first migration before first production promotion.
  - Updated `DATA_SCHEMA_SPEC.md` so the stricter validation contract is documented alongside current artifact shapes.
- Files created/modified:
  - `scripts/validate-protected-data.js` (updated)
  - `RELEASE_CHECKLIST.md` (updated)
  - `DATA_SCHEMA_SPEC.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 9: Sources Runtime Polish

- **Status:** complete
- Actions taken:
  - Removed the `Open original citation` action from the Sources UI so users no longer leave the app for hosted RootsMagic export pages.
  - Kept `citationUrl` in the data model as archival metadata and preserved `Open external record` only for true external provider/archive URLs.
  - Updated release and schema docs so staging verification explicitly checks the corrected source-link behavior.
- Files created/modified:
  - `src/main.js` (updated)
  - `README.md` (updated)
  - `DATA_SCHEMA_SPEC.md` (updated)
  - `RELEASE_CHECKLIST.md` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 10: Roadmap Prioritization Polish

- **Status:** complete
- Actions taken:
  - Added the future one-time `What's New` popup as a low-priority nice-to-have near the bottom of the roadmap.
  - Corrected the stale roadmap line that still implied a remaining intentional runtime RootsMagic profile HTML dependency.
- Files created/modified:
  - `ROADMAP.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 11: Navigation Roadmap Capture

- **Status:** complete
- Actions taken:
  - Added a near-term roadmap item for `View in Family Tree` from person profiles.
  - Captured the expected behavior that the tree should centre on the viewed person and preserve a clear return path.
- Files created/modified:
  - `ROADMAP.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

### Phase 12: Profile Name And Edit Reliability Fix

- **Status:** complete
- Actions taken:
  - Fixed profile headers to prefer the structured full person name from `person-details.json`, which restores surnames like `Joan Mills` on the profile view.
  - Improved profile-edit save messaging for callable failures so staging users get a more actionable explanation when backend functions are unavailable.
  - Updated both deploy workflows to install and deploy Firebase Cloud Functions alongside Hosting, rules, and Storage.
- Files created/modified:
  - `src/main.js` (updated)
  - `.github/workflows/deploy-staging.yml` (updated)
  - `.github/workflows/deploy-production.yml` (updated)
  - `task_plan.md` (updated)
  - `findings.md` (updated)
  - `progress.md` (updated)

## Test Results

| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Planning bootstrap | Create planning files | Repo has persistent working memory for this slice | Created `task_plan.md`, `findings.md`, `progress.md` | ✓ |
| Release gate runtime check | `npm run verify-release` on local Node `20.19.5` | Fail fast because repo now requires Node 22+ | Failed with explicit Node 22 requirement message | ✓ |
| Build verification | `npm run build` | Build completes with current JSON-first pipeline | Build passed | ✓ |
| Protected artifact validation | `npm run validate-protected-data` | All shipped protected artifacts validate | Validation passed for all 7 artifacts | ✓ |
| Surname runtime migration | `npm run build` after replacing `surnames.htm` path | App still builds with JSON-backed surname browse flow | Build passed | ✓ |
| Remaining dependency sanity check | `rg -n "surnames\\.htm|loadSurnames|content-frame"` | Only historical/docs references remain; no runtime surname path | Runtime references removed; only docs/history and profile iframe remain | ✓ |
| Profile coverage check | compare `directory.json` against `person-details.json` and `person-family.json` | Confirm iframe is not required as a shipped profile fallback | All 506 shipped directory members have details and family coverage | ✓ |
| Profile runtime migration | `npm run build` after removing profile iframe | App still builds with JSON-backed profile flow only | Build passed | ✓ |
| Fully JSON-first runtime sanity check | targeted `rg` for iframe/profile runtime references | No intentional runtime RootsMagic HTML dependency remains | Only historical roadmap text remains | ✓ |
| Cross-file artifact validation | `npm run validate-protected-data` after validator hardening | Current protected artifacts still pass with referential checks | Validation passed, including cross-file integrity summary | ✓ |
| Post-hardening build verification | `npm run build` after validator hardening | Build still completes after validation changes | Build passed | ✓ |
| Sources action correction | `rg -n "Open original citation|source\\.citationUrl"` after source UI patch | No runtime code path still exposes the archived citation link as a user action | No matches in runtime/docs targets checked | ✓ |
| Sources runtime polish build verification | `npm run build` after removing the archived citation action | App still builds cleanly with external-link-only source actions | Build passed | ✓ |
| Functions backend syntax | `node -c functions/index.js` | Cloud Functions entrypoint remains syntactically valid after workflow-related fixes | Syntax check passed | ✓ |
| Profile name + workflow reliability build verification | `npm run build` after profile/workflow patch | Frontend still builds after profile identity and workflow changes | Build passed | ✓ |

## Error Log

| Timestamp | Error | Attempt | Resolution |
| ----------- | ------- | --------- | ------------ |
| 2026-04-04 | None so far | 1 | Not applicable |

## 5-Question Reboot Check

| Question | Answer |
| ---------- | ----------- | --------|
| Where am I? | Phase 12 profile name and edit reliability fix complete |
| Where am I going? | Redeploy staging, confirm Joan's profile header and profile-edit save path, then continue with the next bounded product slice |
| What's the goal? | Continue hardening the current codebase through bounded JSON-first migration slices |
| What have I learned? | The authenticated runtime is fully JSON-first, profile identity should come from structured details rather than short directory rows, and callable-backed features need Cloud Functions to deploy in lockstep with the frontend |
| What have I done? | Added release hardening, removed runtime HTML dependencies, tightened validation, corrected source actions, fixed profile name presentation, and aligned the release workflows to deploy Cloud Functions |
