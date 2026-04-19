#!/usr/bin/env node

/**
 * Person-Photo Mapping Extractor
 *
 * Reads the RootsMagic database (HofstetterFamilyTree.rmtree) and extracts
 * the person-to-image associations stored in MediaLinkTable.
 *
 * Uses Node.js built-in sqlite (node:sqlite, available in Node 22+).
 * No external dependencies required.
 *
 * Run with: npm run extract-person-photos
 * Output:   person-photos.json (committed to repo, copied to dist on build)
 *
 * Re-run this script only when the .rmtree database has been updated.
 */

'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'FamilyTreeMedia', 'HofstetterFamilyTree.rmtree');
const OUTPUT_PATH = path.join(__dirname, '..', 'person-photos.json');
const MEDIA_BASE = 'FamilyTreeMedia/HofstetterFamilyTree_media';
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tif', '.tiff']);

function isImageFile(filename) {
    const ext = path.extname(filename).toLowerCase();
    return IMAGE_EXTENSIONS.has(ext);
}

function extractPersonPhotos() {
    if (!fs.existsSync(DB_PATH)) {
        console.error('Error: Database not found at', DB_PATH);
        process.exit(1);
    }

    console.log('Opening database:', path.basename(DB_PATH));
    const db = new DatabaseSync(DB_PATH, { readOnly: true });

    // RootsMagic uses a custom RMNOCASE collation for text columns.
    // We avoid ORDER BY on those columns to prevent collation errors.
    const rows = db.prepare(`
        SELECT
            p.PersonID,
            n.Given,
            n.Surname,
            n.BirthYear,
            n.DeathYear,
            m.MediaFile,
            m.Caption,
            ml.IsPrimary,
            ml.SortOrder
        FROM MediaLinkTable ml
        JOIN MultimediaTable m ON ml.MediaID = m.MediaID
        JOIN PersonTable p     ON ml.OwnerID = p.PersonID
        JOIN NameTable n       ON n.OwnerID = p.PersonID AND n.IsPrimary = 1
        WHERE ml.OwnerType = 0
    `).all();

    db.close();

    // Group by PersonID, keeping only image files
    const byPerson = new Map();

    for (const row of rows) {
        if (!isImageFile(row.MediaFile)) continue;

        if (!byPerson.has(row.PersonID)) {
            const given = (row.Given || '').trim();
            const surname = (row.Surname || '').trim();
            byPerson.set(row.PersonID, {
                name: [given, surname].filter(Boolean).join(' '),
                birthYear: row.BirthYear || null,
                deathYear: row.DeathYear || null,
                photos: []
            });
        }

        byPerson.get(row.PersonID).photos.push({
            file: row.MediaFile,
            path: `${MEDIA_BASE}/${row.MediaFile}`,
            caption: row.Caption || '',
            isPrimary: row.IsPrimary === 1,
            sortOrder: row.SortOrder || 0
        });
    }

    // Sort each person's photos: primary first, then by sortOrder
    for (const person of byPerson.values()) {
        person.photos.sort((a, b) => {
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
            return a.sortOrder - b.sortOrder;
        });
    }

    // Convert Map to plain object keyed by PersonID string
    const output = {};
    for (const [personId, data] of byPerson) {
        output[String(personId)] = data;
    }

    const personCount = Object.keys(output).length;
    const photoCount = Object.values(output).reduce((sum, p) => sum + p.photos.length, 0);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`Done. ${personCount} people with ${photoCount} photo associations.`);
    console.log(`Output: person-photos.json`);
}

extractPersonPhotos();
