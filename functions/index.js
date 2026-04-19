/**
 * Firebase Cloud Functions for Living Family Archive
 *
 * This module provides backend logic for the invitation system and AI-powered
 * photo note generation.
 *
 * sendInvitationEmail:
 *   Firestore trigger that fires when a new document is created in the
 *   `invitations` collection and sends the invitation email via Nodemailer.
 *
 *   Configuration (Firebase Functions config or environment variables):
 *     firebase functions:config:set \
 *       email.host="smtp.gmail.com" \
 *       email.port="465" \
 *       email.secure="true" \
 *       email.user="your-app@gmail.com" \
 *       email.password="your-app-password" \
 *       app.url="https://your-app.web.app"
 *
 *   Or set environment variables when using Firebase Functions v2 / secrets:
 *     EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD, APP_URL
 *
 * generatePhotoNote:
 *   Callable HTTPS function that accepts a photo URL and optional person context,
 *   then uses the Google Gemini Vision API to generate a descriptive note about
 *   the photo.
 *
 *   Configuration:
 *     Set the GEMINI_API_KEY environment variable (or Firebase Functions config
 *     variable gemini.api_key) before deploying:
 *       firebase functions:config:set gemini.api_key="YOUR_API_KEY"
 *     Or use a Secret Manager secret named GEMINI_API_KEY.
 */

const v1 = require('firebase-functions/v1');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

admin.initializeApp();

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
const CONFIGURED_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ben.fuhr@gmail.com';
const PERSON_DETAILS_STORAGE_PATH = 'data/person-details.json';
const PROFILE_NICKNAME_MAX = 80;
const PROFILE_NOTE_MAX = 2000;
const GOVERNANCE_POLICY_VERSION = 'permissionGovernanceV1';
const APP_MODE = {
    NORMAL: 'normal',
    HISTORICAL_READ_ONLY: 'historical_read_only'
};

// Known project-to-hosting mappings for this app.
const PROJECT_HOSTING_MAP = {
    'familytree-f8ac9': 'https://familytree-f8ac9.web.app',
    'familytree-staging': 'https://familytree-staging.web.app'
};

function getAppUrl() {
    // Explicit env/config override takes precedence
    const appCfg = v1.config().app || {};
    if (appCfg.url) return appCfg.url;
    if (process.env.APP_URL) return process.env.APP_URL;

    // Derive from the Firebase project ID
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || '';
    if (PROJECT_HOSTING_MAP[projectId]) return PROJECT_HOSTING_MAP[projectId];

    // Fallback: construct from project ID (standard Firebase Hosting pattern)
    if (projectId) return `https://${projectId}.web.app`;

    return 'https://familytree-staging.web.app';
}

async function getAuthorizedUser(request, { requireAdmin = false } = {}) {
    if (!request.auth?.token?.email) {
        throw new HttpsError('unauthenticated', 'Authentication required.');
    }

    const email = request.auth.token.email;
    const isConfiguredAdmin = email === CONFIGURED_ADMIN_EMAIL;
    const userDoc = await admin.firestore().collection('authorized_users').doc(email).get();
    if (!userDoc.exists && !isConfiguredAdmin) {
        throw new HttpsError('permission-denied', 'Authorized account required.');
    }

    const user = userDoc.exists ? (userDoc.data() || {}) : {};
    const role = isConfiguredAdmin ? 'admin' : normalizeRole(user.role);
    if (requireAdmin && role !== 'admin') {
        throw new HttpsError('permission-denied', 'Admin access required.');
    }

    return {
        email,
        name: user.name || request.auth.token.name || email,
        role
    };
}

function normalizeRole(role) {
    if (role === 'admin' || role === 'moderator' || role === 'contributor' || role === 'viewer') return role;
    if (role === 'user' || !role) return 'contributor';
    return 'viewer';
}

async function getGovernancePolicy() {
    const snap = await admin.firestore().collection('app_config').doc('governance').get();
    if (!snap.exists) {
        return {
            mode: APP_MODE.NORMAL,
            policyVersion: GOVERNANCE_POLICY_VERSION
        };
    }
    const data = snap.data() || {};
    return {
        mode: data.mode === APP_MODE.HISTORICAL_READ_ONLY ? APP_MODE.HISTORICAL_READ_ONLY : APP_MODE.NORMAL,
        policyVersion: data.policyVersion || GOVERNANCE_POLICY_VERSION
    };
}

