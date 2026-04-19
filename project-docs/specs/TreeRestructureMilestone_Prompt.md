You are a senior front-end / visualization engineer tasked with redesigning the Family Tree view in an existing authenticated web application.

Your job is to implement a new authenticated-user-centered genealogy visualization that prioritizes readability of the logged-in user’s direct bloodline, introduces household clustering, and preserves a broader exploration mode for graph browsing.

This is not a greenfield concept exercise. This is a practical product and architecture task. You must analyze the existing Family Tree implementation, identify the current tile sorting / layout / connector logic, and evolve it into a more cognitively coherent visualization system.

## Product context

The current Family Tree view is structurally correct, but at scale it becomes visually spread out, connector lines cross heavily, and it is difficult for the user to visually follow their own ancestral line back through time. The user often has to zoom in and out repeatedly and right-click on individuals to recover local relationship context. The current view behaves more like a neutral relationship graph than a lineage-first genealogy interface.

This app is authenticated. Each logged-in user is known and can be mapped to a person record in the tree. That authentication context must become a first-class layout input.

The new design must treat the authenticated user as the anchor of interpretation rather than just another node in a generic graph.

## Core product goal

When the Family Tree loads for an authenticated user, the interface should make it immediately clear:

1. where the user is in the tree
2. what their direct bloodline path is
3. what household or nuclear family each direct-line person belongs to
4. how to expand outward into broader relative context without losing orientation

The current visualization is structurally faithful but not cognitively prioritized. Your work is to make it both.

## Required design direction

Implement a lineage-first hybrid visualization system with three explicit modes:

### 1. Bloodline Mode
This must become the default mode for authenticated users.

Purpose:

- emphasize the authenticated user’s direct bloodline
- keep the direct ancestor chain visually continuous
- reduce connector clutter
- preserve local household context
- prevent the user’s own lineage from getting lost among collateral branches

Behavior:

- authenticated user is the focal root
- the user’s direct ancestor line is always highlighted automatically without requiring any manual interaction
- the direct line must remain visually recoverable during zooming and panning
- collateral relatives are reduced, collapsed, or rendered as visually secondary by default
- nearby household context remains visible

### 2. Household Mode
Purpose:

- show nuclear family groups as visual units
- reduce edge count
- make family-to-family lineage easier to understand

Behavior:

- represent family units / household units as grouped cards or grouped tiles
- route lineage through household / union midpoints where possible
- support a person appearing in multiple households if they had multiple unions
- preserve genealogical correctness while reducing unnecessary connector clutter

### 3. Explore Mode
Purpose:

- preserve a broader graph-browsing mode for general exploration
- allow freer browsing of the network
- retain useful aspects of the current graph-style experience

Behavior:

- more of the full graph may be visible
- direct-line highlighting still exists
- this mode may tolerate more complexity than Bloodline Mode
- this mode is not the default signed-in experience

## Core visual hierarchy

The renderer and layout model must no longer treat all nodes and edges as equally important.

The strict visual priority order must be:

1. authenticated user
2. authenticated user’s direct bloodline
3. household context around direct-line ancestors
4. nearby collateral relatives
5. distant collateral relatives / background context

This priority must drive:

- line thickness
- color / opacity / contrast
- z-index / layering
- collapse defaults
- label prominence
- routing preference
- spacing decisions

## Primary visualization concept

The tree should behave like a central bloodline trunk with compact household clusters attached to it.

The authenticated user’s direct ancestry must be treated as the main narrative axis of the screen.

Each generation on the direct line should be organized around a household / parent pair rather than loose, equally weighted individual tiles that create unnecessary routing complexity.

The design should make the past feel visually nearer and more coherent. Generational depth should not automatically translate into excessive on-screen distance.

## Functional requirements

### A. Authenticated user anchoring
On Family Tree load for an authenticated user:

- identify the authenticated person record
- set that person as the focal root
- open in Bloodline Mode by default
- automatically compute and highlight the direct ancestor path
- show a sensible generation window on first load, such as 4 to 6 generations
- keep nearby household context visible
- reduce collateral clutter by default

The user should not have to manually find themselves on a generic graph.

### B. Persistent direct bloodline highlighting
Implement persistent direct-line highlighting.

Requirements:

