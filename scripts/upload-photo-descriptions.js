#!/usr/bin/env node
/**
 * Bulk upload photo descriptions to Firestore.
 *
 * Required environment variables:
 *   FIREBASE_DATA_SA   — service account JSON string
 *   FIREBASE_PROJECT_ID — e.g. familytree-f8ac9
 *
 * Optional:
 *   PHOTO_DESCRIPTIONS_FILE — path to JSON file
 *
 * Input file format:
 * [
 *   {
 *     "photoPath": "FamilyTreeMedia/HofstetterFamilyTree_media/grandparent.jpg",
 *     "visualSummary": "What's visible in the image",
 *     "historicalContext": "Cautious era/setting observations",
 *     "researchLead": "Research avenues for family members",
 *     "status": "draft",
 *     "model": "manual or gemini-2.0-flash",
 *     "editedBy": null,
 *     "editedAt": null
 *   }
 * ]
 */

const fs = require('fs');
const path = require('path');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const saJson = process.env.FIREBASE_DATA_SA;
const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
const inputFile = process.env.PHOTO_DESCRIPTIONS_FILE
  ? path.resolve(process.env.PHOTO_DESCRIPTIONS_FILE)
  : path.resolve(__dirname, '..', 'photo-descriptions.json');

if (!saJson) {
  console.error('FIREBASE_DATA_SA env var is not set.');
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

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

const db = getFirestore();

function toBase64Url(value) {
  return Buffer.from(String(value), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function parseNullableTimestamp(value, fieldName, photoPath) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid ${fieldName} for ${photoPath}`);
    }
    return Timestamp.fromDate(value);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName} for ${photoPath}: ${JSON.stringify(value)}`);
  }

  return Timestamp.fromDate(date);
}

function requireNonEmptyString(obj, fieldName) {
  const value = obj[fieldName];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Field "${fieldName}" is required and must be a non-empty string.`);
  }
  return value.trim();
}

function validateStatus(status, photoPath) {
  const allowed = new Set(['draft', 'approved', 'published']);
  if (!allowed.has(status)) {
    throw new Error(
      `Invalid status for ${photoPath}: ${JSON.stringify(status)}. Allowed: draft, approved, published`
    );
  }
}

function normalizeRecord(raw) {
  const photoPath = requireNonEmptyString(raw, 'photoPath');
  const visualSummary = requireNonEmptyString(raw, 'visualSummary');
  const historicalContext = requireNonEmptyString(raw, 'historicalContext');
  const researchLead = requireNonEmptyString(raw, 'researchLead');
  const status = requireNonEmptyString(raw, 'status');
  const model = requireNonEmptyString(raw, 'model');

  validateStatus(status, photoPath);

  let editedBy = raw.editedBy;
  if (editedBy !== null && editedBy !== undefined) {
    if (typeof editedBy !== 'string') {
      throw new Error(`Field "editedBy" must be string or null for ${photoPath}`);
    }
    editedBy = editedBy.trim() || null;
  } else {
    editedBy = null;
  }

  const editedAt = parseNullableTimestamp(raw.editedAt, 'editedAt', photoPath);

  return {
    photoPath,
    visualSummary,
    historicalContext,
    researchLead,
    status,
    generatedAt: Timestamp.now(),
    model,
    editedBy,
    editedAt,
  };
}

async function loadRecords(filePath) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to parse JSON file ${filePath}: ${err.message}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Input JSON must be an array of records.');
  }

  return parsed.map(normalizeRecord);
}

async function uploadAll() {
  const records = await loadRecords(inputFile);

  if (records.length === 0) {
    console.log('No records found. Nothing to upload.');
    return;
  }

  console.log(`Preparing to upload ${records.length} photo description record(s)...`);

  let batch = db.batch();
  let opCount = 0;
  let committed = 0;

  for (const record of records) {
    const docId = toBase64Url(record.photoPath);
    const ref = db.collection('photo_descriptions').doc(docId);

    batch.set(ref, record, { merge: true });
    opCount += 1;

    console.log(`Queued ${record.photoPath} -> photo_descriptions/${docId}`);

    if (opCount === 500) {
      await batch.commit();
      committed += opCount;
      console.log(`Committed ${committed} record(s)...`);
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
    committed += opCount;
  }

  console.log(`Upload complete. ${committed} record(s) written to Firestore.`);
}

uploadAll().catch(err => {
  console.error(`Firestore upload failed: ${err.message}`);
  process.exit(1);
});
