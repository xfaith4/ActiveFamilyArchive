#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function loadFamilyDataModule() {
    const sourcePath = path.join(__dirname, '..', 'src', 'family-data.js');
    let source = fs.readFileSync(sourcePath, 'utf8');
    const exportedNames = [];
    source = source.replace(/^export\s+(async\s+function|function)\s+([A-Za-z0-9_]+)/gm, (_match, kind, name) => {
        exportedNames.push(name);
        return `${kind} ${name}`;
    });
    source = source.replace(/^export\s+(const|let|var)\s+([A-Za-z0-9_]+)/gm, (_match, kind, name) => {
        exportedNames.push(name);
        return `${kind} ${name}`;
    });
    source += `\nmodule.exports = { ${exportedNames.join(', ')} };\n`;

    const module = { exports: {} };
    const context = {
        module,
        exports: module.exports,
        console,
        fetch,
        window: undefined
    };
    vm.runInNewContext(source, context, { filename: sourcePath });
    return module.exports;
}

function assert(name, condition, detail = '') {
    if (!condition) {
        throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
    }
}

function comparable(profile) {
    const { computedAt, ...rest } = profile;
    return rest;
}

function sumRatio(ratio) {
    return Object.values(ratio).reduce((sum, value) => sum + value, 0);
}

async function main() {
    const familyData = await loadFamilyDataModule();

    const personDetails = {
        A: {
            name: 'Alex Example',
            sex: 'Female',
            living: true,
            birthYear: 1980,
            deathYear: null,
            events: [{ type: 'Birth', date: '1980', place: 'Moline, Rock Island, Illinois, United States' }]
        },
        B: {
            name: 'Blake Example',
            sex: 'Male',
            living: false,
            birthYear: 1950,
            deathYear: 2010,
            events: [
                { type: 'Birth', date: '1950', place: 'Davenport, Scott, Iowa, United States' },
                { type: 'Death', date: '2010', place: 'Illinois, United States' }
            ]
        },
        C: {
            name: 'Casey Sample',
            sex: 'Female',
            living: false,
            birthYear: 1952,
            deathYear: 2018,
            events: [{ type: 'Birth', date: '1952', place: 'Ontario, Canada' }]
        },
        D: {
            name: 'Devon Example',
            sex: 'Male',
            living: false,
            birthYear: 1924,
            deathYear: 1999,
            events: [{ type: 'Birth', date: '1924', place: 'Illinois, United States' }]
        }
    };

    const personFamily = {
        A: { spouses: [], parents: [{ id: 'B', name: 'Blake Example' }, { id: 'C', name: 'Casey Sample' }], children: [] },
        B: { spouses: [{ id: 'C', name: 'Casey Sample' }], parents: [{ id: 'D', name: 'Devon Example' }], children: [{ id: 'A', name: 'Alex Example' }] },
        C: { spouses: [{ id: 'B', name: 'Blake Example' }], parents: [], children: [{ id: 'A', name: 'Alex Example' }] },
        D: { spouses: [], parents: [], children: [{ id: 'B', name: 'Blake Example' }] }
    };

    const sources = [
        {
            id: 'S1',
            relatedPeople: [{ id: 'A' }, { id: 'B' }],
            relatedPlaces: ['Illinois, United States'],
            jurisdiction: 'United States'
        },
        {
            id: 'S2',
            relatedPeople: [{ id: 'C' }],
            relatedPlaces: ['Ontario, Canada'],
            jurisdiction: 'Canada'
        }
    ];

    familyData.initDataUrls({
        familyDirectory: () => [],
        personDetails: () => personDetails,
        personFamily: () => personFamily
    });
    await familyData.loadPersonDetails();
    await familyData.loadPersonFamily();

    const first = familyData.computeUserAccuracyProfile('A', sources);
    const second = familyData.computeUserAccuracyProfile('A', sources);

    assert('profile exists', first && second);
    assert('model version', first.modelVersion === 'accuracyScoreV1');
    assert('score range', first.score >= 0 && first.score <= 100, `score=${first.score}`);
    assert('deterministic output', JSON.stringify(comparable(first)) === JSON.stringify(comparable(second)));
    assert('ratio totals 100', Math.round(sumRatio(first.nationalityRatio) * 10) / 10 === 100, JSON.stringify(first.nationalityRatio));
    assert('country ratio has expected buckets', first.nationalityRatio['United States'] > 0 && first.nationalityRatio.Canada > 0);
    assert('coverage metadata', first.coverageStats.peopleInWindow === 4);

    console.log('Accuracy score tests passed.');
}

main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
