// Parse and search family tree data from the existing HTML files

// Protected data resources resolved by main.js after authentication.
// Each entry may be either a direct URL string or an async loader function.
// Falls back to direct paths when empty (local dev with password bypass).
let dataResources = {};
const EMPTY_DATA_LOAD_ERRORS = Object.freeze({
    familyData: null,
    citedSources: null,
    placePages: null,
    personPhotos: null,
    photoCatalog: null,
    personFamily: null,
    personDetails: null,
});
let dataLoadErrors = { ...EMPTY_DATA_LOAD_ERRORS };

function canUseLocalJsonFallback() {
    if (typeof window === 'undefined') return false;
    const { protocol, hostname } = window.location;
    return protocol === 'file:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

function clearDataLoadError(key) {
    dataLoadErrors[key] = null;
}

function recordDataLoadError(key, error) {
    dataLoadErrors[key] = error instanceof Error ? error.message : String(error);
}

async function fetchJsonResource(url, label) {
    const response = await fetch(url);
    const body = await response.text();

    if (!response.ok) {
        throw new Error(`${label} request failed with status ${response.status}.`);
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType && !contentType.includes('json')) {
        throw new Error(`${label} returned ${contentType} instead of JSON.`);
    }

    try {
        return JSON.parse(body);
    } catch {
        throw new Error(`${label} returned invalid JSON.`);
    }
}

async function loadJsonResource(source, fallbackUrl, label) {
    if (typeof source === 'function') {
        return source();
    }

    if (typeof source === 'string' && source.trim()) {
        return fetchJsonResource(source, label);
    }

    if (canUseLocalJsonFallback()) {
        return fetchJsonResource(fallbackUrl, label);
    }

    throw new Error(
        `${label} is unavailable because protected data has not been initialized for this session. ` +
        'Sign in first, or use localhost for local JSON fallback.'
    );
}

export function initDataUrls(urls) {
    dataResources = urls;
    // Clear all caches so data reloads from the newly resolved URLs.
    familyData        = null;
    photoData         = null;
    personPhotoData   = null;
    personFamilyData  = null;
    personDetailsData = null;
    searchIndex       = null;
    photoPersonMap    = null;
    citedSourcesData  = null;
    citedSourcesPromise = null;
    placePagesData    = null;
    placePagesPromise = null;
    familyIndexes     = null;
    dataLoadErrors    = { ...EMPTY_DATA_LOAD_ERRORS };
}

export function getDataLoadErrors() {
    return { ...dataLoadErrors };
}

let familyData = null;
let photoData = null;

function extractPersonIdFromLink(link) {
    const match = typeof link === 'string' ? link.match(/#[Pp](\d+)/) : null;
    return match ? String(match[1]) : null;
}

function extractPersonIdFromMember(member) {
    if (!member) return null;
    if (member.personId != null && member.personId !== '') {
        return String(member.personId);
    }
    return extractPersonIdFromLink(member.link);
}

function inferSurnameFromName(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}

function buildFullName(name = '', surname = '') {
    const normalizedName = String(name || '').trim();
    const normalizedSurname = String(surname || '').trim();
    if (!normalizedSurname) return normalizedName;
    const lowerName = normalizedName.toLowerCase();
    const lowerSurname = normalizedSurname.toLowerCase();
    if (!normalizedName || lowerName === lowerSurname || lowerName.endsWith(` ${lowerSurname}`)) {
        return normalizedName || normalizedSurname;
    }
    return `${normalizedName} ${normalizedSurname}`.trim();
}

function splitSearchWords(...parts) {
    return parts
        .filter(Boolean)
        .flatMap(part => String(part).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

function isQuadCitiesPlace(place) {
    if (!place) return false;
    const s = String(place).toLowerCase();
    if (s.includes('rock island')) return true;
    if (s.includes('east moline')) return true;
    if (s.includes('carbon cliff')) return true;
    if (s.includes('port byron')) return true;
    if (s.includes('silvis')) return true;
    if (s.includes('coal valley')) return true;
    if (s.includes('bettendorf')) return true;
    if (s.includes('le claire')) return true;
    if (s.includes('moline')) return true;
    if (s.includes('davenport') && (s.includes('iowa') || s.includes(', ia'))) return true;
    if ((s.includes('milan') || s.includes('hampton') || s.includes('buffalo')) &&
        (s.includes('rock island') || s.includes('scott'))) return true;
    return false;
}

const SEARCH_PLACE_ALIAS_RULES = [
    {
        aliases: ['quad cities', 'quad city', 'quad-cities'],
        match: isQuadCitiesPlace,
    },
];

function buildPlaceAliases(places = []) {
    const aliases = new Set();
    for (const rule of SEARCH_PLACE_ALIAS_RULES) {
        if (places.some(rule.match)) {
            rule.aliases.forEach(alias => aliases.add(alias));
        }
    }
    return [...aliases];
}

function createMemberRecord({ name = '', surname = '', dates = '', link = null, personId = null, isSynthetic = false }) {
    const normalizedName = String(name || '').trim();
    const normalizedSurname = String(surname || '').trim();
    const normalizedDates = String(dates || '').trim();
    const normalizedLink = typeof link === 'string' && link.trim() ? link.trim() : null;
    const normalizedPersonId = personId != null && personId !== '' ? String(personId) : extractPersonIdFromLink(normalizedLink);

    return {
        name: normalizedName,
        surname: normalizedSurname,
        dates: normalizedDates,
        link: normalizedLink,
        personId: normalizedPersonId,
        isSynthetic,
        searchText: `${normalizedName} ${normalizedSurname} ${normalizedDates}`.toLowerCase()
    };
}

function buildSyntheticMemberFromDetails(personId, details) {
    if (!details) return null;
    return createMemberRecord({
        name: details.name || `Person ${personId}`,
        surname: inferSurnameFromName(details.name),
        dates: formatYearSpan(details),
        link: null,
        personId,
        isSynthetic: true
    });
}

function mergeDetailsIntoFamilyData() {
    if (!familyData || !personDetailsData) return;

    const seenIds = new Set();
    familyData = familyData.map((member) => {
        const personId = extractPersonIdFromMember(member);
        if (!personId) return member;

        seenIds.add(personId);
        const details = personDetailsData[personId];
        return createMemberRecord({
            name: member.name,
            surname: member.surname || inferSurnameFromName(member.name),
            dates: member.dates || formatYearSpan(details),
            link: member.link,
            personId,
            isSynthetic: member.isSynthetic === true && !member.link
        });
    });

    Object.entries(personDetailsData).forEach(([personId, details]) => {
        if (seenIds.has(personId)) return;
        const syntheticMember = buildSyntheticMemberFromDetails(personId, details);
        if (!syntheticMember) return;
        familyData.push(syntheticMember);
        seenIds.add(personId);
    });
}

// Initialize family data from the prebuilt directory artifact
export async function initializeFamilyData() {
    if (familyData) return familyData;

    try {
        const directory = await loadJsonResource(
            dataResources.familyDirectory,
            'directory.json',
            'Family directory'
        );
        familyData = Array.isArray(directory)
            ? directory.map(member => createMemberRecord(member || {}))
            : [];
        mergeDetailsIntoFamilyData();
        clearDataLoadError('familyData');
        return familyData;
    } catch (error) {
        console.error('Error loading family data:', error);
        recordDataLoadError('familyData', error);
        return [];
    }
}

// Search index — built by buildSearchIndex() once both familyData and personDetailsData are loaded
let searchIndex = null;

export function buildSearchIndex() {
    if (!familyData || !personDetailsData) return;
    searchIndex = familyData.map(member => {
        const personId = extractPersonIdFromMember(member);
        const details = personId ? (personDetailsData[personId] || null) : null;

        const nameLower = (member.name || '').toLowerCase();
        const surnameLower = (member.surname || '').toLowerCase();
        const fullNameLower = buildFullName(member.name, member.surname).toLowerCase();
        const searchWords = [...new Set(splitSearchWords(fullNameLower))];
        const nickname = details?.nickname ? details.nickname.toLowerCase() : '';
        const birthYear = details?.birthYear ?? null;
        const deathYear = details?.deathYear ?? null;
        const places = details?.events
            ? details.events.map(e => (e.place || '').toLowerCase()).filter(Boolean)
            : [];
        const placeAliases = buildPlaceAliases(places);
        const searchTextLower = (member.searchText || fullNameLower).toLowerCase();

        return {
            member,
            nameLower,
            surnameLower,
            fullNameLower,
            searchWords,
            nickname,
            birthYear,
            deathYear,
            places,
            placeAliases,
            searchTextLower,
        };
    });
}

// Search family members with ranked scoring when index is available
export function searchFamilyMembers(searchTerm) {
    if (!familyData) {
        familyData = [];
        initializeFamilyData();
        return [];
    }

    // Fallback to simple substring search when index is not yet built
    if (!searchIndex) {
        const term = searchTerm.toLowerCase();
        return familyData.filter(m => m.searchText.includes(term)).slice(0, 50);
    }

    const normalizedQuery = searchTerm.toLowerCase().trim();
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    const scored = searchIndex.map(entry => {
        let total = 0;
        if (entry.fullNameLower === normalizedQuery)                               total += 140;
        if (entry.nickname && entry.nickname === normalizedQuery)                  total += 110;
        if (entry.surnameLower && entry.surnameLower === normalizedQuery)          total += 105;
        if (entry.placeAliases.some(alias => alias === normalizedQuery))           total += 85;
        if (entry.places.some(place => place.includes(normalizedQuery)))           total += 35;

        for (const term of terms) {
            let best = 0;
            if (entry.nameLower === term)                                           best = Math.max(best, 100);
            if (entry.surnameLower === term)                                        best = Math.max(best, 95);
            if (entry.fullNameLower.startsWith(term))                               best = Math.max(best, 82);
            if (entry.searchWords.some(w => w.startsWith(term)))                    best = Math.max(best, 78);
            if (entry.fullNameLower.includes(term))                                 best = Math.max(best, 62);
            if (entry.nickname && entry.nickname.startsWith(term))                 best = Math.max(best, 72);
            if (entry.nickname && entry.nickname.includes(term))                   best = Math.max(best, 65);
            if (entry.birthYear !== null && String(entry.birthYear) === term)      best = Math.max(best, 50);
            if (entry.deathYear !== null && String(entry.deathYear) === term)      best = Math.max(best, 50);
            if (entry.placeAliases.some(alias => alias.includes(term)))             best = Math.max(best, 40);
            if (entry.places.some(p => p.includes(term)))                           best = Math.max(best, 30);
            if (entry.searchTextLower.includes(term))                               best = Math.max(best, 24);
            total += best;
        }
        return { member: entry.member, score: total };
    }).filter(r => r.score > 0);

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 50).map(r => r.member);
}

// Load person-to-photo mapping extracted from the RootsMagic database
let personPhotoData = null;

export async function loadPersonPhotos() {
    if (personPhotoData) return personPhotoData;
    try {
        personPhotoData = await loadJsonResource(dataResources.personPhotos, 'person-photos.json', 'Person photo data');
        clearDataLoadError('personPhotos');
        return personPhotoData;
    } catch (error) {
        console.error('Error loading person photos:', error);
        recordDataLoadError('personPhotos', error);
        personPhotoData = {};
        return personPhotoData;
    }
}

// Look up a family member by PersonID (the number from the #P{id} anchor in their link)
export function getPersonById(personId) {
    const id = String(personId);
    if (familyData) {
        const existing = familyData.find((member) => extractPersonIdFromMember(member) === id);
        if (existing) return existing;
    }

    if (personDetailsData && personDetailsData[id]) {
        return buildSyntheticMemberFromDetails(id, personDetailsData[id]);
    }

    return null;
}

export function getPhotosForPersonId(personId) {
    if (!personPhotoData || !personId) return [];
    return personPhotoData[String(personId)]?.photos || [];
}

// Reverse map: photo path -> [{id, name}] — built once after personPhotoData is loaded
let photoPersonMap = null;
let photoPersonByFilename = null; // filename-only fallback index

function buildPhotoPersonMap() {
    photoPersonMap = {};
    photoPersonByFilename = {};
    for (const [pid, person] of Object.entries(personPhotoData)) {
        for (const photo of person.photos) {
            if (!photoPersonMap[photo.path]) photoPersonMap[photo.path] = [];
            photoPersonMap[photo.path].push({ id: pid, name: person.name });

            // Also index by filename for cross-directory matching
            const filename = photo.path.split('/').pop();
            if (filename) {
                if (!photoPersonByFilename[filename]) photoPersonByFilename[filename] = [];
                photoPersonByFilename[filename].push({ id: pid, name: person.name });
            }
        }
    }
}

// Return the list of people associated with a given photo path.
// Falls back to filename-based matching when the exact path has no result.
export function getPersonsForPhoto(photoPath) {
    if (!personPhotoData) return [];
    if (!photoPersonMap) buildPhotoPersonMap();

    const exact = photoPersonMap[photoPath];
    if (exact && exact.length > 0) return exact;

    // Fallback: match by filename across directories
    const filename = photoPath.split('/').pop();
    if (filename && photoPersonByFilename[filename]) {
        return photoPersonByFilename[filename];
    }
    return [];
}

// Load photos from catalog
export async function loadPhotos() {
    if (photoData) return photoData;

    try {
        photoData = await loadJsonResource(dataResources.photoCatalog, 'photo-catalog.json', 'Photo catalog');
        clearDataLoadError('photoCatalog');
        return photoData;
    } catch (error) {
        console.error('Error loading photo catalog:', error);
        recordDataLoadError('photoCatalog', error);
        photoData = [];
        return photoData;
    }
}

// Load family relationship data (spouses, parents, children) from build-time extract
let personFamilyData = null;

export async function loadPersonFamily() {
    if (personFamilyData) return personFamilyData;
    try {
        personFamilyData = await loadJsonResource(dataResources.personFamily, 'person-family.json', 'Person family data');
        clearDataLoadError('personFamily');
        return personFamilyData;
    } catch (error) {
        console.error('Error loading person family data:', error);
        recordDataLoadError('personFamily', error);
        personFamilyData = {};
        return personFamilyData;
    }
}

// Return family relationships for a person given their PersonID string.
// Returns { spouses: [], parents: [], children: [] } or null if no data.
export function getFamilyForPerson(personId) {
    if (!personFamilyData) return null;
    return personFamilyData[String(personId)] || null;
}

// Load individual-level event data (birth, death, residence, etc.)
let personDetailsData = null;

export async function loadPersonDetails() {
    if (personDetailsData) return personDetailsData;
    try {
        personDetailsData = await loadJsonResource(dataResources.personDetails, 'person-details.json', 'Person details');
        mergeDetailsIntoFamilyData();
        clearDataLoadError('personDetails');
        return personDetailsData;
    } catch (error) {
        console.error('Error loading person details:', error);
        recordDataLoadError('personDetails', error);
        personDetailsData = {};
        return personDetailsData;
    }
}

// Return the full personDetailsData map (id → detail object). Returns null if not yet loaded.
export function getPersonDetailsData() {
    return personDetailsData;
}

// Return individual details for a person given their PersonID string.
// Returns { name, sex, nickname, birthYear, deathYear, events } or null.
export function getDetailsForPerson(personId) {
    if (!personDetailsData) return null;
    return personDetailsData[String(personId)] || null;
}

const ACCURACY_SCORE_MODEL_VERSION = 'accuracyScoreV1';
const ACCURACY_SCORE_ANCESTOR_DEPTH = 4;
const ACCURACY_SCORE_COMPONENT_WEIGHTS = Object.freeze({
    profileCompleteness: 0.35,
    sourceCoverage: 0.35,
    relationshipConsistency: 0.2,
    conflictReview: 0.1
});

const COUNTRY_ALIASES = Object.freeze({
    us: 'United States',
    usa: 'United States',
    'u.s.': 'United States',
    'u.s.a.': 'United States',
    'united states of america': 'United States',
    england: 'United Kingdom',
    scotland: 'United Kingdom',
    wales: 'United Kingdom'
});

const US_STATE_NAMES = new Set([
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
    'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
    'wisconsin', 'wyoming', 'district of columbia'
]);

const US_STATE_CODES = new Set([
    'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in',
    'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne', 'nv',
    'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn',
    'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc'
]);

function clampNumber(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function hasEventOfType(details, type) {
    return (details?.events || []).some((event) => event.type === type && (event.date || event.place));
}

function collectAncestorWindow(rootPersonId, maxDepth = ACCURACY_SCORE_ANCESTOR_DEPTH) {
    const rootId = String(rootPersonId || '');
    if (!rootId || !personDetailsData?.[rootId]) return [];

    const queue = [{ id: rootId, depth: 0 }];
    const seen = new Map();

    while (queue.length) {
        const { id, depth } = queue.shift();
        if (seen.has(id) && seen.get(id) <= depth) continue;
        seen.set(id, depth);
        if (depth >= maxDepth) continue;

        const family = personFamilyData?.[id];
        for (const parent of family?.parents || []) {
            const parentId = String(parent.id || '');
            if (parentId && personDetailsData?.[parentId]) {
                queue.push({ id: parentId, depth: depth + 1 });
            }
        }
    }

    return [...seen.entries()]
        .map(([id, depth]) => ({ id, depth, details: personDetailsData[id], family: personFamilyData?.[id] || null }))
        .sort((a, b) => a.depth - b.depth || Number(a.id) - Number(b.id));
}

function buildPersonSourceIndex(sources = []) {
    const index = new Map();
    for (const source of sources || []) {
        for (const person of source.relatedPeople || []) {
            const personId = String(person.id || '').trim();
            if (!personId) continue;
            if (!index.has(personId)) index.set(personId, []);
            index.get(personId).push(source);
        }
    }
    return index;
}

function scoreProfileCompleteness(windowPeople) {
    let points = 0;
    let possible = 0;

    for (const person of windowPeople) {
        const details = person.details || {};
        const facts = [
            Boolean(normalizeText(details.name)),
            Boolean(details.sex),
            Boolean(details.birthYear || hasEventOfType(details, 'Birth')),
            Boolean((details.events || []).some((event) => event.type === 'Birth' && event.place)),
            Boolean(details.living || details.deathYear || hasEventOfType(details, 'Death') || hasEventOfType(details, 'Burial'))
        ];

        points += facts.filter(Boolean).length;
        possible += facts.length;
    }

    return possible ? points / possible : 0;
}

function scoreSourceCoverage(windowPeople, personSourceIndex) {
    if (!windowPeople.length) return 0;
    const citedCount = windowPeople.filter((person) => (personSourceIndex.get(person.id) || []).length > 0).length;
    return citedCount / windowPeople.length;
}

function scoreRelationshipConsistency(windowPeople) {
    if (!windowPeople.length) return 0;

    let checks = 0;
    let passed = 0;
    const windowIds = new Set(windowPeople.map((person) => person.id));

    for (const person of windowPeople) {
        const family = person.family;
        if (!family) {
            checks += 1;
            continue;
        }

        for (const parent of family.parents || []) {
            checks += 1;
            const parentId = String(parent.id || '');
            const parentFamily = personFamilyData?.[parentId];
            if (personDetailsData?.[parentId] && parentFamily?.children?.some((child) => String(child.id) === person.id)) {
                passed += 1;
            }
        }

        for (const child of family.children || []) {
            const childId = String(child.id || '');
            if (!windowIds.has(childId)) continue;
            checks += 1;
            const childFamily = personFamilyData?.[childId];
            if (childFamily?.parents?.some((parent) => String(parent.id) === person.id)) {
                passed += 1;
            }
        }
    }

    return checks ? passed / checks : 0.5;
}

function getPersonConflictFlags(person) {
    const flags = [];
    const details = person.details || {};
    if (details.birthYear && details.deathYear && details.deathYear < details.birthYear) {
        flags.push('Death year is earlier than birth year');
    }
    if (details.living && details.deathYear) {
        flags.push('Marked living but has a death year');
    }
    for (const parent of person.family?.parents || []) {
        const parentDetails = personDetailsData?.[String(parent.id || '')];
        if (details.birthYear && parentDetails?.birthYear && details.birthYear - parentDetails.birthYear < 10) {
            flags.push('Parent and child years need review');
        }
    }
    return flags;
}

function scoreConflictReview(windowPeople) {
    if (!windowPeople.length) return 0;
    const conflictCount = windowPeople.reduce((sum, person) => sum + getPersonConflictFlags(person).length, 0);
    return clampNumber(1 - (conflictCount / Math.max(windowPeople.length, 1)), 0, 1);
}

function normalizeCountry(value) {
    const text = normalizeText(value);
    if (!text) return '';

    const segments = text
        .split(',')
        .map((segment) => normalizeText(segment))
        .filter(Boolean);
    const candidates = segments.length ? [segments[segments.length - 1], ...segments] : [text];

    for (const candidate of candidates) {
        const key = candidate.toLowerCase().replace(/\.$/, '');
        if (COUNTRY_ALIASES[key]) return COUNTRY_ALIASES[key];
        if (US_STATE_NAMES.has(key) || US_STATE_CODES.has(key)) return 'United States';
        if (/^[A-Z][A-Za-z .'-]+$/.test(candidate) && candidate.length > 2 && !US_STATE_NAMES.has(key)) {
            return candidate;
        }
    }

    return '';
}

function addCountryEvidence(countryWeights, value, weight) {
    const country = normalizeCountry(value) || 'Unknown';
    countryWeights.set(country, (countryWeights.get(country) || 0) + weight);
}

function distributePercentages(countryWeights) {
    const totalWeight = [...countryWeights.values()].reduce((sum, value) => sum + value, 0);
    if (!totalWeight) return { Unknown: 100 };

    const entries = [...countryWeights.entries()]
        .map(([country, weight]) => ({ country, value: Math.round((weight / totalWeight) * 1000) / 10 }))
        .sort((a, b) => b.value - a.value || a.country.localeCompare(b.country));

    const totalPercent = entries.reduce((sum, entry) => sum + entry.value, 0);
    const delta = Math.round((100 - totalPercent) * 10) / 10;
    const unknown = entries.find((entry) => entry.country === 'Unknown');
    if (unknown) {
        unknown.value = Math.round((unknown.value + delta) * 10) / 10;
    } else if (entries.length) {
        entries[0].value = Math.round((entries[0].value + delta) * 10) / 10;
    }

    return Object.fromEntries(entries.map((entry) => [entry.country, entry.value]));
}

function computeNationalityRatio(windowPeople, personSourceIndex) {
    const countryWeights = new Map();

    for (const person of windowPeople) {
        const generationWeight = 1 / Math.pow(2, person.depth);
        let personEvidenceCount = 0;

        for (const event of person.details?.events || []) {
            if (!event.place) continue;
            addCountryEvidence(countryWeights, event.place, generationWeight);
            personEvidenceCount += 1;
        }

        for (const source of personSourceIndex.get(person.id) || []) {
            for (const place of source.relatedPlaces || source.citationPlaces || []) {
                addCountryEvidence(countryWeights, place, generationWeight * 0.5);
                personEvidenceCount += 0.5;
            }
            if (source.jurisdiction) {
                addCountryEvidence(countryWeights, source.jurisdiction, generationWeight * 0.25);
                personEvidenceCount += 0.25;
            }
        }

        if (!personEvidenceCount) {
            addCountryEvidence(countryWeights, 'Unknown', generationWeight);
        }
    }

    return distributePercentages(countryWeights);
}

function getConfidenceBand(score, coverageStats) {
    if (coverageStats.peopleInWindow < 3 || coverageStats.citedPeople < 2 || coverageStats.placeEvidencePeople < 2) {
        return 'Low';
    }
    if (score >= 80 && coverageStats.citedPeople / coverageStats.peopleInWindow >= 0.7) return 'High';
    return 'Medium';
}

function buildScoreExplanations(components, coverageStats, conflictCount) {
    const explanations = [];
    const sourcePct = Math.round(components.sourceCoverage * 100);
    const completenessPct = Math.round(components.profileCompleteness * 100);

    explanations.push(`${sourcePct}% of the people in this ancestor window have at least one linked cited source.`);
    explanations.push(`${completenessPct}% of expected profile facts are present across the same window.`);

    if (conflictCount > 0) {
        explanations.push(`${conflictCount} chronology or relationship item needs review before this line should be treated as high confidence.`);
    } else {
        explanations.push('No obvious chronology conflicts were found in the scored window.');
    }

    if (coverageStats.placeEvidencePeople < 2) {
        explanations.push('Country ratios are low-confidence because only a small number of linked people have usable place evidence.');
    }

    return explanations;
}

export function computeUserAccuracyProfile(personId, sources = [], options = {}) {
    if (!personDetailsData || !personFamilyData || !personId) return null;

    const ancestorDepth = Number.isFinite(options.ancestorDepth)
        ? options.ancestorDepth
        : ACCURACY_SCORE_ANCESTOR_DEPTH;
    const windowPeople = collectAncestorWindow(personId, ancestorDepth);
    if (!windowPeople.length) return null;

    const personSourceIndex = buildPersonSourceIndex(sources);
    const components = {
        profileCompleteness: scoreProfileCompleteness(windowPeople),
        sourceCoverage: scoreSourceCoverage(windowPeople, personSourceIndex),
        relationshipConsistency: scoreRelationshipConsistency(windowPeople),
        conflictReview: scoreConflictReview(windowPeople)
    };
    const conflictCount = windowPeople.reduce((sum, person) => sum + getPersonConflictFlags(person).length, 0);
    const placeEvidencePeople = windowPeople.filter((person) =>
        (person.details?.events || []).some((event) => event.place) ||
        (personSourceIndex.get(person.id) || []).some((source) =>
            (source.relatedPlaces || source.citationPlaces || []).length || source.jurisdiction
        )
    ).length;

    const weightedScore = Object.entries(components).reduce((sum, [key, value]) => {
        return sum + (value * (ACCURACY_SCORE_COMPONENT_WEIGHTS[key] || 0));
    }, 0);
    const score = Math.round(clampNumber(weightedScore, 0, 1) * 100);
    const coverageStats = {
        ancestorDepth,
        peopleInWindow: windowPeople.length,
        citedPeople: windowPeople.filter((person) => (personSourceIndex.get(person.id) || []).length > 0).length,
        placeEvidencePeople,
        conflictCount
    };
    const insufficientData = coverageStats.peopleInWindow < 3 || coverageStats.citedPeople < 1;

    return {
        modelVersion: ACCURACY_SCORE_MODEL_VERSION,
        computedAt: new Date().toISOString(),
        linkedPersonId: String(personId),
        score,
        confidenceBand: insufficientData ? 'Insufficient data' : getConfidenceBand(score, coverageStats),
        insufficientData,
        components: Object.fromEntries(
            Object.entries(components).map(([key, value]) => [key, Math.round(value * 1000) / 1000])
        ),
        weights: ACCURACY_SCORE_COMPONENT_WEIGHTS,
        nationalityRatio: computeNationalityRatio(windowPeople, personSourceIndex),
        coverageStats,
        explanations: buildScoreExplanations(components, coverageStats, conflictCount)
    };
}

function normalizeProfileOverrideValue(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function applyPersonProfileOverrideToDetails(details, override = {}) {
    if (!details) return details;

    const nickname = normalizeProfileOverrideValue(override.nickname);
    const profileNote = normalizeProfileOverrideValue(override.profileNote);

    details.nickname = nickname;
    details.profileNote = profileNote;
    details.profileEditedAt = override.updatedAt || '';
    details.profileEditedBy = override.updatedBy || '';
    details.profileEditedByName = override.updatedByName || '';
    return details;
}

export function applyPersonProfileOverride(personId, override) {
    if (!personDetailsData) return null;

    const id = String(personId);
    const existing = personDetailsData[id];
    if (!existing) return null;

    applyPersonProfileOverrideToDetails(existing, override);
    return existing;
}

export function mergePersonProfileOverrides(overrides) {
    if (!personDetailsData) return;

    Object.entries(overrides || {}).forEach(([personId, override]) => {
        applyPersonProfileOverride(personId, override);
    });
}

// Merge manually-created Firestore media links into the in-memory photo maps.
// Call this after loadPersonPhotos() has resolved.
// links: array of { personId, personName, photoPath, caption }
export function mergeManualMediaLinks(links) {
    if (!personPhotoData) return;
    for (const link of links) {
        const pid = String(link.personId);
        const { photoPath, caption, personName } = link;

        // Ensure the person entry exists
        if (!personPhotoData[pid]) {
            personPhotoData[pid] = {
                name: personName || '',
                birthYear: null,
                deathYear: null,
                photos: []
            };
        }

        // Add photo if not already present
        const alreadyLinked = personPhotoData[pid].photos.some(p => p.path === photoPath);
        if (!alreadyLinked) {
            personPhotoData[pid].photos.push({
                file: photoPath.split('/').pop(),
                path: photoPath,
                caption: caption || '',
                isPrimary: false,
                sortOrder: 999
            });
        }
    }

    // Rebuild the reverse map to include the new links
    photoPersonMap = null;
    photoPersonByFilename = null;
}

let citedSourcesData = null;
let citedSourcesPromise = null;
let placePagesData = null;
let placePagesPromise = null;

function normalizeText(value) {
    return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function addUniqueValue(list, value, limit = Infinity) {
    const normalized = normalizeText(value);
    if (!normalized || list.length >= limit) return;
    if (list.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) return;
    list.push(normalized);
}

function formatYearSpan(details = {}) {
    if (!details?.birthYear && !details?.deathYear) return '';
    return `${details.birthYear || '?'}-${details.deathYear || '?'}`;
}

export async function loadCitedSources() {
    if (citedSourcesData) return citedSourcesData;
    if (citedSourcesPromise) return citedSourcesPromise;

    citedSourcesPromise = (async () => {
        await Promise.all([initializeFamilyData(), loadPersonDetails()]);

        const [sourcesMetadata, sourceUsageIndex] = await Promise.all([
            loadJsonResource(dataResources.citedSources, 'sources.json', 'Cited sources'),
            loadJsonResource(dataResources.sourceUsage, 'source-usage.json', 'Source usage')
        ]);

        const usageLookup = sourceUsageIndex && typeof sourceUsageIndex === 'object' ? sourceUsageIndex : {};
        const sources = (Array.isArray(sourcesMetadata) ? sourcesMetadata : []).map((source) => {
            const sourceId = normalizeText(source?.id);
            const usage = usageLookup[sourceId] || { personIds: [], places: [], occurrences: 0 };

            const relatedPeople = (usage.personIds || [])
                .map((personId) => {
                    const member = getPersonById(personId);
                    const details = getDetailsForPerson(personId);
                    return {
                        id: String(personId),
                        name: member?.name || details?.name || `Person ${personId}`,
                        dates: member?.dates || formatYearSpan(details),
                        link: member?.link || ''
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            const relatedSurnames = [];
            relatedPeople.forEach((person) => {
                const parts = normalizeText(person.name).split(/\s+/).filter(Boolean);
                if (parts.length) addUniqueValue(relatedSurnames, parts[parts.length - 1], 8);
            });

            const relatedPlaces = [];
            (source?.citationPlaces || []).forEach((place) => addUniqueValue(relatedPlaces, place, 8));
            (usage.places || []).forEach((place) => addUniqueValue(relatedPlaces, place, 8));

            return {
                ...source,
                id: sourceId,
                relatedPlaces,
                relatedSurnames,
                linkedPeopleCount: relatedPeople.length,
                relatedPeople,
                usageCount: Number(usage.occurrences) || 0
            };
        });

        if (!sources.length) {
            throw new Error('No cited sources were loaded from JSON.');
        }

        citedSourcesData = sources;
        clearDataLoadError('citedSources');
        return citedSourcesData;
    })().catch((error) => {
        recordDataLoadError('citedSources', error);
        throw error;
    });

    try {
        return await citedSourcesPromise;
    } finally {
        citedSourcesPromise = null;
    }
}

export async function loadPlacePages() {
    if (placePagesData) return placePagesData;
    if (placePagesPromise) return placePagesPromise;

    placePagesPromise = (async () => {
        await Promise.all([initializeFamilyData(), loadPersonDetails()]);
        const places = await loadJsonResource(dataResources.placePages, 'places.json', 'Place pages');

        if (!Array.isArray(places)) {
            throw new Error('Place pages did not load as an array.');
        }

        placePagesData = places;
        clearDataLoadError('placePages');
        return placePagesData;
    })().catch((error) => {
        recordDataLoadError('placePages', error);
        throw error;
    });

    try {
        return await placePagesPromise;
    } finally {
        placePagesPromise = null;
    }
}

// Build the Cytoscape element list for the family tree.
// Roots = living persons with no recorded children.
// Tree expands upward through parent relationships (BFS).
// Shared ancestors are deduplicated — each person appears once.
// Each family unit gets a small couple node between child and parents.
//
// Returns null if required data is not yet loaded.
// Returns { roots, maxDepth, elements } where elements is ready for cy.add().
let familyIndexes = null;

function ensureFamilyIndexes() {
    if (familyIndexes) return familyIndexes;

    const childrenByFamilyId = {};
    Object.entries(personFamilyData || {}).forEach(([personId, fam]) => {
        if (!fam?.parentsFamilyId) return;
        const familyId = String(fam.parentsFamilyId);
        if (!childrenByFamilyId[familyId]) childrenByFamilyId[familyId] = [];
        childrenByFamilyId[familyId].push(personId);
    });

    familyIndexes = { childrenByFamilyId };
    return familyIndexes;
}

function getChildrenForParentsFamily(familyId) {
    if (!familyId) return [];
    const { childrenByFamilyId } = ensureFamilyIndexes();
    return childrenByFamilyId[String(familyId)] || [];
}

function getAncestorDepth(personId, visited = new Set()) {
    const id = String(personId);
    if (visited.has(id)) return 0;
    visited.add(id);

    const fam = personFamilyData?.[id];
    if (!fam?.parents?.length) return 0;

    let maxDepth = 0;
    fam.parents.forEach(parent => {
        maxDepth = Math.max(maxDepth, 1 + getAncestorDepth(parent.id, new Set(visited)));
    });
    return maxDepth;
}

function getDescendantDepth(personId, visited = new Set()) {
    const id = String(personId);
    if (visited.has(id)) return 0;
    visited.add(id);

    const fam = personFamilyData?.[id];
    if (!fam?.families?.length) return 0;

    let maxDepth = 0;
    fam.families.forEach(family => {
        (family.children || []).forEach(child => {
            maxDepth = Math.max(maxDepth, 1 + getDescendantDepth(child.id, new Set(visited)));
        });
    });
    return maxDepth;
}

export function buildTreeData({
    focusPersonId,
    mode = 'family',
    upDepth = 2,
    downDepth = 1,
    lateralDepth = 1,
    includeSpouses = true,
    includeSiblings = true
} = {}) {
    if (!personDetailsData || !personFamilyData) return null;

    const normalizedFocusId = String(focusPersonId || '');
    if (!normalizedFocusId || !personDetailsData[normalizedFocusId]) return null;

    ensureFamilyIndexes();

    const personMeta = new Map();
    const includedBirthFamilies = new Set();
    const includedSpouseFamilies = new Set();
    const descendantFamilyVisits = new Set();
    const ancestorVisits = new Set();

    function mergeArray(target, values) {
        const next = new Set(target || []);
        values.filter(Boolean).forEach(value => next.add(String(value)));
        return [...next];
    }

    function addPerson(personId, tier, meta = {}) {
        const id = String(personId);
        const details = personDetailsData[id];
        if (!details) return false;

        const existing = personMeta.get(id);
        const next = existing ? { ...existing } : {
            personId: id,
            tier,
            isFocus: false,
            relationTags: [],
            sourceFamilies: [],
            anchorFamilies: []
        };

        if (existing) {
            if (Math.abs(tier) < Math.abs(existing.tier)) next.tier = tier;
            if (Math.abs(tier) === Math.abs(existing.tier) && tier < existing.tier) next.tier = tier;
        }

        if (meta.isFocus) next.isFocus = true;
        next.relationTags = mergeArray(next.relationTags, meta.relationTags || []);
        next.sourceFamilies = mergeArray(next.sourceFamilies, meta.sourceFamilies || []);
        next.anchorFamilies = mergeArray(next.anchorFamilies, meta.anchorFamilies || []);
        personMeta.set(id, next);
        return true;
    }

    function addSpousesForPerson(personId, tier, allowAtTier = true) {
        if (!includeSpouses || !allowAtTier) return;
        const fam = personFamilyData[String(personId)];
        (fam?.families || []).forEach(family => {
            if (!family.spouseId) return;
            includedSpouseFamilies.add(String(family.familyId));
            addPerson(family.spouseId, tier, {
                relationTags: ['spouse'],
                sourceFamilies: [family.familyId],
                anchorFamilies: [fam.parentsFamilyId]
            });
        });
    }

    function includeSiblingCluster(personId, tier, collateralDepth = 1) {
        if (!includeSiblings) return;
        const fam = personFamilyData[String(personId)];
        if (!fam?.parentsFamilyId) return;

        const siblingIds = getChildrenForParentsFamily(fam.parentsFamilyId);
        siblingIds.forEach(siblingId => {
            const isSelf = String(siblingId) === String(personId);
            addPerson(siblingId, tier, {
                relationTags: [isSelf ? 'self-family' : 'sibling'],
                anchorFamilies: [fam.parentsFamilyId]
            });
            addSpousesForPerson(siblingId, tier, !isSelf || mode !== 'pedigree');

            if (!isSelf && collateralDepth > 1 && mode === 'branch') {
                expandDescendantsFromPerson(siblingId, tier, 1, true);
            }
        });
    }

    function expandAncestorsFromPerson(personId, tier, remaining, collateralDepth = 0) {
        if (remaining <= 0) return;
        const visitKey = `${personId}:${tier}:${remaining}:${collateralDepth}`;
        if (ancestorVisits.has(visitKey)) return;
        ancestorVisits.add(visitKey);

        const fam = personFamilyData[String(personId)];
        if (!fam?.parents?.length) return;

        fam.parents.forEach(parent => {
            addPerson(parent.id, tier - 1, {
                relationTags: ['ancestor'],
                sourceFamilies: [fam.parentsFamilyId]
            });
            expandAncestorsFromPerson(parent.id, tier - 1, remaining - 1, mode === 'branch' ? Math.max(collateralDepth - 1, 0) : 0);
        });

        if (collateralDepth > 0) {
            fam.parents.forEach(parent => includeSiblingCluster(parent.id, tier - 1, collateralDepth));
        }
    }

    function expandDescendantsFromPerson(personId, tier, remaining, includeCurrentSpouses = true) {
        if (remaining <= 0) return;
        const fam = personFamilyData[String(personId)];
        if (!fam?.families?.length) return;

        fam.families.forEach(family => {
            const familyVisitKey = `${family.familyId}:${remaining}`;
            if (descendantFamilyVisits.has(familyVisitKey)) return;
            descendantFamilyVisits.add(familyVisitKey);

            if (includeCurrentSpouses) {
                includedSpouseFamilies.add(String(family.familyId));
                if (family.spouseId) {
                    addPerson(family.spouseId, tier, {
                        relationTags: ['spouse'],
                        sourceFamilies: [family.familyId]
                    });
                }
            }

            (family.children || []).forEach(child => {
                addPerson(child.id, tier + 1, {
                    relationTags: ['descendant'],
                    sourceFamilies: [family.familyId],
                    anchorFamilies: [fam.parentsFamilyId]
                });
                if (remaining > 1) expandDescendantsFromPerson(child.id, tier + 1, remaining - 1, true);
            });
        });
    }

    addPerson(normalizedFocusId, 0, { isFocus: true, relationTags: ['focus'] });
    addSpousesForPerson(normalizedFocusId, 0, true);

    const focusFamily = personFamilyData[normalizedFocusId];
    const focusSpouseIds = (focusFamily?.families || []).map(family => family.spouseId).filter(Boolean);

    if (mode === 'pedigree') {
        expandAncestorsFromPerson(normalizedFocusId, 0, upDepth, 0);
    } else if (mode === 'descendants') {
        expandDescendantsFromPerson(normalizedFocusId, 0, downDepth, true);
    } else {
        includeSiblingCluster(normalizedFocusId, 0, lateralDepth);
        expandAncestorsFromPerson(normalizedFocusId, 0, upDepth, mode === 'branch' ? lateralDepth : 0);
        expandDescendantsFromPerson(normalizedFocusId, 0, downDepth, true);

        focusSpouseIds.forEach(spouseId => {
            includeSiblingCluster(spouseId, 0, lateralDepth);
            expandAncestorsFromPerson(spouseId, 0, Math.max(1, upDepth), mode === 'branch' ? Math.max(lateralDepth - 1, 0) : 0);
            expandDescendantsFromPerson(spouseId, 0, downDepth, true);
        });
    }

    const elements = [];
    const addedCouples = new Set();
    const addedEdges = new Set();
    const includedPersonIds = [...personMeta.keys()];
    const includedSet = new Set(includedPersonIds);

    function addEdge(source, target) {
        const edgeId = `e_${source}_${target}`;
        if (addedEdges.has(edgeId)) return;
        addedEdges.add(edgeId);
        elements.push({ data: { id: edgeId, source, target } });
    }

    includedPersonIds.forEach(personId => {
        const details = personDetailsData[personId];
        const fam = personFamilyData[personId];
        const meta = personMeta.get(personId);
        const label = details.birthYear ? `${details.name}\n${details.birthYear}` : details.name;

        elements.push({
            data: {
                id: `p${personId}`,
                personId,
                label,
                name: details.name,
                tier: meta.tier,
                relativeTier: meta.tier,
                depth: Math.abs(meta.tier),
                living: details.living,
                sex: details.sex,
                isRoot: meta.isFocus,
                isFocus: meta.isFocus,
                hasParents: !!(fam && fam.parents.length),
                relationTags: meta.relationTags,
                sourceFamilies: meta.sourceFamilies,
                anchorFamilies: meta.anchorFamilies
            }
        });
    });

    includedPersonIds.forEach(personId => {
        const fam = personFamilyData[personId];
        const meta = personMeta.get(personId);
        if (!fam) return;

        if (fam.parentsFamilyId) includedBirthFamilies.add(String(fam.parentsFamilyId));

        if (fam.parentsFamilyId && (fam.parents || []).some(parent => includedSet.has(String(parent.id)))) {
            const familyNodeId = `f${fam.parentsFamilyId}`;
            if (!addedCouples.has(familyNodeId)) {
                addedCouples.add(familyNodeId);
                elements.push({
                    data: {
                        id: familyNodeId,
                        isCouple: true,
                        tier: meta.tier - 0.5,
                        relativeTier: meta.tier - 0.5,
                        coupleTier: meta.tier
                    }
                });
            }

            addEdge(`p${personId}`, familyNodeId);
            (fam.parents || []).forEach(parent => {
                if (includedSet.has(String(parent.id))) addEdge(familyNodeId, `p${parent.id}`);
            });
        }

        (fam.families || []).forEach(family => {
            const spouseIncluded = family.spouseId && includedSet.has(String(family.spouseId));
            const childIncluded = (family.children || []).some(child => includedSet.has(String(child.id)));
            if (!spouseIncluded && !childIncluded) return;

            const spouseNodeId = `sf${family.familyId}`;
            if (!addedCouples.has(spouseNodeId)) {
                addedCouples.add(spouseNodeId);
                elements.push({
                    data: {
                        id: spouseNodeId,
                        isCouple: true,
                        isSpouseFamily: true,
                        tier: meta.tier,
                        relativeTier: meta.tier,
                        coupleTier: meta.tier
                    }
                });
            }

            addEdge(`p${personId}`, spouseNodeId);
            if (spouseIncluded) addEdge(`p${family.spouseId}`, spouseNodeId);
        });
    });

    const focusAndSpouses = [normalizedFocusId, ...focusSpouseIds].filter(id => personMeta.has(String(id)));
    const availableUp = Math.max(...focusAndSpouses.map(id => getAncestorDepth(id)), 0);
    const availableDown = getDescendantDepth(normalizedFocusId);
    const maxDepth = mode === 'pedigree'
        ? availableUp
        : mode === 'descendants'
            ? availableDown
            : Math.max(1, availableUp, availableDown);

    const tiers = includedPersonIds.map(id => personMeta.get(id).tier);

    return {
        elements,
        focusPersonId: normalizedFocusId,
        mode,
        maxDepth,
        minTier: tiers.length ? Math.min(...tiers) : 0,
        maxTier: tiers.length ? Math.max(...tiers) : 0,
        personMeta: Object.fromEntries([...personMeta.entries()].map(([id, meta]) => [id, meta]))
    };
}

// Compute analytics from already-loaded data. Call after all four loaders have resolved.
// Returns null if required data is not yet available.
export function computeAnalytics() {
    if (!personDetailsData || !personPhotoData) return null;

    const entries = Object.entries(personDetailsData);
    const total = entries.length;

    // Gender distribution
    const gender = { Male: 0, Female: 0, Unknown: 0 };
    for (const [, p] of entries) {
        if (p.sex === 'Male') gender.Male++;
        else if (p.sex === 'Female') gender.Female++;
        else gender.Unknown++;
    }

    // People with photos (any entry in personPhotoData with at least one photo)
    const withPhotos = Object.values(personPhotoData).filter(p => p.photos && p.photos.length > 0).length;

    // Most photographed (top 5)
    const mostPhotographed = Object.entries(personPhotoData)
        .filter(([, p]) => p.photos && p.photos.length > 0)
        .sort((a, b) => b[1].photos.length - a[1].photos.length)
        .slice(0, 5)
        .map(([id, p]) => ({ id, name: p.name, count: p.photos.length }));

    // Birth decade distribution
    const birthDecades = {};
    let minBirthYear = Infinity;
    let maxBirthYear = -Infinity;
    let withBirthYear = 0;
    for (const [, p] of entries) {
        if (p.birthYear) {
            withBirthYear++;
            const decade = Math.floor(p.birthYear / 10) * 10;
            birthDecades[decade] = (birthDecades[decade] || 0) + 1;
            if (p.birthYear < minBirthYear) minBirthYear = p.birthYear;
            if (p.birthYear > maxBirthYear) maxBirthYear = p.birthYear;
        }
    }

    // Lifespan — only for people with both birth and death year, and death > birth
    const lifespanValues = [];
    let withDeathYear = 0;
    for (const [, p] of entries) {
        if (p.deathYear) withDeathYear++;
        if (p.birthYear && p.deathYear && p.deathYear > p.birthYear) {
            lifespanValues.push(p.deathYear - p.birthYear);
        }
    }
    const lifespan = lifespanValues.length
        ? {
            avg: Math.round(lifespanValues.reduce((a, b) => a + b, 0) / lifespanValues.length),
            min: Math.min(...lifespanValues),
            max: Math.max(...lifespanValues),
            count: lifespanValues.length
          }
        : null;

    // Top surnames — last word of full name, 2+ chars
    const surnameCounts = {};
    for (const [, p] of entries) {
        const parts = p.name.trim().split(/\s+/);
        if (parts.length >= 2) {
            const s = parts[parts.length - 1];
            if (s.length > 1) surnameCounts[s] = (surnameCounts[s] || 0) + 1;
        }
    }
    const topSurnames = Object.entries(surnameCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Top given names — first word, skip known titles/prefixes
    const skipPrefixes = new Set(['dr', 'mr', 'mrs', 'rev', 'sr', 'jr', 'prof', 'capt']);
    const givenCounts = {};
    for (const [, p] of entries) {
        const parts = p.name.trim().split(/\s+/);
        const first = parts.find(w => w.length > 1 && !skipPrefixes.has(w.toLowerCase()));
        if (first) givenCounts[first] = (givenCounts[first] || 0) + 1;
    }
    const topGivenNames = Object.entries(givenCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // Living vs deceased — deceased = has a recorded death year
    const deceased = withDeathYear;
    const living = total - deceased;

    const totalPhotos = photoData
        ? photoData.filter(p => p.path && p.path.startsWith('FamilyTreeMedia/')).length
        : null;

    const QC_CITIES = [
        ['Rock Island, IL',      s => s.includes('rock island') && (s.includes('illinois') || s.includes(', il'))],
        ['East Moline, IL',      s => s.includes('east moline')],
        ['Moline, IL',           s => s.includes('moline') && !s.includes('east moline')],
        ['Milan, IL',            s => s.includes('milan') && s.includes('rock island')],
        ['Hampton, IL',          s => s.includes('hampton') && s.includes('rock island')],
        ['Port Byron, IL',       s => s.includes('port byron')],
        ['Silvis, IL',           s => s.includes('silvis')],
        ['Coal Valley, IL',      s => s.includes('coal valley')],
        ['Carbon Cliff, IL',     s => s.includes('carbon cliff')],
        ['Buffalo Prairie, IL',  s => s.includes('buffalo') && s.includes('rock island')],
        ['Davenport, IA',        s => s.includes('davenport')],
        ['Bettendorf, IA',       s => s.includes('bettendorf')],
        ['Buffalo, IA',          s => s.includes('buffalo') && s.includes('scott')],
        ['Le Claire, IA',        s => s.includes('le claire')],
    ];

    const qcConnected = new Set();
    const qcByEventType = {};  // eventType → count of distinct people
    const qcByCityEvents = {}; // city label → event occurrence count

    for (const [id, p] of entries) {
        if (!p.events) continue;
        const typesThisPerson = new Set();
        for (const e of p.events) {
            if (!isQuadCitiesPlace(e.place)) continue;
            qcConnected.add(id);
            typesThisPerson.add(e.type);
            const s = (e.place || '').toLowerCase();
            for (const [label, test] of QC_CITIES) {
                if (test(s)) {
                    qcByCityEvents[label] = (qcByCityEvents[label] || 0) + 1;
                    break;
                }
            }
        }
        for (const t of typesThisPerson) {
            qcByEventType[t] = (qcByEventType[t] || 0) + 1;
        }
    }

    const qcCityRows = Object.entries(qcByCityEvents)
        .sort((a, b) => b[1] - a[1]);
    const qcEventTypeRows = Object.entries(qcByEventType)
        .sort((a, b) => b[1] - a[1]);

    return {
        total,
        totalPhotos,
        withPhotos,
        mostPhotographed,
        living,
        deceased,
        gender,
        birthDecades,
        minBirthYear: minBirthYear === Infinity ? null : minBirthYear,
        maxBirthYear: maxBirthYear === -Infinity ? null : maxBirthYear,
        withBirthYear,
        withDeathYear,
        lifespan,
        topSurnames,
        topGivenNames,
        qc: {
            connected: qcConnected.size,
            byEventType: qcEventTypeRows,
            byCity: qcCityRows
        }
    };
}

// ─── Kinship Resolver ────────────────────────────────────────────────────────

/**
 * Build an ancestor map for a person: { ancestorId → generation distance }.
 * Generation 0 = self, 1 = parent, 2 = grandparent, etc.
 * Uses BFS over the parents array in personFamilyData.
 * Caps at maxDepth to avoid runaway traversal on large trees.
 */
function buildAncestorMap(personId, maxDepth = 30) {
    if (!personFamilyData) return {};
    const map = {};
    const queue = [{ id: String(personId), depth: 0 }];

    while (queue.length > 0) {
        const { id, depth } = queue.shift();
        if (map[id] !== undefined) continue; // already visited
        map[id] = depth;
        if (depth >= maxDepth) continue;

        const family = personFamilyData[id];
        if (!family?.parents) continue;
        for (const parent of family.parents) {
            if (map[parent.id] === undefined) {
                queue.push({ id: String(parent.id), depth: depth + 1 });
            }
        }
    }
    return map;
}

function findAncestorPath(descendantId, ancestorId, maxDepth = 30) {
    if (!personFamilyData) return null;
    const startId = String(descendantId);
    const targetId = String(ancestorId);
    const queue = [{ id: startId, depth: 0, path: [startId] }];
    const visited = new Set();

    while (queue.length > 0) {
        const { id, depth, path } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        if (id === targetId) return path;
        if (depth >= maxDepth) continue;

        const family = personFamilyData[id];
        for (const parent of family?.parents || []) {
            const parentId = String(parent.id);
            if (!visited.has(parentId)) {
                queue.push({ id: parentId, depth: depth + 1, path: [...path, parentId] });
            }
        }
    }

    return null;
}

function getRelationshipPersonName(personId) {
    const id = String(personId);
    return personDetailsData?.[id]?.name || getPersonById(id)?.name || `Person ${id}`;
}

function getRelationshipFirstName(personId) {
    const name = getRelationshipPersonName(personId)
        .replace(/\([^)]*\)/g, ' ')
        .replace(/["']/g, '')
        .trim();
    return name.split(/\s+/).filter(Boolean)[0] || name || `Person ${personId}`;
}

function buildDirectRelationshipPath(fromId, toId, direction) {
    const descendantId = direction === 'up' ? fromId : toId;
    const ancestorId = direction === 'up' ? toId : fromId;
    const descendantToAncestor = findAncestorPath(descendantId, ancestorId);
    if (!descendantToAncestor) return null;

    const ancestorToDescendant = descendantToAncestor.slice().reverse();
    return ancestorToDescendant.map((personId) => ({
        id: personId,
        name: getRelationshipPersonName(personId),
        shortName: personId === String(fromId)
            ? 'You'
            : getRelationshipFirstName(personId),
        isLinkedPerson: personId === String(fromId),
        isTargetPerson: personId === String(toId)
    }));
}

function getSpouseIds(personId) {
    const family = personFamilyData?.[String(personId)];
    return (family?.spouses || []).map((spouse) => String(spouse.id)).filter(Boolean);
}

function getPersonSex(personId) {
    return personDetailsData?.[String(personId)]?.sex || '';
}

function genderedLabel(personId, maleLabel, femaleLabel, neutralLabel) {
    const sex = getPersonSex(personId);
    if (sex === 'Male') return maleLabel;
    if (sex === 'Female') return femaleLabel;
    return neutralLabel;
}

function withAffinityType(relationship, detail) {
    return {
        ...relationship,
        type: 'affinity',
        detail
    };
}

/**
 * Compute the kinship relationship between two people.
 *
 * Returns an object:
 *   { label, type, detail }
 *   - label: human-readable string like "1st Cousin Once Removed"
 *   - type: category string for styling — 'self' | 'direct' | 'sibling' | 'collateral' | 'spouse' | 'unknown'
 *   - detail: explanation string for the popover
 *
 * Returns null when the relationship cannot be determined.
 *
 * Algorithm:
 *   1. Check trivial cases: same person, spouse
 *   2. Build ancestor maps for both persons
 *   3. Find shared ancestors (intersection of both maps)
 *   4. Pick the nearest common ancestor pair (minimizes total generation distance)
 *   5. Compute generationA (from personA to ancestor) and generationB (from personB to ancestor)
 *   6. Map (genA, genB) to a relationship label
 */
export function computeKinship(fromPersonId, toPersonId) {
    if (!personFamilyData) return null;
    const fromId = String(fromPersonId);
    const toId = String(toPersonId);

    // Self
    if (fromId === toId) {
        return { label: 'You', type: 'self', detail: 'This is your linked profile.' };
    }

    // Check spouse
    const fromFamily = personFamilyData[fromId];
    if (fromFamily?.spouses?.some(s => String(s.id) === toId)) {
        return { label: 'Spouse', type: 'spouse', detail: 'This person is your spouse.' };
    }

    const bloodRelationship = computeBloodKinship(fromId, toId);
    if (bloodRelationship) return bloodRelationship;

    return computeAffinityKinship(fromId, toId);
}

function computeBloodKinship(fromId, toId) {
    const fromFamily = personFamilyData[fromId];

    // Build ancestor maps
    const ancestorsA = buildAncestorMap(fromId);
    const ancestorsB = buildAncestorMap(toId);

    // Find shared ancestors
    const sharedAncestors = [];
    for (const ancestorId of Object.keys(ancestorsA)) {
        if (ancestorsB[ancestorId] !== undefined) {
            sharedAncestors.push({
                id: ancestorId,
                genA: ancestorsA[ancestorId],
                genB: ancestorsB[ancestorId]
            });
        }
    }

    if (sharedAncestors.length === 0) {
        // Check if toId is an ancestor of fromId
        if (ancestorsA[toId] !== undefined) {
            return formatDirectLine(ancestorsA[toId], 'up');
        }
        // Check if fromId is an ancestor of toId
        if (ancestorsB[fromId] !== undefined) {
            return formatDirectLine(ancestorsB[fromId], 'down');
        }
        return null;
    }

    // Pick the nearest common ancestor (minimize total generation hops)
    sharedAncestors.sort((a, b) => (a.genA + a.genB) - (b.genA + b.genB));
    const best = sharedAncestors[0];
    const genA = best.genA; // generations from "me" to common ancestor
    const genB = best.genB; // generations from target to common ancestor

    // Direct line: one of the generation distances is 0
    if (genA === 0) {
        return {
            ...formatDirectLine(genB, 'down'),
            genA,
            genB,
            path: buildDirectRelationshipPath(fromId, toId, 'down')
        };
    }
    if (genB === 0) {
        return {
            ...formatDirectLine(genA, 'up'),
            genA,
            genB,
            path: buildDirectRelationshipPath(fromId, toId, 'up')
        };
    }

    // Siblings: both at generation 1 from common ancestor
    if (genA === 1 && genB === 1) {
        // Check half-sibling: do they share only one parent?
        const fromParents = new Set((fromFamily?.parents || []).map(p => String(p.id)));
        const toFamily = personFamilyData[toId];
        const toParents = new Set((toFamily?.parents || []).map(p => String(p.id)));
        const sharedParents = [...fromParents].filter(p => toParents.has(p));
        if (sharedParents.length === 1 && fromParents.size >= 2 && toParents.size >= 2) {
            return { label: 'Half-Sibling', type: 'sibling', detail: 'You share one parent with this person.', genA, genB };
        }
        return { label: 'Sibling', type: 'sibling', detail: 'You share the same parents.', genA, genB };
    }

    // Collateral relationships: aunt/uncle, niece/nephew, cousins
    return { ...formatCollateral(genA, genB), genA, genB };
}

function computeAffinityKinship(fromId, toId) {
    const candidates = [];
    const fromSpouseIds = getSpouseIds(fromId);
    const targetSpouseIds = getSpouseIds(toId);

    for (const spouseId of fromSpouseIds) {
        const rel = computeBloodKinship(spouseId, toId);
        if (rel) {
            candidates.push({
                score: relationshipScore(rel) + 1,
                relationship: formatSpouseRelativeRelationship(rel, toId)
            });
        }
    }

    for (const targetSpouseId of targetSpouseIds) {
        const rel = computeBloodKinship(fromId, targetSpouseId);
        if (rel) {
            candidates.push({
                score: relationshipScore(rel) + 1,
                relationship: formatRelativeSpouseRelationship(rel, toId)
            });
        }
    }

    for (const spouseId of fromSpouseIds) {
        for (const targetSpouseId of targetSpouseIds) {
            const rel = computeBloodKinship(spouseId, targetSpouseId);
            if (rel) {
                candidates.push({
                    score: relationshipScore(rel) + 2,
                    relationship: formatSpousesRelativeSpouseRelationship(rel, toId)
                });
            }
        }
    }

    return candidates
        .filter((candidate) => candidate.relationship)
        .sort((a, b) => a.score - b.score)[0]?.relationship || null;
}

function relationshipScore(relationship) {
    if (Number.isFinite(relationship.genA) && Number.isFinite(relationship.genB)) {
        return relationship.genA + relationship.genB;
    }
    return 30;
}

function formatSpouseRelativeRelationship(relationship, targetId) {
    const label = relationship.label;
    if (label === 'Parent') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Father-in-Law', 'Mother-in-Law', 'Parent-in-Law')
        }, 'This person is your spouse\'s parent.');
    }
    if (label === 'Grandparent' || label.endsWith('-Grandparent')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is your spouse's ${label.toLowerCase()}.`);
    }
    if (label === 'Child') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Stepson', 'Stepdaughter', 'Stepchild')
        }, 'This person is your spouse\'s child.');
    }
    if (label === 'Grandchild' || label.endsWith('-Grandchild')) {
        return withAffinityType({ label: `Step-${label}` }, `This person is your spouse's ${label.toLowerCase()}.`);
    }
    if (label === 'Sibling' || label === 'Half-Sibling') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Brother-in-Law', 'Sister-in-Law', 'Sibling-in-Law')
        }, 'This person is your spouse\'s sibling.');
    }
    if (label === 'Aunt/Uncle' || label.endsWith('-Aunt/Uncle')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is your spouse's ${label.toLowerCase()}.`);
    }
    if (label === 'Niece/Nephew' || label.endsWith('-Niece/Nephew')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is your spouse's ${label.toLowerCase()}.`);
    }
    if (label.includes('Cousin')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is your spouse's ${label.toLowerCase()}.`);
    }
    return withAffinityType({ label: `Spouse's ${label}` }, `This person is related through your spouse: ${label.toLowerCase()}.`);
}

function formatRelativeSpouseRelationship(relationship, targetId) {
    const label = relationship.label;
    if (label === 'Parent') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Stepfather', 'Stepmother', 'Step-Parent')
        }, 'This person is married to your parent.');
    }
    if (label === 'Grandparent' || label.endsWith('-Grandparent')) {
        return withAffinityType({ label: `Step-${label}` }, `This person is married to your ${label.toLowerCase()}.`);
    }
    if (label === 'Child') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Son-in-Law', 'Daughter-in-Law', 'Child-in-Law')
        }, 'This person is married to your child.');
    }
    if (label === 'Grandchild' || label.endsWith('-Grandchild')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is married to your ${label.toLowerCase()}.`);
    }
    if (label === 'Sibling' || label === 'Half-Sibling') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Brother-in-Law', 'Sister-in-Law', 'Sibling-in-Law')
        }, 'This person is married to your sibling.');
    }
    if (label === 'Aunt/Uncle' || label.endsWith('-Aunt/Uncle')) {
        return withAffinityType({ label: `${label} by Marriage` }, `This person is married to your ${label.toLowerCase()}.`);
    }
    if (label === 'Niece/Nephew' || label.endsWith('-Niece/Nephew')) {
        return withAffinityType({ label: `${label}-in-Law` }, `This person is married to your ${label.toLowerCase()}.`);
    }
    if (label.includes('Cousin')) {
        return withAffinityType({ label: `${label}'s Spouse` }, `This person is married to your ${label.toLowerCase()}.`);
    }
    return withAffinityType({ label: `${label}'s Spouse` }, `This person is married to your ${label.toLowerCase()}.`);
}

