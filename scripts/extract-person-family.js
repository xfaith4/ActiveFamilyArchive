#!/usr/bin/env node

/**
 * Person Family Relationship Extractor
 *
 * Reads the RootsMagic database and extracts spouse, parent, and child
 * relationships for every person in the database.
 *
 * Output schema per person:
 *   spouses      — flat list of all spouses across all families (for profile display)
 *   parents      — flat list [father, mother] from the family this person was born into
 *   children     — flat deduplicated list of all children (for profile display)
 *   families     — structured array: each entry is one family unit this person formed,
 *                  with the spouse and the children specific to that pairing.
 *                  Used by the family tree to attach children to the correct parental pair
 *                  and preserve half-sibling accuracy.
 *   parentsFamilyId — the FamilyID of the family this person was born into (for tree edges)
 *
 * Uses Node.js built-in sqlite (node:sqlite, available in Node 22+).
 * No external dependencies required.
 *
 * Run with: npm run extract-person-family
 * Output:   person-family.json (copied to dist on build)
 *
 * Re-run only when the .rmtree database has been updated.
 */

'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'FamilyTreeMedia', 'HofstetterFamilyTree.rmtree');
const OUTPUT_PATH = path.join(__dirname, '..', 'person-family.json');
const SUPPLEMENT_PATH = path.join(__dirname, 'genealogy-supplement.json');

function loadSupplement() {
    if (!fs.existsSync(SUPPLEMENT_PATH)) {
        return { syntheticPeople: {}, families: [] };
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(SUPPLEMENT_PATH, 'utf8'));
        return {
            syntheticPeople: parsed.syntheticPeople || {},
            families: Array.isArray(parsed.families) ? parsed.families : []
        };
    } catch (error) {
        console.error('Error: Unable to parse genealogy supplement file.', error);
        process.exit(1);
    }
}

function createEmptyRelationshipRecord() {
    return {
        spouses: [],
        parents: [],
        children: [],
        families: [],
        parentsFamilyId: null
    };
}

function addUniquePerson(list, person) {
    if (!person) return;
    if (!list.some((entry) => entry.id === person.id)) {
        list.push(person);
    }
}

