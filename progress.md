# Research Workflow Feature Progress

## Session Log
- Started implementation of a smoother research workflow for missing family-tree dates, places, and citations.
- Read `frontend-skill`, `genealogy-research`, and `planning-with-files` instructions.
- Restored planning context from the completed mobile audit and started a new plan section.
- Inspected `index.html`, `src/main.js`, `src/family-data.js`, `person-details.json`, and `sources.json`.
- Confirmed the existing suggestion workflow can accept citation-prefilled corrections through the `submissions` collection.
- Confirmed the Research Library already has category/pathway scaffolding and one stale `Directory/Public Record` category reference to fix.
- Added a Research Workbench to the Research Library with missing-fact counts, searchable person opportunities, selected-person fact review, source-type leads, linked-source leads, and a citation builder.
- Added a profile-level `Research` button that opens the selected person in the Research Workbench.
- Refactored `Suggest a Change` opening so research context can prefill person, correction field, proposed value, and source citation.
- Fixed the stale Local Life pathway category reference so the Directories & Local Records chip resolves correctly.
- Updated `ROADMAP.md` to include the Research Workbench and citation-builder workflow.
- Ran `npx --yes html-validate index.html`, `git diff --check -- index.html src/main.js src/styles/main.css ROADMAP.md task_plan.md findings.md progress.md`, and `npm run build`; all passed. Build still reports the existing large JavaScript chunk warning.
- Browser smoke-tested with Playwright Firefox using a temporary local dev password: opened Research Library, verified the workbench, prefilled `Suggest a Change` from the citation builder, opened a profile from the workbench, and returned to that person's research panel from the profile `Research` button.
- Patched Research Workbench search to preserve focus and caret position while filtering, then reran final validation/build checks successfully.

---

# Me-Centered Relationship Lens Progress

## Session Log
- Started implementation request for a modular Me-centered Relationship Lens tree mode.
- Read `planning-with-files`, `genealogy-analyzer`, and `frontend-skill` guidance.
- Restored existing planning context and added a dedicated Relationship Lens plan section.
- Inspected `index.html`, `src/main.js`, `src/styles/main.css`, and `src/family-data.js`.
- Confirmed existing tree architecture already separates data modes from visualization modes; using the visualization layer as the modular extension point.
- Confirmed existing tree click details are expanded Cytoscape node cards, so the new mode will enrich that existing interaction rather than adding a duplicate drawer.
- Added `src/tree-core/relationship-lens.js` for reusable relationship metadata, expected autosomal relatedness estimates, line/side/path summaries, and bucket formatting.
- Added `src/tree-modes/tree-mode-registry.js` so visualization modes have descriptors for labels, legend content, descriptions, and action visibility.
- Registered `Me-centered Relationship Lens` in the visualization selector without removing Bloodline, Household, or Explore.
- Wired the tree shell to compute Relationship Lens metadata from the linked/logged-in person, center the mode on that person, render compact node cues, and enrich expanded node details.
- Added relationship-specific Cytoscape classes and compact legend content for close/distant blood relatives, marriage-only connections, unknowns, and approximation caveats.
- Ran `node scripts/test-kinship.js`; all 42 kinship tests passed.
- Ran `npx --yes html-validate index.html`, `git diff --check -- index.html src/main.js src/styles/main.css src/tree-core/relationship-lens.js src/tree-modes/tree-mode-registry.js task_plan.md findings.md progress.md`, and `npm run build`; all passed. Build still reports the existing large JavaScript chunk warning.
- Started Vite at `http://127.0.0.1:5176/` with the local dev password and smoke-tested the Family Tree screen in Playwright Firefox. The new selector is present; the local-dev account is not linked to a person, so the browser session cannot compute the Me-centered lens data.

---

# Mobile Frontend Audit Progress

## Session Log
- Started mobile frontend audit and hardening request.
- Read `planning-with-files` and `playwright` skill instructions.
- Confirmed `npx` is available.
- Confirmed there is an unrelated existing modification in `vite.config.js`; leaving it untouched.
- Inspected responsive CSS and key auth/workflow DOM hooks.
- Completed Phase 2 static review.
- Started Vite dev server at `http://127.0.0.1:5173/`.
- Fixed startup blocker caused by missing tree toolbar controls in `index.html`.
- First Playwright launch failed because Chrome was not installed in the expected path; started browser installation through the wrapper.
- Chrome install failed because it required `sudo`; switched to installing bundled Chromium.
- Bundled Chromium failed to launch due missing Linux browser library `libnspr4.so`.
- Confirmed Windows PowerShell can reach the Vite server, but Chrome/Edge were not detected in common Windows install paths.
- Started a Playwright Firefox fallback attempt.
- Firefox fallback also failed because host browser dependencies require `sudo`; continuing with static hardening and build/validation checks.
- Applied mobile CSS hardening and `viewport-fit=cover`.
- `npx --yes html-validate index.html` passed.
- `git diff --check -- index.html src/styles/main.css task_plan.md findings.md progress.md` passed.
- `npm run build` passed; Vite still reports the pre-existing large JS chunk warning.
- User confirmed Playwright, Chrome, and Firefox are installed.
- Rechecked browser availability: Firefox is visible at `/usr/bin/firefox`.
- Restarted Vite dev server and launched Playwright Firefox successfully by setting temp dirs to `/tmp`.
- Captured login metrics at `390x844` and `412x915`; no horizontal overflow found.
- Saved `output/playwright/login-android-412x915.png`.
- Found that the mobile tree legend was not wired for unlinked local-audit users because the listener was only attached after `initTree()`.
- Moved the tree legend toggle to a standalone click listener and removed the duplicate `onclick` assignment from `wireTreeControls()`.
- Restarted Vite after it served a stale transformed module, then confirmed `/src/main.js` included the updated legend listener.
- Reran the full iPhone `390x844` workflow in Playwright Firefox; all audited views had no horizontal overflow and the tree legend opened in-view.
- Ran the core Android `412x915` workflow in Playwright Firefox; home, feedback, search, gallery, tree, and tree legend had no horizontal overflow.
- Reran `npx --yes html-validate index.html`, `git diff --check -- index.html src/main.js src/styles/main.css task_plan.md findings.md progress.md`, and `npm run build`; all passed.