async function assertCollaborationWritesEnabled(actionLabel) {
    const policy = await getGovernancePolicy();
    if (policy.mode === APP_MODE.HISTORICAL_READ_ONLY) {
        throw new HttpsError(
            'failed-precondition',
            `${actionLabel} is paused while the archive is in historical read-only mode.`
        );
    }
}

function sanitizeProfileField(value, maxLength, fieldName) {
    if (value == null) return '';
    if (typeof value !== 'string') {
        throw new HttpsError('invalid-argument', `${fieldName} must be a string.`);
    }
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
        throw new HttpsError('invalid-argument', `${fieldName} must be ${maxLength} characters or fewer.`);
    }
    return trimmed;
}

async function loadPersonDetailsMap() {
    const [buffer] = await admin.storage().bucket().file(PERSON_DETAILS_STORAGE_PATH).download();

    try {
        return JSON.parse(buffer.toString('utf8'));
    } catch {
        throw new HttpsError('internal', 'person-details.json is not valid JSON.');
    }
}

exports.savePersonProfileEdit = onCall(async (request) => {
    const actor = await getAuthorizedUser(request);
    await assertCollaborationWritesEnabled('Profile editing');
    const personId = String(request.data?.personId || '').trim();
    const expectedUpdatedAt = request.data?.expectedUpdatedAt ?? null;
    const nickname = sanitizeProfileField(request.data?.nickname, PROFILE_NICKNAME_MAX, 'Nickname');
    const profileNote = sanitizeProfileField(request.data?.profileNote, PROFILE_NOTE_MAX, 'Profile note');

    if (!personId) {
        throw new HttpsError('invalid-argument', 'personId is required.');
    }

    const detailsMap = await loadPersonDetailsMap();
    const basePerson = detailsMap?.[personId];
    if (!basePerson) {
        throw new HttpsError('not-found', 'The requested person could not be found.');
    }

    const overrideRef = admin.firestore().collection('person_profile_overrides').doc(personId);
    const existingOverrideSnap = await overrideRef.get();
    const existingOverride = existingOverrideSnap.exists ? (existingOverrideSnap.data() || {}) : {};
    const currentUpdatedAt = existingOverride.updatedAt || null;
    const normalizedExpectedUpdatedAt = expectedUpdatedAt ? String(expectedUpdatedAt) : null;

    if (currentUpdatedAt !== normalizedExpectedUpdatedAt) {
        throw new HttpsError(
            'failed-precondition',
            'This profile changed after you opened it. Reload the profile and try again.'
        );
    }

    const beforeValues = {
        nickname: typeof existingOverride.nickname === 'string' ? existingOverride.nickname : (basePerson.nickname || ''),
        profileNote: typeof existingOverride.profileNote === 'string' ? existingOverride.profileNote : (basePerson.profileNote || '')
    };
    const afterValues = {
        nickname,
        profileNote
    };
    const changedFields = Object.keys(afterValues).filter((field) => beforeValues[field] !== afterValues[field]);

    if (!changedFields.length) {
        throw new HttpsError('invalid-argument', 'No profile changes were detected.');
    }

    const editedAt = new Date().toISOString();
    const personName = basePerson.name || existingOverride.personName || `Person ${personId}`;
    const overridePayload = {
        personId,
        personName,
        nickname,
        profileNote,
        updatedAt: editedAt,
        updatedBy: actor.email,
        updatedByName: actor.name
    };

    const changeLogRef = admin.firestore().collection('person_change_log').doc();
    const notificationRef = admin.firestore().collection('admin_notifications').doc();
    const narrowedBeforeValues = Object.fromEntries(changedFields.map((field) => [field, beforeValues[field]]));
    const narrowedAfterValues = Object.fromEntries(changedFields.map((field) => [field, afterValues[field]]));
    const notificationMessage =
        `${actor.name} updated ${personName}: ${changedFields.join(', ')}.`;

    const batch = admin.firestore().batch();
    batch.set(overrideRef, overridePayload);
    batch.set(changeLogRef, {
        personId,
        personName,
        editorEmail: actor.email,
        editorName: actor.name,
        editedAt,
        changedFields,
        beforeValues: narrowedBeforeValues,
        afterValues: narrowedAfterValues
    });
    batch.set(notificationRef, {
        type: 'person_profile_edit',
        status: 'unread',
        personId,
        personName,
        editorEmail: actor.email,
        editorName: actor.name,
        editedAt,
        changedFields,
        beforeValues: narrowedBeforeValues,
        afterValues: narrowedAfterValues,
        changeLogId: changeLogRef.id,
        message: notificationMessage
    });
    await batch.commit();

    return {
        override: overridePayload,
        auditId: changeLogRef.id,
        changedFields
    };
});

