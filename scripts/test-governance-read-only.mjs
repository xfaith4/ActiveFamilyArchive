#!/usr/bin/env node

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails
} from '@firebase/rules-unit-testing';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    orderBy,
    setDoc,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getBytes
} from 'firebase/storage';
import { initializeApp, deleteApp } from 'firebase/app';
import {
    getAuth,
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const PROJECT_ID = 'demo-freshstart-governance';
const CONTRIBUTOR_EMAIL = 'contributor@example.com';
const ADMIN_EMAIL = 'admin@example.com';
const PASSWORD = 'Passw0rd!';
const GOVERNANCE_POLICY_VERSION = 'permissionGovernanceV1';

function getHostPort(envVar, fallbackHost, fallbackPort) {
    const raw = process.env[envVar];
    if (!raw) return { host: fallbackHost, port: fallbackPort };
    const [host, portString] = raw.split(':');
    const parsedPort = Number(portString);
    return {
        host: host || fallbackHost,
        port: Number.isFinite(parsedPort) ? parsedPort : fallbackPort
    };
}

async function seedReadOnlyModeData(testEnv) {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        const storage = context.storage();

        await setDoc(doc(db, 'authorized_users', CONTRIBUTOR_EMAIL), {
            email: CONTRIBUTOR_EMAIL,
            role: 'contributor',
            name: 'Contributor User'
        });

        await setDoc(doc(db, 'authorized_users', ADMIN_EMAIL), {
            email: ADMIN_EMAIL,
            role: 'admin',
            name: 'Admin User'
        });

        await setDoc(doc(db, 'app_config', 'governance'), {
            mode: 'historical_read_only',
            policyVersion: GOVERNANCE_POLICY_VERSION,
            updatedAt: new Date().toISOString(),
            updatedBy: ADMIN_EMAIL
        });

        await setDoc(doc(db, 'person_profile_overrides', 'person-1'), {
            personId: 'person-1',
            personName: 'Ada Example',
            nickname: 'Ada',
            profileNote: 'Historical profile data remains readable in read-only mode.',
            updatedAt: new Date().toISOString(),
            updatedBy: ADMIN_EMAIL
        });

        await setDoc(doc(db, 'tree_layouts', '_default'), {
            positions: { 'person-1': { x: 120, y: 80 } },
            updatedAt: new Date().toISOString(),
            updatedBy: ADMIN_EMAIL
        });

        await setDoc(doc(db, 'media_links', 'link-1'), {
            personId: 'person-1',
            photoPath: 'FamilyTreeMedia/photo.jpg',
            addedBy: ADMIN_EMAIL
        });

        await setDoc(doc(db, 'photo_uploads', 'approved-photo-1'), {
            status: 'approved',
            uploaderEmail: CONTRIBUTOR_EMAIL,
            personId: 'person-1',
            storagePath: 'uploads/person-1/approved.jpg'
        });

        await setDoc(doc(db, 'governance_audit', 'seed-audit-entry'), {
            action: 'mode_change',
            actorEmail: ADMIN_EMAIL,
            actorName: 'Admin User',
            before: { mode: 'normal' },
            after: { mode: 'historical_read_only' },
            changedAt: new Date().toISOString()
        });

        const encoder = new TextEncoder();
        await uploadBytes(ref(storage, 'data/person-details.json'), encoder.encode('{"ok":true}'), {
            contentType: 'application/json'
        });
        await uploadBytes(ref(storage, 'data/sources.json'), encoder.encode('{"sources":[]}'), {
            contentType: 'application/json'
        });
        await uploadBytes(ref(storage, 'data/places.json'), encoder.encode('{"places":[]}'), {
            contentType: 'application/json'
        });
    });
}

async function testHistoricalBrowsingReads(testEnv) {
    const contributorContext = testEnv.authenticatedContext('uid-contributor', { email: CONTRIBUTOR_EMAIL });
    const db = contributorContext.firestore();
    const storage = contributorContext.storage();

    await assertSucceeds(getDoc(doc(db, 'person_profile_overrides', 'person-1'))); // profile viewing
    await assertSucceeds(getDoc(doc(db, 'tree_layouts', '_default'))); // tree
    await assertSucceeds(getBytes(ref(storage, 'data/sources.json'))); // sources / research library
    await assertSucceeds(getBytes(ref(storage, 'data/places.json'))); // places
    await assertSucceeds(getDoc(doc(db, 'media_links', 'link-1'))); // gallery / lightbox linkage
    await assertSucceeds(getBytes(ref(storage, 'data/person-details.json'))); // analytics inputs

    console.log('✅ Historical browsing reads remain available in historical_read_only mode.');
}

