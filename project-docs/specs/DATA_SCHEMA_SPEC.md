# Living Family Archive Data Schema Spec

## Purpose

This document defines the data contracts for Living Family Archive.

It has two roles:

1. Describe the JSON artifacts that are currently generated and shipped.
2. Define the target canonical schema that a future JSON-first rebuild should
   converge toward.

This spec is the schema companion to:

- `ROADMAP.md`
- `project-docs/specs/AI_REBUILD_SPEC.md`
- `project-docs/specs/AI_PROMPT_CHAIN.md`

---

## Scope

This document covers build-time genealogy and media artifacts only.

It does not define:

- Firestore collections for workflow data
- Firebase Auth payloads
- raw RootsMagic database tables
- UI component state

---

## Design Rules

- Canonical genealogy facts must be deterministic.
- Each JSON artifact should have one clear responsibility.
- Projection artifacts may be denormalized for speed.
- IDs should be stable and string-safe.
- Runtime merges should be intentional and minimal.
- Build-time generation is preferred over browser-side crawling.

---

## Artifact Classes

### Canonical artifacts

These are source-of-truth genealogy records.

- `people.json`
- `families.json`
- `events.json`
- `places.json`
- `media.json`
- `sources.json`
- `citations.json`

### Projection artifacts

These are optimized for application delivery and navigation.

- `directory.json`
- `graph-index.json`
- `source-usage.json`
- `photo-catalog.json`

### Transitional artifacts currently in repo

These are the active production-facing artifacts today.

- `directory.json`
- `sources.json`
- `source-usage.json`
- `person-details.json`
- `person-family.json`
- `person-photos.json`
- `photo-catalog.json`

---

## ID Conventions

### Current state

The repo currently uses stringified RootsMagic ids in most JSON files.

- Person ids: `"123"`
- Family ids: `"59"`
- Source ids: `"1"`

### Target state

For a full rebuild, these prefixed ids are preferred at the canonical layer:

- Person: `P123`
- Family: `F59`
- Event: `E1001`
- Place: `L44`
- Media: `M88`
- Source: `S12`
- Citation: `C340`

Projection artifacts may still use compact string ids if the mapping is stable
and documented.

---

## Current Shipped Schemas

## `directory.json`

### Role

Lightweight member directory used for search and browse.

### Storage shape

Top-level JSON array.

### Record schema

```json
{
  "name": "Barbara",
  "surname": "<No Surname>",
  "dates": "1806-1861",
  "link": "FamilyTreeMedia/Total Family/f41.htm#P93",
  "personId": "93",
  "searchText": "barbara <no surname> 1806-1861"
}
```

### Field definitions

- `name`: display name
- `surname`: surname bucket from RootsMagic name index
- `dates`: human-readable date span from name index
- `link`: legacy family-sheet anchor for the person, nullable
- `personId`: string person id
- `searchText`: lowercased search haystack

### Required fields

- `name`
- `searchText`

---

## `sources.json`

### Role

Normalized cited-source metadata used by the `Cited Sources` view.

### Storage shape

Top-level JSON array.

### Record schema

```json
{
  "id": "1",
  "title": "New York, U.S., Arriving Passenger and Crew Lists (including Castle Garden and Ellis Island), 1820-1957",
  "citationText": "Ancestry.com, New York, U.S., Arriving Passenger and Crew Lists...",
  "citationUrl": "FamilyTreeMedia/Total Family/sources.htm#1",
  "sourceType": "Immigration",
  "provider": "Ancestry.com",
  "repository": "The National Archives in Washington, DC",
  "jurisdiction": "New York",
  "yearStart": 1787,
  "yearEnd": 2010,
  "externalUrl": "",
  "description": "A travel or arrival record connected to immigration, passenger movement, or port entry.",
  "whyThisMatters": "Immigration records can connect a person to an origin point, a route, and the moment they entered a new country.",
  "citationPlaces": []
}
```

### Field definitions

- `id`: source id string from `sources.htm`
- `title`: emphasized title text from the citation
- `citationText`: normalized full citation text
- `citationUrl`: archival link to the original exported source page anchor; retained in data for traceability, not surfaced as a primary runtime action
- `sourceType`: derived classification
- `provider`: top-level provider name where detectable
- `repository`: cited repository or archive where detectable
- `jurisdiction`: first meaningful location/jurisdiction token from title
- `yearStart`: minimum year detected in citation context, nullable
- `yearEnd`: maximum year detected in citation context, nullable
- `externalUrl`: extracted URL from citation if present
- `description`: plain-language summary for non-technical relatives
- `whyThisMatters`: plain-language explanation of genealogical value
- `citationPlaces`: place values parsed directly from citation text

### Required fields

- `id`
- `title`
- `sourceType`
- `citationText`

### Notes

