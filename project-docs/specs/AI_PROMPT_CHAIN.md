# Living Family Archive AI Prompt Chain

## How to use this file

Use these prompts in order. Do not skip ahead. Each prompt assumes the
previous one has been completed, reviewed, and either accepted or corrected.

Always provide the AI with:

- `README.md`
- `ROADMAP.md`
- `project-docs/specs/AI_REBUILD_SPEC.md`
- the current repo contents for the phase being worked on

Do not ask for a one-shot rebuild.

---

## Prompt 1: Scope Lock And Rebuild Plan

```text
You are rebuilding Living Family Archive from the ground up.

Read:
- README.md
- ROADMAP.md
- project-docs/specs/AI_REBUILD_SPEC.md

Your job in this step is not to write code.

Produce:
1. A concise architecture summary
2. A phased rebuild plan
3. The exact data artifacts that must exist by the end of the rebuild
4. The key risks that could cause the rebuild to drift away from the current product
5. A recommended implementation order that minimizes rework

Constraints:
- Treat the app as a private, profile-first family history application
- Keep Firebase Auth, Firestore, Hosting, and Storage
- Keep genealogy extraction deterministic
- Do not propose replacing canonical genealogy facts with LLM-generated facts
- Do not propose rebuilding around runtime parsing of names.htm or sources.htm

Return only planning output. Do not generate code yet.
```

Expected outcome:

- stable rebuild plan
- no framework churn
- no speculative re-platforming

---

## Prompt 2: Foundation Scaffold

```text
Using the accepted rebuild plan, scaffold the application foundation.

Implement:
1. Vite project structure
2. Node 22 assumptions
3. Firebase config boundaries via environment variables
4. Basic app shell
5. Branch/deploy assumptions compatible with staging and production

Constraints:
- Keep the project lightweight
- Do not implement genealogy logic yet
- Do not add placeholder feature code that pretends to work

Deliver:
- changed files
- what runs successfully
- what remains unimplemented by design
```

Expected outcome:

- runnable shell app
- environment and CI shape established

---

## Prompt 3: Protected Data Delivery Contract

```text
Implement the protected data loading model before any feature-specific genealogy UI.

Build:
1. Firebase Storage-backed protected JSON loading
2. Auth-aware data source resolution
3. Protected-data validation script
4. Build/deploy integration for protected artifacts

Constraints:
- Protected genealogy JSON must not be served publicly from Hosting
- Local dev fallback is acceptable only when explicitly intentional
- Do not implement the full genealogy UI yet

Deliver:
- changed files
- validation commands
- any assumptions about artifact names
```

Expected outcome:

- secure JSON delivery boundary established first

---

## Prompt 4: Genealogy Extraction Pipeline

```text
Implement the deterministic genealogy extraction pipeline.

Build scripts for:
1. people / person details extraction
2. family relationship extraction
3. photo linkage extraction
4. directory projection generation
5. cited-sources projection generation
6. protected artifact validation

Constraints:
- Use deterministic extraction from RootsMagic data and exports
- Keep artifacts narrowly scoped
- Do not push genealogy parsing back into the browser
- Preserve stable IDs where possible

Deliver:
- changed files
- artifact list produced
- schema summary for each artifact
- validation commands and results
```

Expected outcome:

- reproducible build-time JSON artifacts

---

## Prompt 5: Core Family Browsing Experience

```text
Implement the family browsing experience on top of the protected JSON artifacts.

Build:
1. search using directory.json
2. surname browsing
3. person profile navigation
4. relationship rendering
5. contextual back navigation

Constraints:
- Profile-first UX
- No raw exported HTML should be required for the main directory path
- Optimize for non-technical relatives, not researchers

Deliver:
- changed files
- what user flows now work
- remaining gaps
```

Expected outcome:

- useful in-app family browsing

---

## Prompt 6: Photo Experience

```text
Implement the photo experience.

Build:
1. photo gallery
2. person-linked photo sections
3. in-app lightbox
4. person chips that navigate to profiles
5. manual media-link merge support if admin-linked media is already part of scope

Constraints:
- No normal user flow should open raw images in a separate browser tab
- Preserve in-app continuity
- Mobile behavior must remain usable

Deliver:
- changed files
- photo-related user flows
- any data dependencies
```

Expected outcome:

- full in-app photo navigation

---

## Prompt 7: Cited Sources Experience

```text
Implement the cited-sources library from precomputed JSON artifacts.

Use:
- sources.json
- source-usage.json

Build:
1. source list rendering
2. source-type badges
3. filter controls
4. related people and related places
5. exact citation visibility
6. optional external source links

Constraints:
- Do not fetch sources.htm in the browser
- Do not scan family-sheet HTML in the browser
- Preserve exact citation text
- Keep explanatory text clearly distinct from formal citation content

Deliver:
- changed files
- supported filters
- validation performed
```

Expected outcome:

- JSON-driven source library

---

## Prompt 8: Admin And Contribution Workflows

```text
Implement the core admin and contribution workflows.

Build:
1. invite management
2. feedback queue
3. suggested change submissions
4. admin review actions
5. profile overrides where in scope
6. audit/history visibility
7. media linking and photo review workflows if included in the rebuild target

Constraints:
- Historical facts remain controlled
- Immediate live editing, if present, must stay tightly scoped and audited
- Firestore rules and UI behavior must agree

Deliver:
- changed files
- collections/rules touched
- user-facing workflows enabled
```

Expected outcome:

- family contribution model restored safely

---

## Prompt 9: Advanced Exploration

```text
Implement advanced exploration features after the core archive is stable.

Build the features that are in accepted scope, such as:
1. family tree
2. analytics
3. research library
4. place pages
5. branch guidance

Constraints:
- Build on top of the JSON-first architecture already established
- Avoid reintroducing legacy HTML as a primary runtime dependency
- Keep user comprehension ahead of researcher complexity

Deliver:
- changed files
- supported user flows
- any deliberate deferrals
```

Expected outcome:

- secondary exploration features layered on a stable core

---

## Prompt 10: Release Hardening

```text
Harden the rebuilt application for staging release.

Implement or verify:
1. build passes
2. protected-data validation passes
3. staging smoke test checklist exists
4. release checklist exists
5. docs are updated for the current architecture
6. known risks and gaps are explicitly listed

Constraints:
- Do not mark the rebuild complete without validation evidence
- Be explicit about what was tested versus not tested

Deliver:
- validation commands and results
- release-readiness assessment
- remaining risks
```

Expected outcome:

- rebuild is staging-ready, not merely code-complete

---

## Rules For Every Prompt In The Chain

- Ask for one phase only.
- Require the AI to list changed files.
- Require the AI to say what it validated.
- Require the AI to separate implemented behavior from deferred behavior.
- Reject vague statements like "fully production ready" without evidence.
- Reject any regression toward runtime HTML crawling unless it is explicitly temporary and documented.
- Reject any proposal that makes AI-generated facts canonical.

---

## Review Gate Between Prompts

Before moving to the next prompt, confirm:

- the previous phase actually works
- the docs still match the implementation
- the phase did not introduce architectural drift
- the next prompt still makes sense given what was learned

