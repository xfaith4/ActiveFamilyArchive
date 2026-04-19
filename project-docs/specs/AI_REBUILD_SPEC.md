# Living Family Archive AI Rebuild Spec

## Purpose

This document defines the target architecture, execution order, and prompt-chain
strategy for rebuilding Living Family Archive from the ground up with AI assistance.
It is meant to preserve the best decisions already discovered in this codebase
so a future rebuild does not repeat transitional mistakes or drift back toward a
legacy HTML-driven application model.

This is not a marketing brief. It is the implementation-facing contract for an
optimal rebuild trajectory.

---

## Rebuild Objective

Rebuild Living Family Archive as a private, profile-first family history application
that:

- serves non-technical relatives first
- treats genealogical data as reviewable, stable, and historically trustworthy
- uses build-time genealogy extraction plus protected JSON artifacts
- minimizes runtime dependence on exported RootsMagic HTML
- keeps staging-to-production promotion disciplined
- is easy to reason about, extend, and regenerate with AI in bounded stages

---

## Product Contract

Any rebuild must preserve these product truths:

- The app is invite-only and intended for real family members.
- The primary user experience is in-app browsing, not document dumping.
- A person profile is the core destination.
- Photos, family relationships, and cited records must feel connected.
- Core factual genealogy remains controlled and reviewable.
- Staging is mandatory before production promotion.

---

## Non-Negotiable Technical Constraints

- Use Node 22+.
- Keep Firebase Auth, Firestore, Hosting, and Storage unless there is a very strong reason to re-platform.
- Treat protected JSON artifacts in Firebase Storage as the standard delivery model for sensitive genealogy data.
- Keep the SPA fast and static-first; do not introduce a heavy backend without a clear product need.
- Prefer deterministic extraction for canonical genealogy facts.
- Use AI for enrichment, summaries, anomaly detection, and editorial assistance, not as the source of truth for family graph data.
- Do not rebuild around runtime parsing of `names.htm`, `sources.htm`, or exported family sheets unless explicitly required as a temporary fallback.

---

## Target Architecture

### 1. Application layer

- Vite-powered SPA
- Vanilla JavaScript is acceptable if it remains coherent and modular
- Firebase Auth for sign-in
- Firestore for workflow/state data:
  - authorized users
  - feedback
  - submissions
  - admin notifications
  - profile overrides
  - manual media links
  - audit history
- Firebase Storage for auth-gated genealogy JSON artifacts

### 2. Data pipeline layer

- RootsMagic `.rmtree` is the canonical extraction source for people, family, events, and media relationships
- RootsMagic HTML export is transitional input only where the database does not yet provide equivalent structure
- Build scripts produce normalized JSON artifacts before deployment
- Validation scripts fail the release if required artifacts are missing or structurally invalid

### 3. Delivery layer

- `staging` branch is the proving ground
- `main` receives only promoted work from `staging`
- CI builds artifacts, validates protected data, uploads protected JSON to Storage, and deploys Hosting/Firestore/Storage rules

---

## Canonical Data Model

The rebuild should converge on this artifact set.

### Canonical artifacts

- `people.json`
  - identity and profile facts
- `families.json`
  - spouse/partner units, parent-child membership, family ids
- `events.json`
  - birth, death, marriage, residence, burial, occupation, other dated facts
- `places.json`
  - normalized place records
- `media.json`
  - media objects and their links to people, events, or families
- `sources.json`
  - normalized source metadata and citation text
- `citations.json`
  - structured citation links if source-level granularity expands beyond the current source library

### Projection artifacts

- `directory.json`
  - lightweight member directory for search and browse
- `graph-index.json`
  - tree traversal helpers
- `source-usage.json`
  - source-to-person/place usage links for the cited-sources surface
- `photo-catalog.json`
  - flat photo browsing projection

### Current transitional state

The repo currently includes:

- `directory.json`
- `sources.json`
- `source-usage.json`
- `person-details.json`
- `person-family.json`
- `person-photos.json`
- `photo-catalog.json`

This is an acceptable transition state. A rebuild should not regress below it.

---

## Data Principles

- Canonical facts should be deterministic.
- Derived views should be precomputed where they reduce runtime complexity.
- Each JSON artifact should have a narrow purpose.
- IDs must be stable across rebuilds whenever possible.
- Supplements and overrides should be applied during build or through clearly separated admin-controlled stores.
- Runtime merges should be limited and intentional.

---

## Optimal Rebuild Trajectory

Do not ask an AI agent to rebuild the entire app in one shot. The correct path
is staged reconstruction.

### Phase 0: repo and environment foundation

- scaffold Vite app
- establish Node 22 toolchain
- wire Firebase config from environment
- set up staging and production workflows
- define release policy

### Phase 1: protected data contract

- implement Firebase Storage auth-gated JSON loading
- define `initDataUrls()` or equivalent runtime injection boundary
- add protected-data validation
- ensure Hosting does not expose sensitive JSON directly

### Phase 2: genealogy extraction pipeline