function extractPersonFamily() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Error: Database not found at', DB_PATH);
        process.exit(1);
    }

    const supplement = loadSupplement();

    console.log('Opening database:', path.basename(DB_PATH));
    const db = new DatabaseSync(DB_PATH, { readOnly: true });

    // All persons with at least a primary name — same set as person-details.json
    const allPersonIds = db.prepare(`
        SELECT p.PersonID
        FROM PersonTable p
        JOIN NameTable n ON n.OwnerID = p.PersonID AND n.IsPrimary = 1
    `).all().map(r => r.PersonID);

    console.log(`Processing ${allPersonIds.length} persons...`);

    // Resolve a PersonID to { id, name } using the primary name record.
    // Returns null for unknown or nameless persons.
    const nameStmt = db.prepare(`
        SELECT Given, Surname FROM NameTable WHERE OwnerID = ? AND IsPrimary = 1 LIMIT 1
    `);

    function resolvePerson(personId) {
        if (!personId || personId === 0) return null;
        const row = nameStmt.get(personId);
        if (!row) return null;
        const given = (row.Given || '').trim();
        const surname = (row.Surname || '').trim();
        return {
            id: String(personId),
            name: [given, surname].filter(Boolean).join(' ')
        };
    }

    function resolveAnyPerson(personId) {
        const id = String(personId || '');
        if (!id) return null;

        const resolved = resolvePerson(id);
        if (resolved) return resolved;

        const synthetic = supplement.syntheticPeople[id];
        if (!synthetic) return null;

        return {
            id,
            name: String(synthetic.name || '').trim()
        };
    }

    // All family rows where this person is father or mother
    const spouseFamiliesStmt = db.prepare(`
        SELECT FamilyID, FatherID, MotherID
        FROM FamilyTable
        WHERE FatherID = ? OR MotherID = ?
    `);

    // Children for a specific family unit
    const familyChildrenStmt = db.prepare(`
        SELECT ct.ChildID
        FROM ChildTable ct
        WHERE ct.FamilyID = ?
        ORDER BY ct.ChildOrder
    `);

    // The family this person was born into (as a child)
    const parentsStmt = db.prepare(`
        SELECT f.FamilyID, f.FatherID, f.MotherID
        FROM ChildTable ct
        JOIN FamilyTable f ON ct.FamilyID = f.FamilyID
        WHERE ct.ChildID = ?
        LIMIT 1
    `);

    const output = {};

    function ensurePersonRecord(personId) {
        const id = String(personId);
        if (!output[id]) {
            output[id] = createEmptyRelationshipRecord();
        }
        return output[id];
    }

    function ensureFamilyEntry(personRecord, familyId, spouse) {
        const normalizedFamilyId = String(familyId);
        let entry = personRecord.families.find((family) => family.familyId === normalizedFamilyId);
        if (!entry) {
            entry = {
                familyId: normalizedFamilyId,
                spouseId: spouse ? spouse.id : null,
                spouseName: spouse ? spouse.name : null,
                children: []
            };
            personRecord.families.push(entry);
            return entry;
        }

        if (spouse && !entry.spouseId) {
            entry.spouseId = spouse.id;
            entry.spouseName = spouse.name;
        }

        return entry;
    }

    function mergeSupplementFamily(family) {
        const familyId = String(family.familyId || '');
        if (!familyId) return;

        const father = resolveAnyPerson(family.fatherId);
        const mother = resolveAnyPerson(family.motherId);
        const children = (family.children || [])
            .map((childId) => resolveAnyPerson(childId))
            .filter(Boolean);

        if (father) {
            const fatherRecord = ensurePersonRecord(father.id);
            addUniquePerson(fatherRecord.spouses, mother);
            const fatherFamily = ensureFamilyEntry(fatherRecord, familyId, mother);
            children.forEach((child) => {
                addUniquePerson(fatherFamily.children, child);
                addUniquePerson(fatherRecord.children, child);
            });
        }

        if (mother) {
            const motherRecord = ensurePersonRecord(mother.id);
            addUniquePerson(motherRecord.spouses, father);
            const motherFamily = ensureFamilyEntry(motherRecord, familyId, father);
            children.forEach((child) => {
                addUniquePerson(motherFamily.children, child);
                addUniquePerson(motherRecord.children, child);
            });
        }

        children.forEach((child) => {
            const childRecord = ensurePersonRecord(child.id);
            if (!childRecord.parentsFamilyId || childRecord.parentsFamilyId === familyId) {
                childRecord.parentsFamilyId = familyId;
                childRecord.parents = [];
                addUniquePerson(childRecord.parents, father);
                addUniquePerson(childRecord.parents, mother);
            } else {
                console.warn(`Supplement warning: Child ${child.id} already assigned to parentsFamilyId ${childRecord.parentsFamilyId}; skipped conflicting family ${familyId}.`);
            }
        });
    }

    for (const personId of allPersonIds) {
        // ── Families this person formed (as a parent) ──────────────────────────
        const familyRows = spouseFamiliesStmt.all(personId, personId);

        const families = [];       // structured, for tree rendering
        const spousesFlat = [];    // flat, for profile display
        const childrenSeen = new Set();
        const childrenFlat = [];   // flat deduplicated, for profile display

        for (const row of familyRows) {
            const spouseRawId = row.FatherID === personId ? row.MotherID : row.FatherID;
            const spouse = resolvePerson(spouseRawId);

            const childRows = familyChildrenStmt.all(row.FamilyID);
            const familyChildren = [];
            for (const c of childRows) {
                const resolved = resolvePerson(c.ChildID);
                if (resolved) {
                    familyChildren.push(resolved);
                    if (!childrenSeen.has(resolved.id)) {
                        childrenSeen.add(resolved.id);
                        childrenFlat.push(resolved);
                    }
                }
            }

            families.push({
                familyId: String(row.FamilyID),
                spouseId: spouseRawId ? String(spouseRawId) : null,
                spouseName: spouse ? spouse.name : null,
                children: familyChildren
            });

            if (spouse) spousesFlat.push(spouse);
        }

        // ── Family this person was born into (as a child) ──────────────────────
        const parentRow = parentsStmt.get(personId);
        const parentsFlat = [];
        let parentsFamilyId = null;

        if (parentRow) {
            parentsFamilyId = String(parentRow.FamilyID);
            const father = resolvePerson(parentRow.FatherID);
            const mother = resolvePerson(parentRow.MotherID);
            if (father) parentsFlat.push(father);
            if (mother) parentsFlat.push(mother);
        }

        // Only include persons who have at least one relationship
        if (families.length || parentsFlat.length || childrenFlat.length) {
            output[String(personId)] = {
                spouses: spousesFlat,
                parents: parentsFlat,
                children: childrenFlat,
                families,
                parentsFamilyId
            };
        }
    }

    supplement.families.forEach(mergeSupplementFamily);

    db.close();

    const count = Object.keys(output).length;
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Done. Family data for ${count} people.`);
    console.log('Output: person-family.json');
}

extractPersonFamily();