- the authenticated user’s direct ancestor path is automatically emphasized
- the path is visible without right-click or manual highlighting
- primary bloodline edges must be stronger than all secondary edges
- primary bloodline edges must render above background / collateral edges
- the direct path should be easy to visually follow from the focal person upward through generations
- provide a “Recenter on My Line” control
- optionally support a “Bloodline Lock” toggle that keeps the primary line strongly emphasized

### C. Household clustering
Implement household / nuclear family grouping as a first-class visualization structure.

Each household grouping should be capable of representing:

- parent / spouse pair where known
- a union / household midpoint or anchor
- child count or sibling count where relevant
- indication of which child continues the authenticated user’s bloodline
- expand / collapse affordances for non-primary children or collateral relatives

Routing principle:

- whenever possible, lineage should route household-to-household rather than through multiple independent person-to-person connectors that create crossings

### D. Collateral relative handling
Collateral relatives must remain available, but not dominate the layout.

Requirements:

- siblings, aunts, uncles, cousins, and side branches should attach as side clusters to relevant households
- sibling sets and larger child groups should support collapsed summary states
- collapsed summary states may be rendered as compact chips or count badges such as “+4 siblings” or “3 other children”
- expanded collateral groups must not visually overpower the direct bloodline
- collateral visibility should be mode-sensitive, with strongest suppression in Bloodline Mode

### E. Generational compression
The visualization must reduce the feeling that older generations are arbitrarily far away.

Requirements:

- distant generations may use reduced spacing
- cards / tiles may scale slightly smaller with distance or zoom level
- labels may simplify at lower detail levels
- do not destroy readability, but do compact the representation so ancestral distance feels logically compressed rather than endlessly stretched

### F. Orientation aids
Implement persistent orientation helpers.

Required:

1. A visible “Recenter on My Line” action
2. A bloodline breadcrumb rail or equivalent lineage navigation control that lists the focal user and their direct ancestors, with click-to-center behavior
3. If feasible, a minimap or simplified overview indicator showing where the user is within the visible lineage region

## Interaction requirements

### Person click
On click of a person tile/node:

- focus/select that person
- show relationship to authenticated user if relationship logic already exists or can be reasonably derived
- provide actions such as:
  - Center here
  - Show direct line to me
  - Open household
  - Expand siblings
  - Expand descendants

### Household click
On click of a household card or household midpoint:

- expand/collapse the household
- reveal children / sibling context
- preserve direct-line emphasis if one child continues the authenticated user’s line

### Hover
Hover behavior should:

- softly emphasize local edges and immediate context
- never overpower the persistent direct bloodline
- remain subtle and informative

## Complex relationship handling

### Multiple unions / marriages
A person may belong to multiple households.
The authenticated bloodline path should traverse only the relevant household for the logged-in user’s ancestry.
Other unions should appear as alternate connected household groups.

### Unknown parents
Support placeholder household slots such as unknown father / unknown mother where necessary.
Do not break the visual continuity of the bloodline more than necessary.

### Future relationship extensibility
Do not paint the implementation into a corner.
Preserve a structure that could later support multiple relationship types such as biological, adoptive, legal, or step relationships via edge styling and toggles.

## Technical and architectural requirements

You must not solve this as a superficial CSS patch or by sprinkling ad hoc exceptions into the current renderer.

First, inspect the existing Family Tree implementation and determine:

- where tree layout is computed
- where tile sorting is computed
- where node positioning is decided
- where connector routing is generated
- what current view modes already exist
- how the authenticated user is currently resolved to a person record
- what relationship / family structures already exist in the data model

Then refactor toward a layered design.

### Required architecture direction
Introduce or extend an intermediate view-model / layout-model layer that distinguishes between:

- person entities
- household / family-unit entities
- bloodline path entities
- collateral clusters
- logical relationships
- rendered nodes and edges
- render priority

Do not keep everything as a flat person-node render pass if the current design does that.

Suggested computed structures may include:

- focalPersonId
- bloodlineAncestorPath
- householdNodes
- householdEdges
- visiblePersonNodes
- collapsedCollateralGroups
- renderPriority
- relationshipMap
- layoutMode

You may choose better names, but the architecture must clearly separate genealogical data from layout/render decisions.

