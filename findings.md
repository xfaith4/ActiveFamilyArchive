# Research Workflow Feature Findings

## Current App Context

- The app is a Vite frontend with major UI in `index.html`, app logic in `src/main.js`, styles in `src/styles/main.css`, and JSON family data loaded through `src/family-data.js`.
- Research surfaces already exist: `Cited Sources`, `Research Library`, and `Place Pages`.
- Person profiles already render structured events from `person-details.json`, but the UI does not call out which key facts are missing.
- The existing `Suggest a Change` modal writes factual corrections to the `submissions` Firestore collection and includes a free-text source citation field.
- Admin review already exists for submissions; this feature should feed that queue rather than introducing another workflow.
- `sources.json` plus `source-usage.json` already allows the app to show source metadata and linked relatives.

## Research Data Observations

- `person-details.json` stores people by id with `name`, `sex`, `living`, `birthYear`, `deathYear`, and an `events` array.
- Common event types include `Birth`, `Death`, `Residence`, and `Burial`; many profiles have event dates but blank places, or no events at all.
- `sources.json` contains 100 cited sources with `sourceType`, `citationText`, provider/repository/jurisdiction metadata, and optional URLs.
- A previous mobile audit found the Research Library pathway `local-life` referenced `Directory/Public Record` as a category id, but the actual category id is `Directory`.

## Implementation Direction

- Add a Research Workbench in the Research Library that lists missing fact opportunities and lets users choose a person/fact to investigate.
- Recommend record types based on the missing field: vital records, census, cemetery, newspaper, military, immigration, directory/public records.
- Surface already linked citations as source leads where available.
- Provide a citation builder whose output can prefill the existing source citation field in `Suggest a Change`.

---

# Me-Centered Relationship Lens Findings

## Tree Architecture Observations

- `index.html` exposes two separate control groups: data modes (`family`, `pedigree`, `descendants`, `branch`) and visualization modes (`bloodline`, `household`, `explore`).
- `src/main.js` already treats visualization modes as overlays on the existing tree data modes. That is the least disruptive extension point for Relationship Lens.
- `src/family-data.js` owns graph loading and kinship calculation. `computeKinship()` already returns useful labels, generation distances, direct-line paths, and affinity relationships.
- The tree currently uses expanded Cytoscape node labels as the click details panel. There is no separate drawer/modal for tree node details, so Relationship Lens should enrich expanded node labels rather than adding a second interaction pattern.
- The existing legend is static HTML. To support mode-specific legends without duplicating panels, the legend content should be rendered from JavaScript based on the active visualization mode.

## Implementation Direction

- Add `src/tree-core/relationship-lens.js` as a reusable utility boundary that imports public family-data APIs and computes metadata for each visible person.
- Add `src/tree-modes/tree-mode-registry.js` for visualization mode descriptors: `id`, `displayName`, `description`, action visibility, legend, and node metadata hook.
- Keep existing data modes untouched. Relationship Lens will use the same graph elements and layout, then attach `relationshipLens` data to visible nodes.
- Apply Cytoscape classes for relatedness buckets: self, close, strong, medium, light, distant, marriage, and unknown.
- Build labels as `Name`, `relationship · ~percent`, and years where available. Expanded cards add relationship, closeness, connection type, family side, and path.

## Implementation Notes

- Relationship Lens is implemented as a visualization perspective over the existing tree data modes. This preserves Family, Pedigree, Descendants, and Branch shapes while changing the interpretive layer.
- Blood-relatedness calculations traverse parent-child lineage only. Spouse edges are used for spouse/marriage labels and neutral grey styling, but they do not propagate DNA closeness.
- Approximate shared DNA uses expected autosomal values, not exact genetic measurement. Pedigree collapse and recombination variance are intentionally not modeled in V1.
- The tree legend is now rendered from active visualization-mode metadata, so additional modes can add their own explanatory scales without duplicating static HTML.