- `relatedPeople`, `relatedPlaces`, and counts are not stored here.
- Those are derived at runtime by combining `sources.json` with
  `source-usage.json` and person/directory data.

---

## `source-usage.json`

### Role

Per-source link index from cited sources to people, places, and occurrence
counts derived from exported family sheets.

### Storage shape

Top-level JSON object keyed by source id.

### Record schema

```json
{
  "1": {
    "personIds": ["489"],
    "places": [
      "New York, New York, United States",
      "Southampton, England"
    ],
    "occurrences": 4
  }
}
```

### Field definitions

- `personIds`: people connected to the source through cited rows
- `places`: place values inferred from cited family-sheet rows
- `occurrences`: number of source-link appearances across scanned family sheets

### Required fields

- `personIds`
- `places`
- `occurrences`

---

## `person-details.json`

### Role

Current person-centric details artifact for identity and life events.

### Storage shape

Top-level JSON object keyed by person id.

### Record schema

```json
{
  "2": {
    "name": "Harry John Krueger",
    "sex": "Male",
    "living": false,
    "nickname": "",
    "profileNote": "",
    "birthYear": 1895,
    "deathYear": 1965,
    "events": [
      {
        "type": "Birth",
        "date": "1 Jun 1895",
        "place": "Milwaukee, Milwaukee, Wisconsin, United States",
        "details": "",
        "note": ""
      }
    ]
  }
}
```

### Field definitions

- `name`: primary display name
- `sex`: `"Male"`, `"Female"`, or `""`
- `living`: boolean
- `nickname`: editable presentation field
- `profileNote`: editable presentation field
- `birthYear`: integer or `null`
- `deathYear`: integer or `null`
- `events`: flat event list

### Event schema

- `type`: fact type label
- `date`: decoded human-readable date string
- `place`: place string
- `details`: details text from RootsMagic event
- `note`: event note text

### Required fields

- `name`
- `living`
- `events`

### Migration note

This artifact should eventually be split into canonical `people.json` and
`events.json`.

---

## `person-family.json`

### Role

Current relationship artifact used for profile rendering and tree generation.

### Storage shape

Top-level JSON object keyed by person id.

### Record schema

```json
{
  "2": {
    "spouses": [
      { "id": "156", "name": "Gertrude Mardis" }
    ],
    "parents": [
      { "id": "3", "name": "Elinor" }
    ],
    "children": [
      { "id": "4", "name": "Mardene Krueger" }
    ],
    "families": [
      {
        "familyId": "1",
        "spouseId": "156",
        "spouseName": "Gertrude Mardis",
        "children": [
          { "id": "4", "name": "Mardene Krueger" }
        ]
      }
    ],
    "parentsFamilyId": "155"
  }
}
```

### Field definitions

- `spouses`: flat spouse list for profile display
- `parents`: flat parent list from birth family
- `children`: flat deduplicated child list for profile display
- `families`: structured family units formed by this person
- `parentsFamilyId`: family id of family of origin, nullable

### Child/person reference schema

- `id`: related person id
- `name`: related person display name

### Family-unit schema

- `familyId`: family id string
- `spouseId`: spouse person id or `null`
- `spouseName`: spouse name or `null`
- `children`: child reference array

### Required fields

- `spouses`
- `parents`
- `children`
- `families`
- `parentsFamilyId`

### Migration note

This artifact should eventually be replaced by canonical `families.json` plus
optional `graph-index.json`.

---

## `person-photos.json`

### Role

Current person-centric photo association artifact.

### Storage shape

Top-level JSON object keyed by person id.

### Record schema

```json
{
  "56": {
    "name": "Virgil Patterson Hartman",
    "birthYear": 1913,
    "deathYear": 1997,
    "photos": [
      {
        "file": "Virgil Hartman Obituary.jpg",
        "path": "FamilyTreeMedia/HofstetterFamilyTree_media/Virgil Hartman Obituary.jpg",
        "caption": "Virgil Hartman Obituary",
        "isPrimary": true,
        "sortOrder": 0
      }
    ]
  }
}
```

### Field definitions

- `name`: person display name
- `birthYear`: integer or `null`
- `deathYear`: integer or `null`
- `photos`: linked media list

### Photo entry schema

- `file`: original media filename
- `path`: trusted app-relative path
- `caption`: caption text
- `isPrimary`: boolean
- `sortOrder`: numeric sort order

### Required fields

- `name`
- `photos`

### Migration note

This artifact should eventually be absorbed into canonical `media.json`.

---

## `photo-catalog.json`

### Role

Flat media browse projection for the gallery.

### Storage shape

Top-level JSON array.

### Record schema

```json
{
  "name": "005248813_04361",
  "path": "FamilyTreeMedia/FamilyTreeMedia_media/005248813_04361.jpg"
}
```

### Field definitions

- `name`: display label based on filename
- `path`: trusted app-relative path

### Required fields