function formatSpousesRelativeSpouseRelationship(relationship, targetId) {
    const label = relationship.label;
    if (label === 'Sibling' || label === 'Half-Sibling') {
        return withAffinityType({
            label: genderedLabel(targetId, 'Brother-in-Law', 'Sister-in-Law', 'Sibling-in-Law')
        }, 'This person is married to your spouse\'s sibling.');
    }
    if (label === 'Parent') {
        return withAffinityType({ label: 'Parent-in-Law\'s Spouse' }, 'This person is married to your spouse\'s parent.');
    }
    if (label === 'Child') {
        return withAffinityType({ label: 'Stepchild\'s Spouse' }, 'This person is married to your spouse\'s child.');
    }
    return withAffinityType({ label: `Spouse's ${label}'s Spouse` }, `This person is married to your spouse's ${label.toLowerCase()}.`);
}

/** Format a direct-line relationship (ancestor/descendant). */
function formatDirectLine(generations, direction) {
    if (direction === 'up') {
        // Target is an ancestor of "me"
        switch (generations) {
            case 1: return { label: 'Parent', type: 'direct', detail: 'This person is your parent.' };
            case 2: return { label: 'Grandparent', type: 'direct', detail: 'This person is your grandparent.' };
            case 3: return { label: 'Great-Grandparent', type: 'direct', detail: 'This person is your great-grandparent.' };
            default: {
                const greats = generations - 2;
                const prefix = greats === 1 ? 'Great' : `${ordinal(greats)}-Great`;
                return {
                    label: `${prefix}-Grandparent`,
                    type: 'direct',
                    detail: `This person is ${greats} generation${greats > 1 ? 's' : ''} above your grandparent.`
                };
            }
        }
    } else {
        // Target is a descendant of "me"
        switch (generations) {
            case 1: return { label: 'Child', type: 'direct', detail: 'This person is your child.' };
            case 2: return { label: 'Grandchild', type: 'direct', detail: 'This person is your grandchild.' };
            case 3: return { label: 'Great-Grandchild', type: 'direct', detail: 'This person is your great-grandchild.' };
            default: {
                const greats = generations - 2;
                const prefix = greats === 1 ? 'Great' : `${ordinal(greats)}-Great`;
                return {
                    label: `${prefix}-Grandchild`,
                    type: 'direct',
                    detail: `This person is ${greats} generation${greats > 1 ? 's' : ''} below your grandchild.`
                };
            }
        }
    }
}

