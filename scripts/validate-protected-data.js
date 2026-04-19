#!/usr/bin/env node
/**
 * Validate the protected JSON artifacts that power tree, profile, and photo views.
 *
 * The goal is to fail fast in CI if a deploy would ship empty or structurally
 * invalid data, because the SPA can still partially render from static HTML
 * exports while tree/media features silently fail.
 */

const fs = require('fs');
const path = require('path');

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

function readMinimum(name, fallback) {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
        throw new Error(`${name} must be a non-negative number when provided.`);
    }
    return parsed;
}

const DATA_FILE_SPECS = [
    {
        filename: 'directory.json',
        label: 'family directory',
        minimum: readMinimum('MIN_DIRECTORY_RECORDS', 400),
        describeCount: data => data.length,
        validate(data, count) {
            if (!Array.isArray(data)) {
                throw new Error('must be a JSON array.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const sample = data.find(Boolean);
            if (!sample?.name || typeof sample.searchText !== 'string') {
                throw new Error('does not contain member records with name and search text.');
            }
        }
    },
    {
        filename: 'sources.json',
        label: 'sources catalog',
        minimum: readMinimum('MIN_SOURCES_RECORDS', 50),
        describeCount: data => data.length,
        validate(data, count) {
            if (!Array.isArray(data)) {
                throw new Error('must be a JSON array.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const sample = data.find(Boolean);
            if (!sample?.id || !sample?.title || !sample?.sourceType) {
                throw new Error('does not contain normalized source metadata.');
            }
        }
    },
    {
        filename: 'source-usage.json',
        label: 'source usage index',
        minimum: readMinimum('MIN_SOURCE_USAGE_RECORDS', 10),
        describeCount: data => Object.keys(data).length,
        validate(data, count) {
            if (!data || Array.isArray(data) || typeof data !== 'object') {
                throw new Error('must be a JSON object keyed by source id.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const sample = Object.values(data).find(Boolean);
            if (!sample || !Array.isArray(sample.personIds) || !Array.isArray(sample.places) || !Number.isFinite(sample.occurrences)) {
                throw new Error('does not contain source usage records with personIds, places, and occurrences.');
            }
        }
    },
    {
        filename: 'places.json',
        label: 'place pages',
        minimum: readMinimum('MIN_PLACE_RECORDS', 20),
        describeCount: data => data.length,
        validate(data, count) {
            if (!Array.isArray(data)) {
                throw new Error('must be a JSON array.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const sample = data.find(Boolean);
            if (!sample?.id || !sample?.name || !sample?.stats || !Array.isArray(sample.people) || !Array.isArray(sample.sources)) {
                throw new Error('does not contain normalized place page records.');
            }
        }
    },
    {
        filename: 'person-details.json',
        label: 'person details',
        minimum: readMinimum('MIN_PERSON_DETAILS_RECORDS', 400),
        describeCount: data => Object.keys(data).length,
        validate(data, count) {
            if (!data || Array.isArray(data) || typeof data !== 'object') {
                throw new Error('must be a JSON object keyed by person id.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const sample = Object.values(data).find(Boolean);
            if (!sample?.name) {
                throw new Error('does not contain person detail records with names.');
            }
        }
    },
    {
        filename: 'person-family.json',
        label: 'person family',
        minimum: readMinimum('MIN_PERSON_FAMILY_RECORDS', 400),
        describeCount: data => Object.keys(data).length,
        validate(data, count) {
            if (!data || Array.isArray(data) || typeof data !== 'object') {
                throw new Error('must be a JSON object keyed by person id.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const linkedPeople = Object.values(data).filter(entry =>
                Array.isArray(entry?.parents) ||
                Array.isArray(entry?.families) ||
                entry?.parentsFamilyId
            ).length;
            if (linkedPeople < Math.floor(this.minimum * 0.5)) {
                throw new Error(`contains too few linked family records (${linkedPeople}).`);
            }
        }
    },
    {
        filename: 'person-photos.json',
        label: 'person photos',
        minimum: readMinimum('MIN_PERSON_PHOTO_RECORDS', 100),
        describeCount: data => Object.keys(data).length,
        validate(data, count) {
            if (!data || Array.isArray(data) || typeof data !== 'object') {
                throw new Error('must be a JSON object keyed by person id.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const totalPhotos = Object.values(data).reduce((sum, person) => {
                return sum + (Array.isArray(person?.photos) ? person.photos.length : 0);
            }, 0);
            if (totalPhotos < this.minimum) {
                throw new Error(`contains too few linked photos (${totalPhotos}).`);
            }
        }
    },
    {
        filename: 'photo-catalog.json',
        label: 'photo catalog',
        minimum: readMinimum('MIN_PHOTO_CATALOG_RECORDS', 500),
        describeCount: data => data.length,
        validate(data, count) {
            if (!Array.isArray(data)) {
                throw new Error('must be a JSON array.');
            }
            if (count < this.minimum) {
                throw new Error(`has ${count} records; expected at least ${this.minimum}.`);
            }
            const invalidEntry = data.find(photo => !photo || typeof photo.path !== 'string' || !photo.path.startsWith('FamilyTreeMedia/'));
            if (invalidEntry) {
                throw new Error('contains at least one photo without a valid FamilyTreeMedia path.');
            }
        }
    }
];

function loadJsonFile(filePath, label) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`${label} file is missing: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
        throw new Error(`${label} file is empty: ${filePath}`);
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`${label} file contains invalid JSON: ${error.message}`);
    }
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateDirectoryIntegrity(directory, personDetails, personFamily) {
    const seenIds = new Set();

    directory.forEach((member, index) => {
        const prefix = `directory.json record ${index + 1}`;
        assert(member && typeof member === 'object' && !Array.isArray(member), `${prefix} must be an object.`);
        assert(isNonEmptyString(member.name), `${prefix} is missing a name.`);
        assert(isNonEmptyString(member.personId), `${prefix} is missing a personId.`);
        assert(typeof member.searchText === 'string', `${prefix} is missing searchText.`);

        const personId = String(member.personId);
        assert(!seenIds.has(personId), `directory.json contains duplicate personId ${personId}.`);
        seenIds.add(personId);

        assert(
            member.searchText === member.searchText.toLowerCase(),
            `${prefix} has searchText that is not lowercased.`
        );
        assert(
            member.searchText.includes(String(member.name).toLowerCase()),
            `${prefix} searchText does not include the member name.`
        );
        if (member.link != null && member.link !== '') {
            assert(
                /^FamilyTreeMedia\/Total Family\/f\d+\.htm#P\d+$/i.test(member.link),
                `${prefix} has an invalid legacy link format.`
            );
        }
        assert(personDetails[personId], `${prefix} points to missing person-details.json id ${personId}.`);
        assert(personFamily[personId], `${prefix} points to missing person-family.json id ${personId}.`);
    });
}

function validatePersonDetailsIntegrity(personDetails) {
    for (const [personId, detail] of Object.entries(personDetails)) {
        const prefix = `person-details.json person ${personId}`;
        assert(detail && typeof detail === 'object' && !Array.isArray(detail), `${prefix} must be an object.`);
        assert(isNonEmptyString(detail.name), `${prefix} is missing a name.`);
        assert(typeof detail.living === 'boolean', `${prefix} is missing a boolean living flag.`);
        assert(Array.isArray(detail.events), `${prefix} is missing an events array.`);

        if (detail.birthYear != null) {
            assert(Number.isInteger(detail.birthYear), `${prefix} birthYear must be an integer or null.`);
        }
        if (detail.deathYear != null) {
            assert(Number.isInteger(detail.deathYear), `${prefix} deathYear must be an integer or null.`);
        }
        if (detail.birthYear != null && detail.deathYear != null) {
            assert(detail.deathYear >= detail.birthYear, `${prefix} has deathYear earlier than birthYear.`);
        }

        detail.events.forEach((event, eventIndex) => {
            const eventPrefix = `${prefix} event ${eventIndex + 1}`;
            assert(event && typeof event === 'object' && !Array.isArray(event), `${eventPrefix} must be an object.`);
            ['type', 'date', 'place', 'details', 'note'].forEach((field) => {
                assert(
                    typeof event[field] === 'string',
                    `${eventPrefix} field ${field} must be a string.`
                );
            });
        });
    }
}

function validateRelationRefs(relations, personDetails, relationType, ownerId) {
    if (!Array.isArray(relations)) return;
    relations.forEach((relation, index) => {
        const prefix = `person-family.json person ${ownerId} ${relationType}[${index}]`;
        assert(relation && typeof relation === 'object' && !Array.isArray(relation), `${prefix} must be an object.`);
        assert(isNonEmptyString(relation.id), `${prefix} is missing a related person id.`);
        assert(isNonEmptyString(relation.name), `${prefix} is missing a related person name.`);
        assert(String(relation.id) !== String(ownerId), `${prefix} cannot point back to the same person.`);
        assert(personDetails[String(relation.id)], `${prefix} points to missing person-details.json id ${relation.id}.`);
    });
}

function validatePersonFamilyIntegrity(personFamily, personDetails) {
    for (const [personId, entry] of Object.entries(personFamily)) {
        const prefix = `person-family.json person ${personId}`;
        assert(entry && typeof entry === 'object' && !Array.isArray(entry), `${prefix} must be an object.`);
        ['spouses', 'parents', 'children', 'families'].forEach((field) => {
            assert(Array.isArray(entry[field]), `${prefix} field ${field} must be an array.`);
        });
        assert(
            entry.parentsFamilyId == null || typeof entry.parentsFamilyId === 'string',
            `${prefix} parentsFamilyId must be null or a string.`
        );

        validateRelationRefs(entry.spouses, personDetails, 'spouses', personId);
        validateRelationRefs(entry.parents, personDetails, 'parents', personId);
        validateRelationRefs(entry.children, personDetails, 'children', personId);

        entry.families.forEach((family, familyIndex) => {
            const familyPrefix = `${prefix} family ${familyIndex + 1}`;
            assert(family && typeof family === 'object' && !Array.isArray(family), `${familyPrefix} must be an object.`);
            assert(isNonEmptyString(family.familyId), `${familyPrefix} is missing familyId.`);
            assert(
                family.spouseId == null || typeof family.spouseId === 'string',
                `${familyPrefix} spouseId must be null or a string.`
            );
            assert(
                family.spouseName == null || typeof family.spouseName === 'string',
                `${familyPrefix} spouseName must be null or a string.`
            );
            if (family.spouseId) {
                assert(String(family.spouseId) !== String(personId), `${familyPrefix} spouseId cannot equal the owner id.`);
                assert(personDetails[String(family.spouseId)], `${familyPrefix} points to missing spouse id ${family.spouseId}.`);
            }
            assert(Array.isArray(family.children), `${familyPrefix} children must be an array.`);
            validateRelationRefs(family.children, personDetails, `families[${familyIndex}].children`, personId);
        });
    }
}

function validatePhotoCatalogIntegrity(photoCatalog) {
    const seenPaths = new Set();
    photoCatalog.forEach((photo, index) => {
        const prefix = `photo-catalog.json record ${index + 1}`;
        assert(photo && typeof photo === 'object' && !Array.isArray(photo), `${prefix} must be an object.`);
        assert(isNonEmptyString(photo.name), `${prefix} is missing a name.`);
        assert(isNonEmptyString(photo.path), `${prefix} is missing a path.`);
        assert(photo.path.startsWith('FamilyTreeMedia/'), `${prefix} has an invalid path.`);
        assert(!seenPaths.has(photo.path), `${prefix} duplicates photo path ${photo.path}.`);
        seenPaths.add(photo.path);
    });
    return seenPaths;
}

function validatePersonPhotosIntegrity(personPhotos, personDetails, photoPaths) {
    for (const [personId, entry] of Object.entries(personPhotos)) {
        const prefix = `person-photos.json person ${personId}`;
        assert(personDetails[String(personId)], `${prefix} points to missing person-details.json id ${personId}.`);
        assert(entry && typeof entry === 'object' && !Array.isArray(entry), `${prefix} must be an object.`);
        assert(isNonEmptyString(entry.name), `${prefix} is missing a name.`);
        assert(Array.isArray(entry.photos), `${prefix} is missing a photos array.`);

        let primaryCount = 0;
        entry.photos.forEach((photo, index) => {
            const photoPrefix = `${prefix} photo ${index + 1}`;
            assert(photo && typeof photo === 'object' && !Array.isArray(photo), `${photoPrefix} must be an object.`);
            assert(isNonEmptyString(photo.file), `${photoPrefix} is missing a file name.`);
            assert(isNonEmptyString(photo.path), `${photoPrefix} is missing a path.`);
            assert(typeof photo.caption === 'string', `${photoPrefix} caption must be a string.`);
            assert(typeof photo.isPrimary === 'boolean', `${photoPrefix} isPrimary must be a boolean.`);
            assert(Number.isFinite(photo.sortOrder), `${photoPrefix} sortOrder must be numeric.`);
            assert(photoPaths.has(photo.path), `${photoPrefix} path is not present in photo-catalog.json.`);
            if (photo.isPrimary) primaryCount += 1;
        });

        assert(primaryCount <= 1, `${prefix} has more than one primary photo.`);
    }
}

function validateSourcesIntegrity(sources) {
    const sourceIds = new Set();

    sources.forEach((source, index) => {
        const prefix = `sources.json record ${index + 1}`;
        assert(source && typeof source === 'object' && !Array.isArray(source), `${prefix} must be an object.`);
        ['id', 'title', 'citationText', 'citationUrl', 'sourceType', 'description', 'whyThisMatters'].forEach((field) => {
            assert(isNonEmptyString(source[field]), `${prefix} is missing required field ${field}.`);
        });
        assert(!sourceIds.has(String(source.id)), `${prefix} duplicates source id ${source.id}.`);
        sourceIds.add(String(source.id));
        assert(
            /^FamilyTreeMedia\/Total Family\/sources\.htm#\d+$/i.test(source.citationUrl),
            `${prefix} has an invalid citationUrl.`
        );
        if (source.yearStart != null) {
            assert(Number.isInteger(source.yearStart), `${prefix} yearStart must be an integer or null.`);
        }
        if (source.yearEnd != null) {
            assert(Number.isInteger(source.yearEnd), `${prefix} yearEnd must be an integer or null.`);
        }
        if (source.yearStart != null && source.yearEnd != null) {
            assert(source.yearEnd >= source.yearStart, `${prefix} has yearEnd earlier than yearStart.`);
        }
        assert(Array.isArray(source.citationPlaces), `${prefix} citationPlaces must be an array.`);
    });

    return sourceIds;
}

function validateSourceUsageIntegrity(sourceUsage, sourceIds, personDetails) {
    const usageIds = new Set(Object.keys(sourceUsage).map(String));

    for (const sourceId of usageIds) {
        const prefix = `source-usage.json source ${sourceId}`;
        const entry = sourceUsage[sourceId];
        assert(sourceIds.has(String(sourceId)), `${prefix} does not exist in sources.json.`);
        assert(entry && typeof entry === 'object' && !Array.isArray(entry), `${prefix} must be an object.`);
        assert(Array.isArray(entry.personIds), `${prefix} personIds must be an array.`);
        assert(Array.isArray(entry.places), `${prefix} places must be an array.`);
        assert(Number.isInteger(entry.occurrences) && entry.occurrences > 0, `${prefix} occurrences must be a positive integer.`);

        const seenPersonIds = new Set();
        entry.personIds.forEach((personId, index) => {
            const pid = String(personId);
            assert(isNonEmptyString(pid), `${prefix} personIds[${index}] must be a non-empty string.`);
            assert(!seenPersonIds.has(pid), `${prefix} contains duplicate person id ${pid}.`);
            seenPersonIds.add(pid);
            assert(personDetails[pid], `${prefix} points to missing person-details.json id ${pid}.`);
        });

        entry.places.forEach((place, index) => {
            assert(isNonEmptyString(place), `${prefix} places[${index}] must be a non-empty string.`);
        });
    }

    sourceIds.forEach((sourceId) => {
        assert(sourceUsage[String(sourceId)], `sources.json source ${sourceId} is missing from source-usage.json.`);
    });
}

function validatePlacesIntegrity(places, sourceIds, personDetails) {
    const placeIds = new Set();

    places.forEach((place, index) => {
        const prefix = `places.json record ${index + 1}`;
        assert(place && typeof place === 'object' && !Array.isArray(place), `${prefix} must be an object.`);
        assert(isNonEmptyString(place.id), `${prefix} is missing id.`);
        assert(isNonEmptyString(place.name), `${prefix} is missing name.`);
        assert(!placeIds.has(place.id), `${prefix} duplicates place id ${place.id}.`);
        placeIds.add(place.id);

        assert(place.stats && typeof place.stats === 'object' && !Array.isArray(place.stats), `${prefix} is missing stats.`);
        ['peopleCount', 'eventCount', 'sourceCount'].forEach((field) => {
            assert(Number.isInteger(place.stats[field]) && place.stats[field] >= 0, `${prefix} stats.${field} must be a non-negative integer.`);
        });

        ['people', 'events', 'sources', 'surnames', 'recordTypes', 'researchGuidance'].forEach((field) => {
            assert(Array.isArray(place[field]), `${prefix} field ${field} must be an array.`);
        });

        assert(place.stats.peopleCount === place.people.length, `${prefix} stats.peopleCount does not match people length.`);
        assert(place.stats.sourceCount === place.sources.length, `${prefix} stats.sourceCount does not match sources length.`);
        assert(place.stats.eventCount >= place.events.length, `${prefix} stats.eventCount cannot be smaller than exported events length.`);

        place.people.forEach((person, personIndex) => {
            const personPrefix = `${prefix} people[${personIndex}]`;
            assert(person && typeof person === 'object' && !Array.isArray(person), `${personPrefix} must be an object.`);
            assert(isNonEmptyString(person.id), `${personPrefix} is missing id.`);
            assert(isNonEmptyString(person.name), `${personPrefix} is missing name.`);
            assert(personDetails[String(person.id)], `${personPrefix} points to missing person-details.json id ${person.id}.`);
            assert(Array.isArray(person.eventTypes), `${personPrefix} eventTypes must be an array.`);
        });

        place.events.forEach((event, eventIndex) => {
            const eventPrefix = `${prefix} events[${eventIndex}]`;
            assert(event && typeof event === 'object' && !Array.isArray(event), `${eventPrefix} must be an object.`);
            assert(isNonEmptyString(event.personId), `${eventPrefix} is missing personId.`);
            assert(isNonEmptyString(event.personName), `${eventPrefix} is missing personName.`);
            assert(isNonEmptyString(event.type), `${eventPrefix} is missing type.`);
            assert(personDetails[String(event.personId)], `${eventPrefix} points to missing person-details.json id ${event.personId}.`);
        });

        place.sources.forEach((source, sourceIndex) => {
            const sourcePrefix = `${prefix} sources[${sourceIndex}]`;
            assert(source && typeof source === 'object' && !Array.isArray(source), `${sourcePrefix} must be an object.`);
            assert(isNonEmptyString(source.id), `${sourcePrefix} is missing id.`);
            assert(isNonEmptyString(source.title), `${sourcePrefix} is missing title.`);
            assert(isNonEmptyString(source.sourceType), `${sourcePrefix} is missing sourceType.`);
            assert(sourceIds.has(String(source.id)), `${sourcePrefix} points to missing sources.json id ${source.id}.`);
        });

        place.researchGuidance.forEach((guidance, guidanceIndex) => {
            const guidancePrefix = `${prefix} researchGuidance[${guidanceIndex}]`;
            assert(guidance && typeof guidance === 'object' && !Array.isArray(guidance), `${guidancePrefix} must be an object.`);
            assert(isNonEmptyString(guidance.heading), `${guidancePrefix} is missing heading.`);
            assert(isNonEmptyString(guidance.body), `${guidancePrefix} is missing body.`);
            assert(isNonEmptyString(guidance.evidence), `${guidancePrefix} is missing evidence.`);
        });
    });
}

function validateProtectedData({ baseDir = path.join(__dirname, '..'), logger = console } = {}) {
    const loadedData = {};
    const results = [];

    for (const spec of DATA_FILE_SPECS) {
        const filePath = path.join(baseDir, spec.filename);
        const data = loadJsonFile(filePath, spec.label);
        loadedData[spec.filename] = data;
        const count = spec.describeCount(data);
        spec.validate(data, count);
        results.push({
            filename: spec.filename,
            label: spec.label,
            count,
            filePath
        });
    }

    const directory = loadedData['directory.json'];
    const sources = loadedData['sources.json'];
    const sourceUsage = loadedData['source-usage.json'];
    const places = loadedData['places.json'];
    const personDetails = loadedData['person-details.json'];
    const personFamily = loadedData['person-family.json'];
    const personPhotos = loadedData['person-photos.json'];
    const photoCatalog = loadedData['photo-catalog.json'];

    validatePersonDetailsIntegrity(personDetails);
    validateDirectoryIntegrity(directory, personDetails, personFamily);
    validatePersonFamilyIntegrity(personFamily, personDetails);
    const photoPaths = validatePhotoCatalogIntegrity(photoCatalog);
    validatePersonPhotosIntegrity(personPhotos, personDetails, photoPaths);
    const sourceIds = validateSourcesIntegrity(sources);
    validateSourceUsageIntegrity(sourceUsage, sourceIds, personDetails);
    validatePlacesIntegrity(places, sourceIds, personDetails);

    if (logger?.log) {
        logger.log('Protected data validation passed:');
        results.forEach(result => {
            logger.log(`- ${result.filename}: ${result.count} records`);
        });
        logger.log('- cross-file integrity: directory/details/family/photos/sources/places verified');
    }

    return results;
}

if (require.main === module) {
    try {
        validateProtectedData();
    } catch (error) {
        console.error(`Protected data validation failed: ${error.message}`);
        process.exit(1);
    }
}

module.exports = {
    DATA_FILE_SPECS,
    validateProtectedData
};
