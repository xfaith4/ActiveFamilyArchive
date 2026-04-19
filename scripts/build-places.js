#!/usr/bin/env node
/**
 * Build recurring place pages from protected person and citation data.
 *
 * The output is intentionally evidence-oriented: profile events contribute
 * person/place links, cited source usage contributes source/place links, and
 * citation-only places remain source context without overclaiming person facts.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const PERSON_DETAILS_INPUT = path.join(ROOT_DIR, 'person-details.json');
const SOURCES_INPUT = path.join(ROOT_DIR, 'sources.json');
const SOURCE_USAGE_INPUT = path.join(ROOT_DIR, 'source-usage.json');
const PLACES_OUTPUT = path.join(ROOT_DIR, 'places.json');

const PLACE_MINIMUMS = Object.freeze({
    people: 2,
    events: 2,
    sources: 2
});
const BRANCH_PROMPT_MINIMUMS = Object.freeze({
    peopleWithSurname: 3,
    totalPlacePeople: 4
});

const PRIMARY_EVENT_TYPES = new Set(['Birth', 'Baptism', 'Death', 'Burial', 'Cremation', 'Marriage', 'Residence']);

const US_STATE_NAMES_BY_ABBR = Object.freeze({
    AL: 'Alabama',
    AK: 'Alaska',
    AZ: 'Arizona',
    AR: 'Arkansas',
    CA: 'California',
    CO: 'Colorado',
    CT: 'Connecticut',
    DE: 'Delaware',
    FL: 'Florida',
    GA: 'Georgia',
    HI: 'Hawaii',
    ID: 'Idaho',
    IL: 'Illinois',
    IN: 'Indiana',
    IA: 'Iowa',
    KS: 'Kansas',
    KY: 'Kentucky',
    LA: 'Louisiana',
    ME: 'Maine',
    MD: 'Maryland',
    MA: 'Massachusetts',
    MI: 'Michigan',
    MN: 'Minnesota',
    MS: 'Mississippi',
    MO: 'Missouri',
    MT: 'Montana',
    NE: 'Nebraska',
    NV: 'Nevada',
    NH: 'New Hampshire',
    NJ: 'New Jersey',
    NM: 'New Mexico',
    NY: 'New York',
    NC: 'North Carolina',
    ND: 'North Dakota',
    OH: 'Ohio',
    OK: 'Oklahoma',
    OR: 'Oregon',
    PA: 'Pennsylvania',
    RI: 'Rhode Island',
    SC: 'South Carolina',
    SD: 'South Dakota',
    TN: 'Tennessee',
    TX: 'Texas',
    UT: 'Utah',
    VT: 'Vermont',
    VA: 'Virginia',
    WA: 'Washington',
    WV: 'West Virginia',
    WI: 'Wisconsin',
    WY: 'Wyoming',
    DC: 'District of Columbia'
});
const US_STATE_NAMES = new Set(Object.values(US_STATE_NAMES_BY_ABBR).map((name) => name.toLowerCase()));
const COUNTRY_ALIASES = new Map([
    ['usa', 'United States'],
    ['u s a', 'United States'],
    ['u.s.a', 'United States'],
    ['u.s.a.', 'United States'],
    ['us', 'United States'],
    ['u s', 'United States'],
    ['u.s.', 'United States'],
    ['united states of america', 'United States'],
    ['united states', 'United States']
]);
const US_ADMIN_SUFFIX_RE = /\b(county|parish|borough|census area|municipality|township|city)\b/i;

function readJson(filePath, label) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing ${label}: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeText(value) {
    return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizePlace(value) {
    const normalized = canonicalizePlaceName(value)
        .replace(/\s+([,;])/g, '$1')
        .replace(/[.;\s]+$/g, '')
        .trim();

    if (!normalized) return '';
    if (normalized.length < 3) return '';
    if (/^[\d/.\-\s]+$/.test(normalized)) return '';
    if (/^(age|date|unknown|not stated|same house|same place)$/i.test(normalized)) return '';
    return normalized;
}

function normalizePlaceSegmentForComparison(value) {
    return normalizeText(value)
        .replace(/[.]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function normalizeCountrySegment(segment) {
    return COUNTRY_ALIASES.get(normalizePlaceSegmentForComparison(segment)) || segment;
}

function normalizeStateSegment(segment) {
    const compact = normalizeText(segment).replace(/[.\s]/g, '').toUpperCase();
    if (US_STATE_NAMES_BY_ABBR[compact]) return US_STATE_NAMES_BY_ABBR[compact];

    const lower = normalizePlaceSegmentForComparison(segment);
    return US_STATE_NAMES.has(lower)
        ? Object.values(US_STATE_NAMES_BY_ABBR).find((name) => name.toLowerCase() === lower)
        : segment;
}

function stripDuplicateParenthetical(segment, laterSegments) {
    return normalizeText(segment).replace(/\s*\(([^)]+)\)/g, (match, inner) => {
        const innerKey = normalizePlaceSegmentForComparison(inner);
        return laterSegments.some((candidate) => normalizePlaceSegmentForComparison(candidate) === innerKey)
            ? ''
            : match;
    }).trim();
}

function canonicalizePlaceName(value) {
    const cleaned = normalizeText(value)
        .replace(/\s+([,;])/g, '$1')
        .replace(/[.;\s]+$/g, '')
        .trim();
    if (!cleaned) return '';

    let segments = cleaned.split(',')
        .map((segment) => normalizeText(segment))
        .filter(Boolean);

    segments = segments.map((segment, index) => (
        stripDuplicateParenthetical(segment, segments.slice(index + 1))
    )).filter(Boolean);

    segments = segments.map((segment) => normalizeCountrySegment(normalizeStateSegment(segment)));

    const last = segments[segments.length - 1];
    const country = normalizeCountrySegment(last || '');
    if (country === 'United States') {
        segments[segments.length - 1] = country;
    } else if (US_STATE_NAMES.has(normalizePlaceSegmentForComparison(last))) {
        segments.push('United States');
    }

    const countryIndex = segments.findIndex((segment) => segment === 'United States');
    const stateIndex = countryIndex > 0 ? countryIndex - 1 : segments.length - 1;
    const countyIndex = stateIndex - 1;
    if (
        countryIndex !== -1 &&
        countyIndex >= 1 &&
        US_STATE_NAMES.has(normalizePlaceSegmentForComparison(segments[stateIndex])) &&
        !US_ADMIN_SUFFIX_RE.test(segments[countyIndex])
    ) {
        // U.S. census rows often omit "County" in City, County, State strings.
        segments[countyIndex] = `${segments[countyIndex]} County`;
    }

    return segments.join(', ');
}

function createPlaceKey(place) {
    return normalizePlace(place)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[.;]+$/g, '');
}

function slugifyPlace(place, usedIds) {
    const base = normalizePlace(place)
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 72) || 'place';

    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) {
        id = `${base}-${suffix}`;
        suffix += 1;
    }
    usedIds.add(id);
    return id;
}

function inferSurname(name) {
    const parts = normalizeText(name).split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}

function formatYearSpan(details = {}) {
    if (!details?.birthYear && !details?.deathYear) return '';
    return `${details.birthYear || '?'}-${details.deathYear || '?'}`;
}

function incrementCount(map, key) {
    const normalized = normalizeText(key);
    if (!normalized) return;
    map.set(normalized, (map.get(normalized) || 0) + 1);
}

function mapCountsToArray(map, limit = 12) {
    return [...map.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, limit);
}

function mapPeopleToSurnameClusters(people) {
    const clusters = new Map();
    for (const person of people.values()) {
        const surname = inferSurname(person.name);
        if (!surname) continue;
        if (!clusters.has(surname)) {
            clusters.set(surname, {
                surname,
                people: [],
                eventTypes: new Set(),
                sourceCount: 0,
                years: []
            });
        }

        const cluster = clusters.get(surname);
        cluster.people.push(person);
        for (const eventType of person.eventTypes || []) {
            if (eventType) cluster.eventTypes.add(eventType);
        }
        cluster.sourceCount += person.sourceCount || 0;
        if (Number.isFinite(person.birthYear)) cluster.years.push(person.birthYear);
        if (Number.isFinite(person.deathYear)) cluster.years.push(person.deathYear);
    }

    return [...clusters.values()].sort((a, b) => (
        b.people.length - a.people.length ||
        b.sourceCount - a.sourceCount ||
        a.surname.localeCompare(b.surname)
    ));
}

function sortByName(a, b) {
    return String(a.name || '').localeCompare(String(b.name || ''));
}

function getYearFromDate(value) {
    const match = String(value || '').match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return match ? Number(match[1]) : null;
}

function createWorkingPlace(place) {
    return {
        name: normalizePlace(place),
        aliases: new Set(),
        people: new Map(),
        events: [],
        sources: new Map(),
        surnames: new Map(),
        recordTypes: new Map()
    };
}

function getPlaceSegments(placeName) {
    return canonicalizePlaceName(placeName)
        .split(',')
        .map((segment) => normalizeText(segment))
        .filter(Boolean);
}

function getUsPlaceStateIndex(segments) {
    const countryIndex = segments.findIndex((segment) => segment === 'United States');
    return countryIndex > 0 ? countryIndex - 1 : -1;
}

function hasExplicitUsCountySegment(placeName) {
    const segments = getPlaceSegments(placeName);
    const stateIndex = getUsPlaceStateIndex(segments);
    const countyIndex = stateIndex - 1;
    return (
        countyIndex >= 1 &&
        US_STATE_NAMES.has(normalizePlaceSegmentForComparison(segments[stateIndex])) &&
        US_ADMIN_SUFFIX_RE.test(segments[countyIndex])
    );
}

function createCountyAgnosticPlaceKey(placeName) {
    const segments = getPlaceSegments(placeName);
    const stateIndex = getUsPlaceStateIndex(segments);
    const countyIndex = stateIndex - 1;

    if (
        countyIndex >= 1 &&
        US_STATE_NAMES.has(normalizePlaceSegmentForComparison(segments[stateIndex])) &&
        US_ADMIN_SUFFIX_RE.test(segments[countyIndex])
    ) {
        segments.splice(countyIndex, 1);
    }

    return segments.join(', ').toLowerCase();
}

function mergeCounts(target, source) {
    for (const [name, count] of source.entries()) {
        target.set(name, (target.get(name) || 0) + count);
    }
}

function mergePeople(target, source) {
    for (const [personId, sourcePerson] of source.entries()) {
        const targetPerson = target.get(personId);
        if (!targetPerson) {
            target.set(personId, {
                ...sourcePerson,
                eventTypes: new Set(sourcePerson.eventTypes || [])
            });
            continue;
        }

        for (const eventType of sourcePerson.eventTypes || []) {
            targetPerson.eventTypes.add(eventType);
        }
        targetPerson.sourceCount += sourcePerson.sourceCount || 0;
    }
}

function mergeWorkingPlace(target, source) {
    target.aliases.add(source.name);
    source.aliases.forEach((alias) => target.aliases.add(alias));
    mergePeople(target.people, source.people);
    source.events.forEach((event) => target.events.push(event));
    source.sources.forEach((sourceRecord, sourceId) => target.sources.set(sourceId, sourceRecord));
    mergeCounts(target.surnames, source.surnames);
    mergeCounts(target.recordTypes, source.recordTypes);
}

function consolidateCityCountyVariants(placesByKey) {
    const groups = new Map();

    for (const [key, place] of placesByKey.entries()) {
        const agnosticKey = createCountyAgnosticPlaceKey(place.name);
        if (!groups.has(agnosticKey)) groups.set(agnosticKey, []);
        groups.get(agnosticKey).push({ key, place, hasCounty: hasExplicitUsCountySegment(place.name) });
    }

    for (const group of groups.values()) {
        const countySpecific = group.filter((entry) => entry.hasCounty);
        const cityOnly = group.filter((entry) => !entry.hasCounty);
        if (countySpecific.length !== 1 || !cityOnly.length) continue;

        const target = countySpecific[0];
        cityOnly.forEach((entry) => {
            // Only merge when one county-specific candidate exists; ambiguous
            // places like Oklee in multiple counties stay split for review.
            mergeWorkingPlace(target.place, entry.place);
            placesByKey.delete(entry.key);
        });
    }
}

function addPersonToPlace(place, personId, details, eventType = '') {
    const id = String(personId || '').trim();
    if (!id || !details?.name) return;

    const existing = place.people.get(id) || {
        id,
        name: details.name,
        dates: formatYearSpan(details),
        birthYear: details.birthYear ?? null,
        deathYear: details.deathYear ?? null,
        eventTypes: new Set(),
        sourceCount: 0
    };

    if (eventType) existing.eventTypes.add(eventType);
    place.people.set(id, existing);
    incrementCount(place.surnames, inferSurname(details.name));
}

function addSourceToPlace(place, source) {
    if (!source?.id) return;
    const id = String(source.id);
    if (!place.sources.has(id)) {
        place.sources.set(id, {
            id,
            title: source.title || `Source ${id}`,
            sourceType: source.sourceType || 'Record Collection',
            yearStart: source.yearStart ?? null,
            yearEnd: source.yearEnd ?? null,
            citationUrl: source.citationUrl || '',
            externalUrl: source.externalUrl || ''
        });
    }
    incrementCount(place.recordTypes, source.sourceType || 'Record Collection');
}

function buildResearchGuidance(place) {
    const guidance = [];
    const recordTypes = new Set([...place.sources.values()].map((source) => source.sourceType));
    const eventTypes = new Set(place.events.map((event) => event.type));
    const hasVitals = recordTypes.has('Vital Record');
    const hasCensus = recordTypes.has('Census');
    const hasCemetery = recordTypes.has('Cemetery');

    if (place.sources.size === 0) {
        guidance.push({
            heading: 'Add first citations',
            body: 'This place is mentioned in profile facts but has no linked cited sources yet. Start with the oldest birth, marriage, death, or residence facts on this page and attach the exact record that supports the place.',
            evidence: `${place.events.length} profile facts currently mention this place.`
        });
    }

    if ((eventTypes.has('Birth') || eventTypes.has('Death') || eventTypes.has('Marriage')) && !hasVitals) {
        guidance.push({
            heading: 'Check civil vital indexes',
            body: 'Birth, marriage, and death facts tied to this place should be checked against county, state, or parish vital-record indexes before being treated as proven.',
            evidence: 'Vital-record citations are not yet represented for this place.'
        });
    }

    if (eventTypes.has('Residence') && !hasCensus) {
        guidance.push({
            heading: 'Anchor households with census records',
            body: 'Residence facts become stronger when the household can be compared with nearby census or city-directory records for the same decade.',
            evidence: 'Residence facts exist here without a census source type linked to the place.'
        });
    }

    if ((eventTypes.has('Death') || eventTypes.has('Burial')) && !hasCemetery) {
        guidance.push({
            heading: 'Look for cemetery clusters',
            body: 'Deaths and burials at the same place often reveal related households. Cemetery indexes, memorials, and obituaries are good next checks.',
            evidence: 'Death or burial facts are present without a cemetery source type linked to the place.'
        });
    }

    if (guidance.length === 0) {
        guidance.push({
            heading: 'Compare the source mix',
            body: 'This place already has multiple evidence types. Review the connected relatives together and look for people whose dates or places are still uncited.',
            evidence: `${place.sources.size} cited sources and ${place.people.size} linked people are connected here.`
        });
    }

    return guidance.slice(0, 3);
}

function formatClusterYearSpan(cluster) {
    const years = cluster.years.filter(Number.isFinite);
    if (!years.length) return '';
    const min = Math.min(...years);
    const max = Math.max(...years);
    return min === max ? String(min) : `${min}-${max}`;
}

function buildBranchPrompts(place) {
    if (place.people.size < BRANCH_PROMPT_MINIMUMS.totalPlacePeople) return [];

    return mapPeopleToSurnameClusters(place.people)
        .filter((cluster) => cluster.people.length >= BRANCH_PROMPT_MINIMUMS.peopleWithSurname)
        .slice(0, 3)
        .map((cluster) => {
            const eventTypes = [...cluster.eventTypes].sort((a, b) => a.localeCompare(b));
            const yearSpan = formatClusterYearSpan(cluster);
            const evidenceParts = [
                `${cluster.people.length} linked relatives with the ${cluster.surname} surname`,
                eventTypes.length ? `facts include ${eventTypes.slice(0, 4).join(', ')}` : '',
                yearSpan ? `dates span ${yearSpan}` : '',
                cluster.sourceCount ? `${cluster.sourceCount} cited source connections` : ''
            ].filter(Boolean);

            return {
                heading: `${cluster.surname} branch lead`,
                body: `The ${cluster.surname} surname is linked to several relatives at this place. Treat this as a research lead, not proof of one household or one branch; compare the connected people, dates, and cited records before drawing conclusions.`,
                evidence: evidenceParts.join(' · ')
            };
        });
}

function shouldIncludePlace(place) {
    return (
        place.people.size >= PLACE_MINIMUMS.people ||
        place.events.length >= PLACE_MINIMUMS.events ||
        place.sources.size >= PLACE_MINIMUMS.sources
    );
}

function finalizePlace(place, usedIds) {
    const people = [...place.people.values()]
        .map((person) => ({
            ...person,
            eventTypes: [...person.eventTypes].sort((a, b) => a.localeCompare(b))
        }))
        .sort(sortByName);

    const sources = [...place.sources.values()]
        .sort((a, b) => a.sourceType.localeCompare(b.sourceType) || a.title.localeCompare(b.title));

    const events = place.events
        .sort((a, b) => {
            const primaryDiff = Number(PRIMARY_EVENT_TYPES.has(b.type)) - Number(PRIMARY_EVENT_TYPES.has(a.type));
            if (primaryDiff !== 0) return primaryDiff;
            const ay = a.year ?? 9999;
            const by = b.year ?? 9999;
            return ay - by || a.personName.localeCompare(b.personName);
        })
        .slice(0, 80);
    const alternateNames = [...place.aliases]
        .filter((name) => name && name.toLowerCase() !== place.name.toLowerCase())
        .sort((a, b) => a.localeCompare(b));
    const branchPrompts = buildBranchPrompts(place);

    return {
        id: slugifyPlace(place.name, usedIds),
        name: place.name,
        stats: {
            peopleCount: people.length,
            eventCount: place.events.length,
            sourceCount: sources.length,
            surnameCount: place.surnames.size,
            recordTypeCount: place.recordTypes.size
        },
        people,
        events,
        sources,
        ...(alternateNames.length ? { alternateNames } : {}),
        surnames: mapCountsToArray(place.surnames, 14),
        recordTypes: mapCountsToArray(place.recordTypes, 10),
        ...(branchPrompts.length ? { branchPrompts } : {}),
        researchGuidance: buildResearchGuidance(place)
    };
}

function buildPlaces() {
    const personDetails = readJson(PERSON_DETAILS_INPUT, 'person-details.json');
    const sources = readJson(SOURCES_INPUT, 'sources.json');
    const sourceUsage = readJson(SOURCE_USAGE_INPUT, 'source-usage.json');
    const sourcesById = new Map(sources.map((source) => [String(source.id), source]));
    const placesByKey = new Map();

    function getPlace(placeName) {
        const normalized = normalizePlace(placeName);
        if (!normalized) return null;
        const key = createPlaceKey(normalized);
        if (!placesByKey.has(key)) {
            placesByKey.set(key, createWorkingPlace(normalized));
        }
        const place = placesByKey.get(key);
        const original = normalizeText(placeName);
        if (original && original.toLowerCase() !== place.name.toLowerCase()) {
            place.aliases.add(original);
        }
        return place;
    }

    for (const [personId, details] of Object.entries(personDetails)) {
        for (const event of details.events || []) {
            const place = getPlace(event.place);
            if (!place) continue;

            addPersonToPlace(place, personId, details, event.type);
            place.events.push({
                personId: String(personId),
                personName: details.name,
                type: event.type || 'Event',
                date: event.date || '',
                year: getYearFromDate(event.date),
                details: event.details || ''
            });
        }
    }

    for (const [sourceId, usage] of Object.entries(sourceUsage)) {
        const source = sourcesById.get(String(sourceId));
        if (!source) continue;

        for (const placeName of usage.places || []) {
            const place = getPlace(placeName);
            if (!place) continue;

            addSourceToPlace(place, source);
            for (const personId of usage.personIds || []) {
                const details = personDetails[String(personId)];
                if (!details) continue;
                addPersonToPlace(place, personId, details);
                const person = place.people.get(String(personId));
                if (person) person.sourceCount += 1;
            }
        }

        for (const placeName of source.citationPlaces || []) {
            const place = getPlace(placeName);
            if (place) addSourceToPlace(place, source);
        }
    }

    consolidateCityCountyVariants(placesByKey);

    const usedIds = new Set();
    const places = [...placesByKey.values()]
        .filter(shouldIncludePlace)
        .map((place) => finalizePlace(place, usedIds))
        .sort((a, b) => (
            b.stats.peopleCount - a.stats.peopleCount ||
            b.stats.sourceCount - a.stats.sourceCount ||
            b.stats.eventCount - a.stats.eventCount ||
            a.name.localeCompare(b.name)
        ));

    fs.writeFileSync(PLACES_OUTPUT, `${JSON.stringify(places, null, 2)}\n`, 'utf8');
    console.log(`Built places.json with ${places.length} recurring places.`);
}

if (require.main === module) {
    try {
        buildPlaces();
    } catch (error) {
        console.error(`Failed to build places: ${error.message}`);
        process.exit(1);
    }
}

module.exports = {
    buildPlaces,
    normalizePlace,
    createPlaceKey,
    canonicalizePlaceName
};