/** Format a collateral relationship (aunt/uncle, niece/nephew, cousins). */
function formatCollateral(genA, genB) {
    const minGen = Math.min(genA, genB);
    const maxGen = Math.max(genA, genB);

    // Aunt/Uncle and Niece/Nephew: one person at gen 1, other at gen 2+
    if (minGen === 1) {
        const distance = maxGen - 1;
        if (genA < genB) {
            // Target is further from ancestor → target is niece/nephew (or grand-niece, etc.)
            if (distance === 1) return { label: 'Niece/Nephew', type: 'collateral', detail: 'This person is your sibling\'s child.' };
            if (distance === 2) return { label: 'Grand-Niece/Nephew', type: 'collateral', detail: 'This person is your sibling\'s grandchild.' };
            const greats = distance - 2;
            const prefix = greats === 1 ? 'Great' : `${ordinal(greats)}-Great`;
            return { label: `${prefix}-Grand-Niece/Nephew`, type: 'collateral', detail: `This person is ${distance} generations below your sibling.` };
        } else {
            // I am further from ancestor → target is aunt/uncle (or great-aunt, etc.)
            if (distance === 1) return { label: 'Aunt/Uncle', type: 'collateral', detail: 'This person is your parent\'s sibling.' };
            if (distance === 2) return { label: 'Great-Aunt/Uncle', type: 'collateral', detail: 'This person is your grandparent\'s sibling.' };
            const greats = distance - 2;
            const prefix = greats === 1 ? 'Great' : `${ordinal(greats)}-Great`;
            return { label: `${prefix}-Grand-Aunt/Uncle`, type: 'collateral', detail: `This person is a sibling of your ${ordinal(distance)}-generation ancestor.` };
        }
    }

    // Cousins: both at generation 2+ from common ancestor
    const cousinDegree = minGen - 1;        // 1st, 2nd, 3rd, etc.
    const removed = Math.abs(genA - genB);  // times removed

    const degreeStr = ordinal(cousinDegree) + ' Cousin';
    const removedStr = removed === 0
        ? ''
        : removed === 1
            ? ' Once Removed'
            : removed === 2
                ? ' Twice Removed'
                : ` ${removed}x Removed`;

    const label = degreeStr + removedStr;

    let detail;
    if (removed === 0) {
        detail = `You and this person share a common ancestor ${minGen} generation${minGen > 1 ? 's' : ''} back.`;
    } else {
        detail = `You share a common ancestor, but are ${removed} generation${removed > 1 ? 's' : ''} apart in descent from that ancestor.`;
    }

    return { label, type: 'collateral', detail };
}