- `name`
- `path`

---

## Runtime-Enriched Source View Model

The browser currently enriches `sources.json` with usage and person context.
This is not a stored artifact, but it is part of the current application model.

### Derived fields

- `relatedPlaces`
- `relatedSurnames`
- `linkedPeopleCount`
- `relatedPeople`
- `usageCount`

### Derived `relatedPeople` record

```json
{
  "id": "489",
  "name": "Example Person",
  "dates": "1895-1965",
  "link": "FamilyTreeMedia/Total Family/f102.htm#P489"
}
```

If a future rebuild wants stricter data boundaries, these fields can move into a
separate build-time projection artifact instead of being merged in the client.

---

## Current Validation Thresholds

The current protected-data validation script enforces these minimums:

- `directory.json`: at least 400 records
- `sources.json`: at least 50 records
- `source-usage.json`: at least 10 records
- `person-details.json`: at least 400 records
- `person-family.json`: at least 400 records
- `person-photos.json`: at least 100 records
- `photo-catalog.json`: at least 500 records

It also now enforces cross-file integrity for the current shipped runtime:

- every `directory.json` member id must exist in both `person-details.json`
  and `person-family.json`
- every `person-photos.json` photo path must exist in `photo-catalog.json`
- every `sources.json` id must exist in `source-usage.json`
- every `source-usage.json` id must exist in `sources.json`
- every `source-usage.json` person id must exist in `person-details.json`
- relationship references in `person-family.json` must resolve to real people

These checks are still release-smoke integrity checks, not full canonical-schema
proofs.

---

## Target Canonical Schemas

These are the preferred end-state schemas for a full JSON-first rebuild.

## `people.json`

### Shape

Top-level object:

```json
{
  "schemaVersion": 1,
  "people": {
    "P123": {
      "id": "P123",
      "primaryName": {
        "full": "John Henry Smith",
        "given": "John Henry",
        "surname": "Smith",
        "prefix": "",
        "suffix": "",
        "nickname": "Jack"
      },
      "gender": "Male",
      "living": false,
      "birthYear": 1901,
      "deathYear": 1978,
      "profileNote": "",
      "flags": {
        "synthetic": false,
        "private": false
      },
      "attribution": {
        "sourceSystem": "RootsMagic",
        "updatedAt": "2026-04-04T00:00:00Z"
      }
    }
  }
}
```

---

## `families.json`

### Shape

```json
{
  "schemaVersion": 1,
  "families": {
    "F42": {
      "id": "F42",
      "adults": [
        { "personId": "P10", "role": "Father" },
        { "personId": "P11", "role": "Mother" }
      ],
      "children": [
        { "personId": "P12", "order": 1, "relationshipType": "Biological" }
      ],
      "relationshipType": "Married",
      "events": ["E900"],
      "notes": [],
      "citations": []
    }
  }
}
```

---

## `events.json`

### Shape

```json
{
  "schemaVersion": 1,
  "events": {
    "E1001": {
      "id": "E1001",
      "type": "Birth",
      "date": {
        "original": "D.+19010324..+00000000..",
        "display": "24 Mar 1901",
        "year": 1901,
        "sort": "1901-03-24",
        "quality": "Exact"
      },
      "placeId": "L55",
      "details": "",
      "note": "",
      "principalIds": ["P123"],
      "familyId": null,
      "citations": ["C7001"],
      "media": ["M90"]
    }
  }
}
```

---

## `places.json`

### Shape

```json
[
  {
    "id": "rock-island-rock-island-county-illinois-united-states",
    "name": "Rock Island, Rock Island County, Illinois, United States",
    "stats": {
      "peopleCount": 12,
      "eventCount": 8,
      "sourceCount": 4,
      "surnameCount": 5,
      "recordTypeCount": 3
    },
    "people": [
      {
        "id": "P123",
        "name": "Example Person",
        "dates": "1880-1940",
        "birthYear": 1880,
        "deathYear": 1940,
        "eventTypes": ["Birth", "Residence"],
        "sourceCount": 2
      }
    ],
    "events": [
      {
        "personId": "P123",
        "personName": "Example Person",
        "type": "Birth",
        "date": "1880",
        "year": 1880,
        "details": ""
      }
    ],
    "sources": [
      {
        "id": "S300",
        "title": "Example Census",
        "sourceType": "Census",
        "yearStart": 1900,
        "yearEnd": 1900,
        "citationUrl": "",
        "externalUrl": ""
      }
    ],
    "alternateNames": ["Rock Island, Illinois, United States"],
    "surnames": [{ "name": "Example", "count": 3 }],
    "recordTypes": [{ "name": "Census", "count": 1 }],
    "branchPrompts": [
      {
        "heading": "Example branch lead",
        "body": "Cautious, evidence-aware prompt text.",
        "evidence": "3 linked relatives with the Example surname"
      }
    ],
    "researchGuidance": [
      {
        "heading": "Anchor households with census records",
        "body": "Cautious research guidance text.",
        "evidence": "Residence facts exist here without a census source type linked to the place."
      }
    ]
  }
]
```

