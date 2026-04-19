#!/usr/bin/env node

/**
 * Person Details Extractor
 *
 * Reads the RootsMagic database and extracts individual-level facts
 * (birth, death, burial, residence, occupation, etc.) for every person
 * in the HTML export, including their full name, sex, and all dated events.
 *
 * Uses Node.js built-in sqlite (node:sqlite, available in Node 22+).
 * No external dependencies required.
 *
 * Run with: npm run extract-person-details
 * Output:   person-details.json (copied to dist on build)
 *
 * Re-run only when the .rmtree database has been updated.
 */

'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'FamilyTreeMedia', 'HofstetterFamilyTree.rmtree');
const OUTPUT_PATH = path.join(__dirname, '..', 'person-details.json');
const SUPPLEMENT_PATH = path.join(__dirname, 'genealogy-supplement.json');

const MONTHS_EN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FR_TO_EN = {
    'janvier': 'Jan', 'février': 'Feb', 'mars': 'Mar', 'avril': 'Apr',
    'mai': 'May', 'juin': 'Jun', 'juillet': 'Jul', 'août': 'Aug',
    'septembre': 'Sep', 'octobre': 'Oct', 'novembre': 'Nov', 'décembre': 'Dec'
};

function loadSupplement() {
    if (!fs.existsSync(SUPPLEMENT_PATH)) {
        return { augmentPeople: {}, syntheticPeople: {} };
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(SUPPLEMENT_PATH, 'utf8'));
        return {
            augmentPeople: parsed.augmentPeople || {},
            syntheticPeople: parsed.syntheticPeople || {}
        };
    } catch (error) {
        console.error('Error: Unable to parse genealogy supplement file.', error);
        process.exit(1);
    }
}

function cloneEvents(events) {
    return Array.isArray(events)
        ? events.map((event) => ({
            type: event.type || '',
            date: event.date || '',
            place: event.place || '',
            details: event.details || '',
            note: event.note || ''
        }))
        : [];
}

function createEventFingerprint(event) {
    return [
        String(event.type || '').toLowerCase(),
        String(event.date || '').toLowerCase(),
        String(event.place || '').toLowerCase(),
        String(event.details || '').toLowerCase()
    ].join('|');
}

function personHasPrimaryEvent(events, type) {
    return (events || []).some((event) => {
        if (String(event.type || '').toLowerCase() !== type.toLowerCase()) return false;
        return Boolean(event.date || event.place || event.details);
    });
}

function mergeSupplementIntoPerson(person, supplement, personId) {
    if (!person || !supplement) return;

    if (person.birthYear == null && supplement.birthYear != null) {
        person.birthYear = supplement.birthYear;
    }
    if (person.deathYear == null && supplement.deathYear != null) {
        person.deathYear = supplement.deathYear;
    }
    if (!person.nickname && supplement.nickname) {
        person.nickname = String(supplement.nickname).trim();
    }
    if (!person.profileNote && supplement.profileNote) {
        person.profileNote = String(supplement.profileNote).trim();
    }

    const existingEvents = Array.isArray(person.events) ? person.events : [];
    const seen = new Set(existingEvents.map(createEventFingerprint));

    cloneEvents(supplement.events).forEach((event) => {
        const eventType = String(event.type || '').toLowerCase();
        if ((eventType === 'birth' || eventType === 'death') && personHasPrimaryEvent(existingEvents, event.type)) {
            return;
        }

        const fingerprint = createEventFingerprint(event);
        if (seen.has(fingerprint)) return;
        existingEvents.push(event);
        seen.add(fingerprint);
    });

    person.events = existingEvents;

    if (!outputNameLooksValid(person.name)) {
        console.warn(`Supplement merge warning: Person ${personId} has an empty name after merge.`);
    }
}

function outputNameLooksValid(name) {
    return typeof name === 'string' && name.trim().length > 0;
}

function createSyntheticPerson(person) {
    return {
        name: person.name || '',
        sex: person.sex || '',
        living: person.living === true,
        nickname: person.nickname || '',
        profileNote: person.profileNote || '',
        birthYear: person.birthYear ?? null,
        deathYear: person.deathYear ?? null,
        events: cloneEvents(person.events)
    };
}

// Format one RootsMagic YYYYMMDD segment into a human-readable date string.
function formatDateParts(y, mo, day) {
    const parts = [];
    if (day && day !== '00') parts.push(String(parseInt(day, 10)));
    if (mo && mo !== '00') parts.push(MONTHS_EN[parseInt(mo, 10)] || '');
    if (y && y !== '0000') parts.push(y);
    return parts.filter(Boolean).join(' ');
}