async function testReadOnlyWriteDenials(testEnv) {
    const contributorContext = testEnv.authenticatedContext('uid-contributor', { email: CONTRIBUTOR_EMAIL });
    const db = contributorContext.firestore();
    const storage = contributorContext.storage();

    await assertFails(addDoc(collection(db, 'feedback'), {
        type: 'general',
        message: 'Attempted while read-only',
        submittedBy: CONTRIBUTOR_EMAIL
    }));

    await assertFails(addDoc(collection(db, 'submissions'), {
        type: 'correction',
        field: 'birthDate',
        proposedValue: '1901-01-01',
        submittedBy: CONTRIBUTOR_EMAIL
    }));

    await assertFails(addDoc(collection(db, 'photo_uploads'), {
        status: 'pending',
        uploaderEmail: CONTRIBUTOR_EMAIL,
        personId: 'person-1',
        storagePath: 'uploads/person-1/new.jpg'
    }));

    await assertFails(addDoc(collection(db, 'evidence_uploads'), {
        contributorEmail: CONTRIBUTOR_EMAIL,
        status: 'pending',
        personId: 'person-1',
        personName: 'Ada Example',
        storagePath: 'evidence/person-1/doc.pdf',
        downloadURL: 'https://example.invalid/doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024
    }));

    await assertFails(addDoc(collection(db, 'photo_notes'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        note: 'Community note'
    }));

    await assertFails(addDoc(collection(db, 'photo_person_tags'), {
        taggedBy: CONTRIBUTOR_EMAIL,
        personId: 'person-1'
    }));

    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Read-only post attempt',
        createdAt: serverTimestamp()
    }));

    await assertFails(addDoc(collection(db, 'board_replies'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Read-only reply attempt',
        createdAt: serverTimestamp(),
        parentPostId: 'nonexistent-post'
    }));

    await assertFails(setDoc(
        doc(db, 'content_flags', `${CONTRIBUTOR_EMAIL}_post_target-id`),
        {
            flaggerEmail: CONTRIBUTOR_EMAIL,
            targetType: 'post',
            targetId: 'target-id',
            status: 'open'
        }
    ));

    const imageBytes = new Uint8Array([137, 80, 78, 71]);
    const pdfBytes = new Uint8Array([37, 80, 68, 70]);

    await assertFails(uploadBytes(ref(storage, 'uploads/person-1/new.jpg'), imageBytes, {
        contentType: 'image/jpeg'
    }));

    await assertFails(uploadBytes(ref(storage, 'evidence/person-1/new.pdf'), pdfBytes, {
        contentType: 'application/pdf'
    }));

    await assertFails(uploadBytes(ref(storage, 'board/some-post-id/new.jpg'), imageBytes, {
        contentType: 'image/jpeg'
    }));

    console.log('✅ Firestore and Storage writes are denied in historical_read_only mode.');
}

async function testAdminGovernanceWritesStillAllowed(testEnv) {
    const adminContext = testEnv.authenticatedContext('uid-admin', { email: ADMIN_EMAIL });
    const db = adminContext.firestore();

    await assertSucceeds(setDoc(doc(db, 'app_config', 'governance'), {
        mode: 'historical_read_only',
        policyVersion: GOVERNANCE_POLICY_VERSION,
        updatedAt: new Date().toISOString(),
        updatedBy: ADMIN_EMAIL
    }, { merge: true }));

    await assertSucceeds(addDoc(collection(db, 'governance_audit'), {
        action: 'mode_change',
        actorEmail: ADMIN_EMAIL,
        actorName: 'Admin User',
        before: { mode: 'historical_read_only' },
        after: { mode: 'historical_read_only' },
        changedAt: new Date().toISOString()
    }));

    const auditQuery = query(collection(db, 'governance_audit'), orderBy('changedAt', 'desc'));
    const auditSnap = await assertSucceeds(getDocs(auditQuery));
    assert(auditSnap.size >= 1, 'Expected governance audit entries to be readable by admin.');

    console.log('✅ Admin governance writes and audit reads remain available in historical_read_only mode.');
}

async function testCallableBlockedByReadOnlyMode(functionsHost, functionsPort, authHost, authPort) {
    const app = initializeApp({
        apiKey: 'demo-api-key',
        authDomain: `${PROJECT_ID}.firebaseapp.com`,
        projectId: PROJECT_ID,
        appId: '1:1234567890:web:demo'
    }, 'governance-callable-test');

    const auth = getAuth(app);
    connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });

    try {
        await createUserWithEmailAndPassword(auth, CONTRIBUTOR_EMAIL, PASSWORD);
    } catch {
        await signInWithEmailAndPassword(auth, CONTRIBUTOR_EMAIL, PASSWORD);
    }

    const functions = getFunctions(app);
    connectFunctionsEmulator(functions, functionsHost, functionsPort);

    const savePersonProfileEdit = httpsCallable(functions, 'savePersonProfileEdit');

    try {
        await savePersonProfileEdit({
            personId: 'person-1',
            expectedUpdatedAt: null,
            nickname: 'ReadOnlyAttempt',
            profileNote: 'Should be blocked.'
        });
        throw new Error('Expected callable to fail in historical read-only mode, but it succeeded.');
    } catch (error) {
        assert.strictEqual(error.code, 'functions/failed-precondition');
        const message = String(error.message || '');
        // Guard the user-facing read-only error contract without overfitting exact punctuation.
        assert(message.toLowerCase().includes('read-only mode'));
        assert(message.toLowerCase().includes('paused'));
    } finally {
        await deleteApp(app);
    }

    console.log('✅ Callable profile presentation edit returns failed-precondition in historical_read_only mode.');
}