---

# Mobile Frontend Audit Findings

## Initial Context

- `npx` is available, so Playwright CLI automation can be used.
- The app uses a Vite frontend with the main shell in `index.html`, styling in `src/styles/main.css`, and workflow logic in `src/main.js`.
- `vite.config.js` already has unrelated local modifications and is out of scope.

## Responsive Areas To Inspect

- Login and local-development sign-in screen.
- Header actions and search on narrow screens.
- Browse cards and core entry workflows.
- Person profile, modals, lightbox, photo upload.
- Tree view toolbar/canvas, which already has mobile-specific CSS around `max-width: 600px`.

## Static CSS/DOM Findings

- Login screen uses `min-height: 100vh` and centered flex alignment; this can be fragile on iOS/Android browser chrome and with large text/keyboard scenarios.
- Modal content uses `max-height: 80vh`, which may leave cramped usable space on mobile and does not account for safe-area insets.
- Tree view already uses `100dvh`, but the toolbar has many controls and needs narrow-width verification for horizontal overflow and reachable controls.
- Browse cards are button-based and have adequate semantic hooks; recent HTML validation changed inner wrappers to `span`, while CSS still targets the same class.
- Local dev login is available only when `VITE_LOCAL_DEV_PASSWORD` is configured; mobile audit may need DOM class forcing or local env to reach post-login workflows.
- Current `index.html` was missing required tree toolbar elements expected by `src/main.js`, causing a startup error before any mobile workflow could run. Restored the toolbar controls.
- Browser automation is blocked in Linux/WSL unless native browser dependencies are available. Bundled Chromium installed but failed on missing `libnspr4.so`; Windows-side access to the dev server works, but no Chrome/Edge path was detected.

## Hardening Applied

- Added dynamic viewport height fallback (`100dvh`) and safe-area padding to the app shell/login surface.
- Added `viewport-fit=cover` to the mobile viewport meta tag so iOS safe-area inset variables are available.
- Added broad 44px minimum touch targets for primary buttons, inputs, chips, tabs, and tree controls.
- Made mobile header actions stack cleanly and stretch across the available width.
- Reduced narrow-screen card density and removed browse-card arrows on mobile to preserve text space.
- Made modals and lightbox account for dynamic viewport height and safe-area insets.
- Made the mobile tree toolbar scrollable when controls exceed available vertical space, and moved the tree legend to a bottom sheet style on mobile.
- Added accessible names to modal close buttons so mobile screen-reader users hear the dialog-specific close action.
- Wired the tree legend independently from tree graph initialization, so unlinked first-time users can still open the color guide/help panel.

## Browser Findings

- Playwright Firefox launches successfully when `TMPDIR=/tmp TEMP=/tmp TMP=/tmp` are set.
- Login screen at `390x844` and `412x915` has no document-level horizontal overflow (`scrollWidth` equals viewport width).
- Saved mobile login screenshot to `output/playwright/login-android-412x915.png`.
- Full iPhone-width workflow at `390x844` passed without horizontal overflow across home, feedback modal, search results, person profile, surname directory, photo gallery, cited sources, place pages, analytics, research library, family tree, and tree legend.
- Core Android-width workflow at `412x915` passed without horizontal overflow across home, feedback modal, search results, photo gallery, family tree, and tree legend.
- The tree legend now opens at mobile widths as a bottom sheet: `366px` wide in a `390px` iPhone viewport and `388px` wide in a `412px` Android viewport.
- Search returned 41 results for `Fuhr`; the photo gallery rendered 581 items in both mobile runs.
- A pre-existing console warning remains during local dev: the Research Library pathway `local-life` references unknown category id `Directory/Public Record`.
- The production build still reports the existing large JavaScript chunk warning.
- Firebase Google sign-in on `127.0.0.1` currently logs `auth/unauthorized-domain`, so full Google-auth workflow testing needs either an authorized local domain or local dev password.