`branchPrompts` are generated only from unique linked people with repeated
surnames at the same place. They are research leads, not assertions that the
people are one household or one proven branch. UI copy must preserve that
caution.

---

## `accuracyScoreV1`

`accuracyScoreV1` is a computed in-memory analytics model, not a persisted
protected JSON file. It is calculated from the signed-in user's `linkedPersonId`,
`person-details.json`, `person-family.json`, and enriched cited-source metadata.

### Shape

```json
{
  "modelVersion": "accuracyScoreV1",
  "computedAt": "2026-04-17T00:00:00.000Z",
  "linkedPersonId": "P123",
  "score": 82,
  "confidenceBand": "Medium",
  "insufficientData": false,
  "components": {
    "profileCompleteness": 0.88,
    "sourceCoverage": 0.72,
    "relationshipConsistency": 1,
    "conflictReview": 1
  },
  "weights": {
    "profileCompleteness": 0.35,
    "sourceCoverage": 0.35,
    "relationshipConsistency": 0.2,
    "conflictReview": 0.1
  },
  "nationalityRatio": {
    "United States": 75,
    "Canada": 15,
    "Unknown": 10
  },
  "coverageStats": {
    "ancestorDepth": 4,
    "peopleInWindow": 12,
    "citedPeople": 8,
    "placeEvidencePeople": 9,
    "conflictCount": 0
  },
  "explanations": [
    "72% of the people in this ancestor window have at least one linked cited source."
  ]
}
```

### Rules

- The person window starts at `linkedPersonId` and walks ancestors up to 4
  generations.
- The score is weighted as: profile completeness 35%, source coverage 35%,
  relationship consistency 20%, conflict review 10%.
- Country ratios are based on documented profile places and cited-source place
  metadata. They are documentation patterns, not DNA, ethnicity, citizenship, or
  legal nationality claims.
- Ratios must include `Unknown` when evidence is missing and must total 100%.
- Sparse data returns an `Insufficient data` confidence state rather than a
  precise-looking claim.

---

## `media.json`

### Shape

```json
{
  "schemaVersion": 1,
  "media": {
    "M90": {
      "id": "M90",
      "path": "FamilyTreeMedia/HofstetterFamilyTree_media/example.jpg",
      "caption": "Example caption",
      "mimeType": "image/jpeg",
      "links": [
        { "kind": "person", "id": "P123", "isPrimary": true, "sortOrder": 0 }
      ]
    }
  }
}
```

---

## `sources.json` target canonical shape

The current `sources.json` is already close to canonical.

If extended, the preferred shape is:

```json
{
  "schemaVersion": 1,
  "sources": {
    "S300": {
      "id": "S300",
      "title": "1930 United States Census",
      "type": "Census",
      "repository": "",
      "provider": "",
      "url": "",
      "description": "",
      "metadata": {}
    }
  }
}
```

---

## `citations.json`

### Shape

```json
{
  "schemaVersion": 1,
  "citations": {
    "C7001": {
      "id": "C7001",
      "sourceId": "S300",
      "page": "Sheet 4A",
      "detail": "Household of John Smith",
      "confidence": "Secondary",
      "target": {
        "kind": "event",
        "id": "E1001"
      }
    }
  }
}
```

---

## `graph-index.json`

### Shape

```json
{
  "schemaVersion": 1,
  "peopleToFamiliesAsChild": {
    "P12": "F42"
  },
  "peopleToFamiliesAsAdult": {
    "P10": ["F42"],
    "P11": ["F42"]
  }
}
```

---

## Relationship Modeling Rules

Store explicitly:

- parent-child membership
- partner/spouse family units
- child order
- relationship type where known

Derive rather than store:

- siblings
- half-siblings
- ancestors
- descendants
- cousins

This keeps the canonical layer smaller and more consistent.

---

## Versioning Rules

For future canonical artifacts:

- include `schemaVersion` at top level
- bump version only for structural changes, not content refreshes
- document migration notes whenever a schema version changes

For current transitional artifacts:

- no version field is required yet
- structure changes must be documented in `ROADMAP.md` and `AI_REBUILD_SPEC.md`

---

## Rebuild Rules

Any AI-assisted rebuild should:

- use this document as the schema source of truth
- preserve current shipped artifacts unless intentionally replacing them
- avoid inventing new artifact names without justification
- avoid mixing canonical and projection responsibilities in a single file

---

## Next Schema Follow-On

The next useful addition after this document is a machine-readable schema set,
for example:

- JSON Schema files under `schemas/`
- one schema per artifact
- optional validation wiring in `validate-protected-data.js`
