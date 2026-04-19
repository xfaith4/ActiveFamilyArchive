# Living Family Archive — Product & Engineering Roadmap

> Status: Active
>
> Product direction: Deliver a private, family-friendly history application
> that makes people, photos, and family stories easy to explore for users of
> all ages through intuitive, in-app navigation and a calm, respectful
> experience.

## 1. Product Intent

The Living Family Archive is a private family-history application designed for real
relatives, not technical operators. It should help family members of all ages
explore people, relationships, photos, and historical details in a way that
feels welcoming, emotionally meaningful, and easy to understand on both desktop
and mobile. The product's core responsibility is not just to expose
genealogical data, but to present family history through a thoughtfully simple
experience that respects less technical users and keeps navigation obvious,
safe, and intuitive.

The long-term shape of the product is a profile-first family history space:
each person should feel like a meaningful destination with identity,
relationships, stories, and photos connected inside one continuous app
experience. The application should feel calm and trustworthy, never like a
file browser, database viewer, or exported record dump.

---

## 2. Product Principles

- **Clarity over cleverness** — Users should never have to guess how to move
 through the app, how to recover their place, or what a button will do.
- **All-ages usability** — The experience must be approachable for relatives with
 very different levels of technical comfort, from teens to grandparents.
- **Profile-first storytelling** — Each person should feel like a destination
    with context and meaning, not just a linked record.
- **In-app continuity** — Photos, profiles, and related family history should
    open within the app and preserve user context.
- **Calm, respectful design** — The interface should feel steady, thoughtful,
  and emotionally appropriate for family history.
- **Staging before production** — The app already has real family users, so every
    meaningful change must be verified safely before release.
- **Historical trustworthiness** — Core genealogical facts must remain
    reviewable and admin-approved before they influence the live record;
    limited profile-presentation fields may apply immediately only when audit
    evidence and actor identity are preserved.

---

## 3. Current State Summary

The application is live on the staging site at `https://familytree-staging.web.app/` for pre-release validation. Releases 1.1 through 2.7.1 are on staging; production is at 2.6.1.

The app currently provides:

- Google OAuth sign-in with Firestore-based invitation access control
- Full-text search across a build-time member directory derived from the RootsMagic export
- Person profile pages with identity, life events, sex, family relationships (parents, spouse, children),
  and associated photos — all rendered in-app
- An in-app photo lightbox with previous/next navigation, captions, and person chips that link back to profiles
- A full photo gallery (581 photos) browsable with the same in-app lightbox
- A family name browse backed by the exported surnames page
- A native `Cited Sources` library that preserves exact citations while adding record-type badges, related people, related places, and filterable browsing
- A Feedback form for general questions and comments, stored in Firestore and reviewed by admins
- A structured "Suggest a Change" submission form for factual corrections (with optional
    citation) and photo contributions, with admin approve/reject workflow
- An admin panel with seven tabs: Users (invitation management), Feedback queue, Submissions queue, Profile Edits history, Media Links, Photo Uploads, and Diagnostics
- Family Analytics with clickable drill-down including gender, birth decade, surname, given name, and living/deceased distribution
- A user-centered family tree visualization with Bloodline, Household, Explore, and Me-centered Relationship Lens modes; keyboard navigation; per-user position persistence; cluster selection; admin default layout; selected-person tracing back to the logged-in user's linked profile; and automatic selected-tile readability at low zoom
- Photo upload workflow — family members can contribute photos from a person profile; admin reviews before any photo appears in the archive
- Limited live profile editing for authorized users: `nickname` and `profileNote` apply immediately with full audit logging and admin-visible history
- Auth-gated data files (JSON data served from Firebase Storage, not public Hosting)
- Build-time JSON extraction from the RootsMagic `.rmtree` database for persons, photos, family relationships, and life event details — including corrected sex encoding and full date format decoding
- Build-time protected JSON projections for family browsing and source exploration: `directory.json`, `sources.json`, and `source-usage.json`
- Browser-side crawling of `names.htm`, `sources.htm`, and source-linked family sheets has been removed from the primary app data path; those exports now feed prebuilt JSON artifacts instead
- App version displayed in the header to distinguish staging from production
- Kinship resolver: relationship labels (Parent, Cousin, Aunt/Uncle, etc.) relative to the logged-in user's linked person, shown in profiles, search results, tree node details, and relationship-lens tree context with info popover

The newest Family Tree work shifts the tree from a structurally correct graph toward a more readable, lineage-first genealogy interface. The next phase is focused on code hardening, then Place Pages and Branch Research Guidance (2.6.2), and continuing the JSON-first migration so the remaining legacy RootsMagic HTML dependency keeps shrinking.

### Completed release catalog (verified against current codebase — 2026-04-16)

Completed releases and implementation state:

- Release 1.1 — Complete (9/9 milestones checked)
- Release 1.2 — Complete (8/8 milestones checked)
- Release 1.3 — Complete (8/8 milestones checked)
- Release 1.4 — Complete (9/9 milestones checked)
- Release 1.5 — Complete (9/9 milestones checked)
- Release 2.0 — Complete (11/11 milestones checked)
- Release 2.1.0 — Complete (10/10 milestones checked)
- Release 2.1.1 — Complete (7/8 milestones checked; one explicit deferred item documented in-section)
- Release 2.2.0 — Complete (5/5 milestones checked)
- Release 2.3.0 — Complete (8/8 milestones checked)
- Release 2.3.1 — Complete (13/13 milestones checked)
- Release 2.3.2 — Complete (7/7 milestones checked)
- Release 2.3.3 — Complete (6/6 milestones checked)
- Release 2.3.4 — Complete (4/4 milestones checked)
- Release 2.3.5 — Complete (7/7 milestones checked)
- Release 2.3.6 — Complete (8/8 milestones checked)
- Release 2.4.0 — Complete (10 checked milestones plus tracked follow-on hardening tasks retained in-section)
- Release 2.4.1 — Complete (8/8 milestones checked)
- Release 2.4.2 — Complete (solution-only section; no checklist format)
- Release 2.4.3 — Complete (8 core milestones checked plus retained follow-on moderation hardening tasks)
- Release 2.5.0 — Delivered, scoped first version (10/10 milestones checked)
- Release 2.6.0 — Complete (10/10 milestones checked)
- Release 2.6.1 — Complete (8/8 milestones checked)
- Release 2.6.2 — Complete (7/7 milestones checked)
- Release 2.6.3 — Complete (12/12 milestones checked)
- Release 2.7.0 — Complete (8/8 milestones checked)
- Release 2.7.1 — Complete (8/8 milestones checked)

Verification references in code/docs include: `src/main.js` (Research Library, analytics drill-down, notifications, admin tabs, photo uploads, tree features), `src/family-data.js` (JSON-first loading/search/tree data), `functions/index.js` (notifications + AI photo notes), `firestore.rules` and `storage.rules` (auth and moderation controls), and CI workflows (`.github/workflows/deploy-staging.yml`, `.github/workflows/deploy-production.yml`) for protected JSON upload + rules/index deployment.

---

## 4. Baseline Completed Before Release 1.1

- [x] Extract person-to-image mappings from the `.rmtree` RootsMagic database into a build-time mapping file
- [x] Associate people with photos so person-specific photo sections can be rendered from app data
- [x] Launch production with invited family-member access
- [x] Add Google OAuth + Firestore authorization controls
- [x] Parse and expose searchable family members from exported RootsMagic HTML pages
- [x] Display 685 photos in the gallery
- [x] Add an admin panel for inviting users
- [x] Establish staging environment (`familytree-staging`) and production CI/CD via GitHub Actions

---

## 5. Release Roadmap

---

## Release 1.1 — Person Profiles and In-App Photo Viewing

> Status: Complete ✓

**Goal:** Create a true in-app person profile experience and eliminate
raw image-tab navigation so users can move between people and photos
without leaving the application.

### Product outcomes

- A selected family member feels like a real profile page rather than a transient search result or embedded record.
- Users can open photos without being pushed out of the app into raw hosted files.
- Desktop and mobile users can navigate between search, profile, and photos without confusion or loss of context.
- The app becomes more emotionally coherent by presenting people, details, and images together.

### Engineering milestones

- [x] Add a dedicated in-app person profile view activated from search results
- [x] Build a `PersonProfile` view that renders person identity, life event details, sex badge, source reference content, and associated photos together
- [x] Replace any thumbnail behavior that opens raw image URLs in a new tab with an in-app lightbox overlay
- [x] Ensure closing a full-size image returns the user to the same profile state without losing position
- [x] Add previous/next image controls for people with multiple associated photos
- [x] Add a clearly labeled back button to home/search from every person profile
- [x] Make profile layout and image viewing work cleanly on small screens
- [x] Revalidate that existing person-photo mappings resolve correctly after UI changes
- [x] App version displayed in the header to distinguish staging from production builds

### Notes

Profile navigation uses show/hide state rather than URL routing. The profile is a full-page experience within the SPA; browser back navigates out of the app rather than between profile states, which is acceptable given the non-technical audience and the Back to Search button always present.

---

## Release 1.2 — Connected Gallery and Related Family Navigation

> Status: Complete ✓

**Goal:** Turn the gallery into a connected discovery surface that helps users move naturally between photos and family-member profiles.

### Product outcomes

- The gallery becomes part of the family-history journey rather than a disconnected photo bucket.
- Users can move from an image to the relevant person profile without having to start over at home.
- Person profiles feel connected through related people and related media.

### Engineering milestones

- [x] Update the in-app lightbox to show linked people for photos with person associations
- [x] Add person chips in the image viewer that navigate directly to the associated profile
- [x] Surface related family links on profiles for parents, spouse, and children where data exists
- [x] Add "Photos" section on person profiles showing all associated images
- [x] Add graceful fallback behavior for photos that have no associated people
- [x] Surface captions in the lightbox viewer where available
- [x] Verify gallery-to-profile-to-gallery navigation works cleanly on desktop and mobile
- [x] Confirm no gallery thumbnail opens directly to a raw image URL

---

## Release 1.3 — Family Feedback and Admin Review

> Status: Complete ✓

**Goal:** Let family members submit feedback, corrections, and questions through the app while preserving an orderly admin review path.

### Product outcomes

- Family members can contribute helpful corrections or questions without needing technical workarounds
- Admins get one consistent place to review submissions
- The app becomes more participatory without sacrificing trust or control

### Engineering milestones

- [x] Add a "Feedback" button accessible from every page in the main application header
- [x] Build a feedback form that captures submitter name, request type (Correction, New Information, Question, Other), related person, and message
- [x] Store feedback submissions in Firestore with submitter identity and timestamp
- [x] Add a Feedback tab in the admin panel showing a queue of all submissions sorted newest-first
- [x] Add Mark Resolved and Dismiss actions that record reviewer identity and timestamp
- [x] Show a pending-count badge on the Feedback tab when unreviewed items exist
- [x] Pre-fill the related person field when feedback is opened from a person profile
- [x] Add clear success and error messaging for feedback submission attempts

---

## Release 1.4 — Structured Suggestions and Photo Contributions

> Status: Complete ✓

**Goal:** Add a controlled workflow for suggesting factual edits and photo contributions while protecting historical accuracy through admin review.

