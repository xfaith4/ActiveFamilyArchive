# Research Workflow Feature Plan

## Goal
Create a smoother family-history research workflow that helps users find missing dates, places, and related evidence, then submit citation-backed corrections through the existing admin review path.

## Phases
- [x] Phase 1: Restore existing planning context and inspect the current Research Library, profile, sources, and suggestion workflows.
- [x] Phase 2: Add the Research Workbench UI and data logic for missing facts, recommended record types, source leads, and citation building.
- [x] Phase 3: Connect person profiles and the suggestion modal so research context can prefill admin update submissions.
- [x] Phase 4: Style the new workflow responsively within the existing app design.
- [x] Phase 5: Run validation/build checks and update project notes.

## Decisions
- Keep factual updates on the existing `submissions` queue; do not add another moderation collection.
- Treat citations as strongly encouraged, not required, matching the current admin-review policy.
- Use build-time JSON already available in the app: `person-details.json`, `directory.json`, `sources.json`, and `source-usage.json`.
- Prefer a guided workbench inside Research Library over a separate tool, so users can move between record education, cited sources, and missing data.
- Evidence labels should follow genealogy guidance: known facts, missing facts, source leads, and citation notes must be clearly distinguished.

## Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| `git status --short` hung in the working tree | Checked repo state before implementation | Will use scoped diffs and avoid broad git status scans unless needed. |

---

# Me-Centered Relationship Lens Plan

## Goal
Add a first-class Me-centered Relationship Lens tree visualization mode that explains who each visible person is relative to the logged-in linked profile, with approximate expected autosomal relatedness and a clear marriage-only distinction, while preserving existing tree data modes and visualization modes.

## Phases
- [x] Phase 1: Restore planning context and inspect current tree data modes, visualization overlays, relationship helpers, legend, and node card behavior.
- [x] Phase 2: Add reusable relationship-lens metadata utilities with approximate relatedness, side, line type, and path summaries.
- [x] Phase 3: Add a modular visualization-mode descriptor layer and register the Relationship Lens mode alongside existing modes.
- [x] Phase 4: Render Relationship Lens node labels, classes, legend content, and expanded card details without regressing existing modes.
- [x] Phase 5: Validate with focused relationship tests/build checks and update notes.

## Decisions
- Treat Relationship Lens as a visualization mode, not a replacement for Family/Pedigree/Descendants/Branch data modes. This preserves existing selectable tree shapes while adding the new interpretive lens.
- Keep graph building in `buildTreeData()` and attach lens metadata in the tree shell so existing views keep the same data flow.
- Use existing `computeKinship()`/`getRelationshipLabel()` for human relationship labels, then add reusable metadata around it for side, line type, path summary, and expected relatedness.
- Use expected autosomal relatedness buckets for color. This is an educational approximation, not a genetics result.

## Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| `html-validate` rejected `aria-label` on the legend heading and later preferred native navigation for the breadcrumb rail | Validated updated `index.html` | Converted the legend title to a real title element and changed the bloodline rail to `<nav aria-label="...">`. |
| `git status --short` was slow in this dirty worktree | Checked final repo state | Used scoped diffs/checks for the touched files and left unrelated existing changes untouched. |

---

# Mobile Frontend Audit Plan

## Goal
Audit and harden the frontend for first-time mobile family users on Android and iPhone, focusing on layout stability, touch workflows, and core app navigation.

## Phases
- [x] Phase 1: Establish scope, existing repo state, and relevant tooling.
- [x] Phase 2: Inspect responsive CSS and workflow-critical DOM/JS.
- [x] Phase 3: Run real browser checks at iPhone and Android viewport sizes.
- [x] Phase 4: Apply focused mobile hardening fixes.
- [x] Phase 5: Re-run validation/build/browser checks and summarize residual risks.

## Decisions
- Preserve existing IDs and JavaScript hooks unless a bug requires changing them.
- Avoid touching unrelated dirty files, including the existing `vite.config.js` change.
- Prefer CSS/layout fixes before changing app logic.
- Use static/browser-independent hardening where Playwright browser execution is blocked by missing host dependencies.

## Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| Dev server startup error: `backFromTreeBtn` null in `src/main.js` | Started Vite for mobile audit | Restored required tree toolbar elements in `index.html` while preserving current ARIA tab attributes. |
| Playwright CLI could not find Chrome at `/opt/google/chrome/chrome` | First mobile browser snapshot | Installing the browser through the Playwright wrapper, then will retry. |
| Chrome install attempted to use `sudo` and failed | Browser install attempt | Switched to bundled Chromium install. |
| Bundled Chromium could not launch due missing `libnspr4.so` | Retried mobile snapshot with `--browser chromium` | Checking Windows-side browser availability and trying Playwright Firefox as fallback. |
| Playwright Firefox failed with Unix socket error under `/mnt/c/...` | Retried after user installed Playwright/Firefox | Set `TMPDIR`, `TEMP`, and `TMP` to `/tmp`; Firefox now launches. |
| Playwright CLI `screenshot output/...png` treated the path as a selector | Tried saving login screenshot | Used `run-code` with `page.screenshot({ path })`. |
| Tree legend did not open for an unlinked local-audit user | Ran the mobile tree workflow at 390px wide | Moved the legend toggle to a standalone click listener so static tree help works even before `initTree()` runs. |
| Vite served a stale transformed `src/main.js` after the tree fix | Retested the legend immediately after editing | Restarted the local dev server and confirmed `/src/main.js` included the updated listener before rerunning Playwright. |