// Derive a Firestore document ID from a photo path using base64url encoding.
// This gives each photo a stable, collision-free, slash-free document ID.
function photoPathToDocId(photoPath) {
    return Buffer.from(photoPath).toString('base64url');
}

// Fetch a remote image and return { base64, mimeType }.
// Works for both public Firebase Hosting URLs and signed Firebase Storage URLs.
async function fetchImageAsBase64(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new HttpsError('not-found', `Could not fetch image: HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return { base64: buffer.toString('base64'), mimeType: mimeType.split(';')[0].trim() };
}

/**
 * generatePhotoNote — admin-triggered Gemini vision analysis for a single photo.
 *
 * Request data:
 *   photoPath   {string}   Relative path ("FamilyTreeMedia/001.jpg") or Storage download URL
 *   personNames {string[]} Optional list of known person names associated with this photo
 *
 * Writes a draft photo_descriptions document keyed by base64url(photoPath).
 * Returns { visualSummary, historicalContext, researchLead }.
 */
exports.generatePhotoNote = onCall(
    { secrets: [GEMINI_API_KEY] },
    async (request) => {
        await getAuthorizedUser(request, { requireAdmin: true });

        const { photoPath, personNames } = request.data || {};
        if (!photoPath || typeof photoPath !== 'string') {
            throw new HttpsError('invalid-argument', 'photoPath is required.');
        }

        // Resolve to a publicly fetchable URL
        const imageUrl = photoPath.startsWith('https://')
            ? photoPath
            : `${getAppUrl()}/${photoPath}`;

        const { base64, mimeType } = await fetchImageAsBase64(imageUrl);

        // Build the prompt — inject known person names when available
        const contextPrefix = Array.isArray(personNames) && personNames.length > 0
            ? `Known people in this photo: ${personNames.join(', ')}. `
            : '';

        const prompt =
            `${contextPrefix}Analyze this family-history photo and return exactly this JSON object with no other text:\n\n` +
            `{\n` +
            `  "visualSummary": "Describe only what is clearly visible in the image.",\n` +
            `  "historicalContext": "Provide cautious, non-authoritative observations about possible era, clothing, setting, or occasion.",\n` +
            `  "researchLead": "Suggest one or two concrete avenues a family member could explore to learn more."\n` +
            `}\n\n` +
            `Rules:\n` +
            `- Do not identify people by name unless provided above.\n` +
            `- Do not state dates, places, or relationships as facts unless known.\n` +
            `- Use cautious wording for inference: "may", "could", "possibly", "worth comparing", "should be verified".\n` +
            `- Keep the tone helpful, clear, and family-history oriented.\n` +
            `- Return only the JSON object, no markdown, no extra text.`;

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        let geminiResult;
        try {
            geminiResult = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [
                        { inlineData: { data: base64, mimeType } },
                        { text: prompt }
                    ]
                }]
            });
        } catch (err) {
            console.error('Gemini API error', { error: err.message, photoPath });
            throw new HttpsError('internal', 'Gemini API call failed.');
        }

        // Parse the model response — strip markdown fences if present
        const raw = geminiResult.response.text().trim();
        const clean = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        let parsed;
        try {
            parsed = JSON.parse(clean);
        } catch {
            console.error('JSON parse failed', { raw, photoPath });
            throw new HttpsError('internal', 'Failed to parse Gemini response as JSON.');
        }

        const { visualSummary, historicalContext, researchLead } = parsed;
        if (!visualSummary || !historicalContext || !researchLead) {
            throw new HttpsError('internal', 'Gemini response is missing required fields.');
        }

        const docId = photoPathToDocId(photoPath);
        await admin.firestore().collection('photo_descriptions').doc(docId).set({
            photoPath,
            visualSummary: String(visualSummary),
            historicalContext: String(historicalContext),
            researchLead: String(researchLead),
            status: 'draft',
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            model: 'gemini-2.0-flash',
            editedBy: null,
            editedAt: null
        });

        console.log('Photo note generated', { photoPath, docId });
        return { visualSummary, historicalContext, researchLead };
    }
);

const APP_NAME = 'Living Family Archive';

/** Simple email format validator used server-side to guard against malformed addresses. */
function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Build a Nodemailer transport from environment variables.
 * Configure via: EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASSWORD
 */
function createTransport() {
    const cfg = v1.config().email || {};
    return nodemailer.createTransport({
        host:   cfg.host   || process.env.EMAIL_HOST   || 'smtp.gmail.com',
        port:   parseInt(cfg.port || process.env.EMAIL_PORT || '465', 10),
        secure: (cfg.secure || process.env.EMAIL_SECURE || 'true') === 'true',
        auth: {
            user: cfg.user     || process.env.EMAIL_USER     || '',
            pass: cfg.password || process.env.EMAIL_PASSWORD || ''
        }
    });
}

function shouldCreateOutcomeNotification(beforeData, afterData) {
    const beforeStatus = beforeData?.status || null;
    const afterStatus = afterData?.status || null;
    return Boolean(afterStatus && afterStatus !== 'pending' && afterStatus !== beforeStatus);
}

function formatOutcomeLabel(status) {
    const normalized = String(status || '').replace(/_/g, ' ').trim();
    if (!normalized) return 'updated';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getOutcomeClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'approved' || normalized === 'resolved') return 'resolved';
    if (normalized === 'rejected' || normalized === 'dismissed') return 'dismissed';
    return 'pending';
}

async function createContributorNotification({
    recipientEmail,
    title,
    message,
    type,
    outcome,
    personId = '',
    personName = '',
    sourceCollection = '',
    sourceId = '',
    reviewedBy = ''
}) {
    if (!isValidEmail(recipientEmail)) return null;
    if (reviewedBy && reviewedBy === recipientEmail) return null;

    await admin.firestore().collection('user_notifications').add({
        recipientEmail,
        title,
        message,
        type,
        outcome,
        outcomeClass: getOutcomeClass(outcome),
        personId,
        personName,
        sourceCollection,
        sourceId,
        reviewedBy,
        status: 'unread',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return null;
}

/**
 * Firestore trigger (1st-gen) – fires whenever a new document is created
 * in the `invitations` collection.
 *
 * Kept as 1st-gen to avoid a breaking upgrade of the already-deployed function.
 *
 * Expected document fields:
 *   - toEmail   {string}  Recipient email address
 *   - invitedBy {string}  Email of the admin who sent the invite
 *   - appUrl    {string}  (optional) App URL to include in the email
 */
exports.sendInvitationEmail = v1.firestore
    .document('invitations/{invitationId}')
    .onCreate(async (snap, context) => {
        const invitation = snap.data();
        const toEmail = invitation.toEmail;
        const invitedBy = invitation.invitedBy || 'an administrator';

        const appUrl = invitation.appUrl
            || getAppUrl();

        if (!toEmail || !isValidEmail(toEmail)) {
            console.error('sendInvitationEmail: missing or invalid toEmail', {
                invitationId: context.params.invitationId
            });
            await snap.ref.update({ status: 'error', error: 'missing or invalid toEmail' });
            return null;
        }

        const transport = createTransport();

        const mailOptions = {
            from: `"${APP_NAME}" <${transport.options.auth.user}>`,
            to: toEmail,
            subject: `You've been invited to ${APP_NAME}`,
            text: [
                `You have been invited by ${invitedBy} to join the ${APP_NAME}.`,
                '',
                'Click the link below to sign in with your Google account:',
                appUrl,
                '',
                'If you did not expect this invitation, you can safely ignore this email.'
            ].join('\n'),
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Tree Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: linear-gradient(135deg, #8B4513, #D2691E); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌳 ${APP_NAME}</h1>
  </div>
  <div style="background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
    <p>Hello,</p>
    <p>
      You have been invited by <strong>${invitedBy}</strong> to join the
      <strong>${APP_NAME}</strong> – a private genealogy site for our family.
    </p>
    <p>Click the button below to sign in with your Google account and explore the family history:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${appUrl}"
         style="background: #8B4513; color: white; padding: 14px 30px; text-decoration: none;
                border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
        Join the Family Tree
      </a>
    </div>
    <p style="color: #666; font-size: 14px;">
      If the button above doesn't work, copy and paste this link into your browser:<br>
      <a href="${appUrl}" style="color: #8B4513;">${appUrl}</a>
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">
      If you did not expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`
        };

        try {
            await transport.sendMail(mailOptions);
            console.log('Invitation email sent', { toEmail });
            await snap.ref.update({ status: 'sent', sentAt: admin.firestore.FieldValue.serverTimestamp() });
        } catch (error) {
            console.error('Failed to send invitation email', { toEmail, error: error.message });
            await snap.ref.update({ status: 'error', error: error.message });
        }

        return null;
    }
);

exports.notifyPhotoUploadReviewOutcome = v1.firestore
    .document('photo_uploads/{uploadId}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null;

        const beforeData = change.before.exists ? (change.before.data() || {}) : null;
        const afterData = change.after.data() || {};
        if (!shouldCreateOutcomeNotification(beforeData, afterData)) return null;

        const personName = afterData.personName || 'the selected profile';
        const outcome = String(afterData.status || '');
        const reviewedBy = afterData.reviewedBy || '';
        const title = `Photo ${formatOutcomeLabel(outcome)}`;
        const message = outcome === 'approved'
            ? `Your photo upload for ${personName} is now approved and visible in the archive.`
            : `Your photo upload for ${personName} was reviewed and not approved for publication.`;

        return createContributorNotification({
            recipientEmail: afterData.uploaderEmail,
            title,
            message,
            type: 'photo_upload_review',
            outcome,
            personId: afterData.personId || '',
            personName,
            sourceCollection: 'photo_uploads',
            sourceId: context.params.uploadId,
            reviewedBy
        });
    });

exports.notifyFeedbackReviewOutcome = v1.firestore
    .document('feedback/{feedbackId}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null;

        const beforeData = change.before.exists ? (change.before.data() || {}) : null;
        const afterData = change.after.data() || {};
        if (!shouldCreateOutcomeNotification(beforeData, afterData)) return null;

        const personName = afterData.person || '';
        const outcome = String(afterData.status || '');
        const reviewedBy = afterData.reviewedBy || '';
        const title = `Feedback ${formatOutcomeLabel(outcome)}`;
        const message = personName
            ? `Your feedback about ${personName} was marked ${outcome}.`
            : `Your feedback submission was marked ${outcome}.`;

        return createContributorNotification({
            recipientEmail: afterData.submittedBy,
            title,
            message,
            type: 'feedback_review',
            outcome,
            personName,
            sourceCollection: 'feedback',
            sourceId: context.params.feedbackId,
            reviewedBy
        });
    });

exports.notifySubmissionReviewOutcome = v1.firestore
    .document('submissions/{submissionId}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null;

        const beforeData = change.before.exists ? (change.before.data() || {}) : null;
        const afterData = change.after.data() || {};
        if (!shouldCreateOutcomeNotification(beforeData, afterData)) return null;

        const personName = afterData.person || '';
        const outcome = String(afterData.status || '');
        const reviewedBy = afterData.reviewedBy || '';
        const title = `Suggestion ${formatOutcomeLabel(outcome)}`;
        const message = personName
            ? `Your suggestion for ${personName} was marked ${outcome}.`
            : `Your suggestion was marked ${outcome}.`;

        return createContributorNotification({
            recipientEmail: afterData.submittedBy,
            title,
            message,
            type: 'submission_review',
            outcome,
            personName,
            sourceCollection: 'submissions',
            sourceId: context.params.submissionId,
            reviewedBy
        });
    });

exports.notifyEvidenceReviewOutcome = v1.firestore
    .document('evidence_uploads/{uploadId}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null;

        const beforeData = change.before.exists ? (change.before.data() || {}) : null;
        const afterData = change.after.data() || {};
        if (!shouldCreateOutcomeNotification(beforeData, afterData)) return null;

        const personName = afterData.personName || 'the selected profile';
        const outcome = String(afterData.status || '');
        const reviewedBy = afterData.reviewedBy || '';
        const reviewerNote = afterData.reviewerNote || '';
        const title = `Evidence ${formatOutcomeLabel(outcome)}`;
        const baseMessage = outcome === 'approved'
            ? `Your evidence for ${personName} is approved and now visible on the profile.`
            : `Your evidence for ${personName} was reviewed and not approved.`;
        const message = reviewerNote && outcome !== 'approved'
            ? `${baseMessage} Reviewer note: ${reviewerNote}`
            : baseMessage;

        return createContributorNotification({
            recipientEmail: afterData.contributorEmail,
            title,
            message,
            type: 'evidence_review',
            outcome,
            personId: afterData.personId || '',
            personName,
            sourceCollection: 'evidence_uploads',
            sourceId: context.params.uploadId,
            reviewedBy
        });
    });