### Product outcomes

- Relatives can help improve the family archive without direct access to underlying data stores
- Factual change suggestions are structured and citation-encouraged
- Photo contributions are possible without requiring formal citations
- All submissions remain pending until an admin acts on them

### Engineering milestones

- [x] Add a "Suggest a Change" button on every person profile that pre-fills the person's name
- [x] Build a submission modal with two modes: Factual Correction and Photo Contribution
- [x] Factual Correction mode captures: person, field being corrected, proposed value, and optional source citation
- [x] Citation is encouraged but not required — submissions without a source are accepted with an informational note on success; all submissions go to admin review regardless
- [x] Photo Contribution mode captures: related person, description, and optional photo location — no citation required
- [x] Store all submissions in a Firestore `submissions` collection with submitter identity, timestamp, and `status: pending`
- [x] Add a Submissions tab to the admin panel with approve/reject actions and a pending-count badge
- [x] Approve and Reject actions record reviewer identity and timestamp
- [x] Firestore rules ensure no family user can read the submissions queue; only admins can read and update

### Acceptance criteria

- Corrections and photo contributions can be submitted by any authorized family member
- Citation is recommended for corrections; the form communicates this clearly without blocking submission
- All submissions remain pending in Firestore until an admin explicitly approves or rejects them
- Admin decisions are recorded with reviewer identity and timestamp
- No unapproved submission surfaces to family users

### Implementation note

The original milestone specified citations as required. This was revised after implementation: because citations cannot be authenticated programmatically (a blank filename, a government URL, and a family Bible note all require equal human judgment), blocking on the presence of a citation adds friction without adding trust. Citations are now encouraged and surfaced to the admin for context, but are not enforced.

---

## Release 1.5 — Admin Media Linking and Invitation UX

> Status: Complete ✓

**Goal:** Improve maintainability by allowing admins to manually supplement person-photo associations and reducing friction in the invitation flow.

### Product outcomes

- Admins can add or correct photo-to-person links without a database rebuild
- Inviting new family members requires less manual coordination
- The archive becomes more maintainable as new media is added over time

### Engineering milestones

- [x] Add a Media Linking tab or section in the admin panel for associating an existing photo with a person
- [x] Load the current person-photos mapping so the admin can see existing associations before adding
- [x] Store manual media links in a Firestore `media_links` collection keyed by photo path and person ID
- [x] Merge manual Firestore links with build-time JSON associations at runtime in `family-data.js`
- [x] Validate that a photo path and person ID are both present before saving a manual link
- [x] Prevent duplicate links for the same photo-person pair
- [x] Improve the invitation UI with a pre-written invitation message the admin can copy, including the app URL and sign-in instructions
- [x] Add a "Copy invite message" button that puts the pre-filled text on the clipboard
- [x] Add staging verification steps for manual media-link persistence and invitation copy behavior

### Acceptance criteria

- Admins can link an existing photo to a person from within the app without a rebuild
- Manual links persist across page reloads
- Manual links appear alongside database-derived links on the person profile and in the lightbox
- The invitation flow provides a ready-to-send message the admin can copy with one click
- Removing a manual link (if needed) is possible from the same admin interface

### Out of scope

- Automated email delivery (requires a backend service; deferred to a future release if needed)
- Self-service public invitations
- Bulk media-tagging imports
- Non-admin moderation workflows

---

## Release 2.0 — Homepage Framing and Experience Polish

> Status: Complete ✓ (shipped as major version bump from 1.x)

**Goal:** Redesign the first-run experience and all primary navigation to be welcoming and clear for non-technical family members.

### Product outcomes

- Arriving family members see a welcoming archive framing, not a bare search form
- Browse navigation uses descriptive cards instead of unlabeled buttons
- Person search results show photo thumbnails, making identification immediate
- Profile header shows the person's primary photo for instant recognition
- Context-aware back navigation always returns the user to where they came from
- Login screen communicates the purpose of the archive before signing in
- Mobile header is compact and navigable on phones

### Implementation details

- [x] Add home hero banner with archive description and live family/photo stats
- [x] Rename "Search Family Members" → "Find a Family Member"
- [x] Rename "Browse" → "Explore"; replace plain buttons with descriptive browse cards
- [x] Show primary photo thumbnail in search result rows
- [x] Show primary photo as circular avatar in profile header
- [x] Context-aware back button: tracks gallery, surnames, or search origin
- [x] Login screen: tree icon, feature list, clearer invite copy
- [x] Mobile header: compact padding, hide "Welcome" label on small screens, wrapping actions
- [x] Fix Firestore `media_links` rule: allow all authorized users to read (admin-only write)
- [x] Guard all admin Firestore calls with `auth.currentUser` check (no errors in local dev mode)
- [x] Fix DOM warning: wrap local dev password input in a form element

### Deferred