### Layout engine strategy
Prefer deterministic layout rules over force-directed behavior.

Suggested order of operations:

1. resolve authenticated focal person
2. compute direct ancestor path
3. build household units around direct-line generations
4. place those household units on a primary axis / trunk
5. attach side clusters for siblings and other local collateral relatives
6. reduce or collapse distant context depending on mode
7. route primary edges first, secondary edges afterward
8. render according to explicit priority layers

### Edge routing requirements
Reduce crossings materially, especially in Bloodline Mode and Household Mode.

Required strategies:

- route through household / union anchors where beneficial
- separate primary edge routing from secondary edge routing
- avoid allowing low-priority edges to visually cut through the main bloodline corridor whenever reasonably possible
- preserve correctness, but optimize for readability

### Rendering priorities
Implement explicit priorities such as:

- primaryBloodline
- householdCore
- localCollateral
- distantCollateral
- backgroundContext

These priorities must influence style and layout, not just labels.

## UI controls to add

At minimum add:

- mode selector with Bloodline / Household / Explore
- Recenter on My Line
- Bloodline Lock toggle if practical
- Expand / Collapse collateral relatives
- generation depth control if the view already supports or can support it cleanly
- optional visibility presets such as:
  - Bloodline only
  - Bloodline + household context
  - Full context

## Acceptance criteria

### Functional acceptance

- authenticated user becomes the default Family Tree anchor
- Bloodline Mode loads automatically for authenticated users
- the user’s direct ancestor path is highlighted automatically
- the user can recenter on their bloodline at any time
- household grouping exists for direct-line generations
- sibling and collateral branches can be collapsed or visually deemphasized
- Explore Mode remains available for broader graph browsing

### Visual acceptance

- the direct lineage from the authenticated user upward is clearly traceable without repeated zoom-hunting
- line crossings are materially reduced in Bloodline Mode and Household Mode compared with the current branch visualization
- the direct line is always the strongest visual structure on screen
- older generations feel more compact and less arbitrarily distant
- nearby household context is understandable at a glance

### UX acceptance

- the user no longer depends on right-click as the primary way to recover orientation
- the user can understand where they are in the tree within a few seconds after load
- the user can move between direct-line focus and broader exploration without losing context

## Constraints

- Preserve genealogical correctness
- Do not destroy useful current functionality if it can be retained as Explore Mode
- Avoid a reckless full rewrite unless necessary; prefer a layered refactor
- Keep implementation deterministic, testable, and maintainable
- Favor modular helpers and clear transforms over tangled render-time logic
- Produce something that feels like a coherent visualization system, not a pile of special cases

## Required work output

You must deliver the following in your response and implementation:

1. A concise analysis of the current Family Tree architecture relevant to layout, sorting, and connector rendering
2. A proposed architecture plan for the new layout/view-model system
3. Implementation of authenticated-user anchoring
4. Implementation of Bloodline Mode
5. Implementation of Household Mode
6. Preservation or refactoring of current broader graph behavior into Explore Mode where appropriate
7. Persistent direct-line highlighting
8. UI controls for mode switching and recentering
9. Updated routing / prioritization logic that materially reduces clutter
10. Concise developer documentation explaining:

   - how authenticated anchoring works
   - how bloodline highlighting works
   - how household clustering works
   - how the three modes differ

## Preferred execution order

Unless the codebase forces a different sequence, work in this order:

Phase 1:

- inspect current implementation
- identify tile sorting / layout / edge routing entry points
- add authenticated-user anchoring
- add persistent direct bloodline highlighting
- add Recenter on My Line
- add render priority layering

Phase 2:

- introduce household grouping model for direct-line generations
- refactor routing to use household / union anchors where appropriate
- collapse or de-emphasize collateral relatives in Bloodline Mode
- reduce line crossings materially

Phase 3:

- add explicit mode system for Bloodline / Household / Explore
- add breadcrumb rail and additional orientation aids
- refine spacing / generational compression / visual polish

## Final instruction

Do not respond with vague recommendations only. Perform concrete analysis and implementation. Inspect the existing code, identify the current Family Tree view logic, make the necessary refactor, and produce working changes. Explain your reasoning briefly but prioritize shipping code and documentation that implements the new lineage-first, authenticated-user-centered visualization system.
