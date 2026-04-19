#!/usr/bin/env node
/**
 * Upload auth-gated data files to Firebase Storage during CI.
 *
 * These files are removed from Firebase Hosting dist so they are not publicly
 * accessible. Only authenticated app users can reach them via the Storage SDK.
 *
 * Required environment variables:
 *   FIREBASE_DATA_SA       — service account JSON (string) with Storage write access
 *   FIREBASE_STORAGE_BUCKET — e.g. familytree-staging.firebasestorage.app
 *   FIREBASE_PROJECT_ID    — Firebase project id (falls back to VITE_FIREBASE_PROJECT_ID)
 */

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
const { validateProtectedData } = require('./validate-protected-data');

const saJson = process.env.FIREBASE_DATA_SA;
const rawBucket = process.env.FIREBASE_STORAGE_BUCKET;
const bucket = String(rawBucket || '').trim().replace(/^gs:\/\//, '').replace(/\/+$/, '');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

if (!saJson) { console.error('FIREBASE_DATA_SA env var is not set.'); process.exit(1); }
if (!bucket) {
    console.error('FIREBASE_STORAGE_BUCKET env var is not set.');
    process.exit(1);
}
if (!/^[a-z0-9._-]+$/.test(bucket)) {
    console.error(`FIREBASE_STORAGE_BUCKET appears malformed: ${JSON.stringify(rawBucket)}`);
    process.exit(1);
}
if (!projectId) {
    console.error('FIREBASE_PROJECT_ID env var is not set.');
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = JSON.parse(saJson);
} catch {
    console.error('FIREBASE_DATA_SA is not valid JSON.');
    process.exit(1);
}

if (!getApps().length) {
    initializeApp({ credential: cert(serviceAccount), storageBucket: bucket, projectId });
}

const storageBucket = getStorage().bucket();

const DATA_FILES = [
    { local: 'directory.json',       remote: 'data/directory.json',       contentType: 'application/json' },
    { local: 'sources.json',         remote: 'data/sources.json',         contentType: 'application/json' },
    { local: 'source-usage.json',    remote: 'data/source-usage.json',    contentType: 'application/json' },
    { local: 'places.json',          remote: 'data/places.json',          contentType: 'application/json' },
    { local: 'person-details.json',  remote: 'data/person-details.json',  contentType: 'application/json' },
    { local: 'person-photos.json',   remote: 'data/person-photos.json',   contentType: 'application/json' },
    { local: 'person-family.json',   remote: 'data/person-family.json',   contentType: 'application/json' },
    { local: 'photo-catalog.json',   remote: 'data/photo-catalog.json',   contentType: 'application/json' },
];

async function uploadAll() {
    validateProtectedData();

    for (const entry of DATA_FILES) {
        const localPath = path.join(__dirname, '..', entry.local);

        await storageBucket.upload(localPath, {
            destination: entry.remote,
            metadata: {
                contentType: entry.contentType,
                cacheControl: 'private, no-store, max-age=0',
            },
        });

        const remoteFile = storageBucket.file(entry.remote);
        const [exists] = await remoteFile.exists();
        if (!exists) {
            throw new Error(`Uploaded object is missing from Storage: gs://${bucket}/${entry.remote}`);
        }

        const [metadata] = await remoteFile.getMetadata();
        if (!metadata?.size || Number(metadata.size) <= 0) {
            throw new Error(`Uploaded object has no content: gs://${bucket}/${entry.remote}`);
        }

        console.log(`Uploaded ${entry.local} → gs://${bucket}/${entry.remote} (${metadata.size} bytes)`);
    }
    console.log('Data upload complete.');
}

uploadAll().catch(err => {
    console.error('Storage upload failed:', err.message);
    process.exit(1);
});