/** Return ordinal string: 1→'1st', 2→'2nd', 3→'3rd', 4→'4th', etc. */
function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Format a relationship label for display. Returns { label, type, detail } or null.
 * Convenience wrapper that guards against missing data.
 */
export function getRelationshipLabel(fromPersonId, toPersonId) {
    if (!fromPersonId || !toPersonId || !personFamilyData) return null;
    return computeKinship(fromPersonId, toPersonId);
}

// ─── Bloodline / Lineage-first visualization helpers ─────────────────────────

/**
 * Compute the direct bloodline ancestor path from a focal person upward.
 * Returns an array of steps from the focal person to the most distant ancestor
 * reachable through parent links.  Each step includes the person ID and the
 * birth-family (parentsFamilyId) that connects them to the next generation.
 *
 * Example result:
 *   [
 *     { personId: '42', familyId: null },          // focal person (no family upward if root)
 *     { personId: '18', familyId: '7' },           // parent, connected via family 7
 *     { personId: '5',  familyId: '3' },           // grandparent
 *   ]
 *
 * The path follows a single parent line at each generation (preferring the
 * father when both parents are present, to keep a single trunk — the other
 * parent is still available as household context).
 */
export function computeBloodlinePath(focalPersonId) {
    if (!personFamilyData) return [];
    const startId = String(focalPersonId || '');
    if (!startId || !personFamilyData[startId]) return [];

    const path = [];
    const visited = new Set();
    let currentId = startId;

    while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const fam = personFamilyData[currentId];
        const familyId = fam?.parentsFamilyId ? String(fam.parentsFamilyId) : null;
        path.push({ personId: currentId, familyId });

        if (!fam?.parents?.length) break;

        // Collect all parent IDs on the direct line
        const parentIds = fam.parents.map(p => String(p.id)).filter(id => personFamilyData[id]);
        if (!parentIds.length) break;

        // Prefer the parent with the deepest ancestry (longest direct line)
        let bestParent = parentIds[0];
        let bestDepth = 0;
        for (const pid of parentIds) {
            const depth = getAncestorDepth(pid);
            if (depth > bestDepth) {
                bestDepth = depth;
                bestParent = pid;
            }
        }
        currentId = bestParent;
    }

    return path;
}

/**
 * Build the complete set of person IDs that are on the authenticated user's
 * direct bloodline (both ancestors AND the connecting spouses who form
 * households on the direct line).
 *
 * Returns { personIds: Set<string>, familyIds: Set<string>, householdSpouseIds: Set<string> }
 */
export function computeBloodlineSet(focalPersonId) {
    const path = computeBloodlinePath(focalPersonId);
    const personIds = new Set(path.map(step => step.personId));
    const familyIds = new Set(path.map(step => step.familyId).filter(Boolean));

    // Add the spouse of each direct-line ancestor within the relevant household
    const householdSpouseIds = new Set();
    for (const step of path) {
        if (!step.familyId) continue;
        const fam = personFamilyData[step.personId];
        if (!fam?.parents?.length) continue;
        for (const parent of fam.parents) {
            const pid = String(parent.id);
            if (!personIds.has(pid)) {
                householdSpouseIds.add(pid);
            }
        }
    }

    return { personIds, familyIds, householdSpouseIds };
}

// Do not auto-initialize protected data at module load.
// main.js initializes these resources after auth/session state is known.