- implement deterministic extraction from `.rmtree`
- produce person, family, and photo artifacts
- add build-time directory generation
- add build-time cited-source generation
- validate all artifact shapes

### Phase 3: core family browsing experience

- search using `directory.json`
- surname browsing
- profile navigation
- family relationship rendering
- contextual back navigation

### Phase 4: photo experience

- photo gallery
- person-linked photo browsing
- lightbox
- profile photo sections
- manual media-link merge path

### Phase 5: cited-sources experience

- source list from `sources.json`
- related people and places from `source-usage.json`
- record-type badges
- filter controls
- exact citation visibility

### Phase 6: admin and contribution workflows

- invites
- feedback
- suggested changes
- profile overrides
- audit log visibility
- photo upload review

### Phase 7: advanced exploration

- analytics
- family tree
- research library
- place pages
- branch guidance

### Phase 8: release hardening

- staging smoke tests
- build verification
- protected artifact validation
- promotion checklist
- operator documentation

---

## Ideal AI Prompt Chain

The prompt chain should be sequential, artifact-driven, and checkpointed.

### Prompt 1: architecture and scope lock

Goal:
- produce a rebuild plan from `README.md`, `ROADMAP.md`, and this spec

Expected output:
- repo architecture
- phase plan
- target artifact list
- risks and assumptions

Do not allow:
- code generation yet
- framework churn
- speculative backend redesign

### Prompt 2: scaffold foundation

Goal:
- create project skeleton, Firebase config boundaries, branch/deploy assumptions, and build scripts

Expected output:
- runnable shell app
- environment configuration
- CI baseline

### Prompt 3: implement protected data loading

Goal:
- establish the auth-gated JSON loading contract first

Expected output:
- Storage-backed JSON loaders
- validation script
- build/deploy flow that respects protected artifacts

### Prompt 4: implement genealogy pipeline

Goal:
- build deterministic extraction and projection scripts

Expected output:
- extraction scripts
- generated JSON artifacts
- documented schemas

### Prompt 5: implement people and profile UI

Goal:
- make the application useful with search, profile, relationships, and photos

Expected output:
- full in-app navigation
- person profiles
- profile-linked media

### Prompt 6: implement cited sources

Goal:
- rebuild the source library from precomputed JSON, not runtime HTML crawling

Expected output:
- `sources.json`
- `source-usage.json`
- cited-sources UI

### Prompt 7: implement admin workflows

Goal:
- restore the family contribution and review model

Expected output:
- feedback, submissions, overrides, media links, review history

### Prompt 8: harden and verify

Goal:
- make the rebuild releaseable

Expected output:
- smoke tests
- release checklist
- documentation updates
- staging readiness statement

---

## Prompt Rules For Future Rebuild Sessions

- Always provide the AI the current `README.md`, `ROADMAP.md`, and this file.
- Ask for one phase at a time.
- Require each phase to end with:
  - changed files
  - validation performed
  - known gaps
- Do not accept “placeholder” implementations for shipped milestone phases.
- Do not allow the AI to silently change the product model from profile-first family archive to generic genealogy dashboard.
- Do not allow the AI to replace deterministic genealogy extraction with LLM-derived facts.
- Require the AI to preserve staging-first promotion discipline.

---

## Milestone Snapshot Preserved From This Repo

This rebuild spec intentionally preserves these already-earned architectural gains:

- protected genealogy JSON is auth-gated in Firebase Storage
- family directory is prebuilt into `directory.json`
- cited sources are prebuilt into `sources.json`
- source-person/place linkages are prebuilt into `source-usage.json`
- browser crawling of `names.htm`, `sources.htm`, and source-linked family sheets has been removed from the main app path
- the app has already proven the value of profile-first navigation, linked photos, cited sources, admin workflows, and controlled live profile editing

Any rebuild should start from these as baseline expectations, not future aspirations.

---

## Definition Of Rebuild Success

The rebuild is successful only if:

- a signed-in invited family member can search, browse, open profiles, open photos, browse sources, and navigate family relationships without leaving the app
- protected genealogy data is not publicly exposed
- build-time scripts can regenerate shipped JSON artifacts deterministically
- staging can validate the rebuilt app before production promotion
- documentation is sufficient for another engineer or AI agent to continue without rediscovering the architecture
- the rebuilt app is at least as coherent as the current codebase, with less runtime dependence on legacy HTML exports

---

## Next Follow-On Documents

After this spec, the next useful AI-facing documents are:

- `project-docs/specs/DATA_SCHEMA_SPEC.md`
  - normalized schema definitions for canonical and projection artifacts
- `project-docs/operations/RELEASE_CHECKLIST.md`
  - operator checklist for staging and production promotion

`project-docs/specs/AI_PROMPT_CHAIN.md` now exists and should be kept aligned with this spec and
the schema definitions. `project-docs/operations/RELEASE_CHECKLIST.md` now exists and should stay aligned
with the real CI verification path rather than drift into aspirational process.
