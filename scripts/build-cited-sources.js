#!/usr/bin/env node
/**
 * Build normalized citation metadata and source-usage links from the
 * RootsMagic HTML export so the browser no longer crawls sources.htm and
 * family sheets at runtime.
 */

const fs = require('fs');
const path = require('path');

const FAMILY_DIR = path.join(__dirname, '..', 'FamilyTreeMedia', 'Total Family');
const SOURCES_HTML = path.join(FAMILY_DIR, 'sources.htm');
const SOURCES_OUTPUT = path.join(__dirname, '..', 'sources.json');
const SOURCE_USAGE_OUTPUT = path.join(__dirname, '..', 'source-usage.json');

const SOURCE_TYPE_SUMMARIES = Object.freeze({
    'Census': {
        description: 'A population snapshot that usually records where a household was living at a specific point in time.',
        why: 'Census records help place relatives in a home, community, and family group when other records are missing.'
    },
    'Immigration': {
        description: 'A travel or arrival record connected to immigration, passenger movement, or port entry.',
        why: 'Immigration records can connect a person to an origin point, a route, and the moment they entered a new country.'
    },
    'Naturalization': {
        description: 'A citizenship-related record that documents a person becoming a naturalized citizen.',
        why: 'Naturalization records can confirm immigration timing, residence, and legal identity details across generations.'
    },
    'Military': {
        description: 'A draft, service, veteran, pension, or war-era record connected to military activity.',
        why: 'Military records often add dates, residence, next-of-kin clues, and historical context not found elsewhere.'
    },
    'Newspaper': {
        description: 'A newspaper, obituary, or newspaper index entry tied to an event or public notice.',
        why: 'Newspapers can add family stories, local context, and life-event details that formal records leave out.'
    },
    'Yearbook': {
        description: 'A school yearbook or similar school-community publication.',
        why: 'Yearbooks help place relatives in a school, town, and age cohort and can anchor a family to a community.'
    },
    'Cemetery': {
        description: 'A burial, cemetery, grave, funeral, or memorial record.',
        why: 'Cemetery records can confirm death, burial place, and family clustering in the same location.'
    },
    'Church': {
        description: 'A church, parish, baptism, marriage, burial, or congregational archive record.',
        why: 'Church records often preserve family relationships and local identity before civil registration was consistent.'
    },
    'Vital Record': {
        description: 'A birth, marriage, death, or other civil vital-record index or register.',
        why: 'Vital records are core evidence for names, dates, places, and close family relationships.'
    },
    'Directory/Public Record': {
        description: 'A city directory, public record index, or similar civil listing.',
        why: 'Directories and public records help trace where someone lived and how they appeared in the public record over time.'
    },
    'Record Collection': {
        description: 'A compiled record collection that does not fit a more specific category with confidence.',
        why: 'Compiled collections can still offer useful leads, but they should usually be read alongside the exact citation text.'
    }
});

function decodeHtml(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&');
}