- Custom domain (Track A of original Release 1.6, still pending user's domain decision)
- Photo AI analysis and genealogy research features (planned for next phase)
- Major visual rebrand

---

## Release 2.1.0 — Family Analytics

> Status: Complete ✓

**Goal:** Add a visually clear analytics page that helps relatives understand the shape and depth of the family archive at a glance, using only the data already extracted at build time.

### Product outcomes

- The application gains an "archive overview" destination that is informative, welcoming, and easy to revisit
- Relatives can see the breadth of the family record — how many people, how far back records reach, what is well-documented and what is not
- Analytics are grounded in actual app data with honest labeling where coverage is partial

### Engineering milestones

- [x] Add an Analytics browse card to the home Explore section
- [x] Add an analytics view accessible from the home page
- [x] Compute and display key summary stats: total family members, total photographs, people with associated photos, and earliest–latest birth year span
- [x] Show gender distribution across all 512 family members
- [x] Show birth-decade distribution as a horizontal bar chart
- [x] Show average, minimum, and maximum lifespan for people with both birth and death years recorded
- [x] Show top surnames and top given names by frequency as ranked bar lists
- [x] Clearly label any metric that is based on partial data (e.g., lifespan is only for people with both dates)
- [x] Add a back-to-home button from the analytics view
- [x] Verify all stats are accurate against the extracted JSON sources before staging promotion

### Acceptance criteria

- The analytics page is visually appealing, readable on mobile, and grounded in actual app data
- Missing or partial birth/death data degrades gracefully without broken charts or misleading totals
- No new external dependencies are introduced — all charts use pure CSS

### Out of scope

- Birth-place or country distribution (requires data quality review first)
- Spouse/children count analytics (current extraction is scoped to photo subjects only)
- Interactive filtering or drill-down (deferred to Release 2.1.1)

---

## Release 2.1.1 — Analytics Drill-Down Directory

> Status: Complete ✓

**Goal:** Make each statistic on the Family Analytics page interactive so a relative can click any metric and immediately see the list of family members who contributed to it.

### Product outcomes

- Analytics stops being a read-only summary and becomes a discovery tool
- A relative curious about a surname, birth decade, or gender count can click through to see the actual people
- The directory listing uses the same person-profile navigation already in the app — no new destination needed

### Engineering milestones

- [x] Gender distribution — clicking Male, Female, or Unknown opens a directory of all matching members
- [x] Birth-decade bars — clicking any decade bar opens a directory of all people born in that decade
- [x] Top surnames — clicking a surname opens a directory of all members with that surname
- [x] Top given names — clicking a given name opens a directory of all members with that given name
- [ ] Most photographed — clicking a name navigates directly to that person's profile (deferred — most photographed section not currently visible in analytics view)
- [x] Directory view: shows name + birth/death dates, sorted alphabetically; each row links to the full person profile
- [x] Add a clear back-to-analytics path from the directory view
- [x] Counts that are labeled as partial (e.g. lifespan) should not be clickable, or should display a clear explanation if clicked

### Acceptance criteria

- Every clickable stat produces a non-empty, correctly filtered list
- Clicking a name in the directory opens the person profile (same flow as search results)
- Back from directory returns to the analytics page, not the home page
- Stats with no actionable drill-down (e.g. date-range summary lines) are not styled as interactive

### Implementation notes

- `getPeopleForFilter(filterType, value)` filters `personDetailsData` by gender, decade, surname, or given name; maps each match through `getPersonById()` to get navigable result objects; returns alphabetically sorted
- `renderAnalyticsDirectory(title, people)` renders into `analyticsContent` (replaces analytics stats in-place); back button re-renders analytics; profile back-navigation uses `profileOpenedFrom = 'analytics-directory'`
- Lifespan, QC, data coverage, and summary cards intentionally left non-interactive — partial data or multi-factor aggregates with no clean single-criterion drill-down
- `buildBarRow()` extended with optional `onClick` parameter; adds `analytics-bar-clickable` class, `role=button`, keyboard Enter/Space support

### Out of scope

- Compound filters (e.g. female + born 1940s simultaneously)
- Exporting the filtered list
- Sorting the directory by anything other than name

---

## Release 2.2.0 — Family Tree Data Layer

> Status: Complete ✓

**Goal:** Extend the build-time data extraction to support a correct, complete family tree: add a living flag to every person, restructure family units to preserve which children belong to which parental pair, and scope extraction to all 512 people rather than photo subjects only.

### Engineering milestones

- [x] Add `PersonTable.Living` to `extract-person-details.js`; output `living: true|false` per person
- [x] Restructure `extract-person-family.js` to output family units (familyId, spouseId, children array per family) instead of a flat children list; this preserves which children belong to which parental pair so half-sibling relationships remain accurate
- [x] Scope `extract-person-family.js` to all persons in PersonTable, not just photo subjects
- [x] Re-extract and validate: confirm all 512 persons are present, half-sibling relationships are correctly attributed to the right family unit, and the living flag matches RootsMagic source data
- [x] Update `family-data.js` accessors to consume the new family-unit structure without breaking existing profile and lightbox behavior

### Acceptance criteria

- `person-details.json` includes a `living` field for every person — 119 living, 393 not living, sourced directly from `PersonTable.Living`
- `person-family.json` contains family unit objects that map each child to a specific parental pair — 23 remarriage cases confirmed correctly attributed
- All 512 persons appear in the family extraction regardless of photo association — 506 have at least one relationship (6 have none)
- Existing person profile, lightbox, and family chip behavior is unaffected — flat `{ id, name }` fields preserved, build passes clean

### Out of scope

- Tree rendering (Release 2.3.0)
- Any UI changes

---

## Release 2.3.0 — Family Tree Visualization

> Status: Complete ✓

**Goal:** Render a browsable, ancestor-first family tree rooted in the youngest living generation, with generation-depth navigation and direct links to person profiles.

### Rooting strategy

The tree is rooted in living individuals with no recorded children (leaf nodes of the living generation). From those roots the tree expands **upward** through parent relationships, generation by generation. Each family unit has a couple node between child and parents so spouse lateral positioning is structurally correct. In cases of divorce or remarriage, each spouse relationship is a distinct family unit and children are attached to the correct parental pair. Where parent data is missing, the branch ends cleanly.

### Product outcomes

- Relatives can explore one connected view of the family instead of hopping between isolated profiles
- The tree starts where the family is now and reaches back through history
- Shared ancestors appear once, not duplicated per branch (DAG layout via Cytoscape.js + dagre)
- Generation depth slider lets users zoom in or out across all 10 recorded generations
- Tapping a node opens the person profile; Back returns to the tree

### Engineering milestones

- [x] Select and integrate Cytoscape.js with cytoscape-dagre layout (vanilla JS, no framework required)
- [x] Build the tree data structure in `family-data.js` (`buildTreeData()`): identify root set (82 living childless persons), BFS upward, deduplicate shared ancestors — 295 total reachable persons across 10 generations
- [x] Render the initial tree from the root set with correct generational layout (dagre `rankDir: BT`) and couple nodes for spouse lateral positioning
- [x] Implement generation-depth control (− / +) with stable Cytoscape reflow on each step
- [x] Allow navigation from any tree node to the person profile and back to the tree
- [x] Add "find in tree" jump-to-person search with viewport animation and auto-depth expansion
- [x] Remarriage and half-sibling scenarios handled correctly via family-unit couple nodes
- [x] Build verified: 916KB bundle / 283KB gzipped — acceptable for a private family app

### Implementation notes

- 82 roots, 295 total reachable persons, 10 generations deep
- Default initial depth: 2 (roots + parents + grandparents = 190 visible persons)
- Node colors: green border = living, blue border = male, pink border = female, bold green = root
- Couple nodes (small grey dots) sit between each child and their parents in the layout
- `profileOpenedFrom = 'tree'` added so Back from profile returns to tree view

#### Keyboard navigation (added post-2.3.0)

Arrow keys pan the viewport 120 rendered pixels per press (animated, interruptible via `cy.stop(true)`). `+`/`=` and `-` zoom by a 1.25× step centred on the viewport midpoint. Mouse-wheel zoom uses Cytoscape's built-in `userZoomingEnabled` — no custom handler needed. Keyboard handling is guarded by: tree view must be visible, and `document.activeElement` must not be an input/textarea/select. A one-time `treeKeyboardWired` flag prevents duplicate listeners across `initTree()` calls.

#### Profile → Back-to-tree state restoration (added post-2.3.0)

When a user taps a person node, `{ zoom, pan }` is snapshotted into `treeViewport` and the `personId` saved in `treeLastPersonId`. On return (`showTreeArea()`), if a snapshot exists the viewport is instantly restored via `cy.viewport()` then a 350 ms `cy.animate({ center, zoom })` re-centres on the tapped node — so the user lands in the same position and zoom level they left, with a brief focus animation confirming which person they viewed. Without a snapshot (first open or direct navigation), the tree falls back to `cy.fit()`. The snapshot is consumed (set to `null`) on restore so it does not persist across unrelated navigations.

### Out of scope

- In-browser editing of the relationship graph
- Auto-merging ambiguous family links
- Advanced genealogy inference beyond current extracted data

---

## Release 2.3.1 — Tree Interaction Enhancements and Layout Overhaul

> Status: Complete ✓

**Goal:** Make the family tree genuinely interactive and structurally correct — keyboard-driven navigation, per-user identity anchoring, and a custom layout engine that respects real family groupings instead of relying on a generic graph algorithm.

### Product outcomes

- Any family member can navigate the tree with keyboard shortcuts and the viewport resets correctly after viewing a profile
- The tree auto-centres on the logged-in user's family member when first opened
- Spouses are always rendered adjacent, siblings are horizontally grouped under the correct parent family, and birth-year history is visible in the vertical axis

### Engineering milestones

#### Interaction

- [x] Keyboard pan (arrow keys, 120 px per press, animated and interruptible) and zoom (+/−, 1.25× step centred on viewport)
- [x] Mouse-wheel zoom preserved via Cytoscape `userZoomingEnabled`; keyboard handler guarded so keys reach text inputs normally
- [x] Viewport and last-tapped person snapshotted before opening a profile; `showTreeArea()` restores zoom, pan, and re-centres on the last-viewed node with a 350 ms animation

#### User↔Person link (admin assignment)

- [x] Admin → Users tab: Link button opens an in-panel person search; selected person's id is written to the user's `authorized_users` document in Firestore
- [x] On login, `checkUserAuthorization()` reads `personId` from the user's Firestore document and stores it in `linkedPersonId`
- [x] On tree init, `focusLinkedPerson()` centres the viewport and highlights the linked node with a purple `linked-user` Cytoscape class
- [x] Admin Firestore rule fix: `allow read` now includes an admin exception (`get(...).data.role == 'admin'`) so all authorized users are visible in the Users tab; previously the tab showed an empty list due to the missing exception

#### Custom layout engine (dagre replaced)

- [x] `runFamilyLayout()` replaces cytoscape-dagre with a bottom-up family-aware X algorithm: roots sorted by birth-family group then birth year; each parent's ideal x = mean of visible children's x; forward + backward passes enforce minimum node separation
- [x] Y-axis is a continuous birth-year timeline: each person's y = (maxYear − birthYear) × 8 px so oldest ancestors sit at the bottom and youngest generation at the top; fallback chain for missing years: depth-mean → 28-yr/generation estimate
- [x] Spouse-family (sf) nodes added to `buildTreeData()` as a second node type distinct from birth-family (pf) nodes; both spouses point into the sf node with edges `person → sf`
- [x] `getDisplayGroupId()` returns sf familyId when a visible sf node exists, otherwise parentsFamilyId — this key is used for root and tier sorting so spouse pairs cluster before unrelated families are placed
- [x] Authoritative spouse-adjacency pass after initial placement: re-centres each visible couple over their children's mean x, or over their own midpoint for depth-0 pairs with no visible children
- [x] Node dimensions widened to 170 × 50 px, GAP 40 px, text-max-width 156 px for improved readability

### Notes

- `cytoscape-dagre` import and `DAGRE_OPTS` constant remain in the bundle for now; removal is a non-urgent cleanup
- `coupleDepth` visibility rule differs by node type: sf nodes use `<= maxGen` (both spouses same depth); pf nodes use `< maxGen` (parents one tier above their couple node)

---

## Release 2.3.2 — Per-User Tree Position Persistence

> Status: Complete ✓

**Goal:** Remember each user's manual node adjustments from session to session so the tree always reopens in the state they left it, on any device.

### Product outcomes

- Users can rearrange the tree to suit their mental model and return to that exact layout days later
- Position memory is per-user and cross-device (stored in Firestore, not localStorage)
- New nodes revealed by the depth slider are placed by the layout algorithm without displacing nodes the user has already positioned

### Engineering milestones

- [x] On `dragfree` event (node drag ends), write the moved node's position to `tree_layouts/{userEmail}` in Firestore as `{ nodeId: { x, y } }`; debounce to avoid a write per pixel
- [x] On tree init, run `runFamilyLayout()` first to place all nodes, then overlay saved positions from Firestore for any node id that exists in both the saved state and the current graph
- [x] When the depth slider reveals new nodes, compute positions only for nodes without a saved entry; leave nodes with a saved position unchanged
- [x] Add a "Reset layout" button in the tree toolbar that clears the user's Firestore layout document and re-runs the default algorithm
- [x] Firestore rule: `tree_layouts/{userEmail}` — owner read/write only (no other user or admin can read another's layout)
- [x] Handle the case where a saved node id no longer exists in the current tree (person removed from export) — stale keys are silently ignored
- [x] Verify on staging: drag a node, close the browser, reopen — node is in the moved position

### Acceptance criteria

- Node positions survive a full page reload and a new browser session
- Two users on different devices see independent layouts
- Depth-slider expansion places new nodes without disturbing manually positioned nodes
- Reset layout returns the tree to the computed default within one interaction
- No position data from one user is readable by another

### Implementation notes

- `treeSavedLayout` is an in-memory map `{ nodeId: { x, y } }` populated by `loadTreeLayout()` on tree open
- `saveTreeLayout()` uses an 800 ms debounce — rapid drags produce one write, not many
- `overlayTreeLayout()` is called at the end of every `applyTreeDepth()` call so saved positions survive depth-slider changes
- `resetTreeLayout()` calls `deleteDoc()` on the Firestore document and re-runs `applyTreeDepth()` with an empty overlay
- Stale node ids (person no longer in export) are silently ignored during overlay — no cleanup needed in Firestore

### Out of scope

- Sharing a custom layout with other users
- Named/saved layouts (multiple layout slots per user)
- Admin ability to see or reset other users' layouts

---

## Release 2.3.3 — Tree Cluster Selection and Multi-Node Moves

> Status: Complete ✓

**Goal:** Let users select a group of related nodes and move them together as a unit, so rearranging an entire branch or family cluster requires one drag instead of many.

### Product outcomes

- Users can reorganise entire branches or family clusters without repositioning each node individually
- Selection is additive and visual — selected nodes are clearly highlighted before the move
- The feature feels natural alongside existing drag-to-pan behavior (no accidental selection during normal navigation)

### Engineering milestones

- [x] Enable Cytoscape `boxSelectionEnabled: true`; Shift+drag on canvas background activates rubber-band box selection without conflicting with normal pan
- [x] `node:selected` style: amber border (#d97706), border-width 3, amber overlay at 12% opacity, z-index 998
- [x] Shift+click adds nodes to selection (tap handler skips navigation when shiftKey is set); Escape clears selection via keyboard handler; click on empty canvas clears selection
- [x] `grab` handler records start positions of all selected nodes; `drag` handler applies delta from grabbed node to all other selected nodes so cluster moves as a rigid unit
- [x] `dragfree` handler saves all selected nodes' positions to Firestore when `clusterDragActive` is true
- [x] Right-click (`cxttap`) on a person node selects all persons sharing the same birth-family couple node (siblings), plus the person's visible spouse-family couple nodes

### Acceptance criteria

- Box or Shift+drag selects multiple nodes without interfering with normal pan behavior
- All selected nodes move as a rigid unit during drag
- Moved positions are persisted per user (depends on 2.3.2)
- Selection can be cleared with a single Escape press or click on empty canvas
- The "Select all in family" shortcut correctly identifies sibling groups

### Out of scope

- Graph-topology-aware moves (e.g. auto-repositioning connected edges or descendent nodes)
- Saving named selection sets
- Cross-user shared selections

---

## Release 2.3.4 — Tree UI Polish: Legend, Re-center, and Default Depth

> Status: Complete ✓

**Goal:** Reduce disorientation for new users and make the tree's color system self-explanatory without needing external documentation.

### Product outcomes

- Any user who gets lost in the tree can return to their own family member with one tap
- The meaning of every border and fill color is visible on demand without leaving the tree
- The tree opens fully expanded by default so the complete family history is immediately visible

### Engineering milestones

- [x] Add a re-center button (⌖) to the tree toolbar that calls `focusLinkedPerson()` — animates the viewport back to the logged-in user's linked family member node; button is hidden if no person is linked to the account
- [x] Add a collapsible Legend button (ⓘ Legend) to the tree toolbar that toggles a floating panel listing all node color meanings: root (dark teal), linked user (purple), living male/female (blue/pink + green fill), deceased male/female (lighter blue/pink), and unknown sex (teal)
- [x] Legend panel floats at top-right of the canvas, overlays the tree without displacing other UI, dismisses by clicking Legend again
- [x] Default tree depth changed from 2 generations (grandparents) to `treeMaxDepth` (all available generations — 10 in current data) so the full family history is visible on first open

### Notes

- Re-center button uses the existing `focusLinkedPerson()` function — no new animation logic needed
- Legend swatches use the exact same border colors and background fills as the Cytoscape node styles so the legend is always in sync

---

## Release 2.3.5 — Home Screen Redesign and Search Enhancement

> Status: Complete ✓

**Goal:** Rebrand the app to its permanent name, reduce visual clutter above the fold, and replace the naive substring search with a ranked, multi-field indexed search engine.

### Product outcomes

- The app presents under its permanent name "Fuhr Family Archive" across the browser tab, header, and login screen
- The header carries a compact stat line ("512 members · 685 photos") — no separate hero card needed
- The search card occupies less vertical space while becoming substantially more useful
- Users can find family members by year ("1895"), place ("Davenport"), or partial name and receive ranked results — exact and prefix matches surface first

### Engineering milestones

- [x] Rename `<title>` and all `<h1>` instances to "Fuhr Family Archive"
- [x] Remove `.home-hero` section (SVG icon + "Your Family Archive" card + hero-stats badges)
- [x] Add `.header-title-top` wrapper inside `.header-title`; add `#header-stats` subtitle div below it in the header
- [x] `showMainApp()` populates `#header-stats` with plain-text count line; adds `loadPersonDetails()` to its `Promise.all` and calls `buildSearchIndex()` after data loads
- [x] Search card padding reduced to `1rem 1.5rem`; heading changed to "Search the Archive"; placeholder updated to "Search by name, year, or place…"
- [x] `buildSearchIndex()` in `family-data.js` — merges `familyData` with `personDetailsData`, building enriched entries with `nameLower`, `nameWords`, `nickname`, `birthYear`, `deathYear`, `places[]`
- [x] `searchFamilyMembers()` rewritten with per-term scoring: exact full name (100), name prefix (80), first/last name word prefix (75), name contains (60), nickname prefix/contains (72/65), year exact (50), place contains (30); multi-word queries sum per-term bests; falls back to substring search if index not yet built

### Notes

- `buildSearchIndex()` is pre-built in `showMainApp()` so the index is ready before the user's first search
- Fallback to old substring search if `personDetailsData` has not loaded (e.g., network delay)

---

## Release 2.3.6 — Admin Default Tree Layout

> Status: Complete ✓

**Goal:** Allow the admin to promote their current tree arrangement to a shared default that every user sees until they personalise their own view, with per-user skip protection for family members who have already arranged their tree.

### Product outcomes

- The admin can establish a clean, curated starting layout once and have every new or reset user see it automatically
- Family members who have already personalised their layout are not disrupted unless the admin explicitly chooses to reset them
- The admin sees clearly which users have custom layouts before making the decision

### Engineering milestones

- [x] Added `tree_layouts/_default` Firestore document: all authorized users can read; only admin can write
- [x] Updated `tree_layouts/{email}` Firestore rule to allow admin writes (needed to delete individual user docs)
- [x] `loadTreeLayout()` falls back to `_default` when the user has no personal layout doc
- [x] "Set Default" button added to tree toolbar (hidden for non-admin users)
- [x] `openSaveDefaultLayoutModal()` fetches all authorized users, checks each for a personal layout, renders skip checkboxes for users who have one
- [x] `executeSaveDefaultLayout()` writes `treeSavedLayout` to `_default`, then deletes personal docs for non-skipped users
- [x] Modal close on ×, Cancel, backdrop click; status message confirms reset count and skip count
- [x] `.secondary-btn` CSS added for the Cancel button style

### Notes

- The admin's own personal doc is never touched — their arrangement stays as-is
- Users whose personal doc is deleted will automatically see `_default` on next tree open (no forced reload needed)
- Future users who have never opened the tree also see `_default` via the fallback in `loadTreeLayout()`

---

## Release 2.4.0 — Photo Upload and Admin Moderation

> Status: Complete ✓

**Goal:** Let family members contribute photos directly to a person profile, with admin review before any image appears in the archive.

### Infrastructure decisions (resolved)

- **Storage:** Firebase Storage — bucket `gs://familytree-staging.firebasestorage.app` (enabled, rules deployed)
- **AI descriptions:** Deferred to Release 2.4.1 — Gemini, admin-triggered per-photo (not automatic)

### Product outcomes

- Family members can upload a photo linked to a specific person without needing repository access
- Every upload is pending until an admin explicitly approves or rejects it
- Approved photos appear in person profiles and the lightbox alongside existing archive photos
- Provenance is always preserved: who uploaded, when, and which person the photo is linked to

### Engineering milestones

- [x] Enable Firebase Storage in firebase.json; create `storage.rules` allowing authenticated uploads (10 MB max, images only) and admin-only delete
- [x] Add `photo_uploads` Firestore collection with composite indexes for (personId + status) and (status + uploadedAt)
- [x] Add Firestore rules for `photo_uploads`: any authorized user can create and read approved docs; admin can read all and update status
- [x] Add "Add Photo" button to the person profile header
- [x] Build an upload modal: person pre-filled, file picker (image only), optional caption, upload progress bar, submission confirmation
- [x] Upload file to `uploads/{personId}/{timestamp}_{filename}` in Firebase Storage; write metadata doc to `photo_uploads` with status: pending
- [x] Update `isValidFamilyTreeUrl()` to also accept Firebase Storage download URLs for this project's bucket
- [x] Merge approved `photo_uploads` for the current person into profile photo display and lightbox
- [x] Add "Photo Uploads" tab to the admin panel with a pending-count badge
- [x] Admin queue shows thumbnail, person name, uploader, date, and caption; Approve and Reject buttons update status and record reviewer identity + timestamp

### Acceptance criteria

- Any authorized family member can upload a photo from a person profile without leaving the app
- Uploaded photos are not visible to other users until approved
- Approved uploads appear in the person profile photos section and lightbox
- Admin can approve or reject from the admin panel; decisions are recorded with identity and timestamp
- Storage rules prevent non-image uploads and enforce a 10 MB size limit

### Staging verification checklist

- [ ] "Add Photo" button visible on a person profile; opens upload modal with person name pre-filled
- [ ] File picker rejects non-image files and files over 10 MB with a clear message
- [ ] Image preview renders after selecting a file
- [ ] Uploading a valid photo shows progress bar, then success confirmation
- [ ] Submitted photo appears in Firebase console under Storage → `uploads/{personId}/`
- [ ] Corresponding Firestore doc exists in `photo_uploads` with `status: pending`
- [ ] Photo does NOT appear on the person profile for a non-admin user while pending
- [ ] Admin opens Photo Uploads tab; pending upload is visible with thumbnail, person name, uploader, date
- [ ] Admin approves → `status` updates to `approved`; item leaves the queue; badge updates
- [ ] Approved photo now appears on the person profile and in the lightbox alongside existing photos
- [ ] Admin rejects → `status` updates to `rejected`; item leaves the queue; badge updates
- [ ] Rejected photo does not appear on any person profile
- [ ] Upload modal backdrop click and × button both close without submitting

### Implementation notes

- Files stored at `uploads/{personId}/{timestamp}_{sanitized_filename}` in Firebase Storage
- Firestore `photo_uploads` doc fields: `personId`, `personName`, `storagePath`, `downloadURL`, `caption`, `uploaderEmail`, `uploadedAt`, `status`, `reviewedBy`, `reviewedAt`
- `loadApprovedUploads(personId)` queries Firestore and returns photos in the standard format expected by `renderProfilePhotos()` and the lightbox
- `isValidFamilyTreeUrl()` extended to accept `https://firebasestorage.googleapis.com/…familytree-staging…` URLs
- Storage files are not deleted on rejection — admin cleans up manually via Firebase console if needed

### Out of scope

- AI-generated descriptions (Release 2.4.1)
- Automatic rejection or approval without human review
- Bulk upload or drag-and-drop multi-file upload
- Admin ability to delete the Storage file directly from the app

---

## Release 2.4.1 — AI-Assisted Photo Notes (Gemini)

> Status: Complete ✓

**Goal:** Allow admins to generate draft photo notes that help family members better understand an image and spark further research.

### Purpose

The goal is not to replace human captions or identify people with certainty. The goal is to generate useful supporting context from the photo itself:

- a concise visual summary
- possible historical or era cues
- one or two research leads that may help a family member investigate further

### Decisions

- **AI service:** Gemini (`gemini-2.0-flash`) via Firebase Cloud Function — API key stays server-side, never exposed to the client
- **Trigger:** Admin-initiated per photo only — notes are generated only when explicitly requested
- **Storage:** `photo_descriptions` Firestore collection, keyed by photo path — stored separately from human-written captions so generated content is always distinguishable
- **Visibility:** Presented as contextual supporting notes, not authoritative facts — speculative language required for all inference
- **Admin control:** Admins can regenerate, edit, or withhold any note before it is visible to family members
- **Status lifecycle:** `draft` → `approved` → `published` — family members see notes only when `published`

### Product outcomes

- Photos with vague filenames or no caption gain meaningful context that helps family members understand what they are looking at
- Generated notes spark curiosity and give family members concrete leads for further research
- The framing communicates honest uncertainty — observations are presented as possible, not factual
- Admins remain in full control; no note auto-publishes

### Generated note structure

Each `photo_descriptions` document contains:

| Field | Description |
| --- | --- |
| `visualSummary` | Description of what is clearly visible in the image |
| `historicalContext` | Cautious observation about possible era, clothing, setting, or occasion |
| `researchLead` | One or two concrete avenues a family member could explore to learn more |
| `generatedAt` | Timestamp of generation |
| `model` | Model identifier (e.g. `gemini-2.0-flash`) |
| `status` | `draft` \| `approved` \| `published` |
| `editedBy` | Admin email if the note was manually edited after generation |
| `editedAt` | Timestamp of last admin edit |

### Model prompt contract

The Cloud Function enforces this behavioral contract for every generation:

> Analyze this family-history photo and produce three fields:
>
> - `visualSummary`: describe only what is clearly visible.
> - `historicalContext`: provide cautious, non-authoritative observations about possible era, clothing, setting, or occasion.
> - `researchLead`: suggest one or two concrete avenues a family member could explore to learn more.
>
> Do not identify people by name unless that information is already provided in metadata.
> Do not state dates, places, or relationships as facts unless they are known.
> Use cautious wording for inference: "may," "could," "possibly," "worth comparing," "should be verified."
> Keep the tone helpful, clear, and family-history oriented.

If the photo has associated person names (from `person-photos.json` or `photo_uploads`), those names are passed as context so the model can anchor its output where identity is known.

### Lightbox display

Photo notes surface below the human caption in a clearly secondary role, using the following three-section layout:

```text
Photo Note
[visualSummary]

Historical Note
[historicalContext]

Research Clue
[researchLead]
```

All three sections are rendered only when a note is `published`. The section header ("Photo Note" etc.) distinguishes this content visually from human-written captions — no "AI" label is shown to family members.

### Admin UI

- **"Generate Photo Note"** button in the admin lightbox view (visible only to admins, only when viewing a photo)
- On click: calls the Cloud Function, stores the result as `status: draft`, renders a preview panel in the admin view
- Admin can edit any field inline before publishing
- **"Publish"** action sets `status: published` — note becomes visible to family members
- **"Regenerate"** replaces the current draft (requires confirmation if already published)

### Engineering milestones

- [x] Deploy a Firebase Cloud Function (`generatePhotoNote`) that accepts a photo path and optional person names, fetches the image from Storage, calls Gemini vision API, and returns structured `{ visualSummary, historicalContext, researchLead }`
- [x] Store the result in `photo_descriptions/{base64url(photoPath)}` with `status: draft` and full metadata fields
- [x] Add "Generate Photo Note" button to the admin lightbox — visible only when admin is viewing a photo
- [x] Render a draft preview panel after generation: three labeled fields, each editable inline before publishing
- [x] Publish action writes `status: published` and captures editedBy + editedAt; Regenerate prompts for confirmation before overwriting
- [x] In the family-facing lightbox, render the three-section Photo Note block when `status === 'published'` for the current photo
- [x] Firestore rules: any authorized user can read `photo_descriptions` where `status === 'published'`; only admin can read drafts and write
- [x] Pass known associated person names as prompt context where available (from `person-photos.json` mappings)

### Out of scope

- Bulk generation across the 685-photo archive (admin-triggered per photo only)
- Automatic generation on upload approval
- Face recognition or person identification
- Public visibility before admin publish action

---

## Release 2.5.0 — Controlled Family Data Editing and Change Audit

> Status: Delivered (scoped first version)

**Goal:** Allow trusted users to update family-member information while preserving a strong historical audit trail and clear administrator visibility.

### Product outcomes

- Family members can help correct or enrich records directly in the app
- Every edit remains historically reviewable with before/after values, actor identity, and timestamps
- Administrators are notified whenever factual data changes are submitted or saved

### Engineering milestones

- [x] Add edit capability for approved family-member fields from the person profile via a dedicated modal launched from the live profile view
- [x] Define exactly which fields are editable in-app in the first version: `nickname` and `profileNote` only
- [x] Require authenticated identity for all edits and record who made the change and when
- [x] Capture before and after values for every changed field in a dedicated audit/change-log store
- [x] Send a structured administrator notification on save containing the person, changed fields, previous values, new values, editor identity, and timestamp
- [x] Decide and document the publication rule: `nickname` and `profileNote` apply immediately with audit logging; factual corrections still go through the separate admin-reviewed Suggest a Change path
- [x] Add an admin review/history view for browsing past changes by person, editor, and date
- [x] Ensure Firestore rules and backend enforcement prevent unauthorized direct data mutation
- [x] Add clear success, conflict, and validation messaging so users understand what happened to their edit
- [x] Update operator documentation for editing, review, and audit workflows

### Acceptance criteria

- A signed-in authorized user can submit a valid update to a family member record from within the app
- Every saved change records before/after values, actor identity, and timestamp
- Administrators receive a clear notification payload for each save event
- Change history is reviewable and cannot be silently bypassed through the normal UI path
- The live record never changes without corresponding audit evidence

### Out of scope

- Free-form collaborative wiki editing with no accountability
- Silent destructive overwrites of historical data
- Complex merge/conflict-resolution workflows across simultaneous editors

---

## Release 2.6.0 — Family Research Library (Phase 1)

> Status: Complete ✓

**Goal:** Transform the current flat Sources list into a more useful, human-readable research surface that preserves citation-grade evidence while helping family members understand what each record type means and why it matters.

### Product outcomes

- The Sources area becomes easier to browse for non-technical family members
- Each source feels connected to people, places, and branches in the archive rather than appearing as an isolated citation
- Users can understand what a source may reveal without needing genealogical experience
- The app preserves historical rigor while becoming more inviting and practical for family exploration

### Engineering milestones

- [x] Keep the current citation list behavior as the baseline `Cited Sources` view so exact source provenance is preserved
- [x] Add normalized source metadata for `Cited Sources`: `sourceType`, `jurisdiction`, `yearStart`, `yearEnd`, `provider`, `repository`, `relatedPlaces`, `relatedSurnames`, and `externalUrl`
- [x] Derive source-type badges for common record groups such as Census, Immigration, Naturalization, Military, Newspaper, Yearbook, Cemetery, Church, and Vital Record
- [x] Convert each source row into an expandable item with a short description and a `Why this matters` summary
- [x] Show related surnames, related places, and linked people counts where that context can be derived safely from cited family-sheet rows
- [x] Surface direct external links where available, while keeping the source citation visible in-app
- [x] Add filter controls for source type, place, year range, and `has external link`
- [x] Preserve mobile readability and avoid large citation walls by default
- [x] Move source metadata and source-usage derivation out of browser HTML crawling into protected build-time artifacts: `sources.json` and `source-usage.json`
- [x] Promote the exported name index into a protected build-time directory artifact: `directory.json`, removing runtime parsing of `names.htm`

### Acceptance criteria

- A family member can browse the source list and understand, in plain language, what a record is and why it may matter
- Citation-grade source text remains available and is not replaced by simplified summaries
- Source filtering works without breaking existing profile or source rendering flows
- The UI remains usable on phone-sized screens
- Staging validation confirms that no source detail is lost during the display upgrade

### Notes

This release improves the existing Sources destination rather than replacing it. The intent is to make the current evidence list more useful before introducing broader research-library navigation.

Post-implementation hardening also turned the cited-sources experience into a JSON-first flow. The browser no longer fetches `sources.htm` or scans exported family sheets on demand; build-time scripts now emit `sources.json` and `source-usage.json`, the family directory loads from `directory.json` instead of parsing `names.htm` at runtime, surname browsing now renders in-app from that same protected directory data instead of loading `surnames.htm`, and the legacy profile iframe has now been retired in favor of the extracted JSON-backed profile view. This migration should remain visible in the roadmap because it materially changes the application's rebuild path, release verification surface, and future promptability for any AI-assisted ground-up regeneration effort.

---

## Release 2.6.1 — Research Library and Guided Pathways (Phase 2)

> Status: Complete ✓

**Goal:** Add a dedicated Research Library experience that separates exact cited evidence from broader family-history exploration and teaches relatives where to continue researching.

### Product outcomes

- Family members gain a friendlier entry point than a raw source list
- The app begins to function as a research companion, not just a record viewer
- Users can explore by record category and by research intent rather than by citation title alone
- The archive becomes more educational and more likely to inspire further family-history contributions

### Engineering milestones

- [x] Add a new top-level destination: **Research Library**
- [x] Split source exploration into two clear surfaces: **Cited Sources** and **Research Library**
- [x] Build category cards for major record groups already present in the archive, including Census & Population, Immigration & Naturalization, Marriage/Birth/Death, Newspapers & Obituaries, Military Service, Cemeteries & Burial, School Yearbooks, Church Records, and Directories & Public Records
- [x] For each category, add plain-language explanations: what this record type is, why a relative might care, what clues it usually contains, and where to continue searching
- [x] Add guided **Research Pathways** such as Immigration Pathway, Military Pathway, Local Life Pathway, and Marriage & Maiden Name Pathway
- [x] Allow pathway cards to recommend relevant in-app source categories based on the sources already present in the archive
- [x] Add contextual prompts such as `Search this branch further` or `Records like this may also exist in county archives, newspapers, or cemetery offices`
- [x] Ensure all new explanatory text is clearly distinguished from formal source citations
- [x] Add a **Research Workbench** that surfaces missing birth/death/burial dates, places, and uncited profiles from the structured family data
- [x] Connect the Research Workbench to Cited Sources and the admin-reviewed `Suggest a Change` flow with a citation builder

### Acceptance criteria

- A non-technical family member can start from the Research Library without prior genealogy knowledge
- Cited Sources and Research Library are clearly distinct in purpose and wording
- At least four guided research pathways are implemented and readable on desktop and mobile
- Pathway recommendations remain cautious and non-authoritative; they suggest where to look next without overstating facts
- Existing source citations remain intact and accessible from the same overall part of the app
- A family member can identify a missing fact, assemble a source note, and submit the correction to the admin without leaving the research workflow

### Out of scope

- Automated live searching across external genealogy providers
- User-authored pathway content
- Persistent in-app research note-taking or bookmarking

---

## Release 2.6.2 — Place Pages and Branch Research Guidance (Phase 3)

> Status: Complete ✓

**Goal:** Make the family archive more geographically and branch-oriented by turning recurring places into navigable research hubs and using them to guide deeper investigation.

### Product outcomes

- Users can explore the family through places, not just through names
- Geographic clusters such as townships, counties, and cities become meaningful destinations
- Branch research feels more grounded because users can see which people, sources, and events connect to the same location
- The archive better reflects how family history is often discovered in practice: through place-based records and local context

### Engineering milestones

- [x] Add a new **Places** browse surface or subsection within Research Library
- [x] Identify recurring places from existing source and profile data and generate normalized place pages where data quality is sufficient
- [x] For each place page, show connected people, connected surnames, connected sources, and major available record types
- [x] Add `Research this place` guidance suggesting archives, newspapers, cemeteries, churches, or county/state repositories that may hold related records
- [x] Add branch-aware prompts such as `This surname appears repeatedly in Hampton, Rock Island County, Illinois` where evidence supports the pattern
- [x] Add cross-links from person profiles and sources into relevant place pages when context exists
- [x] Preserve caution in all generated summaries so place associations are suggestive and evidence-based, never overstated

### Acceptance criteria

- Users can open a place page and immediately see why that location matters in the family archive
- Place pages connect back to real people and real cited sources already present in the app
- Cross-links from profiles or sources into places do not create confusing navigation loops
- Geographic summaries are phrased cautiously and only when supported by actual app data
- Staging review confirms that place pages improve exploration without making the app feel like a generic map or directory

### Out of scope

- Full GIS/mapping interface
- Historical boundary reconstruction
- Automated external place-history ingestion

---

## Release 2.6.3 — Evidence Attachments for Profile Updates

> Status: Complete ✓

**Goal:** Extend the Research Library / Suggest-a-Change flow introduced in 2.6.1 by allowing family members to attach documentary evidence directly to profile facts or suggested corrections. Users can submit supporting artifacts such as birth, marriage, or death certificates, obituary clippings, family Bible pages, census scans, and other record images or PDFs. Admins review the evidence alongside the suggested fact, approve or decline the artifact and the claim independently, and approved evidence becomes part of a dedicated Evidence section on the person profile.

This release strengthens profile validity rather than profile count, making it a smaller but high-value quality layer that should land before broader person-creation work in 2.9.0.

### Product outcomes

- Family members can enrich their own and their relatives' profiles with real documentary evidence without needing admin access or technical knowledge
- The Citation Builder stops being a dead-end text form and becomes "write the citation *and* attach the artifact that proves it"
- Two distinct, first-class entry points on every profile recognize that enriching ≠ correcting:
  - **Suggest a Change** (existing flow) — now supports an optional evidence attachment so proposed corrections can ship with the artifact that justifies them
  - **Add Evidence** (new flow) — attach an artifact that supports a fact already on the profile; no proposed change required, so honest corroboration does not have to be filed as dissent
- Admins review artifacts in-app with an inline preview (image or PDF), approve or decline the artifact and the associated fact independently, and communicate outcomes back to the contributor through the existing notification pipeline
- Approved evidence appears in a dedicated **Evidence** section on the profile — visually distinct from the photo gallery — so source artifacts and family photos remain conceptually separate
- The growth loop shifts: as family members gain access, each one has a clear, low-friction path to raise the evidentiary quality of their own branch of the tree

### Engineering milestones

#### Upload entry points

- [x] Add an **Add Evidence** button on the person profile, placed adjacent to the existing **Suggest a Change** button, visible to any authorized family member
- [x] Extend the Citation Builder → Suggest-a-Change handoff so the suggestion modal exposes an optional file attachment field alongside the existing `source` text field
- [x] Build a shared **Evidence Upload** modal used by both entry points, supporting: fact selection (which life event this evidence supports, with a `General — supports this person's record overall` option), artifact upload (image or PDF), citation text (prefilled from Citation Builder when arriving from that flow), and a free-text contributor note

#### Storage and moderation data model

- [x] Add a new Firestore `evidence_uploads` collection with fields: `personId`, `personName`, `factTarget` (e.g., `birth`, `marriage`, `death`, `general`), `storagePath`, `mimeType`, `citationText`, `contributorNote`, `contributorEmail`, `contributorName`, `submittedAt`, `status` (`pending` | `approved` | `rejected`), `relatedSubmissionId` (optional, present when the evidence accompanies a Suggest-a-Change submission), `reviewedBy`, `reviewedAt`, `reviewerNote`
- [x] Add a new Firebase Storage path (`evidence/{personId}/{timestamp_filename}`) mirroring the `photo_uploads` moderation pattern from Release 2.4.0, with matching `storage.rules`
- [x] Support PDF and common image formats (PNG, JPG, WebP, GIF); reject other formats client-side with a clear message
- [x] When an evidence upload is linked to a Suggest-a-Change submission, mirror the `relatedSubmissionId` so the two records can be navigated as a pair in either direction

#### Admin review

- [x] Add an **Evidence** admin tab (or extend the existing Submissions tab with an Evidence subtab) showing pending artifacts in chronological order
- [x] Each review card shows: inline preview (image rendered in-place; PDF rendered with a first-page preview or a native `<object>`/`<iframe>` view), contributor identity, submitted citation, contributor note, the target person and fact, and a clear visual badge distinguishing **Supports existing fact** from **Supports proposed change** (linked submission shown alongside)
- [x] Admin can approve or decline the artifact and, when a linked submission is present, can approve or decline the proposed change independently (four outcome combinations must all be supported)
- [x] Declined artifacts require an explanation text that flows into the contributor notification

#### Profile surface for approved evidence

- [x] Add a dedicated **Evidence** section on the person profile, rendered separately from the photo gallery, showing a thumbnail, the fact it supports, the citation text, and the contributor
- [x] Evidence entries open an in-app viewer with the full artifact (image in the existing lightbox pattern; PDF in a simple viewer), preserving in-app continuity
- [x] Each evidence entry visibly credits the contributor (by display name) and shows the approval date, reinforcing that evidence is a family contribution

#### Notifications and history

- [x] On review completion, write a notification to `user_notifications` with the outcome, the target person, and any admin explanation, reusing the existing notification surface
- [x] Extend the contributor's **Updates** and **My Submissions** history views to include evidence uploads with their current status, alongside photo uploads and suggestions

### Implementation order

1. Lock the `evidence_uploads` Firestore schema and Storage path with auth rules and status-transition validation; confirm the `relatedSubmissionId` cross-linking pattern.
2. Build the shared Evidence Upload modal and wire both entry points (profile **Add Evidence** button and **Suggest a Change** evidence attachment field).
3. Implement upload-to-Storage with progress feedback, MIME-type validation, and pending-status record creation.
4. Build the admin Evidence review surface with inline image and PDF preview plus independent approve/decline controls for artifact and linked submission.
5. Wire contributor notifications on review outcome via `user_notifications`.
6. Add the **Evidence** section to the person profile, including the in-app artifact viewer.
7. Extend contributor history views (Updates, My Submissions) to include evidence uploads.
8. Mobile and desktop verification pass; staging sign-off.

### Acceptance criteria

- Any authorized family member can attach evidence to a profile through either entry point without admin access
- The **Add Evidence** flow works end-to-end without requiring a proposed change, and the **Suggest a Change** flow supports an optional evidence attachment
- Images and PDFs both render in the admin review surface without a download step
- Admins can approve or decline the artifact and the linked suggestion independently, and contributors receive a clear notification for each outcome
- Approved evidence appears in a dedicated **Evidence** section on the profile, visually distinct from the photo gallery, with contributor credit and citation visible
- Declined artifacts include the admin's explanation and are visible to the contributor in their history
- No evidence artifact is visible on the live profile before admin approval
- Mobile and desktop both support the full upload and review flow without layout breakage

### Architectural notes

- `evidence_uploads` is a new Firestore collection rather than an extension of `photo_uploads`, because evidence artifacts have different semantics (source documents, PDF support, fact targeting, citation coupling) and are surfaced in a different profile section; sharing the `photo_uploads` moderation patterns at the code level is encouraged, but the data model is kept separate
- The fact-coupling field (`factTarget`) keeps evidence queryable per life event so the profile can render the right artifact next to the right fact; the `general` option preserves the path for evidence that corroborates the record as a whole
- PDF rendering uses the browser's native capability (no heavy PDF.js bundle in the first iteration); if admins need multi-page navigation the scope can expand in a later release
- Evidence review reuses the existing notification pipeline from 2.4.0 and the Submissions review pattern, so contributors experience a consistent outcome surface across photos, suggestions, and evidence

### Out of scope

- OCR or automated text extraction from uploaded artifacts
- Automatic fact inference from a submitted document (e.g., parsing a birth certificate to propose a birth date)
- Multi-file evidence bundles in a single submission (first iteration is one artifact per upload)
- Admin-initiated bulk ingestion of evidence from a shared drive or archive folder
- Evidence visibility controls beyond approved/not-approved (for example, private-to-contributor or family-only scopes) — defer to the permission governance work in 2.7.3

---

## Release 2.7.0 — Relationship Labels Relative to Logged-In User

> Status: Complete ✓

**Goal:** Show clear kinship labels (for example: Parent, Great-Grandparent, First Cousin Once Removed) relative to the logged-in user's linked family member so relationship context is always visible while browsing profiles, search results, and tree nodes.

### Product outcomes

- A family member can immediately understand how any viewed person is related to them without doing mental genealogy math
- Relationship labels are consistent across the app (profile, search, tree) and use plain-language kinship terms
- Ambiguous or incomplete branches degrade gracefully with explicit uncertainty messaging instead of incorrect labels

### Engineering milestones

- [x] Use the existing user-to-person linkage (`linkedPersonId`) as the relationship reference identity for each logged-in user
- [x] Add a kinship resolver in the data layer that computes relationship between `linkedPersonId` and any target `personId` using `person-family.json` family-unit structure
- [x] Implement direct-line labels (self, parent, child, sibling, grandparent/grandchild, great-* variants) when one person is on the other's ancestor/descendant path
- [x] Implement collateral-line labels (aunt/uncle, niece/nephew, cousin degree + removed count) using nearest shared ancestor and generation-distance math
- [x] Add a deterministic label formatter (for example: `1st Cousin`, `2nd Cousin`, `1st Cousin Once Removed`) with concise fallback text when relationship cannot be resolved confidently
- [x] Surface relationship chips in three places: person profile header, search result rows, and selected tree node details
- [x] Add a `How this relationship is calculated` info popover with a simple explanation and examples for non-technical users
- [x] Add regression tests covering known relationships (direct line, sibling, cousin/removed, half-sibling, missing-parent data)

### Implementation order

1. Finalize relationship contract: define canonical labels, unknown-state rules, and precedence rules for edge cases (for example half-sibling vs sibling wording).
2. Build resolver core in data layer: implement shared-ancestor search and generation-distance math first, then direct-line and collateral helpers.
3. Add deterministic formatter: convert resolver outputs to one canonical display label for every person pair.
4. Wire profile usage first: display relationship chip in person header and verify fallback behavior with missing-parent records.
5. Extend to search and tree: reuse the same resolver/formatter output, with no per-surface label variation.
6. Add explanation UI: implement the how-calculated popover copy and examples after labels are stable.
7. Add regression suite: cover known family fixtures and edge cases; lock expected labels to prevent drift.
8. Stage validation pass: mobile + desktop checks for chip readability, performance sampling on larger tree views, and sign-off against acceptance criteria.

### Acceptance criteria

- Viewing any person profile while signed in shows a relationship label relative to the logged-in user's linked person (or a clear unknown-state message)
- Cousin and removed labels are mathematically consistent with the shared-ancestor generation distances
- No relationship label is shown when data is insufficient to compute safely; UI explains why in plain language
- Relationship labels are identical for the same pair of people regardless of where they are shown in the app
- Mobile and desktop both display labels without truncating critical meaning

### Out of scope

- Legal kinship modeling (adoption/guardianship policy interpretation beyond current source data)
- In-law relationship taxonomy in first iteration
- Automatic correction of incomplete or contradictory source relationships

---

## Release 2.7.1 — Family Tree Orientation and Relationship Trace

> Status: Complete ✓

**Goal:** Make the Family Tree easier to read at scale by centering the experience around the logged-in user's linked profile, clarifying direct-line and household context, and keeping selected people understandable even when the tree is zoomed out.

### Product outcomes

- Users can follow their direct bloodline more easily across generations
- Household context is clearer without turning the tree into a dense neutral graph
- Explore mode remains useful for broader branch browsing while preserving orientation
- Selecting a person makes their visible connection back to the logged-in user's linked profile easier to follow
- Expanded tree tiles remain readable after selection, including from heavily zoomed-out views

### Engineering milestones

- [x] Keep Bloodline mode as the lineage-first default visualization for authenticated users
- [x] Preserve Household mode as a stronger family-unit grouping layer around the direct line
- [x] Preserve Explore mode as the broadest branch-browsing view while retaining orientation aids
- [x] Add Me-centered Relationship Lens as a visualization mode that explains visible people relative to the user's linked profile
- [x] Compute and retain a selected-person route through the visible Cytoscape graph back to `linkedPersonId`
- [x] Apply selected-route node and edge styling after other visualization overlays so the route remains visually stronger in every mode
- [x] Smoothly recenter and zoom selected tree tiles to a readable minimum size without making the tile fill the screen
- [x] Add low-noise diagnostics for selection, route-computation misses, highlight state, and readability viewport actions

### Acceptance criteria

- Selecting a visible person in Bloodline, Household, Explore, or Me-centered Relationship Lens mode highlights the route back to the authenticated user's linked profile when both endpoints are visible
- The highlighted selected route is visually stronger than surrounding nodes and edges
- Changing tree visualization modes preserves or recomputes the selected route instead of dropping orientation state
- Selecting while heavily zoomed out brings the expanded tile to a comfortable readable size with smooth motion
- Missing or disconnected visible routes fail quietly for users and provide useful diagnostics in local/debug contexts

### Out of scope

- Full-database path tracing through hidden people not present in the current tree view
- Replacing Cytoscape node cards with a separate drawer or modal
- New relationship taxonomies beyond the existing kinship resolver and Relationship Lens metadata

---

## Release 2.7.2 — Per-User Data Accuracy Score and Nationality Ratio

> Status: Complete ✓

**Goal:** Provide each logged-in user a transparent, data-driven profile quality summary: (1) an accuracy/confidence score for their documented family line and (2) a nationality ratio derived from available place and source evidence.

### Product outcomes

- Users can quickly see how complete and reliable their currently connected family data is
- The app communicates evidence strength honestly, helping families prioritize where more research is needed
- Nationality insights are presented as documentation-based ratios, not as biological or DNA claims

### Engineering milestones

- [x] Define a versioned scoring model (`accuracyScoreV1`) from available app data, including weighted components for profile completeness, relationship consistency, source coverage, and unresolved conflicts
- [x] Implement per-user score computation starting from `linkedPersonId` and traversing a defined ancestor depth window (for example: self + up to 4 generations)
- [x] Normalize place evidence into country buckets using existing profile/event fields and source metadata where available (`relatedPlaces`, citation jurisdiction/provider context)
- [x] Compute a `nationalityRatio` map per user as percentage distribution across normalized country buckets plus `Unknown`, with documented weighting rules
- [x] Add a user-facing analytics card showing: overall accuracy score (0-100), confidence band, top country ratios, and a `How this is calculated` breakdown
- [x] Record score metadata (`computedAt`, `modelVersion`, input coverage stats) for reproducibility and future recalculation
- [x] Add guardrails so missing or sparse data yields cautious outputs (`Insufficient data` state, low-confidence badge) rather than misleading precision
- [x] Add deterministic tests to ensure identical input data always produces identical score and ratio outputs

### Implementation order

1. Lock metric definitions: document score components, weights, ratio rules, and insufficient-data thresholds as versioned spec for accuracyScoreV1.
2. Build normalization layer: standardize place/citation evidence into country buckets plus Unknown before any scoring math.
3. Implement compute pipeline: calculate ancestor-window coverage stats, weighted accuracy score, and nationality ratio in one deterministic pass.
4. Persist computation metadata: store computedAt, modelVersion, and input coverage details alongside outputs.
5. Add analytics UI card: render score, confidence band, ratio summary, and plain-language explanation text.
6. Add low-data guardrails: show non-breaking insufficient-data state and actionable prompts when thresholds are not met.
7. Add deterministic tests: fixed fixtures proving ratio sums to 100% and score stability for unchanged input.
8. Stage verification pass: run reproducibility checks across repeated runs, mobile/desktop readability checks, and acceptance-criteria sign-off.

### Acceptance criteria

- A signed-in user with a linked person can view an accuracy score and nationality ratio summary in-app
- Ratio output is internally consistent: all displayed country percentages plus `Unknown` sum to 100%
- Score output includes at least one human-readable explanation for why the score is high or low
- Users with insufficient linked data are shown a non-breaking fallback state with actionable next steps
- Calculations are reproducible by model version and timestamp for staging verification

### Out of scope

- DNA/ethnicity inference or genetic ancestry claims
- Automatically asserting legal nationality/citizenship status
- External paid data-provider enrichment in the first iteration

---

## Release 2.7.3 — Permission Governance and Historical Read-Only Mode

> Status: Complete ✓

**Goal:** Establish a durable authorization model that supports both living-family collaboration and a reversible archive-only operating mode, so social features can be disabled platform-wide without disrupting historical access.

### Product outcomes

- The archive can run in a strict historical read-only mode at any time while preserving access to profiles, tree, sources, and place/research browsing
- Social and contribution capabilities can be controlled globally and by role without ad hoc code changes
- Permission behavior becomes predictable and auditable across profile edits, photo uploads, and future collaboration surfaces

### Engineering milestones

- [x] Add a global application mode flag with at least two states: `normal` and `historical_read_only`
- [x] Implement role-capability model for Viewer, Contributor, Moderator, and Admin, with explicit capabilities for view/post/update/moderate actions
- [x] Enforce effective authorization as intersection logic: global mode policy AND role capability
- [x] Separate policy domains for historical-core data vs social/collaboration data so one domain can be disabled without affecting the other
- [x] Add admin controls to toggle global mode and manage role assignments from a governed UI path
- [x] Add backend and Firestore-rule enforcement for all write paths tied to profile presentation edits, uploads, submissions, and future collaboration objects
- [x] Add audit logging for mode changes and role-assignment changes, including actor identity, timestamp, and before/after values
- [x] Add clear user messaging when actions are disabled by mode or role (not authorized, read-only period, moderation required)
- [x] Add integration tests proving that historical browsing remains available when collaboration writes are globally disabled

### Implementation order

1. Define authorization contract: roles, capabilities, and global mode behaviors as a versioned policy specification.
2. Add policy primitives in backend/data layer first, then align Firestore rules to the same capability matrix.
3. Migrate existing write paths to centralized authorization checks (profile presentation edits, uploads, submissions).
4. Add admin governance UI for mode toggle and role management with confirmation and audit capture.
5. Implement user-facing disabled-state messaging across affected actions.
6. Add integration and regression tests for mode-toggle and role-permission combinations.
7. Run staging hardening pass including rollback drills: normal -> read-only -> normal.

### Acceptance criteria

- Admin can enable historical read-only mode in one action; collaboration and contribution writes are blocked platform-wide
- Historical browse surfaces remain fully functional while read-only mode is active
- Role capability changes take effect without redeploy and are reflected consistently across UI and backend
- Unauthorized action attempts are denied server-side and captured in audit records where appropriate
- Returning from read-only mode restores permitted write capabilities without data loss or rule drift

### Sequencing and priority fit

- This release is a governance foundation and should be evaluated with ongoing roadmap priorities; it is not an automatic immediate release unless a blocking risk is identified
- Recommended placement: after 2.7.2 planning finalization and before broad social-collaboration rollout so policy controls exist before new contribution surfaces expand
- Dependency relationship: 2.7.3 de-risks future collaboration releases and reduces rework in moderation, permissions, and incident response

### Out of scope

- Fine-grained per-object ACL authoring UI in first iteration
- Temporary delegated roles with expiry workflows
- Public/open community participation outside invited family members

---

## Release 2.8.0 — Family Message Board

> Status: Planned

**Goal:** Give family members a shared space to post questions, share photos, and discuss family connections — so the archive becomes a living conversation, not just a static reference.

### Product outcomes

- Family members can ask questions, post observations, share photos, and respond to each other without leaving the app
- The message board becomes the natural place to coordinate before submitting formal corrections or additions
- Posts with photos use the same in-app lightbox experience as the rest of the archive
- The board feels like a family kitchen table, not a social-media feed — calm, purposeful, and welcoming to all ages

### Engineering milestones

- [ ] Add a new top-level **Message Board** page accessible from the main navigation, distinct from profiles, gallery, and tree
- [ ] Create a Firestore `board_posts` collection with fields: `authorEmail`, `authorName`, `body`, `imageURL` (optional), `imagePath` (optional), `createdAt`, `editedAt`
- [ ] Build a chronological post feed with author name, timestamp, message text, and optional inline photo
- [ ] Allow users to attach a single photo per post using the existing upload-to-Storage infrastructure; display the photo inline with click-to-enlarge via the lightbox
- [ ] Add a compose area at the top of the board with a text field, optional photo attachment, and a Post button
- [ ] Add a reply thread model so users can respond to a specific post; replies are shown inline beneath the parent post in chronological order
- [ ] Add real-time or near-real-time updates so new posts appear without requiring a full page reload (Firestore `onSnapshot` or periodic polling)
- [ ] Add Firestore rules: any authorized user can create and read posts; authors can edit or delete their own posts; admins can delete any post
- [ ] Add a post-count badge or indicator in the navigation so users know when new activity has occurred since their last visit
- [ ] Ensure the board is fully functional and readable on mobile with appropriate text sizing and touch targets

### Implementation order

1. Design Firestore schema for `board_posts` and `board_replies` collections with auth rules.
2. Build the read-only feed first: render posts in reverse-chronological order with author, timestamp, and body.
3. Add the compose area with text-only posting and confirm end-to-end write + read.
4. Add optional photo attachment using the existing Storage upload path; render inline with lightbox click.
5. Add reply threading beneath parent posts.
6. Add real-time listener or polling for live updates.
7. Add new-activity badge in navigation.
8. Mobile and desktop verification pass.

### Acceptance criteria

- Any authorized family member can post a message and optionally attach one photo
- Posts appear in a readable feed with clear authorship and timestamps
- Replies are visually grouped under their parent post
- Attached photos open in the app's standard lightbox — no new-tab or raw-file behavior
- The board is usable and readable on both desktop and mobile without layout breakage
- Authors can edit or delete their own posts; admins can delete any post
- No post content is visible to unauthenticated users

### Out of scope

- Threaded sub-replies (replies to replies) in the first iteration
- Rich text formatting, emoji reactions, or @-mention notifications
- Admin pre-approval of posts — the board is a trusted-family space; moderation is after-the-fact via admin delete
- Direct messaging between individual users
- Full-text search across board posts

---

## Release 2.9.0 — Community Member Additions with Moderated Review

> Status: Planned

**Goal:** Allow any family member to add a new person to the tree — a newborn, a recently discovered relative, or a missing connection — through a guided submission form with admin-moderated approve/decline review and contributor notifications on outcome.

### Product outcomes

- A family member who knows about a new person (baby, spouse, distant relative) can contribute that person to the archive without needing admin access or technical knowledge
- The submission flow guides the contributor through the minimum required fields and optional enrichment (photos, relationship context, dates, sources) one person at a time
- Every submission passes through admin moderation before appearing in the live tree — the archive never shows unverified additions
- Contributors receive clear, timely status notifications when their submission is reviewed: **Pending → Approved** or **Pending → Declined** (with explanation) — consistent with the existing photo-upload and submission review patterns
- The family message board (2.8.0) serves as a natural companion for discussing proposed additions before or during the review process

### Engineering milestones

#### Submission form

- [ ] Add an **Add a Family Member** entry point accessible from the main navigation or from a person profile (to add a child, spouse, or parent relative to an existing person)
- [ ] Build a guided submission form collecting: full name, sex, birth date (optional), death date (optional), relationship to an existing person in the tree (parent/child/spouse/sibling — with person search picker), and a free-text notes field for context the admin should know
- [ ] Allow the contributor to optionally attach one photo of the new person using the existing upload-to-Storage path
- [ ] Allow the contributor to optionally provide a source or citation for the addition (document, family Bible entry, birth certificate, etc.)
- [ ] On submit, write to a new Firestore `member_additions` collection with status `awaiting_review`, contributor email, timestamp, and all form fields

#### Moderation workflow

- [ ] Add a new **Member Additions** tab in the Admin Panel showing pending submissions in chronological order
- [ ] Each submission card shows all submitted fields, the attached photo (if any), the linked existing person, and the contributor's email
- [ ] Admin can approve or decline each submission; declined submissions require an explanation text that is included in the contributor notification
- [ ] On approval, the admin confirms the final field values (which may have been adjusted during review) and the system writes a new record to a `community_persons` Firestore collection that the app overlays onto the build-time person data
- [ ] Approved community-contributed persons appear in search results, can be browsed in profiles, and are visually marked with a `Community` badge to distinguish them from source-extracted records
- [ ] Declined submissions are retained in the admin history view with the explanation, but do not appear in the live tree

#### Contributor notifications

- [ ] On review completion (approve or decline), write a notification to `user_notifications` with the outcome, timestamp, reviewer identity, and any admin message
- [ ] The contributor sees the review outcome in the existing Updates panel with clear language:
  - **Approved** — "Your submission has been approved! The new family member is now visible in the archive."
  - **Declined** — "Your submission was not approved. Reason: [admin explanation]"
- [ ] Add a **My Submissions** history view (accessible from the contributor's Updates panel) showing all past member-addition submissions with their current status

#### Data integration

- [ ] Build a `community_persons` overlay layer in `family-data.js` that merges community-contributed persons into the search index, person-details lookup, and family-relationship graph at load time — without modifying the build-time JSON files
- [ ] Ensure community-contributed persons appear in the family tree visualization with proper parent/child/spouse edges based on the relationship declared in the submission
- [ ] Ensure the kinship resolver (2.7.0) correctly traverses community-contributed relationship edges so relationship labels remain accurate

### Implementation order

1. Design Firestore schema for `member_additions` (submissions) and `community_persons` (approved records) with auth rules and status-transition validation.
2. Build the submission form with person-search picker for the relationship anchor, text fields, and optional photo attachment.
3. Build the admin Member Additions tab with the full submission card and approve/decline controls.
4. Wire contributor notifications on review outcome via `user_notifications`.
5. Build the `community_persons` overlay in `family-data.js` — merge into search index, person details, and family graph.
6. Add the `Community` badge to profiles and search results for community-contributed persons.
7. Verify kinship resolver traverses community edges correctly; add regression tests.
8. Add the contributor "My Submissions" history view.
9. Mobile and desktop verification pass; staging sign-off.

### Acceptance criteria

- Any authorized family member can submit a new person through the guided form without admin access
- The submission includes at minimum a name and a declared relationship to an existing person in the tree
- Admins see pending submissions in a dedicated tab and can approve or decline each one
- Contributors receive a notification on review completion with clear, plain-language messaging
- Approved persons appear in search, profiles, and the family tree with a `Community` badge
- Declined submissions include the admin's explanation and are visible to the contributor in their history
- No community-contributed person appears in the live archive before admin approval
- The kinship resolver produces correct relationship labels for community-contributed persons
- Mobile and desktop both support the full submission and review flow without layout breakage

### Architectural notes

- Community-contributed persons live in Firestore (`community_persons`), not in the build-time JSON files — this keeps the RootsMagic extraction pipeline unchanged and avoids mixing authoritative source data with user contributions
- The overlay merge happens at app load time in `family-data.js`, after protected JSON files are fetched and parsed
- The existing `person_profile_overrides` pattern (Firestore overlay on top of build-time data) is the direct precedent for this approach
- If the contributor declares a relationship to an existing person, that relationship is stored as a bidirectional edge in `community_persons` so both the new person's profile and the existing person's profile reflect the connection after approval

### Out of scope

- Bulk import or GEDCOM file upload in the first iteration — one person at a time only
- Contributor editing of submissions after they enter Review in Progress (contributors can post clarifications on the message board instead)
- Automatic merge with the RootsMagic `.rmtree` database — community persons remain in the Firestore overlay until an admin performs a manual reconciliation
- Community-contributed relationship edits for existing persons (this release covers new persons only; edits to existing relationships remain in the Suggest a Change flow)

---

## 6. Cross-Cutting Engineering Work

These items support all releases and should be advanced continuously:

- [x] Keep staging as the required proving ground for all meaningful behavior changes before production promotion
- [x] Keep person-photo extraction, path normalization, and UI consumption documented together
- [x] Preserve mobile-friendly behavior as a release gate for all profile and media work
- [x] Standardize release verification around a single `npm run verify-release` gate plus `project-docs/operations/RELEASE_CHECKLIST.md` staging smoke checks
- [ ] Update admin/operator documentation whenever invite, review, or media-link workflows change
- [ ] Review labels and navigation wording regularly for all-ages clarity

---

## 7. Risks and Design Guardrails

### Risks

- Raw image-link behavior may reappear through overlooked components or legacy markup
- Person profiles may become cluttered if history, relationships, and photos are surfaced without hierarchy
- Media associations may remain incomplete when extracted RootsMagic mappings are ambiguous
- Admin workflows may become confusing if extracted mappings and manual overrides are not merged clearly
- Family trust may erode if factual corrections appear in the live record without admin review

### Guardrails

- Never ship behavior that routes users from the app into raw hosted image files for normal viewing
- Every major screen should answer: who am I looking at, what can I do here, and how do I go back
- Treat the person profile as the primary destination for identity and history, with source content supporting it rather than dominating it
- Preserve genuine completion history in this roadmap; do not rewrite it just to make the document cleaner
- Require staging verification for navigation, image-viewing, and admin-workflow changes before production promotion
- Structured genealogical corrections must pass through admin review before influencing the live record; scoped profile-presentation fields may apply immediately only with audit logging
- Prefer plain language and obvious navigation over compact or clever interaction patterns

---

## 8. Definition of Done for Release Execution

A release should not be marked complete unless:

- All checklist items for that release are truly implemented or explicitly blocked
- UI elements are connected to real behavior rather than placeholders
- Affected docs are updated where workflow or product behavior changed
- Logging and error handling are sufficient to diagnose failures
- Later releases were not partially started just to create the illusion of momentum
- Desktop and mobile behavior were both validated for the changed user flow
- Users are not routed out of the app into raw media files for the covered release scope
- The resulting UX is understandable to a non-technical family member without explanation

---

## Release 2.4.2 — Auth-Gated Data Security (Phase 1)

> Status: Complete ✓

### Problem

Genealogical JSON data files (`person-details.json`, `person-photos.json`, `person-family.json`, `photo-catalog.json`) were publicly accessible on Firebase Hosting before login. Any web crawler, AI scraper, or red-team scanner could retrieve the full dataset without authentication.

### Solution

- **Firebase Storage auth gate** — JSON files moved from Hosting (`dist/`) to Firebase Storage (`data/` prefix). Storage rules require `request.auth != null` for all reads. Admin SDK writes (used in CI) bypass rules.
- **Storage URL resolution after auth** — `family-data.js` gains an `initDataUrls()` export. After a user authenticates, `showMainApp()` calls `getDownloadURL()` for all four files via the Firebase Storage SDK, then calls `initDataUrls()` to inject the resolved URLs before any data loading begins. Local dev (password bypass) falls back to local file paths gracefully.
- **CI upload step** — Both `deploy-staging.yml` and `deploy-production.yml` gain a "Upload data files to Firebase Storage" step that runs `scripts/upload-data-to-storage.js` after the Vite build. Uses the existing service account secrets.
- **Crawler discouragement** — `public/robots.txt` added with `Disallow: /` and `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet` response header applied to all Hosting routes via `firebase.json`.
- **`post-build.js` updated** — The 4 JSON copy steps removed; they no longer land in `dist/` and are never served by Hosting.

### Out of scope (Phase 2)

`FamilyTreeMedia/` — 587 photos and 176 HTM pages remain on Hosting as public static files. Moving them requires either bulk upload to Storage (auth-gated) or a Cloud Function proxy. Tracked separately.

---

## Release 2.4.3 — Analytics and Admin Photo History

> Status: Complete ✓

**Goal:** Surface living/deceased counts in Family Analytics and give admins visibility into reviewed photo uploads.

### Engineering milestones

- [x] `computeAnalytics()` returns `living` and `deceased` counts (`living = total − withDeathYear`)
- [x] Analytics summary row adds Living and Deceased cards
- [x] "Living vs. Deceased" bar section added between Gender and Birth Decades; both bars are clickable and drill down to the filtered person directory
- [x] `getPeopleForFilter` extended with `'living'` and `'deceased'` filter types
- [x] Admin Photo Uploads tab gains a Pending/History toggle; History view shows approved/rejected uploads with reviewer email and review date
- [x] New Firestore composite index: `photo_uploads` on `(status, reviewedAt DESC)` for the history query
- [x] CI: Firestore rules, Firestore indexes, and Storage rules now deploy automatically on every push to staging and production workflows
- [x] CI: Staging workflow SA mismatch corrected (data upload uses prod SA, matching the hardcoded prod Firebase project)

---

## 9. Immediate Next Focus

All releases through 2.7.1 are shipped to staging. The next planned product sequence is:

1. **Code hardening pass** — keep release verification, admin workflow documentation, and staging promotion checks current before the next collaboration feature
2. **Release 2.7.3 — Permission Governance and Historical Read-Only Mode** — governance framework that de-risks all collaboration surfaces introduced in 2.8.0 and 2.9.0
3. **Release 2.8.0 — Family Message Board** — shared discussion space for family coordination and collaboration; standalone social surface that enables richer communication before and during moderated contributions
4. **Release 2.9.0 — Community Member Additions with Moderated Review** — highest growth-impact feature; allows any family member to add new people to the tree through a guided form with admin approve/decline moderation and contributor notifications

### Near-Term Moderation Workflow Hardening

- [x] Document the end-to-end contributor and admin moderation experience in product/design notes so upload, feedback, review, notification, and history states stay coherent across future releases
- [x] Add user-visible in-app status/history surfaces for photo uploads, feedback, and submissions so contributors can confirm what happened after they send something
- [x] Add backend-generated contributor notifications for review outcomes (approved, rejected, resolved, dismissed) rather than relying on admin-client-only UI refreshes
- [x] Harden admin history loading so Photo Uploads history degrades gracefully when Firestore indexes are missing, delayed, or still building
- [x] Improve the admin photo-review UI with a larger inline preview (160px), file info, person ID, and click-to-enlarge hint before approving or rejecting user uploads

### Near-Term Admin Panel Improvements

- [x] Add the ability to remove (deauthorize) users from the Admin Panel Users tab without requiring direct Firestore console access
- [x] Add the ability to modify the invitation email message text from the Admin Panel so the admin can customize wording without a code change; template stored in Firestore `app_config/invitation` with `{email}` and `{url}` placeholders

### AI Photo Notes Hardening

- [x] Diagnose and fix the Generate Photo Note (Gemini) feature — root cause: `getAppUrl()` hardcoded to staging URL, so production Cloud Function fetched photos from staging instead of production; fixed by deriving hosting URL from `GCLOUD_PROJECT` env var with project-to-hosting map; also added error detail tooltip on client-side failure button
- [ ] Explore bulk photo description generation so admins can generate notes across the archive without clicking one photo at a time; all generated notes must remain in `draft` status until individually reviewed and published by the admin

### Lower-Priority UX Nice-to-Haves

- [ ] Add a one-time post-login `What's New` popup for a future release so production users can see a short, plain-language summary of meaningful shipped features without reading roadmap or release notes