// Decode RootsMagic's internal date formats:
//   D.+YYYYMMDD..+00000000..   exact date
//   D-+YYYYMMDD..+YYYYMMDD..   date range (between)
//   DR+YYYYMMDD..+YYYYMMDD..   date range (between)
//   DB+YYYYMMDD..+00000000..   before date
//   T{text}                    free-text date (may be French)
function decodeDate(raw) {
    if (!raw || raw === '.') return '';

    // Standard exact date or "after" variant: starts with D. or DA
    if (raw.startsWith('D.') || raw.startsWith('DA')) {
        const m = raw.match(/\+(\d{4})(\d{2})(\d{2})\./);
        if (!m) return '';
        return formatDateParts(m[1], m[2], m[3]);
    }

    // Date range: D- or DR → "between DATE1 and DATE2"
    if (raw.startsWith('D-') || raw.startsWith('DR')) {
        const matches = [...raw.matchAll(/\+(\d{4})(\d{2})(\d{2})\./g)];
        const d1 = matches[0] ? formatDateParts(matches[0][1], matches[0][2], matches[0][3]) : '';
        const d2 = matches[1] ? formatDateParts(matches[1][1], matches[1][2], matches[1][3]) : '';
        if (d1 && d2) return `between ${d1} and ${d2}`;
        if (d1) return `after ${d1}`;
        return '';
    }

    // Before date: DB
    if (raw.startsWith('DB')) {
        const m = raw.match(/\+(\d{4})(\d{2})(\d{2})\./);
        if (!m) return '';
        const d = formatDateParts(m[1], m[2], m[3]);
        return d ? `before ${d}` : '';
    }

    // Free-text date: T{text}
    if (raw.startsWith('T')) {
        const text = raw.slice(1).trim();
        if (!text || text.startsWith('#')) {
            // T#####1946 — try to extract a 4-digit year
            const yearMatch = text.match(/(\d{4})/);
            return yearMatch ? yearMatch[1] : '';
        }
        if (text.toLowerCase() === 'living') return 'living';
        // Translate French month names to English
        let translated = text;
        for (const [fr, en] of Object.entries(FR_TO_EN)) {
            translated = translated.replace(new RegExp(fr, 'i'), en);
        }
        // "environ" → "about"
        translated = translated.replace(/environ\s*/i, 'about ');
        return translated.trim();
    }

    return '';
}

function looksLikeStandalonePlace(value) {
    const text = String(value || '').trim();
    if (!text) return false;
    if (/[.;]/.test(text)) return false;
    if (/\b(age|buried|cemetery|cemetary|marital status|relation|weeks worked|income|attended school|grade completed)\b/i.test(text)) {
        return false;
    }

    const parts = text.split(',').map(part => part.trim()).filter(Boolean);
    return parts.length >= 3 && /\b(United States|Canada|Illinois|Iowa|Wisconsin|Kentucky|County)\b/i.test(text);
}

function normalizePlaceAndDetails(place, details) {
    const normalizedPlace = String(place || '').trim();
    const normalizedDetails = String(details || '').trim();
    if (!normalizedPlace && looksLikeStandalonePlace(normalizedDetails)) {
        return { place: normalizedDetails, details: '' };
    }
    return { place: normalizedPlace, details: normalizedDetails };
}

// Sex code from RootsMagic PersonTable: 0=Male, 1=Female, 2=unknown
function decodeSex(code) {
    return code === 0 ? 'Male' : code === 1 ? 'Female' : '';
}

function extractPersonDetails() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Error: Database not found at', DB_PATH);
        process.exit(1);
    }

    const supplement = loadSupplement();

    console.log('Opening database:', path.basename(DB_PATH));
    const db = new DatabaseSync(DB_PATH, { readOnly: true });

    // All persons with at least a primary name
    const persons = db.prepare(`
        SELECT p.PersonID, p.Sex, p.Living,
               n.Given, n.Surname, n.Prefix, n.Suffix, n.Nickname,
               n.BirthYear, n.DeathYear
        FROM PersonTable p
        JOIN NameTable n ON n.OwnerID = p.PersonID AND n.IsPrimary = 1
    `).all();

    // Events for a person, joined with fact type name and place.
    // SortDate is BIGINT and overflows JS numbers so we order by EventID as a proxy.
    const eventsStmt = db.prepare(`
        SELECT ft.Name as factName, e.Date, pl.Name as place, e.Details, e.Note
        FROM EventTable e
        JOIN FactTypeTable ft ON e.EventType = ft.FactTypeID
        LEFT JOIN PlaceTable pl ON e.PlaceID = pl.PlaceID
        WHERE e.OwnerID = ? AND e.OwnerType = 0
          AND (e.Date != '' OR e.PlaceID > 0 OR e.Details != '')
        ORDER BY e.EventID
    `);

    const output = {};

    for (const p of persons) {
        const given = (p.Given || '').trim();
        const surname = (p.Surname || '').trim();
        const prefix = (p.Prefix || '').trim();
        const suffix = (p.Suffix || '').trim();
        const nickname = (p.Nickname || '').trim();

        const nameParts = [prefix, given, surname, suffix].filter(Boolean);
        const fullName = nameParts.join(' ');

        const events = eventsStmt.all(p.PersonID).map(e => {
            const { place, details } = normalizePlaceAndDetails(e.place, e.Details);
            return {
                type: e.factName,
                date: decodeDate(e.Date),
                place,
                details,
                note: (e.Note || '').trim()
            };
        }).filter(e => e.date || e.place || e.details);

        output[String(p.PersonID)] = {
            name: fullName,
            sex: decodeSex(p.Sex),
            living: p.Living === 1,
            nickname: nickname || '',
            profileNote: '',
            birthYear: p.BirthYear || null,
            deathYear: p.DeathYear || null,
            events
        };
    }

    db.close();

    let augmentedCount = 0;
    Object.entries(supplement.augmentPeople).forEach(([personId, personSupplement]) => {
        if (!output[personId]) {
            console.warn(`Supplement warning: Person ${personId} not found in RootsMagic output.`);
            return;
        }
        mergeSupplementIntoPerson(output[personId], personSupplement, personId);
        augmentedCount += 1;
    });

    let syntheticCount = 0;
    Object.entries(supplement.syntheticPeople).forEach(([personId, person]) => {
        if (output[personId]) return;
        output[personId] = createSyntheticPerson(person);
        syntheticCount += 1;
    });

    const total = Object.keys(output).length;
    const withEvents = Object.values(output).filter(p => p.events.length > 0).length;
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Done. ${total} people, ${withEvents} with event data, ${augmentedCount} augmented, ${syntheticCount} supplemental.`);
    console.log('Output: person-details.json');
}

extractPersonDetails();