function stripTags(value) {
    return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

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

function classifySourceType(title, citationText) {
    const haystack = `${title} ${citationText}`.toLowerCase();

    if (
        haystack.includes('passenger') ||
        haystack.includes('crew list') ||
        haystack.includes('ellis island') ||
        haystack.includes('castle garden') ||
        haystack.includes('arriving and departing')
    ) return 'Immigration';
    if (haystack.includes('naturalization')) return 'Naturalization';
    if (haystack.includes('census')) return 'Census';
    if (
        haystack.includes('draft') ||
        haystack.includes('civil war') ||
        haystack.includes('military') ||
        haystack.includes('veteran') ||
        haystack.includes('pension')
    ) return 'Military';
    if (
        haystack.includes('newspaper') ||
        haystack.includes('obituary') ||
        /\bnewspapers\.com\b/.test(haystack)
    ) return 'Newspaper';
    if (haystack.includes('yearbook')) return 'Yearbook';
    if (
        haystack.includes('cemetery') ||
        haystack.includes('grave') ||
        haystack.includes('funeral home') ||
        haystack.includes('gravesites')
    ) return 'Cemetery';
    if (
        haystack.includes('church') ||
        haystack.includes('baptism') ||
        haystack.includes('parish') ||
        haystack.includes('lutheran')
    ) return 'Church';
    if (
        haystack.includes('marriage') ||
        haystack.includes('birth') ||
        haystack.includes('death') ||
        haystack.includes('stillbirth') ||
        haystack.includes('vital')
    ) return 'Vital Record';
    if (
        haystack.includes('directory') ||
        haystack.includes('public records')
    ) return 'Directory/Public Record';

    return 'Record Collection';
}

function extractExternalUrl(citationText) {
    const match = citationText.match(/URL:\s*(https?:\/\/[^\s<>"')]+)/i);
    return match ? match[1].replace(/[.,;]+$/, '') : '';
}

function extractYearRange(text) {
    const matches = [...String(text || '').matchAll(/\b(1[6-9]\d{2}|20\d{2})\b/g)]
        .map((match) => Number(match[1]))
        .filter((year) => Number.isFinite(year));

    if (!matches.length) {
        return { yearStart: null, yearEnd: null };
    }

    return {
        yearStart: Math.min(...matches),
        yearEnd: Math.max(...matches)
    };
}

function deriveProvider(liHtml) {
    const match = String(liHtml || '').match(/^(.*?)<i\b[^>]*>/i);
    return normalizeText(stripTags((match ? match[1] : '').replace(/,\s*$/, '')));
}

function deriveRepository(liHtml, citationText) {
    const afterTitle = String(liHtml || '').match(/<\/i>\s*(?:\([\s\S]*?\))?\s*,\s*([^.;<]+)/i);
    if (afterTitle) {
        return normalizeText(stripTags(afterTitle[1]));
    }

    const afterParen = citationText.match(/\)\s*,\s*([^.;]+)/);
    return afterParen ? normalizeText(afterParen[1]) : '';
}

function deriveJurisdiction(title) {
    const cleaned = normalizeText(title);
    if (!cleaned) return '';
    const firstSegment = normalizeText(cleaned.split(',')[0]);
    if (!firstSegment) return '';
    if (/^(U\.S\.|Web:)/i.test(firstSegment)) return firstSegment.replace(/^Web:\s*/i, '');
    if (firstSegment.split(/\s+/).length <= 5) return firstSegment;
    return '';
}

function extractCitationPlaces(citationText) {
    const places = [];
    const patterns = [
        /Census Place:\s*([^.;]+)/gi,
        /Publication Place:\s*([^.;]+)/gi,
        /Home in \d{4}:\s*([^.;]+)/gi,
        /Place(?: of Rest)?:\s*([^.;]+)/gi,
        /Parish:\s*([^.;]+)/gi,
        /Registration State:\s*([^.;]+)/gi,
        /Registration County:\s*([^.;]+)/gi
    ];

    patterns.forEach((pattern) => {
        for (const match of citationText.matchAll(pattern)) {
            addUniqueValue(places, match[1], 6);
        }
    });

    return places;
}

function extractRowPlace(rowHtml) {
    const cellMatches = [...String(rowHtml || '').matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)]
        .map((match) => match[1]);
    if (!cellMatches.length) return '';

    const placeCell = cellMatches[cellMatches.length - 1].replace(/<sup\b[\s\S]*?<\/sup>/gi, ' ');
    const rawText = normalizeText(stripTags(placeCell));
    if (!rawText) return '';

    const segments = rawText.split(';').map((segment) => normalizeText(segment)).filter(Boolean);
    let candidate = segments.length ? segments[segments.length - 1] : rawText;
    candidate = candidate.replace(/^Place of Rest:\s*/i, '');

    if (!candidate) return '';
    if (/^(Age|Marital Status|Relation to Head|Death Age|Source number|Source type|Number of Pages|Submitter Code)\b/i.test(candidate)) return '';
    if (/^[\d/.\-]+$/.test(candidate)) return '';

    return candidate;
}

function buildSourceUsageIndex() {
    const usageBySourceId = {};
    const familyFiles = fs.readdirSync(FAMILY_DIR)
        .filter((name) => /^f\d+\.htm$/i.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    function ensureUsage(sourceId) {
        if (!usageBySourceId[sourceId]) {
            usageBySourceId[sourceId] = {
                personIds: new Set(),
                places: new Set(),
                occurrences: 0
            };
        }
        return usageBySourceId[sourceId];
    }

    familyFiles.forEach((filename) => {
        const filePath = path.join(FAMILY_DIR, filename);
        const html = fs.readFileSync(filePath, 'utf8');
        if (!html.includes('sources.htm#')) return;

        let currentPersonId = '';
        for (const rowMatch of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
            const rowHtml = rowMatch[1];
            const personAnchor = rowHtml.match(/<a\s+name="(P\d+)"[^>]*><\/a>/i);
            if (personAnchor) {
                currentPersonId = personAnchor[1].replace(/^P/i, '');
            }

            const sourceIds = [...rowHtml.matchAll(/href="sources\.htm#(\d+)"/gi)].map((match) => match[1]);
            if (!sourceIds.length || !currentPersonId) continue;

            const rowPlace = extractRowPlace(rowHtml);
            sourceIds.forEach((sourceId) => {
                const usage = ensureUsage(sourceId);
                usage.personIds.add(String(currentPersonId));
                if (rowPlace) usage.places.add(rowPlace);
                usage.occurrences += 1;
            });
        }
    });

    return Object.fromEntries(
        Object.entries(usageBySourceId).map(([sourceId, usage]) => [
            sourceId,
            {
                personIds: [...usage.personIds].sort((a, b) => Number(a) - Number(b)),
                places: [...usage.places].sort((a, b) => a.localeCompare(b)),
                occurrences: usage.occurrences
            }
        ])
    );
}

function parseSourcesHtml(html) {
    const sources = [];

    for (const match of String(html || '').matchAll(/<a name="([^"]+)"><\/a>\s*<li>([\s\S]*?)<\/li>/gi)) {
        const sourceId = normalizeText(match[1]) || String(sources.length + 1);
        const liHtml = match[2];
        const titleHtml = liHtml.match(/<i\b[^>]*>([\s\S]*?)<\/i>/i)?.[1] || '';
        const title = normalizeText(stripTags(titleHtml)) || `Source ${sourceId}`;
        const citationText = normalizeText(stripTags(liHtml));
        const sourceType = classifySourceType(title, citationText);
        const summary = SOURCE_TYPE_SUMMARIES[sourceType] || SOURCE_TYPE_SUMMARIES['Record Collection'];
        const { yearStart, yearEnd } = extractYearRange(`${title} ${citationText}`);

        sources.push({
            id: sourceId,
            title,
            citationText,
            citationUrl: `FamilyTreeMedia/Total Family/sources.htm#${sourceId}`,
            sourceType,
            provider: deriveProvider(liHtml),
            repository: deriveRepository(liHtml, citationText),
            jurisdiction: deriveJurisdiction(title),
            yearStart,
            yearEnd,
            externalUrl: extractExternalUrl(citationText),
            description: summary.description,
            whyThisMatters: summary.why,
            citationPlaces: extractCitationPlaces(citationText)
        });
    }

    return sources;
}

function buildCitedSources() {
    if (!fs.existsSync(SOURCES_HTML)) {
        throw new Error(`Missing source file: ${SOURCES_HTML}`);
    }

    const sourcesHtml = fs.readFileSync(SOURCES_HTML, 'utf8');
    const sources = parseSourcesHtml(sourcesHtml);
    if (!sources.length) {
        throw new Error('No sources were parsed from sources.htm.');
    }

    const sourceUsage = buildSourceUsageIndex();

    fs.writeFileSync(SOURCES_OUTPUT, `${JSON.stringify(sources, null, 2)}\n`, 'utf8');
    fs.writeFileSync(SOURCE_USAGE_OUTPUT, `${JSON.stringify(sourceUsage, null, 2)}\n`, 'utf8');

    console.log(`Built sources.json with ${sources.length} sources.`);
    console.log(`Built source-usage.json with ${Object.keys(sourceUsage).length} linked sources.`);
}

if (require.main === module) {
    try {
        buildCitedSources();
    } catch (error) {
        console.error(`Failed to build cited sources: ${error.message}`);
        process.exit(1);
    }
}

module.exports = {
    buildCitedSources,
    buildSourceUsageIndex,
    parseSourcesHtml
};
