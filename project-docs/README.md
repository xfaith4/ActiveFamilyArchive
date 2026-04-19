# Project Documentation Index

This folder contains internal Markdown documentation so the repository root stays focused on source code and primary entry docs.

## Layout

- `operations/`
  - `SETUP_GUIDE.md` - environment and Firebase setup instructions
  - `TROUBLESHOOTING.md` - common operational and runtime issues
  - `RELEASE_CHECKLIST.md` - release verification and staging/production gate
- `specs/`
  - `AI_REBUILD_SPEC.md` - AI rebuild expectations and architecture constraints
  - `AI_PROMPT_CHAIN.md` - ordered prompt sequence for iterative AI-assisted rebuild work
  - `DATA_SCHEMA_SPEC.md` - canonical data contracts and projection schema details
  - `AUTHORIZATION_POLICY.md` - versioned roles, capabilities, and global archive mode policy
  - `MODERATION_WORKFLOW_GUIDE.md` - contributor/admin moderation status model across feedback, suggestions, photos, and evidence
- `history/`
  - `IMPLEMENTATION_SUMMARY.md` - historical implementation wrap-up notes
  - `WORKLOG.md` - consolidated planning/findings/progress notes

## Root-level docs kept intentionally

- `README.md` - repository entry point for users and contributors
- `CONTRIBUTING.md` - contribution workflow and standards
- `ROADMAP.md` - product roadmap and release planning source of truth

## Maintenance conventions

- Add new operational runbooks under `operations/`.
- Add schema, architecture, and AI design specs under `specs/`.
- Place historical snapshots, retrospective notes, and temporary project logs under `history/`.
- Keep cross-file links path-based (for example `project-docs/operations/RELEASE_CHECKLIST.md`) to avoid broken references after future moves.