async function testBoardFieldValidationsInNormalMode(testEnv) {
    // Switch governance back to normal mode so positive-path board writes are
    // evaluated only against the field-level contract, not the read-only gate.
    await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'app_config', 'governance'), {
            mode: 'normal',
            policyVersion: GOVERNANCE_POLICY_VERSION,
            updatedAt: new Date().toISOString(),
            updatedBy: ADMIN_EMAIL
        });
    });

    const contributorContext = testEnv.authenticatedContext('uid-contributor', { email: CONTRIBUTOR_EMAIL });
    const db = contributorContext.firestore();

    // A well-formed post is accepted — baseline to confirm the gate is not
    // rejecting legitimate traffic.
    await assertSucceeds(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Hello family',
        createdAt: serverTimestamp()
    }));

    // Impersonation: authorEmail points at a different account.
    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: ADMIN_EMAIL,
        authorName: 'Contributor User',
        body: 'Impersonation attempt',
        createdAt: serverTimestamp()
    }));

    // Backdated post: client-supplied createdAt instead of serverTimestamp().
    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Backdated attempt',
        createdAt: new Date('2000-01-01')
    }));

    // authorName exceeds the 80-character cap.
    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'x'.repeat(100),
        body: 'Oversized name',
        createdAt: serverTimestamp()
    }));

    // imageUrl does not start with https://.
    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Bad image url',
        createdAt: serverTimestamp(),
        imageUrl: 'javascript:alert(1)'
    }));

    // imageStoragePath does not live under board/{postId}/.
    await assertFails(setDoc(doc(collection(db, 'board_posts'), 'shaped-post-id'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Bad storage path',
        createdAt: serverTimestamp(),
        imageStoragePath: 'uploads/person-1/other-users-image.jpg'
    }));

    // replyCount != 0 on create (lying about engagement at creation).
    await assertFails(addDoc(collection(db, 'board_posts'), {
        authorEmail: CONTRIBUTOR_EMAIL,
        authorName: 'Contributor User',
        body: 'Lying reply count',
        createdAt: serverTimestamp(),
        replyCount: 999
    }));

    // content_flags doc id must be "{flaggerEmail}_{targetType}_{targetId}".
    // A random id should be rejected so one-flag-per-(flagger, target) holds.
    await assertFails(addDoc(collection(db, 'content_flags'), {
        flaggerEmail: CONTRIBUTOR_EMAIL,
        targetType: 'post',
        targetId: 'some-post',
        status: 'open'
    }));

    // The deterministic id is accepted for the same payload.
    await assertSucceeds(setDoc(
        doc(db, 'content_flags', `${CONTRIBUTOR_EMAIL}_post_some-post`),
        {
            flaggerEmail: CONTRIBUTOR_EMAIL,
            targetType: 'post',
            targetId: 'some-post',
            status: 'open'
        }
    ));

    console.log('✅ Board post field contract rejects impersonation, backdating, oversized names, non-https images, off-path storage refs, and lying reply counts; flag id shape is enforced.');
}

async function main() {
    const firestoreRules = await readFile(resolve('firestore.rules'), 'utf8');
    const storageRules = await readFile(resolve('storage.rules'), 'utf8');

    const functionsHostPort = getHostPort('FUNCTIONS_EMULATOR_HOST', '127.0.0.1', 5001);
    const authHostPort = getHostPort('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1', 9099);

    const testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: { rules: firestoreRules },
        storage: { rules: storageRules }
    });

    try {
        await testEnv.clearFirestore();
        await seedReadOnlyModeData(testEnv);
        await testHistoricalBrowsingReads(testEnv);
        await testReadOnlyWriteDenials(testEnv);
        await testAdminGovernanceWritesStillAllowed(testEnv);
        await testCallableBlockedByReadOnlyMode(
            functionsHostPort.host,
            functionsHostPort.port,
            authHostPort.host,
            authHostPort.port
        );
        await testBoardFieldValidationsInNormalMode(testEnv);
        console.log('🎉 Governance read-only integration tests passed.');
    } finally {
        await testEnv.cleanup();
    }
}

main().catch((error) => {
    console.error('❌ Governance read-only integration test failure:');
    console.error(error);
    process.exitCode = 1;
});
