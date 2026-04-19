import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    limit,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { firebaseConfig, firebaseConfigErrorMessage, ADMIN_EMAIL, LOCAL_DEV_PASSWORD } from './firebase-config.js';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, getBytes, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import cytoscape from 'cytoscape';
import cydagre from 'cytoscape-dagre';
cytoscape.use(cydagre);

import { initializeFamilyData, initDataUrls, getDataLoadErrors, searchFamilyMembers, buildSearchIndex, loadPhotos, loadPersonPhotos, getPhotosForPersonId, getPersonsForPhoto, getPersonById, loadPersonFamily, getFamilyForPerson, loadPersonDetails, getDetailsForPerson, getPersonDetailsData, applyPersonProfileOverride, mergePersonProfileOverrides, mergeManualMediaLinks, computeAnalytics, computeUserAccuracyProfile, buildTreeData, loadCitedSources, loadPlacePages, getRelationshipLabel, computeBloodlinePath, computeBloodlineSet } from './family-data.js';
import {
    computeRelationshipLensMap,
    formatApproxSharedPercent,
    formatConnectionType,
    formatRelationshipLensCompactCue,
    getRelationshipLensBucketClass
} from './tree-core/relationship-lens.js';
import {
    getVisualizationMode,
    VIZ_MODE,
    VIZ_MODE_LABELS
} from './tree-modes/tree-mode-registry.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const fbFunctions = getFunctions(app);
const provider = new GoogleAuthProvider();

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const mainApp = document.getElementById('main-app');
const googleSignInBtn = document.getElementById('google-signin-btn');
const signoutBtn = document.getElementById('signout-btn');
const authMessage = document.getElementById('auth-message');
const userInfo = document.getElementById('user-info');
const adminBtn = document.getElementById('admin-btn');
const updatesBtn = document.getElementById('updates-btn');
const updatesBadge = document.getElementById('updates-badge');
const adminPanel = document.getElementById('admin-panel');
const closeAdminBtn = document.getElementById('close-admin-btn');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const browseSurnamesBtn = document.getElementById('browse-surnames-btn');
const browsePhotosBtn = document.getElementById('browse-photos-btn');
const browseSourcesBtn = document.getElementById('browse-sources-btn');
const browsePlacesBtn = document.getElementById('browse-places-btn');
const contentDisplay = document.getElementById('content-display');
const surnameDirectory = document.getElementById('surname-directory');
const photoGallery = document.getElementById('photo-gallery');
const personProfile = document.getElementById('person-profile');
const profileName = document.getElementById('profile-name');
const profileDates = document.getElementById('profile-dates');
const profileRelationship = document.getElementById('profile-relationship');
const profileDetails = document.getElementById('profile-details');
const profileFamily = document.getElementById('profile-family');
const profilePhotos = document.getElementById('profile-photos');
const editProfileBtn = document.getElementById('edit-profile-btn');
const backToSearchBtn = document.getElementById('back-to-search-btn');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.getElementById('lightbox-caption');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
const lightboxPeople = document.getElementById('lightbox-people');
const lightboxPhotoNote = document.getElementById('lightbox-photo-note');
const lightboxAdminNote = document.getElementById('lightbox-admin-note');
const lightboxUserNotes = document.getElementById('lightbox-user-notes');
const inviteEmailInput = document.getElementById('invite-email');
const sendInviteBtn = document.getElementById('send-invite-btn');
const inviteStatus = document.getElementById('invite-status');
const usersList = document.getElementById('users-list');
const localLoginSection = document.getElementById('local-login-section');
const localPasswordInput = document.getElementById('local-password-input');
const localSignInBtn = document.getElementById('local-signin-btn');
const feedbackBtn = document.getElementById('feedback-btn');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedbackBtn = document.getElementById('close-feedback-btn');
const feedbackType = document.getElementById('feedback-type');
const feedbackPerson = document.getElementById('feedback-person');
const feedbackMessage = document.getElementById('feedback-message');
const submitFeedbackBtn = document.getElementById('submit-feedback-btn');
const feedbackStatus = document.getElementById('feedback-status');
const feedbackMyHistory = document.getElementById('feedback-my-history');
const feedbackQueue = document.getElementById('feedback-queue');
const feedbackBadge = document.getElementById('feedback-badge');
const updatesModal = document.getElementById('updates-modal');
const closeUpdatesBtn = document.getElementById('close-updates-btn');
const updatesList = document.getElementById('updates-list');
const adminTabs = document.querySelectorAll('.admin-tab');
const suggestChangeBtn = document.getElementById('suggest-change-btn');
const submissionModal = document.getElementById('submission-modal');
const closeSubmissionBtn = document.getElementById('close-submission-btn');
const submissionTypeBtns = document.querySelectorAll('.submission-type-btn');
const correctionFields = document.getElementById('correction-fields');
const photoFields = document.getElementById('photo-fields');
const submissionPerson = document.getElementById('submission-person');
const correctionFieldName = document.getElementById('correction-field-name');
const correctionProposed = document.getElementById('correction-proposed');
const correctionSource = document.getElementById('correction-source');
const photoPerson = document.getElementById('photo-person');
const photoDescription = document.getElementById('photo-description');
const photoSourceInput = document.getElementById('photo-source');
const submitSubmissionBtn = document.getElementById('submit-submission-btn');
const submissionStatus = document.getElementById('submission-status');
const submissionMyHistory = document.getElementById('submission-my-history');
const submissionsQueue = document.getElementById('submissions-queue');
const submissionsBadge = document.getElementById('submissions-badge');
const profileEditsQueue = document.getElementById('profile-edits-queue');
const profileEditsFilter = document.getElementById('profile-edits-filter');
const profileEditsBadge = document.getElementById('profile-edits-badge');
const inviteMessageArea = document.getElementById('invite-message-area');
const inviteMessageText = document.getElementById('invite-message-text');
const copyInviteBtn = document.getElementById('copy-invite-btn');
const copyInviteConfirm = document.getElementById('copy-invite-confirm');
const inviteTemplateText = document.getElementById('invite-template-text');
const saveInviteTemplateBtn = document.getElementById('save-invite-template-btn');
const resetInviteTemplateBtn = document.getElementById('reset-invite-template-btn');
const inviteTemplateStatus = document.getElementById('invite-template-status');
const mlPersonSearch = document.getElementById('ml-person-search');
const mlPersonResults = document.getElementById('ml-person-results');
const mlPersonSelected = document.getElementById('ml-person-selected');
const mlPhotoSearch = document.getElementById('ml-photo-search');
const mlPhotoResults = document.getElementById('ml-photo-results');
const mlPhotoSelected = document.getElementById('ml-photo-selected');
const mlCaption = document.getElementById('ml-caption');
const mlAddBtn = document.getElementById('ml-add-btn');
const mlStatus = document.getElementById('ml-status');
const mlExistingList = document.getElementById('ml-existing-list');
const headerStats = document.getElementById('header-stats');
const profileHeroThumb = document.getElementById('profile-hero-thumb');
const analyticsView = document.getElementById('analytics-view');
const analyticsContent = document.getElementById('analytics-content');
const browseAnalyticsBtn = document.getElementById('browse-analytics-btn');
const researchLibraryView = document.getElementById('research-library-view');
const backFromResearchBtn = document.getElementById('back-from-research-btn');
const researchLibraryContent = document.getElementById('research-library-content');
const browseResearchBtn = document.getElementById('browse-research-btn');
const boardView = document.getElementById('board-view');
const backFromBoardBtn = document.getElementById('back-from-board-btn');
const browseBoardBtn = document.getElementById('browse-board-btn');
const boardPostsList = document.getElementById('board-posts-list');
const boardEmptyState = document.getElementById('board-empty-state');
const boardStatus = document.getElementById('board-status');
const boardGovernanceBanner = document.getElementById('board-governance-banner');
const boardCompose = document.getElementById('board-compose');
const boardComposeBody = document.getElementById('board-compose-body');
const boardComposeCounter = document.getElementById('board-compose-counter');
const boardComposeSubmitBtn = document.getElementById('board-compose-submit-btn');
const boardComposeAttachBtn = document.getElementById('board-compose-attach-btn');
const boardComposeFileInput = document.getElementById('board-compose-file-input');
const boardComposeImagePreview = document.getElementById('board-compose-image-preview');
const boardComposeImageThumb = document.getElementById('board-compose-image-thumb');
const boardComposeRemoveImageBtn = document.getElementById('board-compose-remove-image');
const boardComposeStatus = document.getElementById('board-compose-status');
const boardComposeProgressWrap = document.getElementById('board-compose-progress-wrap');
const boardComposeProgressBar = document.getElementById('board-compose-progress-bar');
const sourcesView = document.getElementById('sources-view');
const backFromSourcesBtn = document.getElementById('back-from-sources-btn');
const sourcesTypeFilter = document.getElementById('sources-type-filter');
const sourcesPlaceFilter = document.getElementById('sources-place-filter');
const sourcesYearStartFilter = document.getElementById('sources-year-start-filter');
const sourcesYearEndFilter = document.getElementById('sources-year-end-filter');
const sourcesHasExternalFilter = document.getElementById('sources-has-external-filter');
const sourcesSummary = document.getElementById('sources-summary');
const sourcesStatus = document.getElementById('sources-status');
const sourcesList = document.getElementById('sources-list');
const placesView = document.getElementById('places-view');
const backFromPlacesBtn = document.getElementById('back-from-places-btn');
const placesSearchInput = document.getElementById('places-search-input');
const placesRecordTypeFilter = document.getElementById('places-record-type-filter');
const placesSummary = document.getElementById('places-summary');
const placesStatus = document.getElementById('places-status');
const placesList = document.getElementById('places-list');
const treeView = document.getElementById('tree-view');
const backFromTreeBtn = document.getElementById('back-from-tree-btn');
const treeDepthDec = document.getElementById('tree-depth-dec');
const treeDepthInc = document.getElementById('tree-depth-inc');
const treeDepthLabel = document.getElementById('tree-depth-label');
const treeSearchInput = document.getElementById('tree-search-input');
const treeCyContainer = document.getElementById('tree-cy');
const treeStatus = document.getElementById('tree-status');
const browseTreeBtn = document.getElementById('browse-tree-btn');
const treeResetLayoutBtn = document.getElementById('tree-reset-layout-btn');
const treeRecenterBtn = document.getElementById('tree-recenter-btn');
const treeLegendBtn = document.getElementById('tree-legend-btn');
const treeLegend = document.getElementById('tree-legend');
const treeSetDefaultBtn = document.getElementById('tree-set-default-btn');
const treeModeBtns = document.querySelectorAll('.tree-mode-btn');

// Upload Photo modal
const uploadPhotoModal        = document.getElementById('upload-photo-modal');
const closeUploadPhotoBtn     = document.getElementById('close-upload-photo-btn');
const uploadPhotoPersonDisplay= document.getElementById('upload-photo-person-display');
const uploadPhotoFile         = document.getElementById('upload-photo-file');
const uploadPhotoPreviewWrap  = document.getElementById('upload-photo-preview-wrap');
const uploadPhotoPreview      = document.getElementById('upload-photo-preview');
const uploadPhotoCaption      = document.getElementById('upload-photo-caption');
const uploadPhotoProgressWrap = document.getElementById('upload-photo-progress-wrap');
const uploadPhotoProgressBar  = document.getElementById('upload-photo-progress-bar');
const submitUploadPhotoBtn    = document.getElementById('submit-upload-photo-btn');
const uploadPhotoStatus       = document.getElementById('upload-photo-status');
const uploadPhotoHistory      = document.getElementById('upload-photo-history');
const addPhotoBtn             = document.getElementById('add-photo-btn');
const viewInTreeBtn           = document.getElementById('view-in-tree-btn');
const researchPersonBtn       = document.getElementById('research-person-btn');
const photoUploadsQueue       = document.getElementById('photo-uploads-queue');
const photoUploadsBadge       = document.getElementById('photo-uploads-badge');
const photoUploadsTab         = document.getElementById('admin-tab-photo-uploads');
// Evidence upload modal + admin queue
const addEvidenceBtn          = document.getElementById('add-evidence-btn');
const evidenceUploadModal     = document.getElementById('evidence-upload-modal');
const closeEvidenceUploadBtn  = document.getElementById('close-evidence-upload-btn');
const evidenceUploadTitle     = document.getElementById('evidence-upload-title');
const evidenceUploadIntro     = document.getElementById('evidence-upload-intro');
const evidenceUploadPersonDisplay = document.getElementById('evidence-upload-person-display');
const evidenceFactTarget      = document.getElementById('evidence-fact-target');
const evidenceUploadFile      = document.getElementById('evidence-upload-file');
const evidenceUploadPreviewWrap = document.getElementById('evidence-upload-preview-wrap');
const evidenceCitation        = document.getElementById('evidence-citation');
const evidenceNote            = document.getElementById('evidence-note');
const evidenceUploadProgressWrap = document.getElementById('evidence-upload-progress-wrap');
const evidenceUploadProgressBar = document.getElementById('evidence-upload-progress-bar');
const submitEvidenceUploadBtn = document.getElementById('submit-evidence-upload-btn');
const attachEvidenceToSubmissionBtn = document.getElementById('attach-evidence-to-submission-btn');
const evidenceUploadStatus    = document.getElementById('evidence-upload-status');
const evidenceUploadHistory   = document.getElementById('evidence-upload-history');
const evidenceQueue           = document.getElementById('evidence-queue');
const evidenceBadge           = document.getElementById('evidence-badge');
const evidenceFilterPending   = document.getElementById('evidence-filter-pending');
const evidenceFilterHistory   = document.getElementById('evidence-filter-history');
const evidenceViewer          = document.getElementById('evidence-viewer');
const evidenceViewerClose     = document.getElementById('evidence-viewer-close');
const evidenceViewerBody      = document.getElementById('evidence-viewer-body');
const evidenceViewerCaption   = document.getElementById('evidence-viewer-caption');
const profileEvidence         = document.getElementById('profile-evidence');
// Correction-flow evidence attachment controls
const correctionEvidenceAttach = document.getElementById('correction-evidence-attach');
const correctionEvidenceAttached = document.getElementById('correction-evidence-attached');
const correctionEvidenceAttachedName = document.getElementById('correction-evidence-attached-name');
const correctionEvidenceRemove = document.getElementById('correction-evidence-remove');
const editProfileModal        = document.getElementById('edit-profile-modal');
const closeEditProfileBtn     = document.getElementById('close-edit-profile-btn');
const editProfileNickname     = document.getElementById('edit-profile-nickname');
const editProfileNote         = document.getElementById('edit-profile-note');
const saveEditProfileBtn      = document.getElementById('save-edit-profile-btn');
const editProfileStatus       = document.getElementById('edit-profile-status');
const governanceBanner        = document.getElementById('governance-banner');
const governanceCurrentMode   = document.getElementById('governance-current-mode');
const governancePolicyVersion = document.getElementById('governance-policy-version');
const governanceModeSelect    = document.getElementById('governance-mode-select');
const saveGovernanceModeBtn   = document.getElementById('save-governance-mode-btn');
const governanceStatus        = document.getElementById('governance-status');
const governanceCapabilityMatrix = document.getElementById('governance-capability-matrix');
const governanceAuditList     = document.getElementById('governance-audit-list');

let currentUser = null;
let isAdmin = false;
let currentUserRole = 'viewer';
let appGovernance = null;
let currentProfileName = '';     // tracks the active person profile for feedback pre-fill
let currentProfilePersonId = ''; // PersonID of the currently open profile
let currentProfileEditVersion = null;
let currentSubmissionType = 'correction';  // 'correction' or 'photo'
let currentSubmissionPersonId = '';
let profileOpenedFrom = 'home';  // 'home' | 'search' | 'gallery' | 'surnames' | 'tree' | 'sources' | 'places' | 'research' | 'analytics-directory' | 'profile'
let previousProfileResult = null;  // member result saved when navigating to a profile via a family chip
let previousProfileName = '';      // display name of the previous profile for back-button label
let previousProfileOpenedFrom = 'home'; // profileOpenedFrom value before a chip-navigation
let analyticsDirectoryState = null; // { title, people } — retained so back-from-profile can restore the directory
let currentAnalyticsStats = null;
let surnameBrowseState = { view: 'index', surname: null };
let surnameDirectoryState = { sortBy: 'alpha', filter: '' };
let mlSelectedPersonId = null;
let mlSelectedPersonName = '';
let mlSelectedPhotoPath = '';
let manualLinksLoaded = false;
let linkedPersonId = null;   // PersonID of the family member linked to the current user
let personProfileOverridesLoaded = false;
let personProfileOverridesPromise = null;
let personEditHistoryCache = [];
let citedSourcesCache = [];
let placesCache = [];
let placesFiltersInitialized = false;
let placesSelectedId = '';
let photoUploadsQueueMode = 'pending';
let selectedResearchPersonId = '';
let selectedResearchFactKey = '';
let researchFilterText = '';

function resetRuntimeDataCaches() {
    citedSourcesCache = [];
    placesCache = [];
    placesFiltersInitialized = false;
    placesSelectedId = '';
}

// Lightbox state
let lightboxPhotos = [];
let lightboxIndex = 0;
let lightboxOptions = { enableNotes: true, allowPersonLinks: true };

// Show local login option only when running on localhost and password is configured
const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isLocalDev && LOCAL_DEV_PASSWORD) {
    localLoginSection.classList.remove('hidden');
}

// Helper function to validate URL is from allowed paths
function isValidFamilyTreeUrl(url) {
    if (!url) return false;
    if (url.startsWith('FamilyTreeMedia/')) return true;
    // Firebase Storage download URLs for user-uploaded photos in this project's bucket
    const configuredBucket = firebaseConfig.storageBucket;
    if (!configuredBucket) return false;
    if (url.startsWith('https://firebasestorage.googleapis.com/') && url.includes(configuredBucket)) return true;
    return false;
}

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const GOVERNANCE_POLICY_VERSION = 'permissionGovernanceV1';
const APP_MODE = {
    NORMAL: 'normal',
    HISTORICAL_READ_ONLY: 'historical_read_only'
};

const ROLE_LABELS = {
    viewer: 'Viewer',
    contributor: 'Contributor',
    moderator: 'Moderator',
    admin: 'Admin'
};

const ROLE_CAPABILITIES = {
    viewer: ['viewHistoricalCore', 'viewMessageBoard'],
    contributor: [
        'viewHistoricalCore',
        'viewMessageBoard',
        'submitFeedback',
        'submitCorrections',
        'uploadPhotos',
        'uploadEvidence',
        'editProfilePresentation',
        'postPhotoNotes',
        'tagPhotos',
        'postMessages',
        'flagContent'
    ],
    moderator: [
        'viewHistoricalCore',
        'viewMessageBoard',
        'submitFeedback',
        'submitCorrections',
        'uploadPhotos',
        'uploadEvidence',
        'editProfilePresentation',
        'postPhotoNotes',
        'tagPhotos',
        'postMessages',
        'flagContent',
        'moderateContent'
    ],
    admin: [
        'viewHistoricalCore',
        'viewMessageBoard',
        'submitFeedback',
        'submitCorrections',
        'uploadPhotos',
        'uploadEvidence',
        'editProfilePresentation',
        'postPhotoNotes',
        'tagPhotos',
        'postMessages',
        'flagContent',
        'moderateContent',
        'manageUsers',
        'manageGovernance',
        'manageMedia'
    ]
};

const READ_ONLY_BLOCKED_CAPABILITIES = new Set([
    'submitFeedback',
    'submitCorrections',
    'uploadPhotos',
    'uploadEvidence',
    'editProfilePresentation',
    'postPhotoNotes',
    'tagPhotos',
    'postMessages',
    'flagContent'
]);

const HISTORICAL_READ_ONLY_MESSAGE =
    'The archive is in historical read-only mode. Browsing remains available, but contributions are paused for now.';

const CAPABILITY_LABELS = {
    viewHistoricalCore: 'Browse historical profiles, tree, places, sources, and photos',
    viewMessageBoard: 'Read the family message board',
    submitFeedback: 'Submit feedback',
    submitCorrections: 'Suggest factual corrections',
    uploadPhotos: 'Upload profile photos',
    uploadEvidence: 'Upload source evidence',
    editProfilePresentation: 'Edit nickname and profile notes',
    postPhotoNotes: 'Add photo notes',
    tagPhotos: 'Tag people in photos',
    postMessages: 'Post and reply on the message board',
    flagContent: 'Flag a message board post or reply for review',
    moderateContent: 'Review feedback, submissions, photos, and evidence',
    manageUsers: 'Invite, link, role-change, or remove users',
    manageGovernance: 'Change archive mode and governance policy',
    manageMedia: 'Manage manual media links and admin photo notes'
};

function normalizeRole(role) {
    if (role === 'admin' || role === 'moderator' || role === 'contributor' || role === 'viewer') return role;
    if (role === 'user' || !role) return 'contributor';
    return 'viewer';
}

function getRoleDisplayLabel(role) {
    const normalized = normalizeRole(role);
    return ROLE_LABELS[normalized];
}

function defaultGovernance() {
    return {
        mode: APP_MODE.NORMAL,
        policyVersion: GOVERNANCE_POLICY_VERSION,
        updatedAt: null,
        updatedBy: null
    };
}

function getCapabilitySet(role = currentUserRole) {
    return new Set(ROLE_CAPABILITIES[normalizeRole(role)] || ROLE_CAPABILITIES.viewer);
}

function isHistoricalReadOnly() {
    return (appGovernance?.mode || APP_MODE.NORMAL) === APP_MODE.HISTORICAL_READ_ONLY;
}

function hasCapability(capability) {
    const role = isAdmin ? 'admin' : normalizeRole(currentUserRole);
    const hasRoleCapability = getCapabilitySet(role).has(capability);
    if (!hasRoleCapability) return false;
    if (isHistoricalReadOnly() && READ_ONLY_BLOCKED_CAPABILITIES.has(capability)) return false;
    return true;
}

function getCapabilityBlockedMessage(capability) {
    if (isHistoricalReadOnly() && READ_ONLY_BLOCKED_CAPABILITIES.has(capability)) {
        return HISTORICAL_READ_ONLY_MESSAGE;
    }
    return 'Your current role does not allow this action.';
}

function requireCapability(capability, statusElement = null) {
    if (hasCapability(capability)) return true;
    const message = getCapabilityBlockedMessage(capability);
    if (statusElement) {
        showMessage(statusElement, message, 'error');
    } else {
        window.alert(message);
    }
    return false;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toDateValue(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value?.toDate === 'function') {
        const date = value.toDate();
        return Number.isNaN(date?.getTime?.()) ? null : date;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatShortDate(value) {
    const date = toDateValue(value);
    if (!date) return '';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatStatusLabel(status) {
    const normalized = String(status || 'pending').replace(/_/g, ' ').trim();
    if (!normalized) return 'Pending';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getStatusClass(status) {
    const normalized = String(status || 'pending').toLowerCase();
    if (normalized === 'approved' || normalized === 'resolved') return 'resolved';
    if (normalized === 'rejected' || normalized === 'dismissed') return 'dismissed';
    return 'pending';
}

function compareByDateDesc(a, b, selector) {
    const aTime = toDateValue(selector(a))?.getTime?.() || 0;
    const bTime = toDateValue(selector(b))?.getTime?.() || 0;
    return bTime - aTime;
}

function setQueueLoading(container, message) {
    if (container) container.innerHTML = `<p class="queue-loading">${message}</p>`;
}

function setQueueEmpty(container, message) {
    if (container) container.innerHTML = `<p class="queue-empty">${message}</p>`;
}

function isMissingIndexError(error) {
    const message = String(error?.message || '').toLowerCase();
    return error?.code === 'failed-precondition' || message.includes('index');
}

const PROTECTED_DATA_MAX_BYTES = 2 * 1024 * 1024;
const jsonDecoder = new TextDecoder();

const RECENT_UPDATES = [
    {
        version: '2.7.2',
        title: 'Personal Data Confidence',
        description: 'Family Analytics now includes a documentation-based score for your linked family line, with cautious country ratios and a plain-language breakdown of how the numbers are calculated.'
    },
    {
        version: '2.7.1',
        title: 'Family Tree Orientation',
        description: 'Bloodline, Household, and Explore views now make the tree easier to follow, with clearer direct-line emphasis, stronger household grouping, and better branch context.'
    },
    {
        version: '2.7.1',
        title: 'Me-Centered Relationship Trace',
        description: 'Selecting someone in the tree now highlights their visible connection back to your linked family profile, so it is easier to understand where they fit.'
    },
    {
        version: '2.7.1',
        title: 'Readable Selected Tiles',
        description: 'Selected tree tiles now open at a readable size, even when you are zoomed far out, and recenter smoothly without taking over the whole screen.'
    },
    {
        version: '2.7.0',
        title: 'Relationship Labels',
        description: 'Profiles, search results, and tree nodes now show your relationship to each person — Parent, 1st Cousin, Great-Grandparent, and more. Tap the (?) to see how the relationship is calculated.'
    },
    {
        version: '2.6.1',
        title: 'Research Library',
        description: 'A new Research Library section lets you explore family history by record type — Census, Immigration, Military Service, and more — with plain-language explanations of what each record type reveals and guided pathways to help you continue researching.'
    },
    {
        version: '2.6.0',
        title: 'Richer Cited Sources',
        description: 'Cited Sources now include record-type labels, expandable descriptions, "Why this matters" summaries, and connections to related family members and places. You can filter sources by type, place, year range, or whether they link to an external record.'
    },
    {
        version: '2.5.0',
        title: 'Edit Profile Notes',
        description: 'You can now add or update a nickname and personal note on any family member\'s profile. Changes take effect immediately and are visible to all family members.'
    },
    {
        version: '2.4.1',
        title: 'Photo Notes in the Photo Gallery',
        description: 'Selected photos now show contextual notes with a visual description, historical observations, and research suggestions to help you understand and explore what you\'re looking at.'
    }
];

async function loadProtectedJson(user, path, label) {
    const attempts = 4;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            // Prime the auth token before hitting Storage; immediately after popup
            // sign-in, rule-gated reads can briefly reject until the token settles.
            await user.getIdToken();
            const bytes = await getBytes(storageRef(storage, path), PROTECTED_DATA_MAX_BYTES);
            return JSON.parse(jsonDecoder.decode(bytes));
        } catch (error) {
            lastError = error;
            if (attempt === attempts) break;
            await wait(500 * attempt);
        }
    }

    const reason = lastError?.code || lastError?.message || String(lastError);
    throw new Error(`${label} Storage read failed: ${reason}`);
}

function buildProtectedDataSources(user) {
    return {
        familyDirectory: () => loadProtectedJson(user, 'data/directory.json', 'Family directory'),
        citedSources: () => loadProtectedJson(user, 'data/sources.json', 'Cited sources'),
        sourceUsage: () => loadProtectedJson(user, 'data/source-usage.json', 'Source usage'),
        placePages: () => loadProtectedJson(user, 'data/places.json', 'Place pages'),
        personDetails: () => loadProtectedJson(user, 'data/person-details.json', 'Person details'),
        personPhotos: () => loadProtectedJson(user, 'data/person-photos.json', 'Person photo data'),
        personFamily: () => loadProtectedJson(user, 'data/person-family.json', 'Person family data'),
        photoCatalog: () => loadProtectedJson(user, 'data/photo-catalog.json', 'Photo catalog'),
    };
}

// ─── Authentication ───────────────────────────────────────────────────────────

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const authState = await checkUserAuthorization(user);
        if (authState.authorized) {
            currentUser = user;
            isAdmin = authState.isAdmin;
            currentUserRole = authState.role || (authState.isAdmin ? 'admin' : 'contributor');
            await loadAppGovernance();
            personProfileOverridesLoaded = false;
            personProfileOverridesPromise = null;
            personEditHistoryCache = [];
            currentProfileEditVersion = null;
            resetRuntimeDataCaches();
            initDataUrls(buildProtectedDataSources(user));
            showMainApp();
        } else {
            showMessage(authMessage, 'You are not authorized to access this site. Please contact the administrator for an invitation.', 'error');
            await signOut(auth);
        }
    } else {
        unsubscribeFromBoardPosts();
        resetBoardComposeState();
        currentUser = null;
        isAdmin = false;
        currentUserRole = 'viewer';
        appGovernance = null;
        linkedPersonId = null;
        personProfileOverridesLoaded = false;
        personProfileOverridesPromise = null;
        personEditHistoryCache = [];
        currentProfileEditVersion = null;
        resetRuntimeDataCaches();
        showLoginScreen();
    }
});

async function checkUserAuthorization(user) {
    linkedPersonId = null;
    try {
        const userDoc = await getDoc(doc(db, 'authorized_users', user.email));
        if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.personId) linkedPersonId = String(data.personId);
            const shouldBeAdmin = user.email === ADMIN_EMAIL;
            const hasAdminRole = data.role === 'admin';

            if (shouldBeAdmin && !hasAdminRole) {
                await setDoc(doc(db, 'authorized_users', user.email), {
                    email: user.email,
                    name: user.displayName || data.name || 'Admin',
                    role: 'admin',
                    authorizedAt: data.authorizedAt || new Date().toISOString()
                }, { merge: true });
            }

            return {
                authorized: true,
                isAdmin: shouldBeAdmin || hasAdminRole,
                role: shouldBeAdmin ? 'admin' : normalizeRole(data.role)
            };
        }
        if (user.email === ADMIN_EMAIL) {
            await setDoc(doc(db, 'authorized_users', user.email), {
                email: user.email,
                name: user.displayName || 'Admin',
                role: 'admin',
                authorizedAt: new Date().toISOString()
            });
            return {
                authorized: true,
                isAdmin: true,
                role: 'admin'
            };
        }
        return {
            authorized: false,
            isAdmin: false,
            role: 'viewer'
        };
    } catch (error) {
        console.error('Error checking authorization:', error);
        return {
            authorized: false,
            isAdmin: false,
            role: 'viewer'
        };
    }
}

async function loadAppGovernance() {
    appGovernance = defaultGovernance();
    if (!auth.currentUser && !isLocalDev) return appGovernance;
    try {
        const snap = await getDoc(doc(db, 'app_config', 'governance'));
        if (snap.exists()) {
            const data = snap.data() || {};
            appGovernance = {
                ...defaultGovernance(),
                ...data,
                mode: data.mode === APP_MODE.HISTORICAL_READ_ONLY ? APP_MODE.HISTORICAL_READ_ONLY : APP_MODE.NORMAL,
                policyVersion: data.policyVersion || GOVERNANCE_POLICY_VERSION
            };
        }
    } catch (error) {
        console.warn('Could not load governance policy; defaulting to normal mode.', error);
        appGovernance = defaultGovernance();
    }
    updateGovernanceUi();
    return appGovernance;
}

function updateGovernanceUi() {
    const mode = appGovernance?.mode || APP_MODE.NORMAL;
    const readOnly = mode === APP_MODE.HISTORICAL_READ_ONLY;
    if (governanceBanner) {
        governanceBanner.textContent = readOnly
            ? HISTORICAL_READ_ONLY_MESSAGE
            : '';
        governanceBanner.classList.toggle('hidden', !readOnly);
    }
    if (governanceCurrentMode) {
        governanceCurrentMode.textContent = readOnly ? 'Historical read-only mode' : 'Normal mode';
    }
    if (governancePolicyVersion) {
        const updated = appGovernance?.updatedAt ? ` · updated ${formatShortDate(appGovernance.updatedAt) || appGovernance.updatedAt}` : '';
        governancePolicyVersion.textContent = `${appGovernance?.policyVersion || GOVERNANCE_POLICY_VERSION}${updated}`;
    }
    if (governanceModeSelect) {
        governanceModeSelect.value = mode;
        governanceModeSelect.disabled = !hasCapability('manageGovernance');
    }
    if (saveGovernanceModeBtn) {
        saveGovernanceModeBtn.disabled = !hasCapability('manageGovernance');
    }
    renderGovernanceCapabilityMatrix();
    updateContributionControls();
    renderBoardGovernanceBanner();
    refreshBoardComposeVisibility();
}

function updateContributionControls() {
    const contributionControls = [
        [feedbackBtn, 'submitFeedback'],
        [suggestChangeBtn, 'submitCorrections'],
        [addPhotoBtn, 'uploadPhotos'],
        [addEvidenceBtn, 'uploadEvidence'],
        [editProfileBtn, 'editProfilePresentation'],
        [correctionEvidenceAttach, 'uploadEvidence']
    ];
    contributionControls.forEach(([element, capability]) => {
        if (!element) return;
        const allowed = hasCapability(capability);
        element.disabled = !allowed;
        element.title = allowed ? '' : getCapabilityBlockedMessage(capability);
    });
}

function renderGovernanceCapabilityMatrix() {
    if (!governanceCapabilityMatrix) return;
    governanceCapabilityMatrix.innerHTML = '';
    ['viewer', 'contributor', 'moderator', 'admin'].forEach((role) => {
        const card = document.createElement('div');
        card.className = 'governance-role-card';
        const title = document.createElement('div');
        title.className = 'governance-role-name';
        title.textContent = ROLE_LABELS[role];
        const caps = document.createElement('div');
        caps.className = 'governance-role-caps';
        caps.textContent = ROLE_CAPABILITIES[role].map((cap) => CAPABILITY_LABELS[cap] || cap).join(', ');
        card.appendChild(title);
        card.appendChild(caps);
        if (isHistoricalReadOnly() && role !== 'viewer') {
            const note = document.createElement('div');
            note.className = 'governance-disabled-note';
            note.textContent = 'Contribution capabilities are paused while historical read-only mode is active.';
            card.appendChild(note);
        }
        governanceCapabilityMatrix.appendChild(card);
    });
}

async function loadGovernanceAudit() {
    if (!governanceAuditList) return;
    governanceAuditList.innerHTML = '<p class="queue-loading">Loading governance audit...</p>';
    try {
        const snap = await getDocs(query(collection(db, 'governance_audit'), orderBy('changedAt', 'desc')));
        governanceAuditList.innerHTML = '';
        if (snap.empty) {
            governanceAuditList.innerHTML = '<p class="queue-empty">No governance changes logged yet.</p>';
            return;
        }
        snap.docs.slice(0, 10).forEach((docSnap) => {
            const entry = docSnap.data() || {};
            const item = document.createElement('div');
            item.className = 'feedback-item';
            const title = document.createElement('div');
            title.className = 'feedback-who';
            const actionLabel = entry.action === 'mode_change'
                ? 'Archive mode changed'
                : entry.action === 'role_change'
                    ? 'User role changed'
                    : (entry.action || 'Governance change');
            title.textContent = actionLabel;
            const meta = document.createElement('div');
            meta.className = 'feedback-when';
            meta.textContent = `${entry.actorEmail || 'Unknown admin'} · ${formatShortDate(entry.changedAt) || 'recently'}`;
            const body = document.createElement('div');
            body.className = 'feedback-item-message';
            if (entry.action === 'role_change') {
                const beforeRole = getRoleDisplayLabel(entry.before?.role);
                const afterRole = getRoleDisplayLabel(entry.after?.role);
                const target = entry.targetEmail || 'Unknown user';
                body.textContent = `${target}: ${beforeRole} -> ${afterRole}`;
            } else {
                const beforeMode = entry.before?.mode === APP_MODE.HISTORICAL_READ_ONLY ? 'historical_read_only' : 'normal';
                const afterMode = entry.after?.mode === APP_MODE.HISTORICAL_READ_ONLY ? 'historical_read_only' : 'normal';
                body.textContent = `${beforeMode} -> ${afterMode}`;
            }
            item.append(title, meta, body);
            governanceAuditList.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading governance audit:', error);
        governanceAuditList.innerHTML = '<p class="queue-error">Could not load governance audit.</p>';
    }
}

googleSignInBtn.addEventListener('click', async () => {
    if (firebaseConfigErrorMessage) {
        showMessage(authMessage, firebaseConfigErrorMessage, 'error');
        return;
    }

    try {
        authMessage.textContent = '';
        authMessage.className = 'auth-message';
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Sign in error:', error);
        showMessage(authMessage, 'Failed to sign in. Please try again.', 'error');
    }
});

localSignInBtn.addEventListener('click', () => {
    const enteredPassword = localPasswordInput.value;
    if (!enteredPassword) {
        showMessage(authMessage, 'Please enter the local dev password.', 'error');
        return;
    }
    if (enteredPassword !== LOCAL_DEV_PASSWORD) {
        showMessage(authMessage, 'Incorrect local dev password.', 'error');
        localPasswordInput.value = '';
        return;
    }
    currentUser = { email: ADMIN_EMAIL, displayName: 'Local Admin' };
    isAdmin = true;
    currentUserRole = 'admin';
    appGovernance = defaultGovernance();
    personProfileOverridesLoaded = false;
    personProfileOverridesPromise = null;
    personEditHistoryCache = [];
    currentProfileEditVersion = null;
    showMainApp();
});

localPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') localSignInBtn.click();
});

signoutBtn.addEventListener('click', async () => {
    try {
        currentUser = null;
        isAdmin = false;
        currentUserRole = 'viewer';
        appGovernance = null;
        if (auth.currentUser) {
            await signOut(auth);
        } else {
            showLoginScreen();
        }
    } catch (error) {
        console.error('Sign out error:', error);
    }
});

// ─── Screen transitions ───────────────────────────────────────────────────────

function showLoginScreen() {
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
    updatesBtn.classList.add('hidden');
    updatesBadge.classList.add('hidden');
}

async function showMainApp() {
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    userInfo.textContent = `Welcome, ${currentUser.displayName || currentUser.email}`;
    adminBtn.classList.toggle('hidden', !isAdmin);
    updatesBtn.classList.toggle('hidden', !auth.currentUser);
    updateEditProfileButtonVisibility();
    updateGovernanceUi();
    document.getElementById('app-version').textContent = `v${__APP_VERSION__}`;
    if (auth.currentUser) {
        loadManualMediaLinks();
        loadUserNotificationsBadge();
    }
    if (isAdmin) {
        loadProfileEditsBadge();
    }
    Promise.all([initializeFamilyData(), loadPhotos(), loadPersonDetails(), loadPersonProfileOverrides()]).then(([members, photos]) => {
        const loadErrors = getDataLoadErrors();
        const activeErrors = Object.values(loadErrors).filter(Boolean);
        if (headerStats) {
            if (members.length) {
                const photoStatus = loadErrors.photoCatalog ? 'photo data unavailable' : `${photos.length} photos`;
                headerStats.textContent = `${members.length} members · ${photoStatus}`;
            } else if (activeErrors.length) {
                headerStats.textContent = 'Family data unavailable';
            } else {
                headerStats.textContent = '';
            }
            headerStats.classList.toggle('error', activeErrors.length > 0);
            headerStats.title = activeErrors.join('\n');
        }
        buildSearchIndex();
    });
}

function renderUserHistoryCards(container, entries, emptyMessage) {
    if (!container) return;
    container.innerHTML = '';
    if (!entries.length) {
        setQueueEmpty(container, emptyMessage);
        return;
    }

    entries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'user-history-card';

        const header = document.createElement('div');
        header.className = 'user-history-card-header';

        const title = document.createElement('div');
        title.className = 'user-history-card-title';
        title.textContent = entry.title;

        const badge = document.createElement('span');
        badge.className = `feedback-status-badge feedback-status-badge--${entry.statusClass || 'pending'}`;
        badge.textContent = entry.statusLabel;

        header.appendChild(title);
        header.appendChild(badge);
        item.appendChild(header);

        if (entry.meta) {
            const meta = document.createElement('div');
            meta.className = 'submission-source';
            meta.textContent = entry.meta;
            item.appendChild(meta);
        }

        if (entry.message) {
            const message = document.createElement('div');
            message.className = 'feedback-item-message';
            message.textContent = entry.message;
            item.appendChild(message);
        }

        if (entry.review) {
            const review = document.createElement('div');
            review.className = 'submission-review-info';
            review.textContent = entry.review;
            item.appendChild(review);
        }

        container.appendChild(item);
    });
}

async function loadUserNotificationsBadge() {
    if (!auth.currentUser || !currentUser?.email) {
        updatesBadge.classList.add('hidden');
        return;
    }

    try {
        const snap = await getDocs(query(collection(db, 'user_notifications'), where('recipientEmail', '==', currentUser.email)));
        const unread = snap.docs.filter((docSnap) => (docSnap.data()?.status || 'unread') === 'unread').length;
        if (unread > 0) {
            updatesBadge.textContent = String(unread);
            updatesBadge.classList.remove('hidden');
        } else {
            updatesBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading updates badge:', error);
        updatesBadge.classList.add('hidden');
    }
}

async function markUserNotificationsRead(notifications = []) {
    if (!auth.currentUser || !currentUser?.email) return;
    const unreadDocs = notifications.filter((entry) => (entry.status || 'unread') === 'unread');
    if (!unreadDocs.length) {
        await loadUserNotificationsBadge();
        return;
    }

    try {
        await Promise.all(
            unreadDocs.map((entry) => updateDoc(doc(db, 'user_notifications', entry.id), {
                status: 'read',
                readBy: currentUser.email,
                readAt: new Date().toISOString()
            }))
        );
        await loadUserNotificationsBadge();
    } catch (error) {
        console.error('Error marking updates read:', error);
    }
}

async function loadUserNotificationsList() {
    if (!auth.currentUser || !currentUser?.email) {
        renderUserHistoryCards(updatesList, getRecentUpdateEntries(), 'No updates yet.');
        return;
    }

    setQueueLoading(updatesList, 'Loading updates...');
    try {
        const snap = await getDocs(query(collection(db, 'user_notifications'), where('recipientEmail', '==', currentUser.email)));
        const notifications = snap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.createdAt));

        const visibleNotifications = notifications.slice(0, 12);
        const entries = visibleNotifications.map((entry) => ({
            title: entry.title || 'Update',
            statusLabel: formatStatusLabel(entry.outcome || 'update'),
            statusClass: entry.outcomeClass || getStatusClass(entry.outcome),
            meta: formatShortDate(entry.createdAt),
            message: entry.message || '',
            review: entry.personName ? `Related to ${entry.personName}` : ''
        })).concat(getRecentUpdateEntries());

        renderUserHistoryCards(updatesList, entries, 'No updates yet.');
        await markUserNotificationsRead(visibleNotifications);
    } catch (error) {
        console.error('Error loading updates list:', error);
        updatesList.innerHTML = '<p class="queue-error">Could not load your updates right now.</p>';
    }
}

function getRecentUpdateEntries() {
    return RECENT_UPDATES.map((update) => ({
        title: update.title,
        statusLabel: update.version,
        statusClass: 'resolved',
        meta: 'Recent update',
        message: update.description,
        review: ''
    }));
}

async function loadMyPhotoUploadHistory() {
    if (!auth.currentUser || !currentUser?.email) {
        setQueueEmpty(uploadPhotoHistory, 'Sign in to review your uploads.');
        return;
    }

    setQueueLoading(uploadPhotoHistory, 'Loading your uploads...');
    try {
        const snap = await getDocs(query(collection(db, 'photo_uploads'), where('uploaderEmail', '==', currentUser.email)));
        const uploads = snap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.uploadedAt));

        const entries = uploads.slice(0, 6).map((entry) => ({
            title: entry.personName || 'Photo upload',
            statusLabel: formatStatusLabel(entry.status),
            statusClass: getStatusClass(entry.status),
            meta: `Submitted ${formatShortDate(entry.uploadedAt) || 'recently'}`,
            message: entry.caption ? `"${entry.caption}"` : '',
            review: entry.reviewedBy
                ? `Reviewed by ${entry.reviewedBy} on ${formatShortDate(entry.reviewedAt) || 'a recent date'}`
                : 'Awaiting admin review'
        }));

        renderUserHistoryCards(uploadPhotoHistory, entries, 'You have not uploaded any photos yet.');
    } catch (error) {
        console.error('Error loading upload history:', error);
        uploadPhotoHistory.innerHTML = '<p class="queue-error">Could not load your upload history.</p>';
    }
}

async function loadMyFeedbackHistory() {
    if (!auth.currentUser || !currentUser?.email) {
        setQueueEmpty(feedbackMyHistory, 'Sign in to review your feedback.');
        return;
    }

    setQueueLoading(feedbackMyHistory, 'Loading your feedback...');
    try {
        const snap = await getDocs(query(collection(db, 'feedback'), where('submittedBy', '==', currentUser.email)));
        const feedbackEntries = snap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.submittedAt));

        const entries = feedbackEntries.slice(0, 6).map((entry) => ({
            title: entry.person ? `Re: ${entry.person}` : formatStatusLabel(entry.type || 'feedback'),
            statusLabel: formatStatusLabel(entry.status),
            statusClass: getStatusClass(entry.status),
            meta: `Submitted ${formatShortDate(entry.submittedAt) || 'recently'}`,
            message: entry.message || '',
            review: entry.reviewedBy
                ? `Reviewed by ${entry.reviewedBy} on ${formatShortDate(entry.reviewedAt) || 'a recent date'}`
                : 'Awaiting admin review'
        }));

        renderUserHistoryCards(feedbackMyHistory, entries, 'You have not submitted feedback yet.');
    } catch (error) {
        console.error('Error loading feedback history:', error);
        feedbackMyHistory.innerHTML = '<p class="queue-error">Could not load your feedback history.</p>';
    }
}

async function loadMySubmissionHistory() {
    if (!auth.currentUser || !currentUser?.email) {
        setQueueEmpty(submissionMyHistory, 'Sign in to review your suggestions.');
        return;
    }

    setQueueLoading(submissionMyHistory, 'Loading your suggestions...');
    try {
        const [submissionsSnap, evidenceSnap] = await Promise.all([
            getDocs(query(collection(db, 'submissions'), where('submittedBy', '==', currentUser.email))),
            getDocs(query(collection(db, 'evidence_uploads'), where('contributorEmail', '==', currentUser.email)))
        ]);

        const submissions = submissionsSnap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .map((entry) => ({
                title: entry.person || formatStatusLabel(entry.submissionType || 'submission'),
                statusLabel: formatStatusLabel(entry.status),
                statusClass: getStatusClass(entry.status),
                meta: `Suggestion · Submitted ${formatShortDate(entry.submittedAt) || 'recently'}`,
                sortDate: entry.submittedAt,
                message: entry.submissionType === 'photo'
                    ? (entry.description || '')
                    : `${entry.correctionField || 'Correction'}: ${entry.proposedValue || ''}`.trim(),
                review: entry.reviewedBy
                    ? `Reviewed by ${entry.reviewedBy} on ${formatShortDate(entry.reviewedAt) || 'a recent date'}`
                    : 'Awaiting admin review'
            }));

        const evidenceEntries = evidenceSnap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .map((entry) => ({
                title: `${entry.personName || 'Evidence'} — ${factTargetLabel(entry.factTarget)}`,
                statusLabel: formatStatusLabel(entry.status),
                statusClass: getStatusClass(entry.status),
                meta: `Evidence · Submitted ${formatShortDate(entry.submittedAt) || 'recently'}`,
                sortDate: entry.submittedAt,
                message: entry.citationText || entry.fileName || '',
                review: entry.reviewedBy
                    ? `Reviewed by ${entry.reviewedBy} on ${formatShortDate(entry.reviewedAt) || 'a recent date'}`
                    : 'Awaiting admin review'
            }));

        const entries = [...submissions, ...evidenceEntries]
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.sortDate))
            .slice(0, 8);

        renderUserHistoryCards(submissionMyHistory, entries, 'You have not submitted any suggestions or evidence yet.');
    } catch (error) {
        console.error('Error loading submission history:', error);
        submissionMyHistory.innerHTML = '<p class="queue-error">Could not load your suggestion history.</p>';
    }
}

function showContentArea() {
    contentDisplay.classList.remove('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
}

function showOnlyContentPanel(panelToShow = null) {
    [surnameDirectory, photoGallery].forEach((panel) => {
        if (!panel) return;
        panel.classList.toggle('hidden', panel !== panelToShow);
    });
}

function showProfileArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.remove('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
}

function showAnalyticsArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.remove('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
}

function showSourcesArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.remove('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
}

function showPlacesArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.remove('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
}

function showResearchLibraryArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.remove('hidden');
    boardView.classList.add('hidden');
}

function showBoardArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.add('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.remove('hidden');
}

function showTreeArea() {
    contentDisplay.classList.add('hidden');
    personProfile.classList.add('hidden');
    analyticsView.classList.add('hidden');
    sourcesView.classList.add('hidden');
    placesView.classList.add('hidden');
    treeView.classList.remove('hidden');
    researchLibraryView.classList.add('hidden');
    boardView.classList.add('hidden');
    if (!cy) return;
    requestAnimationFrame(() => {
        cy.resize();
        if (treeViewport) {
            const saved = treeViewport;
            treeViewport = null;
            cy.viewport(saved);
        } else {
            cy.fit(undefined, 32);
        }
    });
}

function scrollToExplorePanel(panel) {
    if (!panel) return;
    requestAnimationFrame(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

function getPrimarySurname(member) {
    const explicit = String(member?.surname || '').trim();
    if (explicit) return explicit;
    const parts = String(member?.name || '').trim().split(/\s+/).filter(Boolean);
    return parts.length ? parts[parts.length - 1] : '';
}

function buildSurnameGroups(members) {
    const groups = new Map();

    for (const member of members) {
        const surname = getPrimarySurname(member) || 'Unknown';
        if (!groups.has(surname)) groups.set(surname, []);
        groups.get(surname).push(member);
    }

    return Array.from(groups.entries())
        .map(([surname, people]) => ({
            surname,
            people: [...people].sort((a, b) => a.name.localeCompare(b.name)),
            count: people.length
        }))
        .sort((a, b) => a.surname.localeCompare(b.surname));
}

function getVisibleSurnameGroups(groups) {
    const filter = surnameDirectoryState.filter.trim().toLowerCase();
    const filtered = filter
        ? groups.filter(group => group.surname.toLowerCase().startsWith(filter))
        : groups;

    return [...filtered].sort((a, b) => {
        if (surnameDirectoryState.sortBy === 'count') {
            const countDiff = b.count - a.count;
            if (countDiff !== 0) return countDiff;
        }
        return a.surname.localeCompare(b.surname);
    });
}

function renderSurnameDirectoryIndex(groups, { focusFilter = false } = {}) {
    surnameBrowseState = { view: 'index', surname: null };
    surnameDirectory.innerHTML = '';
    const visibleGroups = getVisibleSurnameGroups(groups);

    const header = document.createElement('div');
    header.className = 'analytics-directory-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'analytics-directory-title';
    titleEl.textContent = 'Browse by Surname';

    const countEl = document.createElement('span');
    countEl.className = 'analytics-directory-count';
    countEl.textContent = surnameDirectoryState.filter
        ? `${visibleGroups.length} of ${groups.length} surnames`
        : `${groups.length} surnames`;

    header.appendChild(titleEl);
    header.appendChild(countEl);
    surnameDirectory.appendChild(header);

    const intro = document.createElement('p');
    intro.className = 'surname-directory-intro';
    intro.textContent = 'Explore the family archive by surname, then open any person profile without leaving the app.';
    surnameDirectory.appendChild(intro);

    const controls = document.createElement('div');
    controls.className = 'surname-directory-controls';

    const filterLabel = document.createElement('label');
    filterLabel.className = 'surname-directory-filter';

    const filterText = document.createElement('span');
    filterText.className = 'surname-directory-control-label';
    filterText.textContent = 'Starts with';

    const filterInput = document.createElement('input');
    filterInput.type = 'search';
    filterInput.className = 'surname-directory-filter-input';
    filterInput.placeholder = 'Type letters';
    filterInput.autocomplete = 'off';
    filterInput.value = surnameDirectoryState.filter;
    filterInput.addEventListener('input', () => {
        surnameDirectoryState.filter = filterInput.value.trim();
        renderSurnameDirectoryIndex(groups, { focusFilter: true });
    });

    filterLabel.appendChild(filterText);
    filterLabel.appendChild(filterInput);

    const sortLabel = document.createElement('label');
    sortLabel.className = 'surname-directory-sort';

    const sortText = document.createElement('span');
    sortText.className = 'surname-directory-control-label';
    sortText.textContent = 'Sort by';

    const sortSelect = document.createElement('select');
    sortSelect.className = 'surname-directory-sort-select';

    const alphaOption = document.createElement('option');
    alphaOption.value = 'alpha';
    alphaOption.textContent = 'Alphabetical';

    const countOption = document.createElement('option');
    countOption.value = 'count';
    countOption.textContent = 'Person count';

    sortSelect.appendChild(alphaOption);
    sortSelect.appendChild(countOption);
    sortSelect.value = surnameDirectoryState.sortBy;
    sortSelect.addEventListener('change', () => {
        surnameDirectoryState.sortBy = sortSelect.value;
        renderSurnameDirectoryIndex(groups);
    });

    sortLabel.appendChild(sortText);
    sortLabel.appendChild(sortSelect);
    controls.appendChild(filterLabel);
    controls.appendChild(sortLabel);
    surnameDirectory.appendChild(controls);

    if (!groups.length) {
        const empty = document.createElement('p');
        empty.className = 'no-results';
        empty.textContent = 'No surnames are available right now.';
        surnameDirectory.appendChild(empty);
        return;
    }

    const list = document.createElement('div');
    list.className = 'surname-directory-list';

    if (!visibleGroups.length) {
        const empty = document.createElement('p');
        empty.className = 'no-results';
        empty.textContent = 'No surnames match that filter.';
        surnameDirectory.appendChild(empty);
        if (focusFilter) {
            filterInput.focus();
            filterInput.setSelectionRange(filterInput.value.length, filterInput.value.length);
        }
        return;
    }

    for (const group of visibleGroups) {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'surname-directory-row';

        const nameEl = document.createElement('span');
        nameEl.className = 'surname-directory-name';
        nameEl.textContent = group.surname;

        const countMeta = document.createElement('span');
        countMeta.className = 'surname-directory-meta';
        countMeta.textContent = `${group.count} ${group.count === 1 ? 'person' : 'people'}`;

        row.appendChild(nameEl);
        row.appendChild(countMeta);
        row.addEventListener('click', () => {
            renderSurnamePeopleList(group.surname, group.people);
        });
        list.appendChild(row);
    }

    surnameDirectory.appendChild(list);
    if (focusFilter) {
        filterInput.focus();
        filterInput.setSelectionRange(filterInput.value.length, filterInput.value.length);
    }
}

function renderSurnamePeopleList(surname, people) {
    surnameBrowseState = { view: 'list', surname };
    surnameDirectory.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'analytics-directory-back-btn';
    backBtn.textContent = '← Back to Surnames';
    backBtn.addEventListener('click', () => {
        void openSurnameDirectoryView();
    });
    surnameDirectory.appendChild(backBtn);

    const header = document.createElement('div');
    header.className = 'analytics-directory-header';

    const titleEl = document.createElement('span');
    titleEl.className = 'analytics-directory-title';
    titleEl.textContent = surname;

    const countEl = document.createElement('span');
    countEl.className = 'analytics-directory-count';
    countEl.textContent = `${people.length} ${people.length === 1 ? 'person' : 'people'}`;

    header.appendChild(titleEl);
    header.appendChild(countEl);
    surnameDirectory.appendChild(header);

    const list = document.createElement('div');
    list.className = 'analytics-directory-list';

    for (const result of people) {
        const row = document.createElement('div');
        row.className = 'analytics-directory-row';

        const nameEl = document.createElement('span');
        nameEl.className = 'analytics-directory-name';
        nameEl.textContent = result.name;

        const datesEl = document.createElement('span');
        datesEl.className = 'analytics-directory-dates';
        datesEl.textContent = result.dates || '';

        row.appendChild(nameEl);
        row.appendChild(datesEl);
        row.addEventListener('click', () => {
            profileOpenedFrom = 'surnames';
            openPersonProfile(result);
        });
        list.appendChild(row);
    }

    surnameDirectory.appendChild(list);
}

async function openSurnameDirectoryView(targetSurname = null, { scroll = true } = {}) {
    showContentArea();
    showOnlyContentPanel(surnameDirectory);
    surnameDirectory.innerHTML = '<p class="no-results">Loading surnames...</p>';

    try {
        const members = await initializeFamilyData();
        const groups = buildSurnameGroups(members);

        if (targetSurname) {
            const match = groups.find((group) => group.surname === targetSurname);
            if (match) {
                renderSurnamePeopleList(match.surname, match.people);
            } else {
                renderSurnameDirectoryIndex(groups);
            }
        } else {
            renderSurnameDirectoryIndex(groups);
        }
    } catch (error) {
        console.error('Error opening surname directory:', error);
        surnameDirectory.innerHTML = '<p class="no-results">Could not load the surname directory right now.</p>';
    }

    if (scroll) scrollToExplorePanel(surnameDirectory);
}

function restoreSurnameBrowseView() {
    if (surnameBrowseState.view === 'list' && surnameBrowseState.surname) {
        void openSurnameDirectoryView(surnameBrowseState.surname);
        return;
    }

    void openSurnameDirectoryView();
}

const PROFILE_EDIT_FIELD_LABELS = {
    nickname: 'Nickname',
    profileNote: 'Profile note'
};

function formatPersonProfileEditValue(value) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    return trimmed || 'Empty';
}

function updateEditProfileButtonVisibility() {
    const canEdit = Boolean(auth.currentUser && currentProfilePersonId);
    editProfileBtn.classList.toggle('hidden', !canEdit);
    editProfileBtn.disabled = canEdit && !hasCapability('editProfilePresentation');
    editProfileBtn.title = editProfileBtn.disabled ? getCapabilityBlockedMessage('editProfilePresentation') : '';
}

async function loadPersonProfileOverrides() {
    if (!auth.currentUser) return {};
    if (personProfileOverridesLoaded) return {};
    if (personProfileOverridesPromise) return personProfileOverridesPromise;

    personProfileOverridesPromise = (async () => {
        try {
            await loadPersonDetails();
            const snap = await getDocs(collection(db, 'person_profile_overrides'));
            const overrides = {};
            snap.forEach((docSnap) => {
                overrides[docSnap.id] = docSnap.data();
            });
            mergePersonProfileOverrides(overrides);
            personProfileOverridesLoaded = true;
            return overrides;
        } catch (error) {
            console.error('Error loading profile overrides:', error);
            return {};
        } finally {
            personProfileOverridesPromise = null;
        }
    })();

    return personProfileOverridesPromise;
}

function renderProfileEditsQueue(entries = personEditHistoryCache, filterTerm = '') {
    const term = filterTerm.trim().toLowerCase();
    profileEditsQueue.innerHTML = '';

    const filteredEntries = entries.filter((entry) => {
        if (!term) return true;
        const haystack = [
            entry.personName,
            entry.editorName,
            entry.editorEmail,
            entry.editedAt ? new Date(entry.editedAt).toLocaleString() : '',
            ...(entry.changedFields || [])
        ].join(' ').toLowerCase();
        return haystack.includes(term);
    });

    if (!filteredEntries.length) {
        profileEditsQueue.innerHTML = `<p class="queue-empty">${term ? 'No profile edits match that filter.' : 'No profile edits recorded yet.'}</p>`;
        return;
    }

    filteredEntries.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'feedback-item profile-edit-item';

        const meta = document.createElement('div');
        meta.className = 'feedback-item-meta';

        const typeBadge = document.createElement('span');
        typeBadge.className = 'feedback-type-badge';
        typeBadge.textContent = 'Profile edit';

        const who = document.createElement('span');
        who.className = 'feedback-who';
        who.textContent = entry.editorName || entry.editorEmail || 'Unknown editor';

        const when = document.createElement('span');
        when.className = 'feedback-when';
        when.textContent = entry.editedAt ? new Date(entry.editedAt).toLocaleString() : '';

        meta.appendChild(typeBadge);
        meta.appendChild(who);
        meta.appendChild(when);
        item.appendChild(meta);

        const body = document.createElement('div');
        body.className = 'feedback-item-body';

        const personEl = document.createElement('div');
        personEl.className = 'feedback-item-person';
        personEl.textContent = entry.personName || `Person ${entry.personId}`;
        body.appendChild(personEl);

        (entry.changedFields || []).forEach((field) => {
            const row = document.createElement('div');
            row.className = 'profile-edit-change-row';

            const label = document.createElement('span');
            label.className = 'profile-edit-change-label';
            label.textContent = PROFILE_EDIT_FIELD_LABELS[field] || field;

            const values = document.createElement('span');
            values.className = 'profile-edit-change-values';
            const before = formatPersonProfileEditValue(entry.beforeValues?.[field]);
            const after = formatPersonProfileEditValue(entry.afterValues?.[field]);
            values.textContent = `${before} -> ${after}`;

            row.appendChild(label);
            row.appendChild(values);
            body.appendChild(row);
        });

        item.appendChild(body);
        profileEditsQueue.appendChild(item);
    });
}

async function loadProfileEditsBadge() {
    if (!isAdmin || !auth.currentUser) {
        profileEditsBadge.classList.add('hidden');
        return;
    }

    try {
        const snap = await getDocs(query(collection(db, 'admin_notifications'), where('status', '==', 'unread')));
        if (snap.size > 0) {
            profileEditsBadge.textContent = String(snap.size);
            profileEditsBadge.classList.remove('hidden');
        } else {
            profileEditsBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading profile edit badge:', error);
        profileEditsBadge.classList.add('hidden');
    }
}

async function markProfileEditNotificationsRead() {
    if (!isAdmin || !auth.currentUser) return;

    try {
        const snap = await getDocs(query(collection(db, 'admin_notifications'), where('status', '==', 'unread')));
        if (snap.empty) {
            profileEditsBadge.classList.add('hidden');
            return;
        }

        await Promise.all(
            snap.docs.map((docSnap) => updateDoc(doc(db, 'admin_notifications', docSnap.id), {
                status: 'read',
                readBy: auth.currentUser.email,
                readAt: new Date().toISOString()
            }))
        );
        profileEditsBadge.classList.add('hidden');
    } catch (error) {
        console.error('Error marking profile edit notifications read:', error);
    }
}

async function loadPersonEditHistory() {
    if (!isAdmin || !auth.currentUser) {
        profileEditsQueue.innerHTML = '<p class="queue-empty">Sign in with an admin account to review profile edits.</p>';
        return;
    }

    profileEditsQueue.innerHTML = '<p class="queue-loading">Loading profile edits...</p>';
    try {
        const snap = await getDocs(query(collection(db, 'person_change_log'), orderBy('editedAt', 'desc')));
        personEditHistoryCache = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        renderProfileEditsQueue(personEditHistoryCache, profileEditsFilter.value);
        await markProfileEditNotificationsRead();
    } catch (error) {
        console.error('Error loading profile edit history:', error);
        profileEditsQueue.innerHTML = '<p class="queue-error">Could not load profile edit history.</p>';
    }
}

// ─── Search ───────────────────────────────────────────────────────────────────

searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm.length < 2) {
        showMessage(searchResults, 'Please enter at least 2 characters to search.', 'error');
        return;
    }
    displaySearchResults(searchFamilyMembers(searchTerm));
}

function displaySearchResults(results) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        searchResults.innerHTML = '<p class="no-results">No family members found.</p>';
        return;
    }

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'result-item';

        const thumbWrap = document.createElement('div');
        thumbWrap.className = 'result-thumb-wrap';
        const thumbImg = document.createElement('img');
        thumbImg.className = 'result-thumb';
        thumbImg.alt = '';
        thumbImg.loading = 'lazy';
        thumbWrap.appendChild(thumbImg);

        const textWrap = document.createElement('div');
        textWrap.className = 'result-text';

        const nameEl = document.createElement('h3');
        nameEl.textContent = result.name;

        const detailsEl = document.createElement('p');
        detailsEl.textContent = `${result.dates || 'Dates unknown'}${result.surname ? ' • ' + result.surname : ''}`;

        textWrap.appendChild(nameEl);
        textWrap.appendChild(detailsEl);

        // Show relationship label if user has a linked person
        if (linkedPersonId) {
            const resultPersonId = result.personId || extractPersonIdFromLink(result.link);
            const rel = getRelationshipLabel(linkedPersonId, resultPersonId);
            if (rel) {
                const relEl = document.createElement('span');
                relEl.className = 'result-relationship';
                relEl.textContent = rel.label;
                textWrap.appendChild(relEl);
            }
        }

        item.appendChild(thumbWrap);
        item.appendChild(textWrap);
        item.addEventListener('click', () => {
            profileOpenedFrom = 'search';
            openPersonProfile(result);
        });
        searchResults.appendChild(item);

        loadPersonPhotos().then(() => {
            const personId = result.personId || extractPersonIdFromLink(result.link);
            const photos = getPhotosForPersonId(personId);
            const valid = photos.filter(p => isValidFamilyTreeUrl(p.path));
            if (valid.length > 0) {
                thumbImg.src = valid[0].path;
                thumbWrap.classList.add('has-photo');
            }
        });
    });
}

// ─── Person Profile ───────────────────────────────────────────────────────────

function buildProfileDisplayName(result = {}, details = null) {
    const detailedName = String(details?.name || '').trim();
    if (detailedName) return detailedName;

    const shortName = String(result?.name || '').trim();
    const surname = String(result?.surname || '').trim();
    if (shortName && surname) {
        const shortLower = shortName.toLowerCase();
        const surnameLower = surname.toLowerCase();
        if (shortLower === surnameLower || shortLower.endsWith(` ${surnameLower}`)) {
            return shortName;
        }
        return `${shortName} ${surname}`;
    }

    return shortName || surname || 'Unknown person';
}

/**
 * Render a relationship chip into a container element.
 * If relationship is null or linkedPersonId is unset, hides the container.
 * @param {HTMLElement} container - element to render into (gets innerHTML cleared)
 * @param {string} targetPersonId - the person being viewed
 * @param {object} [options] - { showInfo: true } to show the (?) popover button
 * @returns {void}
 */
function renderRelationshipChip(container, targetPersonId, options = {}) {
    container.innerHTML = '';
    container.className = container.className.replace(/\s*relationship-chip--\w+/g, '');
    container.classList.add('hidden');

    if (!linkedPersonId || !targetPersonId) return;

    const rel = getRelationshipLabel(linkedPersonId, targetPersonId);
    if (!rel) return;

    container.textContent = rel.label;
    container.classList.remove('hidden');
    container.classList.add(`relationship-chip--${rel.type}`);

    if (options.showInfo !== false && rel.detail) {
        const infoBtn = document.createElement('button');
        infoBtn.type = 'button';
        infoBtn.className = 'relationship-info-btn';
        infoBtn.textContent = '?';
        infoBtn.title = 'How is this calculated?';
        infoBtn.setAttribute('aria-label', 'How is this relationship calculated?');

        let popoverOpen = false;
        let popover = null;

        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (popoverOpen && popover) {
                popover.remove();
                popoverOpen = false;
                return;
            }
            popover = document.createElement('div');
            popover.className = 'relationship-popover';
            const title = document.createElement('p');
            title.className = 'relationship-popover-title';
            title.textContent = 'How is this calculated?';
            const body = document.createElement('p');
            body.className = 'relationship-popover-body';
            body.textContent = rel.detail;
            popover.appendChild(title);
            popover.appendChild(body);

            if (Array.isArray(rel.path) && rel.path.length >= 2) {
                const pathWrap = document.createElement('div');
                pathWrap.className = 'relationship-path';

                rel.path.forEach((person, index) => {
                    const name = document.createElement('span');
                    name.className = 'relationship-path-name';
                    name.textContent = person.shortName || person.name;
                    if (person.isTargetPerson) name.classList.add('is-target');
                    if (person.isLinkedPerson) name.classList.add('is-you');
                    pathWrap.appendChild(name);

                    if (index < rel.path.length - 1) {
                        const arrow = document.createElement('span');
                        arrow.className = 'relationship-path-arrow';
                        arrow.textContent = '→';
                        pathWrap.appendChild(arrow);
                    }
                });

                popover.appendChild(pathWrap);
            }

            container.appendChild(popover);
            popoverOpen = true;

            const dismiss = (ev) => {
                if (!popover.contains(ev.target) && ev.target !== infoBtn) {
                    popover.remove();
                    popoverOpen = false;
                    document.removeEventListener('click', dismiss);
                }
            };
            setTimeout(() => document.addEventListener('click', dismiss), 0);
        });

        container.appendChild(infoBtn);
    }
}

async function openPersonProfile(result) {
    const personId = result.personId || extractPersonIdFromLink(result.link);
    currentProfilePersonId = personId || '';

    // Update back button label based on where the user navigated from.
    // 'profile' means we arrived via a family chip; show the previous person's name.
    let backLabel;
    if (profileOpenedFrom === 'profile' && previousProfileName) {
        backLabel = `← Back to ${previousProfileName}`;
    } else {
        const backLabels = { gallery: '← Back to Gallery', surnames: '← Back to Surnames', search: '← Back to Search', tree: '← Back to Tree', sources: '← Back to Sources', places: '← Back to Places', research: '← Back to Research', 'analytics-directory': '← Back to List' };
        backLabel = backLabels[profileOpenedFrom] || '← Back';
    }
    backToSearchBtn.textContent = backLabel;

    // Immediately show a preliminary name (synchronous) so the header doesn't
    // appear blank during async data loading when navigating via family chips.
    const prelimName = buildProfileDisplayName(result, null);
    profileName.textContent = prelimName;
    profileDates.textContent = result.dates || '';
    profileRelationship.classList.add('hidden');

    // Load structured details so the profile header can use the full person name
    // instead of the shorter directory projection.
    await loadPersonDetails();
    await loadPersonProfileOverrides();
    const details = getDetailsForPerson(personId);
    const displayName = buildProfileDisplayName(result, details);

    currentProfileName = displayName;
    profileName.textContent = displayName;

    // Show relationship chip relative to the logged-in user
    await loadPersonFamily();
    renderRelationshipChip(profileRelationship, personId);

    // Load associated photos (build-time + manual links) and approved user uploads; merge for display
    await loadPersonPhotos();
    const photos = getPhotosForPersonId(personId);
    const approvedUploads = await loadApprovedUploads(personId);
    const allPhotos = [...photos, ...approvedUploads];
    renderProfilePhotos(displayName, allPhotos);

    // Show primary photo as circular avatar in the profile header
    const validPhotos = allPhotos.filter(p => isValidFamilyTreeUrl(p.path));
    if (profileHeroThumb) {
        if (validPhotos.length > 0) {
            profileHeroThumb.src = validPhotos[0].path;
            profileHeroThumb.alt = displayName;
            profileHeroThumb.classList.remove('hidden');
        } else {
            profileHeroThumb.src = '';
            profileHeroThumb.classList.add('hidden');
        }
    }

    renderProfileDetails(personId);
    updateEditProfileButtonVisibility();

    // Render family relationships (family data already loaded above)
    renderProfileFamily(personId);

    // Render approved evidence artifacts (async; section unhides itself if any)
    renderProfileEvidence(personId, displayName);

    showProfileArea();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderProfilePhotos(name, photos) {
    profilePhotos.innerHTML = '';
    const validPhotos = photos.filter(p => isValidFamilyTreeUrl(p.path));

    if (validPhotos.length === 0) {
        profilePhotos.classList.add('hidden');
        return;
    }

    const heading = document.createElement('h3');
    heading.className = 'person-photos-heading';
    heading.textContent = `Photos — ${name}`;
    profilePhotos.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'gallery-grid';

    validPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = photo.path;
        img.alt = photo.caption || name;
        img.loading = 'lazy';

        const caption = document.createElement('div');
        caption.className = 'gallery-item-caption';
        caption.textContent = photo.caption || photo.file;

        item.appendChild(img);
        item.appendChild(caption);
        item.addEventListener('click', () => openLightbox(validPhotos, index));
        grid.appendChild(item);
    });

    profilePhotos.appendChild(grid);
    profilePhotos.classList.remove('hidden');
}

function renderProfileDetails(personId) {
    profileDetails.innerHTML = '';
    if (!personId) { profileDetails.classList.add('hidden'); return; }

    const details = getDetailsForPerson(personId);
    if (!details) {
        profileDetails.classList.add('hidden');
        return;
    }

    // Group events: primary facts first (Birth, Death, Burial), then others
    const primaryTypes = new Set(['Birth', 'Baptism', 'Death', 'Burial', 'Cremation']);
    const events = Array.isArray(details.events) ? details.events : [];
    const primary = events.filter(e => primaryTypes.has(e.type));
    const other = events.filter(e => !primaryTypes.has(e.type));
    const hasStructuredDetails = Boolean(details.sex || primary.length || other.length || details.nickname || details.profileNote || details.profileEditedAt);

    if (!hasStructuredDetails) {
        profileDetails.classList.add('hidden');
        return;
    }

    if (details.nickname) {
        const nicknameBlock = document.createElement('div');
        nicknameBlock.className = 'profile-note-card profile-nickname-card';

        const nicknameLabel = document.createElement('span');
        nicknameLabel.className = 'profile-note-label';
        nicknameLabel.textContent = 'Known as';

        const nicknameValue = document.createElement('span');
        nicknameValue.className = 'profile-note-text';
        nicknameValue.textContent = details.nickname;

        nicknameBlock.appendChild(nicknameLabel);
        nicknameBlock.appendChild(nicknameValue);
        profileDetails.appendChild(nicknameBlock);
    }

    if (details.profileNote) {
        const noteBlock = document.createElement('div');
        noteBlock.className = 'profile-note-card';

        const noteLabel = document.createElement('span');
        noteLabel.className = 'profile-note-label';
        noteLabel.textContent = 'Profile note';

        const noteText = document.createElement('p');
        noteText.className = 'profile-note-text';
        noteText.textContent = details.profileNote;

        noteBlock.appendChild(noteLabel);
        noteBlock.appendChild(noteText);
        profileDetails.appendChild(noteBlock);
    }

    if (details.profileEditedAt) {
        const editedMeta = document.createElement('div');
        editedMeta.className = 'profile-edit-meta';
        const editorName = details.profileEditedByName || details.profileEditedBy || 'an authorized family member';
        editedMeta.textContent = `Last edited by ${editorName} on ${new Date(details.profileEditedAt).toLocaleString()}`;
        profileDetails.appendChild(editedMeta);
    }

    if (details.sex) {
        const badge = document.createElement('span');
        badge.className = 'details-sex-badge';
        badge.textContent = details.sex;
        profileDetails.appendChild(badge);
    }

    if (primary.length || other.length) {
        const table = document.createElement('table');
        table.className = 'details-table';

        function addRow(event) {
            const tr = document.createElement('tr');

            const tdType = document.createElement('td');
            tdType.className = 'details-type';
            tdType.textContent = event.type;

            const tdDate = document.createElement('td');
            tdDate.className = 'details-date';
            tdDate.textContent = event.date || '';

            const tdPlace = document.createElement('td');
            tdPlace.className = 'details-place';
            if (event.place) {
                const placeBtn = document.createElement('button');
                placeBtn.type = 'button';
                placeBtn.className = 'profile-place-link';
                placeBtn.textContent = event.place;
                placeBtn.addEventListener('click', () => {
                    void openPlacePagesView({ placeName: event.place });
                });
                tdPlace.appendChild(placeBtn);
                if (event.details) {
                    const detailText = document.createElement('span');
                    detailText.className = 'profile-place-detail';
                    detailText.textContent = ` ${event.details}`;
                    tdPlace.appendChild(detailText);
                }
            } else {
                tdPlace.textContent = event.details || '';
            }

            tr.appendChild(tdType);
            tr.appendChild(tdDate);
            tr.appendChild(tdPlace);
            table.appendChild(tr);
        }

        [...primary, ...other].forEach(addRow);

        profileDetails.appendChild(table);
    }

    profileDetails.classList.remove('hidden');
}

function renderProfileFamily(personId) {
    profileFamily.innerHTML = '';
    if (!personId) { profileFamily.classList.add('hidden'); return; }

    const family = getFamilyForPerson(personId);
    if (!family) { profileFamily.classList.add('hidden'); return; }

    const sections = [
        { label: 'Parents', people: family.parents },
        { label: 'Spouse', people: family.spouses },
        { label: 'Children', people: family.children }
    ].filter(s => s.people.length > 0);

    if (sections.length === 0) { profileFamily.classList.add('hidden'); return; }

    const heading = document.createElement('h3');
    heading.className = 'profile-family-heading';
    heading.textContent = 'Family';
    profileFamily.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'family-grid';

    for (const section of sections) {
        const group = document.createElement('div');
        group.className = 'family-group';

        const label = document.createElement('span');
        label.className = 'family-group-label';
        label.textContent = section.label;
        group.appendChild(label);

        const chips = document.createElement('div');
        chips.className = 'family-chips';

        for (const person of section.people) {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'family-chip';
            chip.textContent = person.name;
            chip.addEventListener('click', () => {
                const result = getPersonById(person.id);
                if (result) {
                    // Save the current profile as the return point before navigating
                    // to a family member, so Back can return here.
                    previousProfileResult = getPersonById(currentProfilePersonId) || null;
                    previousProfileName = currentProfileName;
                    previousProfileOpenedFrom = profileOpenedFrom;
                    profileOpenedFrom = 'profile';
                    openPersonProfile(result);
                }
            });
            chips.appendChild(chip);
        }

        group.appendChild(chips);
        grid.appendChild(group);
    }

    profileFamily.appendChild(grid);
    profileFamily.classList.remove('hidden');
}

function setSourcesStatus(message = '', type = '') {
    if (!message) {
        sourcesStatus.textContent = '';
        sourcesStatus.className = 'sources-status hidden';
        return;
    }

    sourcesStatus.textContent = message;
    sourcesStatus.className = `sources-status ${type}`.trim();
}

function parseSourceFilterYear(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function populateSourceTypeFilter(sources) {
    const existingValue = sourcesTypeFilter.value || 'all';
    const sourceTypes = [...new Set(sources.map((source) => source.sourceType).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b));

    sourcesTypeFilter.innerHTML = '<option value="all">All record types</option>';
    sourceTypes.forEach((sourceType) => {
        const option = document.createElement('option');
        option.value = sourceType;
        option.textContent = sourceType;
        sourcesTypeFilter.appendChild(option);
    });

    sourcesTypeFilter.value = sourceTypes.includes(existingValue) ? existingValue : 'all';
}

function getFilteredCitedSources() {
    const typeFilter = sourcesTypeFilter.value;
    const placeFilter = sourcesPlaceFilter.value.trim().toLowerCase();
    const minYear = parseSourceFilterYear(sourcesYearStartFilter.value);
    const maxYear = parseSourceFilterYear(sourcesYearEndFilter.value);
    const requireExternal = sourcesHasExternalFilter.checked;

    return citedSourcesCache.filter((source) => {
        if (typeFilter !== 'all' && source.sourceType !== typeFilter) return false;
        if (requireExternal && !source.externalUrl) return false;

        if (placeFilter) {
            const placeHaystack = [
                ...(source.relatedPlaces || []),
                source.citationText
            ].join(' ').toLowerCase();
            if (!placeHaystack.includes(placeFilter)) return false;
        }

        const sourceStart = source.yearStart ?? source.yearEnd;
        const sourceEnd = source.yearEnd ?? source.yearStart;

        if (minYear !== null && (sourceEnd === null || sourceEnd < minYear)) return false;
        if (maxYear !== null && (sourceStart === null || sourceStart > maxYear)) return false;
        return true;
    });
}

function renderCitedSourcesSummary(filteredSources) {
    if (!citedSourcesCache.length) {
        sourcesSummary.textContent = '';
        return;
    }

    const linkedPeople = filteredSources.reduce((total, source) => total + source.linkedPeopleCount, 0);
    sourcesSummary.textContent = `${filteredSources.length} of ${citedSourcesCache.length} cited sources shown · ${linkedPeople} linked relatives surfaced`;
}

function appendSourceTagList(container, label, values, className = 'source-tag', onClick = null) {
    if (!values?.length) return;

    const section = document.createElement('div');
    section.className = 'source-context-block';

    const heading = document.createElement('span');
    heading.className = 'source-context-label';
    heading.textContent = label;
    section.appendChild(heading);

    const list = document.createElement('div');
    list.className = 'source-tags';

    values.forEach((value) => {
        const tag = document.createElement(onClick ? 'button' : 'span');
        tag.className = onClick ? `${className} source-tag-button` : className;
        tag.textContent = value;
        if (onClick) {
            tag.type = 'button';
            tag.addEventListener('click', () => onClick(value));
        }
        list.appendChild(tag);
    });

    section.appendChild(list);
    container.appendChild(section);
}

function renderCitedSourcesList(filteredSources) {
    sourcesList.innerHTML = '';
    renderCitedSourcesSummary(filteredSources);

    if (!filteredSources.length) {
        const empty = document.createElement('p');
        empty.className = 'sources-empty';
        empty.textContent = 'No cited sources match the current filters.';
        sourcesList.appendChild(empty);
        return;
    }

    filteredSources.forEach((source, index) => {
        const item = document.createElement('details');
        item.className = 'source-item';
        if (index < 2) item.open = true;

        const summary = document.createElement('summary');
        summary.className = 'source-item-summary';

        const summaryText = document.createElement('div');
        summaryText.className = 'source-item-summary-text';

        const title = document.createElement('h3');
        title.className = 'source-item-title';
        title.textContent = source.title;
        summaryText.appendChild(title);

        const meta = document.createElement('div');
        meta.className = 'source-item-meta';

        const typeBadge = document.createElement('span');
        typeBadge.className = 'source-badge';
        typeBadge.textContent = source.sourceType;
        meta.appendChild(typeBadge);

        if (source.yearStart !== null) {
            const yearBadge = document.createElement('span');
            yearBadge.className = 'source-badge source-badge-muted';
            yearBadge.textContent = source.yearStart === source.yearEnd ? String(source.yearStart) : `${source.yearStart}-${source.yearEnd}`;
            meta.appendChild(yearBadge);
        }

        if (source.linkedPeopleCount) {
            const linkedBadge = document.createElement('span');
            linkedBadge.className = 'source-badge source-badge-muted';
            linkedBadge.textContent = `${source.linkedPeopleCount} linked ${source.linkedPeopleCount === 1 ? 'relative' : 'relatives'}`;
            meta.appendChild(linkedBadge);
        }

        if (source.externalUrl) {
            const urlBadge = document.createElement('span');
            urlBadge.className = 'source-badge source-badge-muted';
            urlBadge.textContent = 'External link';
            meta.appendChild(urlBadge);
        }

        summaryText.appendChild(meta);
        summary.appendChild(summaryText);

        const expandHint = document.createElement('span');
        expandHint.className = 'source-expand-hint';
        expandHint.textContent = 'Details';
        summary.appendChild(expandHint);

        item.appendChild(summary);

        const body = document.createElement('div');
        body.className = 'source-item-body';

        const description = document.createElement('p');
        description.className = 'source-description';
        description.textContent = source.description;
        body.appendChild(description);

        const whyCard = document.createElement('div');
        whyCard.className = 'source-why-card';

        const whyLabel = document.createElement('span');
        whyLabel.className = 'source-why-label';
        whyLabel.textContent = 'Why this matters';

        const whyText = document.createElement('p');
        whyText.className = 'source-why-text';
        whyText.textContent = source.whyThisMatters;

        whyCard.appendChild(whyLabel);
        whyCard.appendChild(whyText);
        body.appendChild(whyCard);

        const metadataGrid = document.createElement('div');
        metadataGrid.className = 'source-metadata-grid';

        const metadataItems = [
            ['Provider', source.provider],
            ['Repository', source.repository],
            ['Jurisdiction', source.jurisdiction],
            ['Citation ID', source.id]
        ].filter(([, value]) => value);

        metadataItems.forEach(([label, value]) => {
            const cell = document.createElement('div');
            cell.className = 'source-metadata-item';

            const cellLabel = document.createElement('span');
            cellLabel.className = 'source-metadata-label';
            cellLabel.textContent = label;

            const cellValue = document.createElement('span');
            cellValue.className = 'source-metadata-value';
            cellValue.textContent = value;

            cell.appendChild(cellLabel);
            cell.appendChild(cellValue);
            metadataGrid.appendChild(cell);
        });

        if (metadataItems.length) body.appendChild(metadataGrid);

        appendSourceTagList(body, 'Related surnames', source.relatedSurnames);
        appendSourceTagList(body, 'Related places', source.relatedPlaces, 'source-tag', (placeName) => {
            void openPlacePagesView({ placeName });
        });

        if (source.relatedPeople?.length) {
            const peopleBlock = document.createElement('div');
            peopleBlock.className = 'source-context-block';

            const peopleLabel = document.createElement('span');
            peopleLabel.className = 'source-context-label';
            peopleLabel.textContent = 'Linked relatives';
            peopleBlock.appendChild(peopleLabel);

            const peopleList = document.createElement('div');
            peopleList.className = 'source-people-list';

            source.relatedPeople.forEach((person) => {
                const personBtn = document.createElement('button');
                personBtn.type = 'button';
                personBtn.className = 'source-person-chip';
                personBtn.textContent = person.dates ? `${person.name} (${person.dates})` : person.name;
                personBtn.addEventListener('click', () => {
                    const result = getPersonById(person.id);
                    if (!result) return;
                    profileOpenedFrom = 'sources';
                    openPersonProfile(result);
                });
                peopleList.appendChild(personBtn);
            });

            peopleBlock.appendChild(peopleList);
            body.appendChild(peopleBlock);
        }

        if (source.externalUrl) {
            const actions = document.createElement('div');
            actions.className = 'source-actions';

            const externalLink = document.createElement('a');
            externalLink.className = 'source-action-link';
            externalLink.href = source.externalUrl;
            externalLink.target = '_blank';
            externalLink.rel = 'noopener noreferrer';
            externalLink.textContent = 'Open external record';
            actions.appendChild(externalLink);

            body.appendChild(actions);
        }

        const citationBlock = document.createElement('div');
        citationBlock.className = 'source-citation-block';

        const citationLabel = document.createElement('span');
        citationLabel.className = 'source-context-label';
        citationLabel.textContent = 'Citation';

        const citationText = document.createElement('p');
        citationText.className = 'source-citation-text';
        citationText.textContent = source.citationText;

        citationBlock.appendChild(citationLabel);
        citationBlock.appendChild(citationText);
        body.appendChild(citationBlock);

        item.appendChild(body);
        sourcesList.appendChild(item);
    });
}

function refreshCitedSourcesView() {
    renderCitedSourcesList(getFilteredCitedSources());
}

async function openCitedSourcesView() {
    showSourcesArea();
    scrollToExplorePanel(sourcesView);

    if (citedSourcesCache.length) {
        setSourcesStatus();
        refreshCitedSourcesView();
        return;
    }

    sourcesList.innerHTML = '';
    sourcesSummary.textContent = '';
    setSourcesStatus('Loading cited sources...');

    try {
        await ensureCitedSourcesLoaded();
        setSourcesStatus();
        refreshCitedSourcesView();
    } catch (error) {
        console.error('Error loading cited sources:', error);
        sourcesSummary.textContent = '';
        sourcesList.innerHTML = '';
        setSourcesStatus('Could not load cited sources right now. Please try again.', 'error');
    }
}

function setPlacesStatus(message = '', type = '') {
    placesStatus.textContent = message;
    placesStatus.className = `sources-status ${type || ''}`.trim();
    placesStatus.classList.toggle('hidden', !message);
}

const PLACE_US_STATE_NAMES_BY_ABBR = Object.freeze({
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
const PLACE_US_STATE_NAMES = new Set(Object.values(PLACE_US_STATE_NAMES_BY_ABBR).map((name) => name.toLowerCase()));
const PLACE_COUNTRY_ALIASES = new Map([
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
const PLACE_US_ADMIN_SUFFIX_RE = /\b(county|parish|borough|census area|municipality|township|city)\b/i;

function normalizePlaceSegmentForLookup(value) {
    return String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/[.]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function normalizePlaceCountrySegment(segment) {
    return PLACE_COUNTRY_ALIASES.get(normalizePlaceSegmentForLookup(segment)) || segment;
}

function normalizePlaceStateSegment(segment) {
    const compact = String(segment || '').replace(/[.\s]/g, '').toUpperCase();
    if (PLACE_US_STATE_NAMES_BY_ABBR[compact]) return PLACE_US_STATE_NAMES_BY_ABBR[compact];

    const lower = normalizePlaceSegmentForLookup(segment);
    return PLACE_US_STATE_NAMES.has(lower)
        ? Object.values(PLACE_US_STATE_NAMES_BY_ABBR).find((name) => name.toLowerCase() === lower)
        : segment;
}

function stripDuplicatePlaceParenthetical(segment, laterSegments) {
    return String(segment || '').replace(/\s*\(([^)]+)\)/g, (match, inner) => {
        const innerKey = normalizePlaceSegmentForLookup(inner);
        return laterSegments.some((candidate) => normalizePlaceSegmentForLookup(candidate) === innerKey)
            ? ''
            : match;
    }).trim();
}

function normalizePlaceName(value) {
    const cleaned = String(value || '')
        .replace(/\u00a0/g, ' ')
        .replace(/\s+([,;])/g, '$1')
        .replace(/[.;\s]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) return '';

    let segments = cleaned.split(',')
        .map((segment) => segment.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    segments = segments.map((segment, index) => (
        stripDuplicatePlaceParenthetical(segment, segments.slice(index + 1))
    )).filter(Boolean);

    segments = segments.map((segment) => normalizePlaceCountrySegment(normalizePlaceStateSegment(segment)));

    const last = segments[segments.length - 1];
    const country = normalizePlaceCountrySegment(last || '');
    if (country === 'United States') {
        segments[segments.length - 1] = country;
    } else if (PLACE_US_STATE_NAMES.has(normalizePlaceSegmentForLookup(last))) {
        segments.push('United States');
    }

    const countryIndex = segments.findIndex((segment) => segment === 'United States');
    const stateIndex = countryIndex > 0 ? countryIndex - 1 : segments.length - 1;
    const countyIndex = stateIndex - 1;
    if (
        countryIndex !== -1 &&
        countyIndex >= 1 &&
        PLACE_US_STATE_NAMES.has(normalizePlaceSegmentForLookup(segments[stateIndex])) &&
        !PLACE_US_ADMIN_SUFFIX_RE.test(segments[countyIndex])
    ) {
        // Match build-places.js: U.S. census rows often omit "County" in City, County, State strings.
        segments[countyIndex] = `${segments[countyIndex]} County`;
    }

    return segments.join(', ').toLowerCase();
}

async function ensurePlacePagesLoaded() {
    if (!placesCache.length) {
        placesCache = await loadPlacePages();
    }

    try {
        if (!placesFiltersInitialized) {
            populatePlacesRecordTypeFilter(placesCache);
            placesFiltersInitialized = true;
        }
    } catch (error) {
        placesFiltersInitialized = false;
        console.error('Place Pages filter initialization failed after data loaded:', {
            placeCount: placesCache.length,
            error,
        });
        try {
            placesRecordTypeFilter.innerHTML = '<option value="all">All record types</option>';
            placesRecordTypeFilter.value = 'all';
        } catch (fallbackError) {
            console.error('Place Pages record type filter fallback failed:', fallbackError);
        }
    }

    return placesCache;
}

function getPlaceRecordTypeNames(place) {
    if (!Array.isArray(place?.recordTypes)) return [];
    return place.recordTypes
        .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
        .filter(Boolean);
}

function getPlaceSearchNames(place) {
    return [place?.name, ...(Array.isArray(place?.alternateNames) ? place.alternateNames : [])]
        .filter(Boolean);
}

function populatePlacesRecordTypeFilter(places) {
    const existingValue = placesRecordTypeFilter.value || 'all';
    // places.json stores record types as { name, count }; spread the Set so names are deduped into dropdown options.
    const recordTypes = [...new Set(
        places.flatMap(getPlaceRecordTypeNames)
    )].sort((a, b) => a.localeCompare(b));

    placesRecordTypeFilter.innerHTML = '<option value="all">All record types</option>';
    recordTypes.forEach((recordType) => {
        const option = document.createElement('option');
        option.value = recordType;
        option.textContent = recordType;
        placesRecordTypeFilter.appendChild(option);
    });

    placesRecordTypeFilter.value = recordTypes.includes(existingValue) ? existingValue : 'all';
}

function findPlacePageByName(placeName) {
    const normalized = normalizePlaceName(placeName);
    if (!normalized) return null;
    return placesCache.find((place) => getPlaceSearchNames(place).some((name) => normalizePlaceName(name) === normalized))
        || placesCache.find((place) => getPlaceSearchNames(place).some((name) => {
            const candidate = normalizePlaceName(name);
            return candidate.includes(normalized) || normalized.includes(candidate);
        }));
}

function getFilteredPlacePages() {
    const query = normalizePlaceName(placesSearchInput.value);
    const recordType = placesRecordTypeFilter.value || 'all';

    return placesCache.filter((place) => {
        if (query && !getPlaceSearchNames(place).some((name) => normalizePlaceName(name).includes(query))) return false;
        if (recordType !== 'all' && !getPlaceRecordTypeNames(place).includes(recordType)) return false;
        return true;
    });
}

function renderPlacesSummary(places) {
    if (!placesCache.length) {
        placesSummary.textContent = '';
        return;
    }

    const peopleCount = places.reduce((total, place) => total + (place.stats?.peopleCount || 0), 0);
    const sourceCount = places.reduce((total, place) => total + (place.stats?.sourceCount || 0), 0);
    placesSummary.textContent = `${places.length} of ${placesCache.length} place pages shown · ${peopleCount} linked relative connections · ${sourceCount} cited source connections`;
}

function appendPlaceStat(container, value, label) {
    const stat = document.createElement('div');
    stat.className = 'place-stat';

    const valueEl = document.createElement('span');
    valueEl.className = 'place-stat-value';
    valueEl.textContent = String(value);

    const labelEl = document.createElement('span');
    labelEl.className = 'place-stat-label';
    labelEl.textContent = label;

    stat.appendChild(valueEl);
    stat.appendChild(labelEl);
    container.appendChild(stat);
}

function appendCountPills(container, values, emptyText) {
    if (!values?.length) {
        const empty = document.createElement('p');
        empty.className = 'places-muted';
        empty.textContent = emptyText;
        container.appendChild(empty);
        return;
    }

    const list = document.createElement('div');
    list.className = 'place-pill-list';
    values.forEach((entry) => {
        const pill = document.createElement('span');
        pill.className = 'place-pill';
        pill.textContent = `${entry.name} (${entry.count})`;
        list.appendChild(pill);
    });
    container.appendChild(list);
}

function renderPlaceIndex(places) {
    placesSelectedId = '';
    placesList.innerHTML = '';
    renderPlacesSummary(places);

    if (!places.length) {
        const empty = document.createElement('p');
        empty.className = 'sources-empty';
        empty.textContent = 'No place pages match the current filters.';
        placesList.appendChild(empty);
        return;
    }

    places.forEach((place) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'place-card';

        const title = document.createElement('span');
        title.className = 'place-card-title';
        title.textContent = place.name;

        const meta = document.createElement('span');
        meta.className = 'place-card-meta';
        meta.textContent = `${place.stats.peopleCount} ${place.stats.peopleCount === 1 ? 'relative' : 'relatives'} · ${place.stats.sourceCount} cited ${place.stats.sourceCount === 1 ? 'source' : 'sources'} · ${place.stats.eventCount} facts`;

        const surnames = document.createElement('span');
        surnames.className = 'place-card-subtext';
        const surnameNames = (place.surnames || []).slice(0, 5).map((entry) => entry.name);
        surnames.textContent = surnameNames.length ? `Surnames: ${surnameNames.join(', ')}` : 'No surname cluster yet';

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(surnames);
        card.addEventListener('click', () => {
            placesSelectedId = place.id;
            renderPlaceDetail(place);
        });
        placesList.appendChild(card);
    });
}

function renderPlaceDetail(place) {
    placesList.innerHTML = '';
    renderPlacesSummary([place]);

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'analytics-directory-back-btn';
    backBtn.textContent = '← Back to Places';
    backBtn.addEventListener('click', () => {
        renderPlaceIndex(getFilteredPlacePages());
    });
    placesList.appendChild(backBtn);

    const heading = document.createElement('div');
    heading.className = 'place-detail-heading';

    const title = document.createElement('h3');
    title.textContent = place.name;
    heading.appendChild(title);

    const stats = document.createElement('div');
    stats.className = 'place-stats';
    appendPlaceStat(stats, place.stats.peopleCount, 'Relatives');
    appendPlaceStat(stats, place.stats.sourceCount, 'Cited Sources');
    appendPlaceStat(stats, place.stats.eventCount, 'Facts');
    appendPlaceStat(stats, place.stats.surnameCount, 'Surnames');
    heading.appendChild(stats);
    placesList.appendChild(heading);

    const guidanceSection = document.createElement('section');
    guidanceSection.className = 'place-section';
    const guidanceTitle = document.createElement('h4');
    guidanceTitle.textContent = 'Research Guidance';
    guidanceSection.appendChild(guidanceTitle);

    const caution = document.createElement('p');
    caution.className = 'place-caution';
    caution.textContent = 'Place and branch patterns here are research leads from the archive data. They should be compared with the connected facts and cited sources before being treated as conclusions.';
    guidanceSection.appendChild(caution);

    (place.researchGuidance || []).forEach((item) => {
        const guidance = document.createElement('div');
        guidance.className = 'place-guidance';

        const guidanceHeading = document.createElement('span');
        guidanceHeading.className = 'place-guidance-heading';
        guidanceHeading.textContent = item.heading;

        const body = document.createElement('p');
        body.textContent = item.body;

        const evidence = document.createElement('small');
        evidence.textContent = item.evidence;

        guidance.appendChild(guidanceHeading);
        guidance.appendChild(body);
        guidance.appendChild(evidence);
        guidanceSection.appendChild(guidance);
    });
    placesList.appendChild(guidanceSection);

    if (place.branchPrompts?.length) {
        const branchSection = document.createElement('section');
        branchSection.className = 'place-section place-branch-section';
        const branchTitle = document.createElement('h4');
        branchTitle.textContent = 'Branch Research Leads';
        branchSection.appendChild(branchTitle);

        const branchIntro = document.createElement('p');
        branchIntro.className = 'place-caution';
        branchIntro.textContent = 'These prompts highlight repeated surname patterns at this place. They are meant to guide what to compare next, not to prove a relationship by themselves.';
        branchSection.appendChild(branchIntro);

        place.branchPrompts.forEach((item) => {
            const prompt = document.createElement('div');
            prompt.className = 'place-branch-prompt';

            const promptHeading = document.createElement('span');
            promptHeading.className = 'place-guidance-heading';
            promptHeading.textContent = item.heading;

            const body = document.createElement('p');
            body.textContent = item.body;

            const evidence = document.createElement('small');
            evidence.textContent = item.evidence;

            prompt.appendChild(promptHeading);
            prompt.appendChild(body);
            prompt.appendChild(evidence);
            branchSection.appendChild(prompt);
        });

        placesList.appendChild(branchSection);
    }

    const contextSection = document.createElement('section');
    contextSection.className = 'place-section';
    const contextTitle = document.createElement('h4');
    contextTitle.textContent = 'Family Context';
    contextSection.appendChild(contextTitle);
    appendCountPills(contextSection, place.surnames, 'No surname clusters are available for this place.');
    appendCountPills(contextSection, place.recordTypes, 'No cited record types are linked to this place.');
    placesList.appendChild(contextSection);

    if (place.people?.length) {
        const peopleSection = document.createElement('section');
        peopleSection.className = 'place-section';
        const peopleTitle = document.createElement('h4');
        peopleTitle.textContent = 'Connected Relatives';
        peopleSection.appendChild(peopleTitle);

        const peopleList = document.createElement('div');
        peopleList.className = 'source-people-list';
        place.people.forEach((person) => {
            const personBtn = document.createElement('button');
            personBtn.type = 'button';
            personBtn.className = 'source-person-chip';
            const types = person.eventTypes?.length ? ` · ${person.eventTypes.join(', ')}` : '';
            personBtn.textContent = `${person.name}${person.dates ? ` (${person.dates})` : ''}${types}`;
            personBtn.addEventListener('click', () => {
                const result = getPersonById(person.id);
                if (!result) return;
                profileOpenedFrom = 'places';
                openPersonProfile(result);
            });
            peopleList.appendChild(personBtn);
        });
        peopleSection.appendChild(peopleList);
        placesList.appendChild(peopleSection);
    }

    if (place.sources?.length) {
        const sourcesSection = document.createElement('section');
        sourcesSection.className = 'place-section';
        const sourcesTitle = document.createElement('h4');
        sourcesTitle.textContent = 'Connected Sources';
        sourcesSection.appendChild(sourcesTitle);

        const sourceList = document.createElement('div');
        sourceList.className = 'place-source-list';
        place.sources.forEach((source) => {
            const item = document.createElement('div');
            item.className = 'place-source-row';

            const titleEl = document.createElement('span');
            titleEl.className = 'place-source-title';
            titleEl.textContent = source.title;

            const meta = document.createElement('span');
            meta.className = 'place-source-meta';
            const years = source.yearStart !== null
                ? (source.yearStart === source.yearEnd ? String(source.yearStart) : `${source.yearStart}-${source.yearEnd}`)
                : '';
            meta.textContent = [source.sourceType, years].filter(Boolean).join(' · ');

            item.appendChild(titleEl);
            item.appendChild(meta);
            sourceList.appendChild(item);
        });
        sourcesSection.appendChild(sourceList);
        placesList.appendChild(sourcesSection);
    }

    if (place.events?.length) {
        const eventsSection = document.createElement('section');
        eventsSection.className = 'place-section';
        const eventsTitle = document.createElement('h4');
        eventsTitle.textContent = 'Profile Facts';
        eventsSection.appendChild(eventsTitle);

        const eventList = document.createElement('div');
        eventList.className = 'place-event-list';
        place.events.slice(0, 30).forEach((event) => {
            const row = document.createElement('div');
            row.className = 'place-event-row';
            row.textContent = `${event.type}${event.date ? `, ${event.date}` : ''} · ${event.personName}`;
            eventList.appendChild(row);
        });
        eventsSection.appendChild(eventList);
        placesList.appendChild(eventsSection);
    }
}

function refreshPlacePagesView() {
    if (placesSelectedId) {
        const selected = placesCache.find((place) => place.id === placesSelectedId);
        if (selected) {
            renderPlaceDetail(selected);
            return;
        }
    }
    renderPlaceIndex(getFilteredPlacePages());
}

async function openPlacePagesView({ placeName = '', scroll = true } = {}) {
    showPlacesArea();
    if (scroll) scrollToExplorePanel(placesView);

    if (!placesCache.length) {
        placesList.innerHTML = '';
        placesSummary.textContent = '';
        setPlacesStatus('Loading place pages...');
        try {
            await ensurePlacePagesLoaded();
            setPlacesStatus();
        } catch (error) {
            console.error('Place Pages data load failed:', error);
            placesSummary.textContent = '';
            placesList.innerHTML = '';
            setPlacesStatus('Could not load place pages right now. Please try again.', 'error');
            return;
        }
    }

    if (placeName) {
        const match = findPlacePageByName(placeName);
        if (match) {
            placesSelectedId = match.id;
            placesSearchInput.value = '';
            placesRecordTypeFilter.value = 'all';
        } else {
            placesSelectedId = '';
            placesSearchInput.value = placeName;
        }
    }

    refreshPlacePagesView();
}

[
    sourcesTypeFilter,
    sourcesPlaceFilter,
    sourcesYearStartFilter,
    sourcesYearEndFilter
].forEach((element) => {
    element.addEventListener('input', () => {
        if (!citedSourcesCache.length) return;
        refreshCitedSourcesView();
    });
});

sourcesHasExternalFilter.addEventListener('change', () => {
    if (!citedSourcesCache.length) return;
    refreshCitedSourcesView();
});

[placesSearchInput, placesRecordTypeFilter].forEach((element) => {
    element.addEventListener('input', () => {
        if (!placesCache.length) return;
        placesSelectedId = '';
        refreshPlacePagesView();
    });
});

backToSearchBtn.addEventListener('click', () => {
    // When navigating back to a previous profile via family chip, re-open it directly.
    if (profileOpenedFrom === 'profile' && previousProfileResult) {
        const prevResult = previousProfileResult;
        const prevOpenedFrom = previousProfileOpenedFrom;
        previousProfileResult = null;
        previousProfileName = '';
        previousProfileOpenedFrom = 'home';
        profileOpenedFrom = prevOpenedFrom;
        openPersonProfile(prevResult);
        return;
    }

    // Clear previous-profile state whenever leaving profile view through any other path.
    previousProfileResult = null;
    previousProfileName = '';
    previousProfileOpenedFrom = 'home';

    currentProfileName = '';
    currentProfilePersonId = '';
    currentProfileEditVersion = null;
    profileDetails.innerHTML = '';
    profileDetails.classList.add('hidden');
    profileFamily.innerHTML = '';
    profileFamily.classList.add('hidden');
    profilePhotos.innerHTML = '';
    profilePhotos.classList.add('hidden');
    if (profileHeroThumb) {
        profileHeroThumb.src = '';
        profileHeroThumb.classList.add('hidden');
    }
    updateEditProfileButtonVisibility();
    showContentArea();
    if (profileOpenedFrom === 'gallery') {
        showOnlyContentPanel(photoGallery);
    } else if (profileOpenedFrom === 'sources') {
        showSourcesArea();
    } else if (profileOpenedFrom === 'places') {
        showPlacesArea();
    } else if (profileOpenedFrom === 'research') {
        showResearchLibraryArea();
    } else if (profileOpenedFrom === 'surnames') {
        restoreSurnameBrowseView();
    } else if (profileOpenedFrom === 'tree') {
        showTreeArea();
    } else if (profileOpenedFrom === 'analytics-directory') {
        showAnalyticsArea();
    } else {
        showOnlyContentPanel();
    }
    profileOpenedFrom = 'home';
    backToSearchBtn.textContent = '← Back to Search';
});

editProfileBtn.addEventListener('click', () => {
    if (!auth.currentUser || !currentProfilePersonId) return;
    if (!requireCapability('editProfilePresentation')) return;

    const details = getDetailsForPerson(currentProfilePersonId) || {};
    editProfileNickname.value = details.nickname || '';
    editProfileNote.value = details.profileNote || '';
    currentProfileEditVersion = details.profileEditedAt || null;
    editProfileStatus.textContent = '';
    editProfileStatus.className = 'status-message';
    saveEditProfileBtn.disabled = false;
    editProfileModal.classList.remove('hidden');
    editProfileNickname.focus();
});

closeEditProfileBtn.addEventListener('click', () => {
    editProfileModal.classList.add('hidden');
});

editProfileModal.addEventListener('click', (e) => {
    if (e.target === editProfileModal) editProfileModal.classList.add('hidden');
});

saveEditProfileBtn.addEventListener('click', async () => {
    if (!requireCapability('editProfilePresentation', editProfileStatus)) return;
    if (!auth.currentUser) {
        showMessage(editProfileStatus, 'You must be signed in to edit a profile.', 'error');
        return;
    }
    if (!currentProfilePersonId) {
        showMessage(editProfileStatus, 'Cannot determine which profile is being edited.', 'error');
        return;
    }

    const savePersonProfileEdit = httpsCallable(fbFunctions, 'savePersonProfileEdit');
    saveEditProfileBtn.disabled = true;

    try {
        const response = await savePersonProfileEdit({
            personId: currentProfilePersonId,
            nickname: editProfileNickname.value,
            profileNote: editProfileNote.value,
            expectedUpdatedAt: currentProfileEditVersion
        });
        const override = response.data?.override || null;
        if (!override) {
            throw new Error('Profile edit saved without an override payload.');
        }

        applyPersonProfileOverride(currentProfilePersonId, override);
        currentProfileEditVersion = override.updatedAt || null;
        renderProfileDetails(currentProfilePersonId);
        buildSearchIndex();
        if (isAdmin && !document.getElementById('admin-tab-profile-edits').classList.contains('hidden')) {
            loadPersonEditHistory();
        } else if (isAdmin) {
            loadProfileEditsBadge();
        }

        showMessage(editProfileStatus, 'Profile update saved and logged for admin review history.', 'success');
        setTimeout(() => {
            editProfileModal.classList.add('hidden');
        }, 1000);
    } catch (error) {
        console.error('Error saving profile edit:', error);
        const code = error?.code || '';
        if (code.includes('failed-precondition')) {
            if ((error.message || '').toLowerCase().includes('read-only')) {
                showMessage(editProfileStatus, getCapabilityBlockedMessage('editProfilePresentation'), 'error');
            } else {
                showMessage(editProfileStatus, 'This profile changed since you opened it. Close the dialog, reopen the profile, and try again.', 'error');
            }
        } else if (code.includes('invalid-argument')) {
            showMessage(editProfileStatus, error.message || 'Please review the values and try again.', 'error');
        } else if (code.includes('permission-denied') || code.includes('unauthenticated')) {
            showMessage(editProfileStatus, error.message || 'You do not have permission to edit this profile.', 'error');
        } else if (code.includes('not-found') || code.includes('unavailable') || code.includes('internal')) {
            showMessage(editProfileStatus, 'Profile editing is temporarily unavailable in this environment. Try again after the backend functions deploy completes.', 'error');
        } else {
            showMessage(editProfileStatus, 'Could not save the profile edit. Please try again.', 'error');
        }
    } finally {
        saveEditProfileBtn.disabled = false;
    }
});

// ─── Browse ───────────────────────────────────────────────────────────────────

browseSurnamesBtn.addEventListener('click', () => {
    profileOpenedFrom = 'surnames';
    void openSurnameDirectoryView();
});

browsePhotosBtn.addEventListener('click', async () => {
    profileOpenedFrom = 'gallery';
    showContentArea();
    showOnlyContentPanel(photoGallery);
    const photos = await loadPhotos();
    displayPhotoGallery(photos);
    scrollToExplorePanel(photoGallery);
});

browseSourcesBtn.addEventListener('click', async () => {
    profileOpenedFrom = 'sources';
    await openCitedSourcesView();
});

browsePlacesBtn.addEventListener('click', async () => {
    profileOpenedFrom = 'places';
    await openPlacePagesView();
});

browseAnalyticsBtn.addEventListener('click', async () => {
    await openAnalyticsView();
});

backFromSourcesBtn.addEventListener('click', () => {
    showContentArea();
    showOnlyContentPanel();
});

backFromPlacesBtn.addEventListener('click', () => {
    showContentArea();
    showOnlyContentPanel();
});

browseResearchBtn.addEventListener('click', async () => {
    await openResearchLibraryForPerson(selectedResearchPersonId);
});

async function openResearchLibraryForPerson(personId) {
    await Promise.all([initializeFamilyData(), loadPersonDetails(), ensureCitedSourcesLoaded()]);
    selectedResearchPersonId = String(personId || '');
    selectedResearchFactKey = '';
    showResearchLibraryArea();
    renderResearchLibrary();
    scrollToExplorePanel(researchLibraryView);
}

backFromResearchBtn.addEventListener('click', () => {
    showContentArea();
    showOnlyContentPanel();
});

// ─── Family Message Board (read-only scaffold) ───────────────────────────────

let boardPostsUnsubscribe = null;
const BOARD_POSTS_PAGE_SIZE = 50;

browseBoardBtn.addEventListener('click', () => {
    openMessageBoard();
});

backFromBoardBtn.addEventListener('click', () => {
    closeMessageBoard();
});

function openMessageBoard() {
    if (!hasCapability('viewMessageBoard')) {
        window.alert('Your current role does not allow access to the Message Board.');
        return;
    }
    showBoardArea();
    renderBoardGovernanceBanner();
    refreshBoardComposeVisibility();
    subscribeToBoardPosts();
    scrollToExplorePanel(boardView);
}

function closeMessageBoard() {
    unsubscribeFromBoardPosts();
    resetBoardComposeState();
    showContentArea();
    showOnlyContentPanel();
}

function renderBoardGovernanceBanner() {
    if (!boardGovernanceBanner) return;
    if (isHistoricalReadOnly()) {
        boardGovernanceBanner.textContent =
            'This archive is currently in historical read-only mode. Message Board posts remain visible, but new posting and replies are disabled.';
        boardGovernanceBanner.classList.remove('hidden');
    } else {
        boardGovernanceBanner.textContent = '';
        boardGovernanceBanner.classList.add('hidden');
    }
}

function subscribeToBoardPosts() {
    unsubscribeFromBoardPosts();
    if (!boardPostsList) return;

    boardPostsList.innerHTML = '';
    if (boardStatus) {
        boardStatus.textContent = 'Loading posts…';
        boardStatus.className = 'board-status';
        boardStatus.classList.remove('hidden');
    }
    if (boardEmptyState) {
        boardEmptyState.classList.add('hidden');
    }

    const postsQuery = query(
        collection(db, 'board_posts'),
        orderBy('createdAt', 'desc'),
        limit(BOARD_POSTS_PAGE_SIZE)
    );

    boardPostsUnsubscribe = onSnapshot(
        postsQuery,
        (snapshot) => {
            const posts = snapshot.docs.map((snap) => ({ id: snap.id, ...(snap.data() || {}) }));
            renderBoardPosts(posts);
        },
        (error) => {
            console.error('Could not load message board posts:', error);
            if (boardStatus) {
                boardStatus.textContent = 'Could not load posts. Please try again.';
                boardStatus.className = 'board-status error';
                boardStatus.classList.remove('hidden');
            }
            if (boardEmptyState) {
                boardEmptyState.classList.add('hidden');
            }
        }
    );
}

function unsubscribeFromBoardPosts() {
    if (typeof boardPostsUnsubscribe === 'function') {
        boardPostsUnsubscribe();
    }
    boardPostsUnsubscribe = null;
}

function renderBoardPosts(posts) {
    if (!boardPostsList) return;

    if (boardStatus) {
        boardStatus.textContent = '';
        boardStatus.classList.add('hidden');
    }

    if (!posts.length) {
        boardPostsList.innerHTML = '';
        if (boardEmptyState) boardEmptyState.classList.remove('hidden');
        return;
    }

    if (boardEmptyState) boardEmptyState.classList.add('hidden');
    boardPostsList.innerHTML = posts.map(renderBoardPostCard).join('');
}

function renderBoardPostCard(post) {
    const authorName = escapeHtml(post.authorName || post.authorEmail || 'Family member');
    const createdAt = formatBoardTimestamp(post.createdAt);
    const body = escapeHtml(post.body || '').replace(/\n/g, '<br>');
    const rawImageUrl = typeof post.imageUrl === 'string' ? post.imageUrl : '';
    const imageUrl = /^https:\/\//i.test(rawImageUrl) ? rawImageUrl : '';
    const replyCount = Number.isFinite(post.replyCount) ? post.replyCount : 0;
    const replyLabel = replyCount === 1 ? '1 reply' : `${replyCount} replies`;

    const imageHtml = imageUrl
        ? `<div class="board-post-image"><img src="${escapeHtml(imageUrl)}" alt="Attachment"></div>`
        : '';

    const replyCountHtml = replyCount > 0
        ? `<span class="board-post-reply-count">${replyLabel}</span>`
        : '';

    return `
        <article class="board-post">
            <header class="board-post-header">
                <span class="board-post-author">${authorName}</span>
                <span class="board-post-meta">${escapeHtml(createdAt)}</span>
            </header>
            <div class="board-post-body">${body}</div>
            ${imageHtml}
            <footer class="board-post-footer">
                ${replyCountHtml}
            </footer>
        </article>
    `;
}

function formatBoardTimestamp(value) {
    const date = toDateValue(value);
    if (!date) return 'Just now';
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

// ─── Board compose ──────────────────────────────────────────────────────────

const BOARD_MAX_BODY_CHARS = 4000;
const BOARD_MAX_AUTHOR_NAME_CHARS = 80;
const BOARD_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

let boardSelectedFile = null;
let boardSubmitting = false;

function refreshBoardComposeVisibility() {
    if (!boardCompose) return;
    const canPost = hasCapability('postMessages');
    boardCompose.classList.toggle('hidden', !canPost);
    if (!canPost) {
        resetBoardComposeState();
    }
    updateBoardComposeSubmitState();
}

function resetBoardComposeState() {
    if (boardComposeBody) boardComposeBody.value = '';
    if (boardComposeCounter) boardComposeCounter.textContent = `0 / ${BOARD_MAX_BODY_CHARS}`;
    clearBoardComposeImage();
    setBoardComposeStatus('', '');
    hideBoardComposeProgress();
    boardSubmitting = false;
}

function clearBoardComposeImage() {
    boardSelectedFile = null;
    if (boardComposeFileInput) boardComposeFileInput.value = '';
    if (boardComposeImagePreview) boardComposeImagePreview.classList.add('hidden');
    if (boardComposeImageThumb) boardComposeImageThumb.src = '';
}

function setBoardComposeStatus(message, type) {
    if (!boardComposeStatus) return;
    if (!message) {
        boardComposeStatus.textContent = '';
        boardComposeStatus.className = 'board-compose-status hidden';
        return;
    }
    boardComposeStatus.textContent = message;
    boardComposeStatus.className = `board-compose-status${type ? ' ' + type : ''}`;
}

function showBoardComposeProgress(percent) {
    if (!boardComposeProgressWrap || !boardComposeProgressBar) return;
    boardComposeProgressWrap.classList.remove('hidden');
    boardComposeProgressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function hideBoardComposeProgress() {
    if (!boardComposeProgressWrap || !boardComposeProgressBar) return;
    boardComposeProgressWrap.classList.add('hidden');
    boardComposeProgressBar.style.width = '0%';
}

function updateBoardComposeSubmitState() {
    if (!boardComposeSubmitBtn) return;
    const body = (boardComposeBody?.value || '').trim();
    const canSubmit = body.length > 0
        && body.length <= BOARD_MAX_BODY_CHARS
        && !boardSubmitting
        && hasCapability('postMessages');
    boardComposeSubmitBtn.disabled = !canSubmit;
}

function getBoardAuthorDisplayName() {
    const raw = currentUser?.displayName
        || currentUser?.email
        || 'Family member';
    return String(raw).slice(0, BOARD_MAX_AUTHOR_NAME_CHARS);
}

if (boardComposeBody) {
    boardComposeBody.addEventListener('input', () => {
        const length = boardComposeBody.value.length;
        if (boardComposeCounter) {
            boardComposeCounter.textContent = `${length} / ${BOARD_MAX_BODY_CHARS}`;
        }
        updateBoardComposeSubmitState();
    });

    boardComposeBody.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            submitBoardPost();
        }
    });
}

if (boardComposeAttachBtn && boardComposeFileInput) {
    boardComposeAttachBtn.addEventListener('click', () => {
        boardComposeFileInput.click();
    });
}

if (boardComposeFileInput) {
    boardComposeFileInput.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            clearBoardComposeImage();
            return;
        }
        if (!file.type.startsWith('image/')) {
            setBoardComposeStatus('Only image files can be attached.', 'error');
            clearBoardComposeImage();
            return;
        }
        if (file.size > BOARD_MAX_IMAGE_BYTES) {
            setBoardComposeStatus('Image must be 10 MB or smaller.', 'error');
            clearBoardComposeImage();
            return;
        }
        boardSelectedFile = file;
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            if (boardComposeImageThumb) boardComposeImageThumb.src = readerEvent.target.result;
            if (boardComposeImagePreview) boardComposeImagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        setBoardComposeStatus('', '');
    });
}

if (boardComposeRemoveImageBtn) {
    boardComposeRemoveImageBtn.addEventListener('click', () => {
        clearBoardComposeImage();
    });
}

if (boardComposeSubmitBtn) {
    boardComposeSubmitBtn.addEventListener('click', () => {
        submitBoardPost();
    });
}

async function uploadBoardImage(file, postId) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `board/${postId}/${timestamp}_${safeName}`;
    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file, { contentType: file.type });

    return new Promise((resolve, reject) => {
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                showBoardComposeProgress(pct);
            },
            (error) => reject(error),
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ downloadURL, storagePath: path });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

async function submitBoardPost() {
    if (boardSubmitting) return;
    if (!requireCapability('postMessages', boardComposeStatus)) return;
    if (!currentUser?.email) {
        setBoardComposeStatus('You must be signed in to post.', 'error');
        return;
    }

    const body = (boardComposeBody?.value || '').trim();
    if (!body || body.length > BOARD_MAX_BODY_CHARS) {
        setBoardComposeStatus(`Post must be 1 to ${BOARD_MAX_BODY_CHARS} characters.`, 'error');
        return;
    }

    boardSubmitting = true;
    updateBoardComposeSubmitState();
    setBoardComposeStatus(boardSelectedFile ? 'Uploading photo…' : 'Posting…', '');
    hideBoardComposeProgress();

    try {
        const postRef = doc(collection(db, 'board_posts'));
        let imageUrl = null;
        let imageStoragePath = null;

        if (boardSelectedFile) {
            const uploaded = await uploadBoardImage(boardSelectedFile, postRef.id);
            imageUrl = uploaded.downloadURL;
            imageStoragePath = uploaded.storagePath;
        }

        const payload = {
            authorEmail: currentUser.email,
            authorName: getBoardAuthorDisplayName(),
            body,
            createdAt: serverTimestamp(),
            replyCount: 0
        };
        if (imageUrl) {
            payload.imageUrl = imageUrl;
            payload.imageStoragePath = imageStoragePath;
        }

        await setDoc(postRef, payload);

        resetBoardComposeState();
        setBoardComposeStatus('Posted.', 'success');
        updateBoardComposeSubmitState();
        setTimeout(() => {
            if (boardComposeStatus && boardComposeStatus.textContent === 'Posted.') {
                setBoardComposeStatus('', '');
            }
        }, 3000);
    } catch (error) {
        console.error('Could not post to message board:', error);
        hideBoardComposeProgress();
        const message = error?.code === 'permission-denied'
            ? 'You do not have permission to post right now.'
            : 'Could not post. Please check your connection and try again.';
        setBoardComposeStatus(message, 'error');
        boardSubmitting = false;
        updateBoardComposeSubmitState();
    }
}

browseTreeBtn.addEventListener('click', async () => {
    showTreeArea();
    scrollToExplorePanel(treeView);
    await Promise.all([loadPersonDetails(), loadPersonFamily()]);
    if (!linkedPersonId) {
        treeFocusPersonId = null;
        treeLastPersonId = null;
        treeStatus.textContent = 'Your account is not yet linked to a family member.';
        treeStatus.classList.remove('hidden');
        return;
    }
    treeFocusPersonId = String(linkedPersonId);
    treeLastPersonId = String(linkedPersonId);
    treeCurrentDepth = TREE_DEFAULT_ENTRY_DEPTH;
    treeExpandedPersonId = null;
    treeSelectedPersonId = null;
    selectedRelationshipTrace = null;
    await initTree({ initialFocus: true });
    scrollToExplorePanel(treeView);
});

backFromTreeBtn.addEventListener('click', () => {
    // If we arrived at the tree via "View in Tree" from a profile, return to that profile.
    if (treeReturnPersonId) {
        const pid = treeReturnPersonId;
        const openedFrom = treeReturnProfileOpenedFrom;
        treeReturnPersonId = null;
        treeReturnProfileOpenedFrom = 'home';
        const result = getPersonById(pid);
        if (result) {
            profileOpenedFrom = openedFrom;
            openPersonProfile(result);
            return;
        }
    }
    showContentArea();
    showOnlyContentPanel();
});

treeLegendBtn.addEventListener('click', toggleTreeLegend);

function displayPhotoGallery(photos) {
    photoGallery.innerHTML = '<h2>Photo Gallery</h2><div class="gallery-grid"></div>';
    const grid = photoGallery.querySelector('.gallery-grid');

    const validPhotos = photos.filter(p => isValidFamilyTreeUrl(p.path));
    const loadErrors = getDataLoadErrors();

    if (!validPhotos.length) {
        const empty = document.createElement('p');
        empty.className = 'gallery-empty';
        empty.textContent = loadErrors.photoCatalog
            ? 'Photo catalog is temporarily unavailable. The Firebase Storage data files are missing or failed to load.'
            : 'No photos available.';
        grid.appendChild(empty);
        photoGallery.classList.remove('hidden');
        return;
    }

    validPhotos.forEach((photo, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = photo.path;
        img.alt = photo.name;
        img.loading = 'lazy';

        const caption = document.createElement('div');
        caption.className = 'gallery-item-caption';
        caption.textContent = photo.name;

        item.appendChild(img);
        item.appendChild(caption);
        item.addEventListener('click', () => openLightbox(
            validPhotos.map(p => ({ path: p.path, caption: p.name, file: p.name })),
            index
        ));
        grid.appendChild(item);
    });

    photoGallery.classList.remove('hidden');
}

// ─── Family Tree ─────────────────────────────────────────────────────────────

const TREE_MODE_LABELS = {
    family: 'Family',
    pedigree: 'Pedigree',
    descendants: 'Descendants',
    branch: 'Branch'
};

// ─── Visualization modes ─────────────────────────────────────────────────────
// The registry in tree-modes/ is the mode contract boundary.  Existing
// Bloodline/Household/Explore behavior remains here, while new modes provide
// descriptors and focused data hooks instead of adding another monolithic view.

// Render priority levels — lower number = higher visual priority
const RENDER_PRIORITY = {
    FOCAL_USER:         1,
    DIRECT_BLOODLINE:   2,
    HOUSEHOLD_CORE:     3,
    LOCAL_COLLATERAL:   4,
    DISTANT_COLLATERAL: 5,
    BACKGROUND:         6
};

let cy = null;
let treeMaxDepth = 0;
const TREE_DEFAULT_ENTRY_DEPTH = 6;
let treeCurrentDepth = TREE_DEFAULT_ENTRY_DEPTH;
let treeViewport = null;       // { zoom, pan } snapshotted before leaving tree for a profile
let treeLastPersonId = null;   // personId of the last tapped node
let treeKeyboardWired = false; // keyboard listener is registered once
let treeSavedLayout = {};      // { nodeId: { x, y } } loaded from Firestore; empty = no saved layout
let treeLayoutChanges = {};   // accumulated node changes within the current debounce window
let treeSaveTimer = null;      // debounce handle for dragfree writes
let clusterDragActive = false;    // true when a multi-node cluster drag is in progress
let clusterStartPositions = {};   // { nodeId: { x, y } } snapshots at drag start
let treeLayoutPersistenceEnabled = true;
let treeLayoutPermissionNotified = false;
let treeFocusPersonId = null;
let treeMode = 'family';
let treeGraphData = null;
let treeExpandedPersonId = null;
let treeReturnPersonId = null;        // personId to return to when Back is pressed from tree (set by "View in Tree" from a profile)
let treeReturnProfileOpenedFrom = 'home'; // profileOpenedFrom to restore when returning to a profile from tree

// ─── Visualization mode state ────────────────────────────────────────────────
let vizMode = VIZ_MODE.BLOODLINE;               // active visualization overlay mode
let bloodlineLockActive = true;                  // when true, bloodline highlighting is persistent
let bloodlinePathData = [];                      // result of computeBloodlinePath(linkedPersonId)
let bloodlinePersonIds = new Set();              // direct-line person IDs
let bloodlineFamilyIds = new Set();              // family IDs on the direct line
let bloodlineHouseholdSpouseIds = new Set();     // spouses of direct-line ancestors
let collateralCollapsed = false;                 // whether collateral relatives are visually collapsed
let relationshipLensData = new Map();            // personId -> relationship metadata relative to linkedPersonId
let treeSelectedPersonId = null;                  // tapped/expanded person whose route should stay highlighted
let selectedRelationshipTrace = null;             // cached visible graph path from linkedPersonId to treeSelectedPersonId

const TREE_NODE_BASE_WIDTH = 160;
const TREE_NODE_BASE_HEIGHT = 48;
const TREE_NODE_EXPANDED_WIDTH = 270;
const TREE_NODE_EXPANDED_HEIGHT = 158;
const TREE_SELECTED_READABLE_FONT_PX = 9;
const TREE_SELECTED_READABLE_DESKTOP_ZOOM = 0.9;
const TREE_SELECTED_READABLE_NARROW_ZOOM = 0.86;
const TREE_ENTRY_FOCUS_DEPTH = 2;
const TREE_ENTRY_DESKTOP_ZOOM = 0.82;
const TREE_ENTRY_NARROW_ZOOM = 0.74;

const DAGRE_OPTS = {
    name: 'dagre',
    rankDir: 'BT',
    rankSep: 90,
    nodeSep: 18,
    edgeSep: 8,
    animate: false,
    fit: true,
    padding: 32
};

const CY_STYLE = [
    // Person nodes
    {
        selector: 'node[?personId]',
        style: {
            'shape': 'round-rectangle',
            'width': 'data(nodeWidth)',
            'height': 'data(nodeHeight)',
            'background-color': '#eef5f5',
            'border-color': '#008080',
            'border-width': 1.5,
            'label': 'data(treeLabel)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-family': 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
            'color': '#333',
            'text-wrap': 'wrap',
            'text-max-width': '146px',
            'text-overflow-wrap': 'anywhere'
        }
    },
    // Expanded in-tree person card
    {
        selector: 'node[?isExpanded][?personId]',
        style: {
            'width': 'data(nodeWidth)',
            'height': 'data(nodeHeight)',
            'background-color': '#ffffff',
            'border-color': '#006666',
            'border-width': 3,
            'font-size': '10px',
            'text-max-width': '248px',
            'text-valign': 'center',
            'text-halign': 'center',
            'padding': '8px'
        }
    },
    // Living person nodes
    {
        selector: 'node[?living][?personId]',
        style: {
            'background-color': '#d8f0e8',
            'border-color': '#28a745',
            'border-width': 2
        }
    },
    // Root nodes (living + childless)
    {
        selector: 'node[?isRoot]',
        style: {
            'border-width': 3,
            'border-color': '#006666',
            'background-color': '#b8e8d8'
        }
    },
    // Male
    {
        selector: 'node[sex="Male"][?personId]',
        style: { 'border-color': '#5b8fc9' }
    },
    // Female
    {
        selector: 'node[sex="Female"][?personId]',
        style: { 'border-color': '#c97ca0' }
    },
    // Living male / female override border
    {
        selector: 'node[?living][sex="Male"]',
        style: { 'border-color': '#3a7abf' }
    },
    {
        selector: 'node[?living][sex="Female"]',
        style: { 'border-color': '#b0558a' }
    },
    // Root override always wins
    {
        selector: 'node[?isRoot]',
        style: { 'border-color': '#006666' }
    },
    // Couple nodes (small dots between generations)
    {
        selector: 'node[?isCouple]',
        style: {
            'shape': 'ellipse',
            'width': 10,
            'height': 10,
            'background-color': '#888',
            'border-width': 0,
            'label': ''
        }
    },
    // Edges
    {
        selector: 'edge',
        style: {
            'width': 1.5,
            'line-color': '#aac5c5',
            'target-arrow-color': '#aac5c5',
            'target-arrow-shape': 'none',
            'curve-style': 'bezier'
        }
    },
    // Highlighted (search result)
    {
        selector: 'node.highlighted',
        style: {
            'border-color': '#e07b00',
            'border-width': 4,
            'background-color': '#fff3cd'
        }
    },
    // Linked user — current logged-in user's family member
    {
        selector: 'node.linked-user',
        style: {
            'border-color': '#6c3fb5',
            'border-width': 4,
            'background-color': '#ede8f8',
            'z-index': 999
        }
    },
    // Selected nodes — amber highlight during cluster selection and move
    {
        selector: 'node:selected',
        style: {
            'border-color': '#d97706',
            'border-width': 3,
            'overlay-color': '#d97706',
            'overlay-opacity': 0.12,
            'z-index': 998
        }
    },

    // ─── Render priority: collateral de-emphasis ─────────────────────────────
    // Applied in Bloodline / Household modes to fade non-primary context
    {
        selector: 'node.rp-collateral',
        style: {
            'opacity': 0.45,
            'z-index': 1
        }
    },
    {
        selector: 'edge.rp-collateral',
        style: {
            'opacity': 0.25,
            'width': 1,
            'z-index': 1
        }
    },
    // Distant collateral — stronger fade
    {
        selector: 'node.rp-distant',
        style: {
            'opacity': 0.3,
            'z-index': 0
        }
    },
    {
        selector: 'edge.rp-distant',
        style: {
            'opacity': 0.15,
            'width': 0.75,
            'z-index': 0
        }
    },

    // ─── Render priority: household core ─────────────────────────────────────
    // Spouses of direct-line ancestors
    {
        selector: 'node.rp-household',
        style: {
            'opacity': 0.85,
            'z-index': 5
        }
    },

    // ─── Bloodline highlighting ──────────────────────────────────────────────
    // Direct bloodline person nodes
    {
        selector: 'node.bloodline',
        style: {
            'border-width': 3.5,
            'border-color': '#b45309',
            'background-color': '#fef3c7',
            'z-index': 900,
            'opacity': 1
        }
    },
    // Bloodline + male
    {
        selector: 'node.bloodline[sex="Male"]',
        style: {
            'border-color': '#92600f',
            'background-color': '#fef9e7'
        }
    },
    // Bloodline + female
    {
        selector: 'node.bloodline[sex="Female"]',
        style: {
            'border-color': '#a0522d',
            'background-color': '#fdf2e9'
        }
    },
    // Bloodline couple nodes — the small dots on the direct line
    {
        selector: 'node.bloodline-couple',
        style: {
            'background-color': '#b45309',
            'width': 14,
            'height': 14,
            'z-index': 890,
            'opacity': 1
        }
    },
    // Bloodline edges — primary lineage connectors
    // Uses taxi routing for clean right-angle paths through generation bands
    {
        selector: 'edge.bloodline-edge',
        style: {
            'width': 3.5,
            'line-color': '#d97706',
            'target-arrow-color': '#d97706',
            'curve-style': 'taxi',
            'taxi-direction': 'vertical',
            'taxi-turn': '50%',
            'z-index': 900,
            'opacity': 1
        }
    },
    // Household core edges (bloodline-adjacent)
    {
        selector: 'edge.household-edge',
        style: {
            'width': 2,
            'line-color': '#92857a',
            'curve-style': 'taxi',
            'taxi-direction': 'vertical',
            'taxi-turn': '50%',
            'z-index': 500,
            'opacity': 0.8
        }
    },

    // ─── Collapsed collateral chip ──────────────────────────────────────────
    {
        selector: 'node.collapsed-chip',
        style: {
            'shape': 'round-rectangle',
            'width': 90,
            'height': 26,
            'background-color': '#e2e8f0',
            'border-color': '#94a3b8',
            'border-width': 1,
            'font-size': '9px',
            'color': '#64748b',
            'label': 'data(chipLabel)',
            'text-valign': 'center',
            'text-halign': 'center',
            'z-index': 2
        }
    },

    // ─── Household grouping visual ──────────────────────────────────────────
    {
        selector: 'node.household-group',
        style: {
            'shape': 'round-rectangle',
            'background-color': 'rgba(255, 251, 235, 0.6)',
            'border-color': '#d4a574',
            'border-width': 1.5,
            'border-style': 'dashed',
            'z-index': -1,
            'label': '',
            'opacity': 0.7
        }
    },

    // ─── Focal user — strongest emphasis ─────────────────────────────────────
    // Must come after bloodline so it takes priority
    {
        selector: 'node.linked-user.bloodline',
        style: {
            'border-color': '#7c2d12',
            'border-width': 5,
            'background-color': '#fed7aa',
            'z-index': 1000
        }
    },

    // ─── Relationship Lens relatedness buckets ──────────────────────────────
    // Buckets intentionally use broad steps rather than a fine gradient; the
    // displayed relatedness is an expected autosomal approximation, not a DNA
    // test result.
    {
        selector: 'node.relationship-lens-node',
        style: {
            'border-width': 2.5,
            'opacity': 1,
            'z-index': 760
        }
    },
    {
        selector: 'node.rl-self',
        style: {
            'background-color': '#0f766e',
            'border-color': '#042f2e',
            'color': '#ffffff',
            'border-width': 5,
            'z-index': 980
        }
    },
    {
        selector: 'node.rl-close',
        style: {
            'background-color': '#115e59',
            'border-color': '#0f3f3b',
            'color': '#ffffff',
            'z-index': 940
        }
    },
    {
        selector: 'node.rl-strong',
        style: {
            'background-color': '#2dd4bf',
            'border-color': '#0f766e',
            'color': '#073b36',
            'z-index': 920
        }
    },
    {
        selector: 'node.rl-medium',
        style: {
            'background-color': '#99f6e4',
            'border-color': '#14b8a6',
            'color': '#134e4a',
            'z-index': 900
        }
    },
    {
        selector: 'node.rl-light',
        style: {
            'background-color': '#ccfbf1',
            'border-color': '#5eead4',
            'color': '#134e4a',
            'z-index': 880
        }
    },
    {
        selector: 'node.rl-distant',
        style: {
            'background-color': '#f0fdfa',
            'border-color': '#99f6e4',
            'color': '#134e4a',
            'z-index': 860
        }
    },
    {
        selector: 'node.rl-marriage',
        style: {
            'background-color': '#e5e7eb',
            'border-color': '#6b7280',
            'color': '#374151',
            'border-style': 'dashed',
            'z-index': 720
        }
    },
    {
        selector: 'node.rl-unknown',
        style: {
            'background-color': '#f8fafc',
            'border-color': '#cbd5e1',
            'color': '#64748b',
            'opacity': 0.72,
            'z-index': 700
        }
    },
    {
        selector: 'node.relationship-lens-couple',
        style: {
            'background-color': '#94a3b8',
            'opacity': 0.78
        }
    },
    {
        selector: 'edge.relationship-lens-edge',
        style: {
            'line-color': '#94a3b8',
            'opacity': 0.55
        }
    },

    // ─── Relationship path highlighting (click-to-trace) ─────────────────────
    // Shown when a user clicks any person — traces the relationship path
    // from the authenticated user to the clicked node through the visible graph.
    {
        selector: 'node.path-highlight[?personId]',
        style: {
            'opacity': 1,
            'border-color': '#312e81',
            'border-width': 4,
            'background-color': '#e0e7ff',
            'color': '#111827',
            'z-index': 1100,
            'shadow-blur': 14,
            'shadow-color': '#4338ca',
            'shadow-opacity': 0.28
        }
    },
    {
        selector: 'node.path-highlight[?isCouple]',
        style: {
            'opacity': 1,
            'background-color': '#312e81',
            'width': 16,
            'height': 16,
            'z-index': 1090,
            'shadow-blur': 12,
            'shadow-color': '#4338ca',
            'shadow-opacity': 0.32
        }
    },
    {
        selector: 'edge.path-highlight',
        style: {
            'width': 5,
            'line-color': '#312e81',
            'target-arrow-color': '#312e81',
            'opacity': 1,
            'z-index': 1080,
            'curve-style': 'taxi',
            'taxi-direction': 'vertical',
            'taxi-turn': '50%'
        }
    },
    // The logged-in user's node when it is part of the selected route.
    {
        selector: 'node.path-self[?personId]',
        style: {
            'border-color': '#581c87',
            'border-width': 5,
            'background-color': '#f3e8ff',
            'z-index': 1120
        }
    },
    // The clicked target person — strongest indigo emphasis
    {
        selector: 'node.path-target',
        style: {
            'opacity': 1,
            'border-color': '#1e1b4b',
            'border-width': 5,
            'background-color': '#c7d2fe',
            'z-index': 1130,
            'shadow-blur': 18,
            'shadow-color': '#312e81',
            'shadow-opacity': 0.4
        }
    },
    // Breadcrumb-focused node — full visibility, warm highlight
    {
        selector: 'node.breadcrumb-focus',
        style: {
            'opacity': 1,
            'border-color': '#b45309',
            'border-width': 4,
            'z-index': 970
        }
    }
];

// ─── Tree layout persistence ──────────────────────────────────────────────────
// Positions are stored in Firestore at tree_layouts/{userEmail} as a flat map
// { nodeId: { x, y } }.  Only the current user can read or write their own doc.
//
// Flow:
//  1. loadTreeLayout()    — called once when tree is first opened; fills treeSavedLayout
//  2. overlayTreeLayout() — called after runFamilyLayout(); moves any node whose id
//                           exists in treeSavedLayout to the saved position
//  3. saveTreeLayout()    — debounced; called on every dragfree event; writes only the
//                           moved node's position (merges with existing doc via setDoc merge)
//  4. resetTreeLayout()   — deletes the Firestore doc and re-runs the default layout

function isPermissionDeniedError(err) {
    return err?.code === 'permission-denied' || /insufficient permissions/i.test(err?.message || '');
}

function disableTreeLayoutPersistence(message = 'Custom tree layouts are unavailable for this account.') {
    treeLayoutPersistenceEnabled = false;
    treeLayoutChanges = {};
    clearTimeout(treeSaveTimer);

    if (!treeLayoutPermissionNotified) {
        treeLayoutPermissionNotified = true;
        console.info(message);
    }

    treeResetLayoutBtn.disabled = true;
    treeResetLayoutBtn.title = message;
    treeSetDefaultBtn.disabled = true;
    treeSetDefaultBtn.title = message;

    if (!treeView.classList.contains('hidden')) {
        treeStatus.textContent = message;
        treeStatus.classList.remove('hidden');
    }
}

async function loadTreeLayout() {
    treeSavedLayout = {};
    if (!currentUser) return;
    try {
        const snap = await getDoc(doc(db, 'tree_layouts', currentUser.email));
        if (snap.exists() && Object.keys(snap.data() || {}).length > 0) {
            treeSavedLayout = snap.data();
            return;
        }
        // No personal layout — fall back to the admin-set default
        const defaultSnap = await getDoc(doc(db, 'tree_layouts', '_default'));
        if (defaultSnap.exists()) treeSavedLayout = defaultSnap.data() || {};
    } catch (err) {
        if (isPermissionDeniedError(err)) {
            disableTreeLayoutPersistence();
            return;
        }
        console.warn('Could not load tree layout:', err);
    }
}

function overlayTreeLayout() {
    if (!cy || !Object.keys(treeSavedLayout).length) return;
    cy.nodes().forEach(n => {
        const saved = treeSavedLayout[n.id()];
        if (saved && n.style('display') !== 'none') {
            n.position({ x: saved.x, y: saved.y });
        }
    });
}

function saveTreeLayout(nodeId, pos) {
    if (!currentUser || !treeLayoutPersistenceEnabled) return;
    // Update local cache and accumulate into the current debounce batch
    treeSavedLayout[nodeId] = { x: pos.x, y: pos.y };
    treeLayoutChanges[nodeId] = { x: pos.x, y: pos.y };
    clearTimeout(treeSaveTimer);
    treeSaveTimer = setTimeout(async () => {
        const changesToSend = treeLayoutChanges;
        treeLayoutChanges = {};  // reset for next batch
        if (!Object.keys(changesToSend).length) return;
        try {
            await setDoc(
                doc(db, 'tree_layouts', currentUser.email),
                changesToSend,
                { merge: true }
            );
        } catch (err) {
            if (isPermissionDeniedError(err)) {
                disableTreeLayoutPersistence();
                return;
            }
            console.warn('Could not save tree layout:', err);
        }
    }, 800);
}

async function resetTreeLayout() {
    treeSavedLayout = {};
    treeLayoutChanges = {};
    clearTimeout(treeSaveTimer);
    if (!treeLayoutPersistenceEnabled) {
        applyTreeDepth(treeCurrentDepth);
        return;
    }
    if (currentUser) {
        try {
            await deleteDoc(doc(db, 'tree_layouts', currentUser.email));
        } catch (err) {
            if (isPermissionDeniedError(err)) {
                disableTreeLayoutPersistence();
                applyTreeDepth(treeCurrentDepth);
                return;
            }
            console.warn('Could not reset tree layout:', err);
        }
    }
    applyTreeDepth(treeCurrentDepth);
}

// ─── Admin: Save current layout as default for all users ─────────────────────

async function openSaveDefaultLayoutModal() {
    const modal = document.getElementById('save-default-layout-modal');
    const userList = document.getElementById('save-default-user-list');
    const status = document.getElementById('save-default-status');
    status.textContent = '';
    status.className = 'status-message';
    userList.innerHTML = '<p class="queue-empty">Checking user layouts\u2026</p>';
    modal.classList.remove('hidden');

    try {
        // Fetch all authorized users except the admin
        const usersSnap = await getDocs(collection(db, 'authorized_users'));
        const otherEmails = [];
        usersSnap.forEach(d => { if (d.id !== currentUser.email) otherEmails.push(d.id); });

        // Check which users already have a personal layout saved
        const checks = await Promise.all(otherEmails.map(async email => {
            const snap = await getDoc(doc(db, 'tree_layouts', email));
            return { email, hasCustom: snap.exists() && Object.keys(snap.data() || {}).length > 0 };
        }));

        userList.innerHTML = '';
        const withCustom = checks.filter(c => c.hasCustom);

        if (withCustom.length === 0) {
            userList.innerHTML = '<p class="queue-empty">No users have a custom layout \u2014 all will use the new default.</p>';
        } else {
            const intro = document.createElement('p');
            intro.className = 'save-default-list-label';
            intro.textContent = `${withCustom.length} user(s) have a saved custom layout:`;
            userList.appendChild(intro);

            withCustom.forEach(({ email }) => {
                const row = document.createElement('label');
                row.className = 'save-default-user-row';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.dataset.email = email;
                cb.className = 'save-default-skip-cb';
                row.appendChild(cb);
                row.append(` Skip \u2014 preserve ${email}\u2019s custom layout`);
                userList.appendChild(row);
            });
        }
    } catch (err) {
        if (isPermissionDeniedError(err)) {
            status.textContent = isAdmin
                ? 'Could not inspect saved user layouts. You can still save a new default, but existing custom layouts will not be reset from this dialog.'
                : 'You do not have permission to manage shared tree layouts.';
            status.className = 'status-message error';
            userList.innerHTML = isAdmin
                ? '<p class="queue-empty">User layout details are unavailable. Saving will update the shared default only.</p>'
                : '<p class="queue-empty">Shared tree layouts are unavailable for this account.</p>';
            if (!isAdmin) {
                disableTreeLayoutPersistence('Tree layout admin controls are unavailable for this account.');
            }
            return;
        }
        console.error('Could not load shared tree layout options:', err);
        status.textContent = 'Could not load shared tree layout options.';
        status.className = 'status-message error';
        userList.innerHTML = '<p class="queue-empty">Unable to load user layout details right now.</p>';
    }
}

async function executeSaveDefaultLayout() {
    const status = document.getElementById('save-default-status');
    const confirmBtn = document.getElementById('confirm-save-default-btn');
    confirmBtn.disabled = true;
    status.textContent = 'Saving\u2026';
    status.className = 'status-message';

    const skipSet = new Set(
        [...document.querySelectorAll('.save-default-skip-cb:checked')].map(cb => cb.dataset.email)
    );

    try {
        captureCurrentTreeLayout();
        // Write admin's current layout to _default
        await setDoc(doc(db, 'tree_layouts', '_default'), treeSavedLayout);

        // Delete personal layout docs for non-skipped users so they fall back to _default
        const allCbs = [...document.querySelectorAll('.save-default-skip-cb')];
        await Promise.all(
            allCbs.filter(cb => !cb.checked)
                  .map(cb => deleteDoc(doc(db, 'tree_layouts', cb.dataset.email)))
        );

        const reset = allCbs.length - skipSet.size;
        const skipped = skipSet.size;
        status.textContent = `Default saved. ${reset} user layout(s) reset; ${skipped} skipped.`;
        status.className = 'status-message success';
        setTimeout(() => document.getElementById('save-default-layout-modal').classList.add('hidden'), 2400);
    } catch (err) {
        if (isPermissionDeniedError(err)) {
            status.textContent = 'You do not have permission to save or reset shared tree layouts.';
            status.className = 'status-message error';
            if (!isAdmin) {
                disableTreeLayoutPersistence('Tree layout admin controls are unavailable for this account.');
            }
            return;
        }
        console.error('Save default layout failed:', err);
        status.textContent = 'Error saving default layout. See console.';
        status.className = 'status-message error';
    } finally {
        confirmBtn.disabled = false;
    }
}

function captureCurrentTreeLayout() {
    if (!cy) return;
    cy.nodes().forEach(node => {
        const pos = node.position();
        treeSavedLayout[node.id()] = { x: pos.x, y: pos.y };
    });
}

function extractPersonIdFromLink(link) {
    const match = link && link.match(/#P(\d+)/);
    return match ? String(match[1]) : null;
}

function getTreeDepthMinimum() {
    return treeMode === 'family' || treeMode === 'branch' ? 1 : 0;
}

function getTreeBuildOptions() {
    const effectiveDepth = Math.max(treeCurrentDepth, getTreeDepthMinimum());
    const focusPersonId = vizMode === VIZ_MODE.RELATIONSHIP_LENS && linkedPersonId
        ? linkedPersonId
        : treeFocusPersonId || linkedPersonId || treeLastPersonId || null;

    if (treeMode === 'pedigree') {
        return {
            focusPersonId,
            mode: treeMode,
            upDepth: effectiveDepth,
            downDepth: 0,
            lateralDepth: 0,
            includeSpouses: true,
            includeSiblings: false
        };
    }

    if (treeMode === 'descendants') {
        return {
            focusPersonId,
            mode: treeMode,
            upDepth: 0,
            downDepth: effectiveDepth,
            lateralDepth: 0,
            includeSpouses: true,
            includeSiblings: false
        };
    }

    return {
        focusPersonId,
        mode: treeMode,
        upDepth: effectiveDepth,
        downDepth: effectiveDepth,
        lateralDepth: treeMode === 'branch' ? Math.max(2, Math.min(3, effectiveDepth + 1)) : 1,
        includeSpouses: true,
        includeSiblings: true
    };
}

function updateTreeModeUI() {
    treeModeBtns.forEach(btn => {
        const active = btn.dataset.treeMode === treeMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
    });
}

function updateTreeToolbarTitle() {
    const titleEl = document.querySelector('.tree-toolbar-title');
    if (!titleEl) return;
    const focusName = treeGraphData?.focusPersonId
        ? (getDetailsForPerson(treeGraphData.focusPersonId)?.name || 'Family Tree')
        : 'Family Tree';
    const vizLabel = VIZ_MODE_LABELS[vizMode] || '';
    const dataLabel = TREE_MODE_LABELS[treeMode] || 'Family';
    titleEl.textContent = `Family Tree — ${focusName} · ${vizLabel} · ${dataLabel}`;
}

function formatTreeEventLine(event) {
    if (!event) return '';
    const parts = [event.type, event.date, event.place || event.details]
        .map(part => String(part || '').trim())
        .filter(Boolean);
    return parts.join(': ');
}

function buildTreePersonLabel(personId, expanded = false) {
    const details = getDetailsForPerson(personId);
    const name = details?.name || `Person ${personId}`;
    const years = details?.birthYear || details?.deathYear
        ? `${details.birthYear || '?'}-${details.deathYear || ''}`
        : '';
    const lensMetadata = relationshipLensData.get(String(personId));

    if (!expanded) {
        if (vizMode === VIZ_MODE.RELATIONSHIP_LENS && lensMetadata) {
            const cue = formatRelationshipLensCompactCue(lensMetadata);
            return [name, cue, years].filter(Boolean).join('\n');
        }
        return years ? `${name}\n${years}` : name;
    }

    const family = getFamilyForPerson(personId);
    const events = Array.isArray(details?.events) ? details.events : [];
    const birth = events.find(event => event.type === 'Birth');
    const death = events.find(event => event.type === 'Death');
    const lines = [name];

    // Show relationship to logged-in user. Relationship Lens enriches this
    // existing click-card interaction instead of creating a duplicate panel.
    if (vizMode === VIZ_MODE.RELATIONSHIP_LENS && lensMetadata) {
        lines.push(`Relationship: ${lensMetadata.relationshipLabel}`);
        lines.push(`Approx. relatedness: ${formatApproxSharedPercent(lensMetadata.approxSharedPercent)}`);
        lines.push(`Connection: ${formatConnectionType(lensMetadata)}`);
        lines.push(`Family side: ${lensMetadata.familySide}`);
        lines.push(`Path: ${lensMetadata.pathSummary}`);
    } else if (linkedPersonId) {
        const rel = getRelationshipLabel(linkedPersonId, personId);
        if (rel) lines.push(`Relationship: ${rel.label}`);
    }

    if (details?.nickname) lines.push(`Known as: ${details.nickname}`);
    if (years) lines.push(years);
    if (details?.sex) lines.push(details.sex);
    if (birth) lines.push(formatTreeEventLine(birth));
    if (death) lines.push(formatTreeEventLine(death));
    if (family?.parents?.length) lines.push(`Parents: ${family.parents.map(parent => parent.name).join(', ')}`);
    if (family?.spouses?.length) lines.push(`Spouse: ${family.spouses.map(spouse => spouse.name).join(', ')}`);
    if (family?.children?.length) lines.push(`Children: ${family.children.length}`);
    if (details?.profileNote) lines.push(details.profileNote);

    return lines.slice(0, 10).join('\n');
}

function applyTreePersonCardState() {
    if (!cy) return;
    cy.nodes('[?personId]').forEach(node => {
        const personId = String(node.data('personId'));
        const expanded = personId === String(treeExpandedPersonId || '');
        node.data({
            isExpanded: expanded,
            treeLabel: buildTreePersonLabel(personId, expanded),
            nodeWidth: expanded ? TREE_NODE_EXPANDED_WIDTH : TREE_NODE_BASE_WIDTH,
            nodeHeight: expanded ? TREE_NODE_EXPANDED_HEIGHT : TREE_NODE_BASE_HEIGHT
        });
        node.toggleClass('tree-card-expanded', expanded);
    });
}

function toggleTreePersonCard(personId, { reason = 'selection' } = {}) {
    if (!cy || !personId) return;
    const currentViewport = { zoom: cy.zoom(), pan: cy.pan() };
    const nextExpandedPersonId = String(treeExpandedPersonId) === String(personId) ? null : String(personId);
    treeExpandedPersonId = nextExpandedPersonId;
    treeSelectedPersonId = nextExpandedPersonId;
    treeLastPersonId = String(personId);

    if (!treeSelectedPersonId) {
        selectedRelationshipTrace = null;
        clearPathHighlight({ clearState: false });
    }

    applyTreePersonCardState();
    runFamilyLayout(cy, { fit: false });
    applyTreeVisualizationClasses();
    cy.viewport(currentViewport);

    if (treeExpandedPersonId) {
        selectedRelationshipTrace = buildVisibleRelationshipTrace(treeExpandedPersonId);
        applySelectedRelationshipTrace({ reason });
        ensureSelectedPersonReadable(treeExpandedPersonId, { reason });
    }

    logTreeTraceDiagnostic('selection-change', {
        personId: String(personId),
        expanded: !!treeExpandedPersonId,
        relationshipLabel: selectedRelationshipTrace?.relationshipLabel,
        routeFound: !!selectedRelationshipTrace?.found,
        routeReason: selectedRelationshipTrace?.reason,
        treeMode,
        vizMode
    });
}

// ─── Bloodline & render priority application ─────────────────────────────────
//
// DEVELOPER DOCUMENTATION: Lineage-First Visualization System
// ════════════════════════════════════════════════════════════
//
// 1. AUTHENTICATED USER ANCHORING
//    - linkedPersonId (set during Firebase auth) maps the logged-in user to a person record
//    - On tree open, treeFocusPersonId defaults to linkedPersonId
//    - vizMode defaults to VIZ_MODE.BLOODLINE for authenticated users
//    - recomputeBloodlineState() builds the bloodline path from linkedPersonId upward
//
// 2. BLOODLINE HIGHLIGHTING
//    - computeBloodlinePath() in family-data.js traces the direct ancestor line
//    - computeBloodlineSet() returns { personIds, familyIds, householdSpouseIds }
//    - applyTreeVisualizationClasses() applies Cytoscape CSS classes based on render priority:
//        .bloodline           → direct ancestor nodes (amber border, warm background)
//        .bloodline-couple    → couple connector nodes on the direct line
//        .bloodline-edge      → edges connecting bloodline nodes (thick amber, taxi routing)
//        .household-edge      → edges connecting household spouses to bloodline couples
//        .rp-household        → spouses of direct-line ancestors (slightly faded)
//        .rp-collateral       → local collateral (siblings, close relatives — faded)
//        .rp-distant          → distant collateral (strongly faded)
//    - bloodlineLockActive keeps highlighting persistent even in Explore mode
//
// 3. HOUSEHOLD CLUSTERING
//    - Households are represented by couple nodes (f{familyId} / sf{familyId})
//    - In Bloodline/Household modes, groups containing bloodline members sort first
//    - Extra spacing separates bloodline trunk from collateral side branches
//    - Collateral relatives can be collapsed via the Collapse toggle
//
// 4. THREE VISUALIZATION MODES
//    - Bloodline (default): full render priority, generational compression, emphasis
//    - Household: same priority + tighter household clustering
//    - Explore: no priority fading (but bloodline highlighting persists if lock is on)
//    These overlay on the existing data modes (Family/Pedigree/Descendants/Branch)
//
// 5. KEY ENTRY POINTS
//    - recomputeBloodlineState()  — rebuilds bloodline path from linkedPersonId
//    - applyTreeVisualizationClasses()    — applies visual priority CSS classes
//    - applyCollateralVisibility() — toggles collateral node visibility
//    - renderBloodlineBreadcrumbs() — builds the ancestor breadcrumb rail
//    - runFamilyLayout() uses isCompressed and bloodline Sets for priority layout
//

/**
 * Recompute the bloodline path from the authenticated user.
 * Call once after data is loaded and whenever the linked person changes.
 */
function recomputeBloodlineState() {
    if (!linkedPersonId) {
        bloodlinePathData = [];
        bloodlinePersonIds = new Set();
        bloodlineFamilyIds = new Set();
        bloodlineHouseholdSpouseIds = new Set();
        return;
    }
    bloodlinePathData = computeBloodlinePath(linkedPersonId);
    const bset = computeBloodlineSet(linkedPersonId);
    bloodlinePersonIds = bset.personIds;
    bloodlineFamilyIds = bset.familyIds;
    bloodlineHouseholdSpouseIds = bset.householdSpouseIds;
}

function recomputeRelationshipLensState() {
    relationshipLensData = linkedPersonId
        ? computeRelationshipLensMap(linkedPersonId)
        : new Map();
}

function clearRelationshipLensClasses() {
    if (!cy) return;
    const classes = [
        'relationship-lens-node',
        'relationship-lens-couple',
        'relationship-lens-edge',
        'rl-self',
        'rl-close',
        'rl-strong',
        'rl-medium',
        'rl-light',
        'rl-distant',
        'rl-marriage',
        'rl-unknown'
    ];
    classes.forEach(cls => cy.elements(`.${cls}`).removeClass(cls));
}

function applyRelationshipLensClasses() {
    if (!cy) return;
    clearRelationshipLensClasses();
    if (vizMode !== VIZ_MODE.RELATIONSHIP_LENS) return;

    cy.nodes('[?personId]').forEach(node => {
        const personId = String(node.data('personId'));
        const metadata = relationshipLensData.get(personId);
        node.data('relationshipLens', metadata || null);
        node.addClass('relationship-lens-node');
        node.addClass(getRelationshipLensBucketClass(metadata));
    });

    cy.nodes('[?isCouple]').addClass('relationship-lens-couple');
    cy.edges().addClass('relationship-lens-edge');
}

/**
 * Classify each visible node's render priority and assign the appropriate
 * CSS classes that drive Cytoscape styling.  Called after layout.
 *
 * Classes applied:
 *   .bloodline           — direct ancestor line person nodes
 *   .bloodline-couple    — couple nodes on the direct line
 *   .bloodline-edge      — edges connecting direct-line nodes/couples
 *   .household-edge      — edges connecting household spouses to bloodline couples
 *   .rp-household        — household-core nodes (spouses of direct-line ancestors)
 *   .rp-collateral       — local collateral relatives (siblings, aunts/uncles)
 *   .rp-distant          — distant collateral
 *   .collapsed-chip      — collapsed sibling/child count chips
 */
function applyBloodlineClasses() {
    if (!cy) return;
    const isEmphasized = vizMode === VIZ_MODE.BLOODLINE || vizMode === VIZ_MODE.HOUSEHOLD;
    const isExploreLock = vizMode === VIZ_MODE.EXPLORE && bloodlineLockActive;

    // Clear all priority/bloodline classes
    const allClasses = ['bloodline', 'bloodline-couple', 'bloodline-edge', 'household-edge',
                        'rp-household', 'rp-collateral', 'rp-distant'];
    allClasses.forEach(cls => {
        cy.elements(`.${cls}`).removeClass(cls);
    });

    if (!linkedPersonId) return;
    if (!isEmphasized && !isExploreLock) return;

    // ── Person node classification ───────────────────────────────────────────
    cy.nodes('[?personId]').forEach(node => {
        const pid = String(node.data('personId'));

        if (bloodlinePersonIds.has(pid)) {
            node.addClass('bloodline');
        } else if (bloodlineHouseholdSpouseIds.has(pid)) {
            if (isEmphasized) node.addClass('rp-household');
        } else if (isEmphasized) {
            // Determine collateral distance
            const tags = node.data('relationTags') || [];
            const depth = Math.abs(node.data('tier') || 0);
            const isLocalCollateral = tags.includes('sibling') || tags.includes('spouse') || depth <= 2;
            node.addClass(isLocalCollateral ? 'rp-collateral' : 'rp-distant');
        }
    });

    // ── Couple node classification ───────────────────────────────────────────
    cy.nodes('[?isCouple]').forEach(coupleNode => {
        const connectedPersonIds = coupleNode.connectedEdges().connectedNodes('[?personId]')
            .map(n => String(n.data('personId')));
        const hasBloodline = connectedPersonIds.some(pid => bloodlinePersonIds.has(pid));
        const allBloodlineOrHousehold = connectedPersonIds.every(pid =>
            bloodlinePersonIds.has(pid) || bloodlineHouseholdSpouseIds.has(pid)
        );

        if (hasBloodline && allBloodlineOrHousehold) {
            coupleNode.addClass('bloodline-couple');
        } else if (isEmphasized) {
            coupleNode.addClass('rp-collateral');
        }
    });

    // ── Edge classification ──────────────────────────────────────────────────
    cy.edges().forEach(edge => {
        const srcId = edge.source().data('personId') ? String(edge.source().data('personId')) : null;
        const tgtId = edge.target().data('personId') ? String(edge.target().data('personId')) : null;
        const srcIsBloodline = srcId ? bloodlinePersonIds.has(srcId) : edge.source().hasClass('bloodline-couple');
        const tgtIsBloodline = tgtId ? bloodlinePersonIds.has(tgtId) : edge.target().hasClass('bloodline-couple');
        const srcIsHousehold = srcId ? bloodlineHouseholdSpouseIds.has(srcId) : false;
        const tgtIsHousehold = tgtId ? bloodlineHouseholdSpouseIds.has(tgtId) : false;

        if (srcIsBloodline && tgtIsBloodline) {
            edge.addClass('bloodline-edge');
        } else if ((srcIsBloodline || tgtIsBloodline) && (srcIsHousehold || tgtIsHousehold)) {
            edge.addClass('household-edge');
        } else if (isEmphasized) {
            // Determine if this is a local or distant collateral edge
            const srcDepth = Math.abs(edge.source().data('tier') || 0);
            const tgtDepth = Math.abs(edge.target().data('tier') || 0);
            edge.addClass(Math.max(srcDepth, tgtDepth) > 3 ? 'rp-distant' : 'rp-collateral');
        }
    });
}

function applyTreeVisualizationClasses() {
    applyBloodlineClasses();
    applyRelationshipLensClasses();
    // Selection trace is reapplied last so it remains stronger than mode
    // overlays in Bloodline, Household, Explore, and Relationship Lens views.
    applySelectedRelationshipTrace({ recompute: true, reason: 'visualization-refresh' });
}

/**
 * Build the breadcrumb data for the bloodline rail.
 * Returns an array of { personId, name, shortName } from the focal person upward.
 */
function getBloodlineBreadcrumbs() {
    return bloodlinePathData.map(step => {
        const details = getDetailsForPerson(step.personId);
        const name = details?.name || `Person ${step.personId}`;
        const parts = name.replace(/\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean);
        return {
            personId: step.personId,
            name,
            shortName: parts[0] || name
        };
    });
}

function getTreeTraceRelationshipLabel(targetPersonId) {
    const metadata = relationshipLensData.get(String(targetPersonId || ''));
    if (metadata?.relationshipLabel) return metadata.relationshipLabel;
    const relationship = linkedPersonId && targetPersonId
        ? getRelationshipLabel(linkedPersonId, targetPersonId)
        : null;
    return relationship?.label || 'Connection';
}

function isTreeTraceDiagnosticsEnabled() {
    try {
        return isLocalDev || window.localStorage?.getItem('familyTreeDiagnostics') === '1';
    } catch {
        return isLocalDev;
    }
}

function logTreeTraceDiagnostic(eventName, detail = {}, level = 'debug') {
    if (!isTreeTraceDiagnosticsEnabled()) return;
    const logMethod = typeof console[level] === 'function' ? level : 'debug';
    console[logMethod]('[family-tree trace]', eventName, detail);
}

function clearPathHighlight({ clearState = true } = {}) {
    if (cy) {
        cy.elements('.path-highlight').removeClass('path-highlight');
        cy.elements('.path-self').removeClass('path-self');
        cy.elements('.path-target').removeClass('path-target');
        cy.elements('.breadcrumb-focus').removeClass('breadcrumb-focus');
    }

    if (clearState) {
        treeSelectedPersonId = null;
        selectedRelationshipTrace = null;
    }
}

function getTreeElementByExactId(elementId, graph = cy) {
    if (!graph || elementId == null || elementId === '') return null;
    // Use Cytoscape's exact id lookup instead of selector strings. Its selector
    // parser does not accept every CSS.escape() numeric escape, e.g. #p\34 73.
    return graph.getElementById(String(elementId));
}

function getTreePersonNodeByPersonId(personId, graph = cy) {
    if (personId == null || personId === '') return null;
    return getTreeElementByExactId(`p${personId}`, graph);
}

function buildVisibleRelationshipTrace(targetPersonId) {
    const targetId = String(targetPersonId || '');
    const sourcePersonId = String(linkedPersonId || '');
    const emptyTrace = (reason) => ({
        selectedPersonId: targetId,
        sourcePersonId,
        relationshipLabel: getTreeTraceRelationshipLabel(targetId),
        pathNodeIds: [],
        pathEdgeIds: [],
        personPathIds: [],
        found: false,
        reason
    });

    if (!cy) return emptyTrace('tree-not-ready');
    if (!sourcePersonId) return emptyTrace('missing-linked-person');
    if (!targetId) return emptyTrace('missing-target-person');

    const source = getTreePersonNodeByPersonId(sourcePersonId);
    const target = getTreePersonNodeByPersonId(targetId);
    if (!source?.length) return emptyTrace('linked-person-not-visible');
    if (!target?.length) return emptyTrace('target-not-visible');
    if (source.style('display') === 'none') return emptyTrace('linked-person-hidden');
    if (target.style('display') === 'none') return emptyTrace('target-hidden');

    if (sourcePersonId === targetId) {
        return {
            ...emptyTrace('self'),
            pathNodeIds: [source.id()],
            personPathIds: [sourcePersonId],
            found: true,
            reason: 'self'
        };
    }

    const visibleEles = cy.elements().filter(ele => ele.style('display') !== 'none');
    try {
        // Cytoscape pathfinding is scoped to visible elements so the highlighted
        // route always matches what the user can actually follow on screen.
        const result = visibleEles.aStar({
            root: source,
            goal: target,
            directed: false
        });

        if (!result.found || !result.path?.length) {
            return emptyTrace('no-visible-route');
        }

        const pathNodes = result.path.nodes();
        return {
            ...emptyTrace('ok'),
            pathNodeIds: pathNodes.map(node => node.id()),
            pathEdgeIds: result.path.edges().map(edge => edge.id()),
            personPathIds: pathNodes
                .filter(node => !!node.data('personId'))
                .map(node => String(node.data('personId'))),
            found: true,
            reason: 'ok'
        };
    } catch (error) {
        return {
            ...emptyTrace('pathfinding-error'),
            errorMessage: error?.message || String(error)
        };
    }
}

function applySelectedRelationshipTrace({ recompute = false, reason = 'refresh' } = {}) {
    if (!cy) return null;
    clearPathHighlight({ clearState: false });
    if (!treeSelectedPersonId) return null;

    if (recompute || !selectedRelationshipTrace || selectedRelationshipTrace.selectedPersonId !== String(treeSelectedPersonId)) {
        selectedRelationshipTrace = buildVisibleRelationshipTrace(treeSelectedPersonId);
    }

    const trace = selectedRelationshipTrace;
    if (!trace?.found) {
        logTreeTraceDiagnostic('route-missing', {
            reason: trace?.reason,
            selectedPersonId: treeSelectedPersonId,
            linkedPersonId,
            treeMode,
            vizMode,
            errorMessage: trace?.errorMessage
        }, trace?.reason === 'no-visible-route' ? 'warn' : 'debug');
        return trace;
    }

    trace.pathNodeIds.forEach(nodeId => {
        const node = cy.getElementById(nodeId);
        if (node.length) node.addClass('path-highlight');
    });
    trace.pathEdgeIds.forEach(edgeId => {
        const edge = cy.getElementById(edgeId);
        if (edge.length) edge.addClass('path-highlight');
    });

    const sourceNode = getTreePersonNodeByPersonId(trace.sourcePersonId);
    const targetNode = getTreePersonNodeByPersonId(trace.selectedPersonId);
    if (sourceNode?.length) sourceNode.addClass('path-self');
    if (targetNode?.length) targetNode.addClass('path-target');

    logTreeTraceDiagnostic('route-applied', {
        reason,
        selectedPersonId: trace.selectedPersonId,
        relationshipLabel: trace.relationshipLabel,
        personSteps: trace.personPathIds.length,
        graphSteps: trace.pathNodeIds.length + trace.pathEdgeIds.length,
        treeMode,
        vizMode
    });
    return trace;
}

function getSelectedCardReadableZoom() {
    if (!cy) return TREE_SELECTED_READABLE_DESKTOP_ZOOM;

    const viewportWidth = treeCyContainer.clientWidth || window.innerWidth || 0;
    const narrowViewport = viewportWidth <= 640;
    const baseZoom = narrowViewport
        ? TREE_SELECTED_READABLE_NARROW_ZOOM
        : TREE_SELECTED_READABLE_DESKTOP_ZOOM;

    // Expanded card labels use 10px text in Cytoscape coordinates. Keep the
    // rendered text around 9px+ even when the user selected from a far zoom.
    const fontReadableZoom = TREE_SELECTED_READABLE_FONT_PX / 10;
    const widthReadableZoom = viewportWidth > 0
        ? Math.min(1.05, Math.max(0.72, (viewportWidth * (narrowViewport ? 0.64 : 0.28)) / TREE_NODE_EXPANDED_WIDTH))
        : baseZoom;

    return Math.min(
        cy.maxZoom(),
        Math.max(cy.minZoom(), baseZoom, fontReadableZoom, widthReadableZoom)
    );
}

function ensureSelectedPersonReadable(personId, { reason = 'selection' } = {}) {
    if (!cy || !personId) return;
    const node = getTreePersonNodeByPersonId(personId);
    if (!node?.length || node.style('display') === 'none') {
        logTreeTraceDiagnostic('readability-skipped', { personId, reason: 'node-not-visible' });
        return;
    }

    const currentZoom = cy.zoom();
    const targetZoom = Math.max(currentZoom, getSelectedCardReadableZoom());
    logTreeTraceDiagnostic('readability-viewport', {
        personId: String(personId),
        reason,
        fromZoom: Number(currentZoom.toFixed(3)),
        toZoom: Number(targetZoom.toFixed(3)),
        narrowViewport: (treeCyContainer.clientWidth || 0) <= 640
    });

    // Centering plus a minimum zoom is less disruptive than fitting the full
    // route, and it keeps the selected details readable after heavy zoom-out.
    cy.stop(true).animate(
        { center: { eles: node }, zoom: targetZoom },
        { duration: 320, easing: 'ease-out' }
    );
}

function getVisibleTreeNeighborhood(seedNode, maxHops) {
    if (!cy || !seedNode?.length) return cy ? cy.collection() : null;
    let visibleNeighborhood = seedNode;
    let frontier = seedNode;

    for (let hop = 0; hop < maxHops; hop++) {
        frontier = frontier.closedNeighborhood().filter(ele => ele.style('display') !== 'none');
        visibleNeighborhood = visibleNeighborhood.union(frontier);
    }

    return visibleNeighborhood;
}

function focusTreeEntryViewport() {
    if (!cy || !linkedPersonId) return false;
    const linkedNode = getTreePersonNodeByPersonId(linkedPersonId);
    if (!linkedNode?.length || linkedNode.style('display') === 'none') return false;

    const focusNeighborhood = getVisibleTreeNeighborhood(linkedNode, TREE_ENTRY_FOCUS_DEPTH);
    const fitEles = focusNeighborhood?.length ? focusNeighborhood : linkedNode;
    const narrowViewport = (treeCyContainer.clientWidth || 0) <= 640;
    const targetZoom = narrowViewport ? TREE_ENTRY_NARROW_ZOOM : TREE_ENTRY_DESKTOP_ZOOM;

    cy.fit(fitEles, narrowViewport ? 54 : 72);
    if (cy.zoom() < targetZoom) {
        cy.zoom({
            level: Math.min(cy.maxZoom(), targetZoom),
            renderedPosition: {
                x: (treeCyContainer.clientWidth || window.innerWidth || 0) / 2,
                y: (treeCyContainer.clientHeight || window.innerHeight || 0) / 2
            }
        });
        cy.center(linkedNode);
    }

    return true;
}

async function initTree({ preserveViewport = false, initialFocus = false } = {}) {
    const previousViewport = preserveViewport && cy ? { zoom: cy.zoom(), pan: cy.pan() } : null;
    const treeData = buildTreeData(getTreeBuildOptions());
    if (!treeData) {
        treeStatus.textContent = 'Tree data is not yet available. Please try again.';
        treeStatus.classList.remove('hidden');
        return;
    }

    treeGraphData = treeData;
    treeFocusPersonId = treeData.focusPersonId;
    treeMaxDepth = Math.max(getTreeDepthMinimum(), treeData.maxDepth);
    treeCurrentDepth = Math.min(Math.max(treeCurrentDepth, getTreeDepthMinimum()), treeMaxDepth);
    treeStatus.classList.add('hidden');
    recomputeRelationshipLensState();

    if (cy) { cy.destroy(); cy = null; }

    cy = cytoscape({
        container: treeCyContainer,
        elements: treeData.elements.map(element => {
            if (!element.data?.personId) return element;
            const personId = String(element.data.personId);
            const expanded = personId === String(treeExpandedPersonId || '');
            return {
                ...element,
                data: {
                    ...element.data,
                    isExpanded: expanded,
                    treeLabel: buildTreePersonLabel(personId, expanded),
                    nodeWidth: expanded ? TREE_NODE_EXPANDED_WIDTH : TREE_NODE_BASE_WIDTH,
                    nodeHeight: expanded ? TREE_NODE_EXPANDED_HEIGHT : TREE_NODE_BASE_HEIGHT
                }
            };
        }),
        style: CY_STYLE,
        layout: { name: 'preset' },
        userZoomingEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        minZoom: 0.1,
        maxZoom: 3
    });

    cy.on('tap', 'node[?personId]', (evt) => {
        if (evt.originalEvent?.shiftKey) return;
        const personId = evt.target.data('personId');
        toggleTreePersonCard(personId, { reason: 'tap' });
    });

    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            clearPathHighlight({ clearState: true });
            cy.$(':selected').unselect();
        }
    });

    cy.on('cxttap', 'node[?personId]', (evt) => {
        cy.$(':selected').unselect();
        const node = evt.target;
        const birthFams = node.connectedEdges().connectedNodes()
            .filter(n => n.data('isCouple') && !n.data('isSpouseFamily'));
        if (birthFams.length) {
            birthFams.connectedEdges().connectedNodes()
                .filter(n => n.data('personId'))
                .select();
        } else {
            node.select();
        }
        node.connectedEdges().connectedNodes()
            .filter(n => n.data('isSpouseFamily'))
            .select();
    });

    cy.on('grab', 'node', (evt) => {
        const grabbed = evt.target;
        const selected = cy.$(':selected');
        clusterDragActive = selected.length > 1 && grabbed.selected();
        if (clusterDragActive) {
            clusterStartPositions = {};
            selected.forEach(n => {
                clusterStartPositions[n.id()] = { x: n.position('x'), y: n.position('y') };
            });
        }
    });

    cy.on('drag', 'node', (evt) => {
        if (!clusterDragActive) return;
        const grabbed = evt.target;
        const start = clusterStartPositions[grabbed.id()];
        if (!start) return;
        const dx = grabbed.position('x') - start.x;
        const dy = grabbed.position('y') - start.y;
        cy.$(':selected').not(grabbed).forEach(n => {
            const s = clusterStartPositions[n.id()];
            if (s) n.position({ x: s.x + dx, y: s.y + dy });
        });
    });

    cy.on('dragfree', 'node', (evt) => {
        const grabbed = evt.target;
        if (clusterDragActive) {
            cy.$(':selected').forEach(n => saveTreeLayout(n.id(), n.position()));
        } else {
            saveTreeLayout(grabbed.id(), grabbed.position());
        }
        clusterDragActive = false;
        clusterStartPositions = {};
    });

    await loadTreeLayout();

    // Compute bloodline state before layout so the layout can use priority data
    recomputeBloodlineState();

    runFamilyLayout(cy, { fit: false });

    // In Explore mode, honour saved manual layouts from Firestore.
    // In Bloodline / Household modes, the computed layout IS the layout —
    // saved positions from the old generic view would break bloodline trunk
    // alignment, so skip the overlay.
    if (vizMode === VIZ_MODE.EXPLORE) {
        overlayTreeLayout();
    }

    // Apply the active visualization mode's highlighting and render priority classes.
    applyTreeVisualizationClasses();
    renderBloodlineBreadcrumbs();
    renderTreeLegend();

    if (previousViewport) {
        cy.viewport(previousViewport);
    } else if (initialFocus && focusTreeEntryViewport()) {
        // The entry view renders six generations but starts near the user's own
        // profile, so the broader tree feels explorable instead of zoomed out.
    } else {
        cy.fit(undefined, 36);
    }

    if (treeSelectedPersonId) {
        // A mode/data rebuild creates a new Cytoscape instance; restore the
        // selected route and readability after the initial viewport is set.
        selectedRelationshipTrace = buildVisibleRelationshipTrace(treeSelectedPersonId);
        applySelectedRelationshipTrace({ reason: 'tree-rebuild' });
        ensureSelectedPersonReadable(treeSelectedPersonId, { reason: 'tree-rebuild' });
    }

    updateTreeModeUI();
    updateVizModeUI();
    updateTreeDepthUI();
    updateTreeToolbarTitle();
    wireTreeControls();
}

// ─── Custom family-aware layout with continuous time axis ────────────────────
//
// Grouping priority (highest to lowest):
//  1. Spouse-family (sf) node — visible spouses stay adjacent as a single block.
//  2. Birth-family (parentsFamilyId) — siblings stay contiguous inside the same block.
//  3. Root ordering — branch blocks are sorted by family/name cues rather than raw ids.
//  4. Parent anchoring — upper generations centre over their visible descendants.
//
// Y-axis: fixed generation bands based on the focus person's relative tier.
//   tier -2 = grandparents, -1 = parents, 0 = focus generation, +1 = children, etc.
//   Birth year remains a secondary ordering hint only.
//
// X-axis algorithm:
//  Depth 0  — visible family blocks are sorted into a deterministic opening view.
//  Depth d  — each block is sorted by descendant centre, then packed left-to-right.
//  Members  — spouses stay adjacent; siblings stay together within the same block.
//  Couples  — x = midpoint of connected persons; y = midpoint between generation bands.
function runFamilyLayout(cy, { fit = true } = {}) {
    const NODE_W = TREE_NODE_BASE_WIDTH;
    const GAP = 24;          // minimum horizontal gap between node edges
    const GROUP_GAP = 44;    // space between adjacent family blocks
    const RELATED_GROUP_GAP = 18;
    const COUPLE_Y_OFFSET = 28;

    // ── Generational compression ─────────────────────────────────────────────
    // In Bloodline / Household modes, reduce vertical spacing for distant
    // generations so older ancestors don't feel arbitrarily far away.
    const BASE_TIER_BAND = 176;
    const isCompressed = vizMode === VIZ_MODE.BLOODLINE || vizMode === VIZ_MODE.HOUSEHOLD;

    function tierBandForDistance(tierDistance) {
        if (!isCompressed) return BASE_TIER_BAND;
        // Tiers 0-2 get full spacing; beyond that, progressively compress
        if (tierDistance <= 2) return BASE_TIER_BAND;
        if (tierDistance <= 4) return BASE_TIER_BAND * 0.85;
        return BASE_TIER_BAND * 0.72;
    }

    const visPersons      = cy.nodes('[?personId]').filter(n => n.style('display') !== 'none');
    const visCouples      = cy.nodes('[?isCouple]').filter(n => n.style('display') !== 'none');
    if (visPersons.length === 0) return;

    // ── Birth-year map ────────────────────────────────────────────────────────
    const knownYear = {};  // nodeId → recorded birth year
    const byDepth   = {};  // depth  → [node, …]
    const byTier    = {};  // tier   → [node, …]

    visPersons.forEach(n => {
        const d = n.data('depth');
        (byDepth[d] = byDepth[d] || []).push(n);
        const tier = n.data('tier');
        (byTier[tier] = byTier[tier] || []).push(n);
        const det = getDetailsForPerson(n.data('personId'));
        if (det?.birthYear) knownYear[n.id()] = det.birthYear;
    });

    const depths = Object.keys(byDepth).map(Number).sort((a, b) => a - b);

    // Mean birth year per depth for fallback estimation
    const meanAtDepth = {};
    depths.forEach(d => {
        const ys = byDepth[d].map(n => knownYear[n.id()]).filter(Boolean);
        if (ys.length) meanAtDepth[d] = ys.reduce((s, v) => s + v, 0) / ys.length;
    });
    const anchor = meanAtDepth[0] ?? 2005;
    depths.forEach(d => { if (meanAtDepth[d] === undefined) meanAtDepth[d] = anchor - d * 28; });

    const yearOf = {};
    visPersons.forEach(n => {
        yearOf[n.id()] = knownYear[n.id()] ?? meanAtDepth[n.data('depth')] ?? (anchor - n.data('depth') * 28);
    });

    const minTier = depths.length ? Math.min(...depths) : 0;
    const maxTier = depths.length ? Math.max(...depths) : 0;

    // Build cumulative Y offsets per tier with generational compression
    const tierYOffset = {};
    tierYOffset[minTier] = 0;
    for (let t = minTier + 1; t <= maxTier; t++) {
        const distance = t - minTier;
        tierYOffset[t] = tierYOffset[t - 1] + tierBandForDistance(distance);
    }

    const yOf = {};
    visPersons.forEach(n => {
        const tier = n.data('tier');
        yOf[n.id()] = tierYOffset[tier] ?? (tier - minTier) * BASE_TIER_BAND;
    });

    function normalizeSortText(text = '') {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function surnameKey(name = '') {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return normalizeSortText(parts[parts.length - 1] || name);
    }

    function pickPrimarySurname(names) {
        const counts = new Map();
        names.forEach(name => {
            const key = surnameKey(name);
            if (!key) return;
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        const ranked = [...counts.entries()].sort((a, b) =>
            (b[1] - a[1]) || a[0].localeCompare(b[0])
        );
        return ranked[0]?.[0] || normalizeSortText(names[0] || '');
    }

    function getVisibleSpouseFamilyId(personNode) {
        const sfIds = new Set();
        personNode.connectedEdges().forEach(edge => {
            const other = edge.source().id() === personNode.id() ? edge.target() : edge.source();
            if (other.data('isSpouseFamily') && other.style('display') !== 'none') sfIds.add(other.id());
        });
        return [...sfIds].sort()[0] || null;
    }

    function getVisibleParentPairKey(personNode) {
        const parentIds = new Set();
        personNode.outgoers('[?isCouple]')
            .filter(n => n.data('isCouple') && !n.data('isSpouseFamily') && n.style('display') !== 'none')
            .forEach(familyNode => {
                familyNode.outgoers('[?personId]')
                    .filter(n => n.style('display') !== 'none')
                    .forEach(parentNode => parentIds.add(String(parentNode.data('personId'))));
            });
        return parentIds.size ? `parents:${[...parentIds].sort().join('-')}` : null;
    }

    function getBranchOwnClusterKey(personNode) {
        const visibleParentKey = getVisibleParentPairKey(personNode);
        if (visibleParentKey) return visibleParentKey;

        const sources = personNode.data('sourceFamilies') || [];
        if (sources.length) return `source:${sources.slice().sort()[0]}`;

        const anchors = personNode.data('anchorFamilies') || [];
        if (anchors.length) return `anchor:${anchors.slice().sort()[0]}`;

        const fam = getFamilyForPerson(personNode.data('personId'));
        if (fam?.parentsFamilyId) return `birth:${fam.parentsFamilyId}`;

        return null;
    }

    function getBranchSpouseClusterKey(personNode) {
        const spouseGroup = getVisibleSpouseFamilyId(personNode);
        if (!spouseGroup) return null;

        const spouseFamily = getTreeElementByExactId(spouseGroup, cy);
        if (!spouseFamily?.length) return null;

        const partnerKeys = spouseFamily.connectedEdges().connectedNodes()
            .filter(n => n.data('personId') && n.id() !== personNode.id() && n.style('display') !== 'none')
            .map(partner => getBranchOwnClusterKey(partner))
            .filter(Boolean)
            .sort();

        return partnerKeys[0] || null;
    }

    function getBranchClusterKey(personNode) {
        if (treeMode !== 'branch') return null;
        const ownCluster = getBranchOwnClusterKey(personNode);
        const spouseCluster = getBranchSpouseClusterKey(personNode);
        const relationTags = personNode.data('relationTags') || [];
        if (spouseCluster && relationTags.includes('spouse') && !relationTags.includes('focus')) return spouseCluster;
        if (ownCluster?.startsWith('source:') && spouseCluster) return spouseCluster;
        return ownCluster || spouseCluster;
    }

    function getDisplayGroupKey(personNode) {
        const branchCluster = getBranchClusterKey(personNode);
        if (branchCluster) return branchCluster;

        const spouseGroup = getVisibleSpouseFamilyId(personNode);
        if (spouseGroup) return spouseGroup;
        const fam = getFamilyForPerson(personNode.data('personId'));
        if (fam?.parentsFamilyId) return `f${fam.parentsFamilyId}`;
        return personNode.id();
    }

    function getChildrenCenter(personNode) {
        const xs = [];
        personNode.incomers('[?isCouple]').intersection(visCouples).forEach(c => {
            if (c.data('isSpouseFamily')) return;
            c.incomers('[?personId]').intersection(visPersons).forEach(ch => {
                if (xOf[ch.id()] !== undefined) xs.push(xOf[ch.id()]);
            });
        });
        if (!xs.length) return undefined;
        return xs.reduce((sum, value) => sum + value, 0) / xs.length;
    }

    function getParentsCenter(personNode) {
        const xs = [];
        personNode.outgoers('[?isCouple]').intersection(visCouples).forEach(c => {
            if (c.data('isSpouseFamily')) return;
            c.outgoers('[?personId]').intersection(visPersons).forEach(parent => {
                if (xOf[parent.id()] !== undefined) xs.push(xOf[parent.id()]);
            });
        });
        if (!xs.length) return undefined;
        return xs.reduce((sum, value) => sum + value, 0) / xs.length;
    }

    function getVisibleParentUpstreamFamilies(personNode) {
        const fam = getFamilyForPerson(personNode.data('personId'));
        if (!fam?.parents?.length) return [];

        return fam.parents
            .map(parent => {
                const parentNode = getTreePersonNodeByPersonId(parent.id, cy);
                if (!parentNode?.length || parentNode.style('display') === 'none') return null;
                const parentFam = getFamilyForPerson(parent.id);
                return parentFam?.parentsFamilyId ? Number(parentFam.parentsFamilyId) : null;
            })
            .filter(id => Number.isFinite(id));
    }

    function sortGroupMembers(group) {
        if (group.type === 'branch') {
            const byId = new Map(group.members.map(member => [member.id(), member]));
            const spouseByPersonId = new Map();

            group.members.forEach(member => {
                const spouseGroup = getVisibleSpouseFamilyId(member);
                if (!spouseGroup) return;
                const spouseFamily = getTreeElementByExactId(spouseGroup, cy);
                if (!spouseFamily?.length) return;
                spouseFamily.connectedEdges().connectedNodes()
                    .filter(n => n.data('personId') && n.id() !== member.id() && byId.has(n.id()))
                    .forEach(spouse => spouseByPersonId.set(member.id(), spouse.id()));
            });

            const primaryMembers = group.members
                .filter(member => {
                    const spouseId = spouseByPersonId.get(member.id());
                    if (!spouseId) return true;
                    const counterpart = byId.get(spouseId);
                    if (!counterpart) return true;
                    const memberYear = yearOf[member.id()] ?? Infinity;
                    const counterpartYear = yearOf[counterpart.id()] ?? Infinity;
                    if (memberYear !== counterpartYear) return memberYear <= counterpartYear;
                    return member.data('name').localeCompare(counterpart.data('name')) <= 0;
                })
                .sort((a, b) => {
                    const yearDiff = (yearOf[a.id()] ?? Infinity) - (yearOf[b.id()] ?? Infinity);
                    if (yearDiff !== 0) return yearDiff;
                    return a.data('name').localeCompare(b.data('name'));
                });

            const ordered = [];
            const added = new Set();
            primaryMembers.forEach(member => {
                if (!added.has(member.id())) {
                    ordered.push(member);
                    added.add(member.id());
                }

                const spouseId = spouseByPersonId.get(member.id());
                const spouse = spouseId ? byId.get(spouseId) : null;
                if (spouse && !added.has(spouse.id())) {
                    ordered.push(spouse);
                    added.add(spouse.id());
                }
            });

            group.members.forEach(member => {
                if (!added.has(member.id())) ordered.push(member);
            });

            group.members = ordered;
            return;
        }

        group.members.sort((a, b) => {
            const aSex = a.data('sex');
            const bSex = b.data('sex');
            if (group.type === 'spouse' && aSex !== bSex) {
                if (aSex === 'Male') return -1;
                if (bSex === 'Male') return 1;
            }
            const yearDiff = (yearOf[a.id()] ?? Infinity) - (yearOf[b.id()] ?? Infinity);
            if (yearDiff !== 0) return yearDiff;
            return a.data('name').localeCompare(b.data('name'));
        });
    }

    function createTierGroups(nodes) {
        const groups = new Map();
        nodes.forEach(node => {
            const key = getDisplayGroupKey(node);
            const type = key.startsWith('parents:') || key.startsWith('source:') || key.startsWith('anchor:') || key.startsWith('birth:')
                ? 'branch'
                : key.startsWith('sf') ? 'spouse' : key.startsWith('f') ? 'birth' : 'single';
            if (!groups.has(key)) groups.set(key, { key, type, members: [] });
            groups.get(key).members.push(node);
        });
        const result = [...groups.values()];
        result.forEach(group => {
            sortGroupMembers(group);
            const names = group.members.map(member => member.data('name'));
            const ownBirthFamilies = group.members
                .map(member => Number(getFamilyForPerson(member.data('personId'))?.parentsFamilyId))
                .filter(id => Number.isFinite(id));
            const upstreamParentFamilies = group.members.flatMap(member => getVisibleParentUpstreamFamilies(member));

            group.sortLabel = normalizeSortText(names.slice().sort((a, b) => a.localeCompare(b))[0] || '');
            group.primarySurname = pickPrimarySurname(names);
            group.earliestYear = Math.min(...group.members.map(member => yearOf[member.id()] ?? Infinity));
            group.width = group.members.reduce((sum, member) => sum + (member.data('nodeWidth') || NODE_W), 0) +
                Math.max(0, group.members.length - 1) * GAP;

            const preferredFamilies = group.type === 'birth'
                ? (upstreamParentFamilies.length ? upstreamParentFamilies : ownBirthFamilies)
                : (ownBirthFamilies.length ? ownBirthFamilies : upstreamParentFamilies);

            group.branchAnchor = preferredFamilies.length ? Math.min(...preferredFamilies) : Infinity;
        });
        return result;
    }

    function positionGroups(groups, idealCenterByKey) {
        let nextLeft = 0;
        groups.forEach((group, index) => {
            const idealCenter = idealCenterByKey[group.key];
            const desiredLeft = idealCenter !== undefined
                ? idealCenter - group.width / 2
                : nextLeft;
            const left = Math.max(nextLeft, desiredLeft);
            let cursor = left;
            group.members.forEach((member) => {
                const width = member.data('nodeWidth') || NODE_W;
                xOf[member.id()] = cursor + width / 2;
                cursor += width + GAP;
            });
            const nextGroup = groups[index + 1];
            let gap;
            if (nextGroup && Number.isFinite(group.branchAnchor) &&
                nextGroup.branchAnchor === group.branchAnchor) {
                gap = RELATED_GROUP_GAP;
            } else if (isCompressed) {
                // In bloodline/household modes, add extra space between the
                // bloodline trunk and collateral groups for visual separation
                const thisIsBloodline = groupHasBloodline(group) || groupHasHousehold(group);
                const nextIsBloodline = nextGroup && (groupHasBloodline(nextGroup) || groupHasHousehold(nextGroup));
                gap = (thisIsBloodline !== nextIsBloodline) ? GROUP_GAP * 1.5 : GROUP_GAP;
            } else {
                gap = GROUP_GAP;
            }
            nextLeft = left + group.width + gap;
        });
    }

    // ── X coordinates ─────────────────────────────────────────────────────────
    const xOf = {};

    // Tier 0: pack visible spouse pairs / sibling groups into logical branch blocks.
    const rootGroups = createTierGroups(byTier[0] || []);
    // Helper: does this group contain any bloodline members?
    function groupHasBloodline(group) {
        return group.members.some(m => bloodlinePersonIds.has(String(m.data('personId'))));
    }

    function groupHasHousehold(group) {
        return group.members.some(m => bloodlineHouseholdSpouseIds.has(String(m.data('personId'))));
    }

    rootGroups.sort((a, b) => {
        // In Bloodline/Household mode, bloodline-containing groups sort first (center)
        if (isCompressed) {
            const aBlood = groupHasBloodline(a) ? 0 : groupHasHousehold(a) ? 1 : 2;
            const bBlood = groupHasBloodline(b) ? 0 : groupHasHousehold(b) ? 1 : 2;
            if (aBlood !== bBlood) return aBlood - bBlood;
        }
        const anchorDiff = a.branchAnchor - b.branchAnchor;
        if (anchorDiff !== 0) return anchorDiff;
        const surnameDiff = a.primarySurname.localeCompare(b.primarySurname);
        if (surnameDiff !== 0) return surnameDiff;
        const labelDiff = a.sortLabel.localeCompare(b.sortLabel);
        if (labelDiff !== 0) return labelDiff;
        const yearDiff = a.earliestYear - b.earliestYear;
        if (yearDiff !== 0) return yearDiff;
        return a.key.localeCompare(b.key);
    });
    positionGroups(rootGroups, {});

    function positionTier(tier) {
        const tierGroups = createTierGroups(byTier[tier] || []);
        if (!tierGroups.length) return;

        const idealCenterByKey = {};
        tierGroups.forEach(group => {
            const centers = group.members
                .map(member => getChildrenCenter(member) ?? getParentsCenter(member))
                .filter(center => center !== undefined);
            if (centers.length) {
                idealCenterByKey[group.key] = centers.reduce((sum, value) => sum + value, 0) / centers.length;
            }
        });

        tierGroups.sort((a, b) => {
            // Bloodline priority: groups with bloodline members sort first
            if (isCompressed) {
                const aBlood = groupHasBloodline(a) ? 0 : groupHasHousehold(a) ? 1 : 2;
                const bBlood = groupHasBloodline(b) ? 0 : groupHasHousehold(b) ? 1 : 2;
                if (aBlood !== bBlood) return aBlood - bBlood;
            }
            const aCenter = idealCenterByKey[a.key];
            const bCenter = idealCenterByKey[b.key];
            if (aCenter !== undefined || bCenter !== undefined) {
                if (aCenter === undefined) return 1;
                if (bCenter === undefined) return -1;
                const centerDiff = aCenter - bCenter;
                if (centerDiff !== 0) return centerDiff;
            }
            const surnameDiff = a.primarySurname.localeCompare(b.primarySurname);
            if (surnameDiff !== 0) return surnameDiff;
            const yearDiff = a.earliestYear - b.earliestYear;
            if (yearDiff !== 0) return yearDiff;
            const labelDiff = a.sortLabel.localeCompare(b.sortLabel);
            if (labelDiff !== 0) return labelDiff;
            return a.key.localeCompare(b.key);
        });

        positionGroups(tierGroups, idealCenterByKey);
    }

    // Walk outward from the focus tier. Each visible generation band is packed
    // independently so descendants are not pushed aside by ancestor-side groups.
    const tierValues = Object.keys(byTier).map(Number);
    const maxTierDistance = tierValues.length ? Math.max(...tierValues.map(tier => Math.abs(tier))) : 0;
    for (let distance = 1; distance <= maxTierDistance; distance++) {
        positionTier(-distance);
        positionTier(distance);
    }

    // ── Couple node positions ─────────────────────────────────────────────────
    visCouples.forEach(c => {
        const outgoerPersons = c.outgoers('[?personId]').intersection(visPersons).toArray();
        const incomerPersons = c.incomers('[?personId]').intersection(visPersons).toArray();

        if (c.data('isSpouseFamily')) {
            const spouseXs = incomerPersons.map(person => xOf[person.id()]).filter(x => x !== undefined);
            const spouseYs = incomerPersons.map(person => yOf[person.id()]).filter(y => y !== undefined);
            xOf[c.id()] = spouseXs.length ? spouseXs.reduce((sum, value) => sum + value, 0) / spouseXs.length : 0;
            yOf[c.id()] = spouseYs.length
                ? (spouseYs.reduce((sum, value) => sum + value, 0) / spouseYs.length) - COUPLE_Y_OFFSET
                : 0;
            return;
        }

        const parentXs = outgoerPersons.map(person => xOf[person.id()]).filter(x => x !== undefined);
        const parentYs = outgoerPersons.map(person => yOf[person.id()]).filter(y => y !== undefined);
        const childXs = incomerPersons.map(person => xOf[person.id()]).filter(x => x !== undefined);
        const childYs = incomerPersons.map(person => yOf[person.id()]).filter(y => y !== undefined);

        const parentCenterX = parentXs.length ? parentXs.reduce((sum, value) => sum + value, 0) / parentXs.length : undefined;
        const childCenterX = childXs.length ? childXs.reduce((sum, value) => sum + value, 0) / childXs.length : undefined;
        const parentCenterY = parentYs.length ? parentYs.reduce((sum, value) => sum + value, 0) / parentYs.length : undefined;
        const childCenterY = childYs.length ? childYs.reduce((sum, value) => sum + value, 0) / childYs.length : undefined;

        xOf[c.id()] = parentCenterX ?? childCenterX ?? 0;

        if (parentCenterY !== undefined && childCenterY !== undefined) {
            yOf[c.id()] = (parentCenterY + childCenterY) / 2;
        } else if (parentCenterY !== undefined) {
            yOf[c.id()] = parentCenterY - COUPLE_Y_OFFSET;
        } else if (childCenterY !== undefined) {
            yOf[c.id()] = childCenterY + COUPLE_Y_OFFSET;
        } else {
            yOf[c.id()] = 0;
        }
    });

    const focusNode = visPersons.filter(n => n.data('isFocus')).first();
    let anchorShift = 0;
    if (focusNode.length) {
        const focusGroupKey = getDisplayGroupKey(focusNode);
        const focusGroupMembers = visPersons.filter(n =>
            n.data('tier') === focusNode.data('tier') && getDisplayGroupKey(n) === focusGroupKey
        );
        const focusXs = focusGroupMembers.map(n => xOf[n.id()] ?? 0);
        if (focusXs.length) {
            anchorShift = -(focusXs.reduce((sum, value) => sum + value, 0) / focusXs.length);
        }
    }
    if (anchorShift !== 0) {
        Object.keys(xOf).forEach(id => { xOf[id] += anchorShift; });
    }

    // ── Apply positions ───────────────────────────────────────────────────────
    visPersons.forEach(n => { n.position({ x: xOf[n.id()] ?? 0, y: yOf[n.id()] ?? 0 }); });
    visCouples.forEach(c => { c.position({ x: xOf[c.id()] ?? 0, y: yOf[c.id()] ?? 0 }); });

    cy.nodes('[?personId]').removeClass('linked-user');
    if (linkedPersonId) {
        const linkedNode = getTreePersonNodeByPersonId(linkedPersonId, cy);
        if (linkedNode?.length) linkedNode.addClass('linked-user');
    }

    if (fit) cy.fit(undefined, 24);
}

function applyTreeDepth(maxGen) {
    treeCurrentDepth = Math.max(getTreeDepthMinimum(), Math.min(maxGen, treeMaxDepth));
    initTree({ preserveViewport: false });
}

function updateTreeDepthUI() {
    const minDepth = getTreeDepthMinimum();
    const rangeLabel = treeMode === 'pedigree'
        ? `${treeCurrentDepth} ancestor generation${treeCurrentDepth === 1 ? '' : 's'}`
        : treeMode === 'descendants'
            ? `${treeCurrentDepth} descendant generation${treeCurrentDepth === 1 ? '' : 's'}`
            : `${treeCurrentDepth} generation${treeCurrentDepth === 1 ? '' : 's'} each direction`;
    treeDepthLabel.textContent = `${TREE_MODE_LABELS[treeMode] || 'Family'} · ${rangeLabel}`;
    treeDepthDec.disabled = treeCurrentDepth <= minDepth;
    treeDepthInc.disabled = treeCurrentDepth >= treeMaxDepth;
}

function renderTreeLegend() {
    if (!treeLegend) return;
    const mode = getVisualizationMode(vizMode);
    treeLegend.innerHTML = '';

    const title = document.createElement('div');
    title.className = 'tree-legend-title';
    title.id = 'tree-legend-title';
    title.textContent = mode.legendTitle || 'Color Guide';
    treeLegend.appendChild(title);

    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'tree-legend-items';
    (mode.legendItems || []).forEach(item => {
        const row = document.createElement('div');
        row.className = 'tree-legend-item';

        const swatch = document.createElement('span');
        swatch.className = `tree-legend-swatch ${item.swatchClass || ''}`;
        row.appendChild(swatch);

        const label = document.createElement('span');
        label.textContent = item.label;
        row.appendChild(label);
        itemsWrap.appendChild(row);
    });
    treeLegend.appendChild(itemsWrap);

    if (mode.legendNote) {
        const note = document.createElement('p');
        note.className = 'tree-legend-note';
        note.textContent = mode.legendNote;
        treeLegend.appendChild(note);
    }
}

function toggleTreeLegend() {
    renderTreeLegend();
    const open = !treeLegend.classList.contains('hidden');
    treeLegend.classList.toggle('hidden', open);
    treeLegendBtn.setAttribute('aria-expanded', String(!open));
}

/**
 * Toggle visibility of collateral (non-bloodline, non-household) nodes.
 * In collapsed state, collateral nodes are hidden; in expanded state they are shown.
 */
function applyCollateralVisibility() {
    if (!cy) return;
    const shouldHide = collateralCollapsed && (vizMode === VIZ_MODE.BLOODLINE || vizMode === VIZ_MODE.HOUSEHOLD);
    const selectedTraceNodeIds = new Set(selectedRelationshipTrace?.pathNodeIds || []);
    const selectedTraceEdgeIds = new Set(selectedRelationshipTrace?.pathEdgeIds || []);

    cy.nodes('[?personId]').forEach(node => {
        const pid = String(node.data('personId'));
        const isBloodline = bloodlinePersonIds.has(pid);
        const isHousehold = bloodlineHouseholdSpouseIds.has(pid);
        const isSelectedRouteNode = selectedTraceNodeIds.has(node.id());
        if (!isBloodline && !isHousehold && !isSelectedRouteNode) {
            node.style('display', shouldHide ? 'none' : 'element');
        } else {
            node.style('display', 'element');
        }
    });

    cy.nodes('[?isCouple]').forEach(coupleNode => {
        if (selectedTraceNodeIds.has(coupleNode.id())) {
            coupleNode.style('display', 'element');
            return;
        }
        const connPersons = coupleNode.connectedEdges().connectedNodes('[?personId]')
            .filter(n => n.style('display') !== 'none');
        coupleNode.style('display', connPersons.length > 0 ? 'element' : 'none');
    });

    cy.edges().forEach(edge => {
        if (selectedTraceEdgeIds.has(edge.id())) {
            edge.style('display', 'element');
            return;
        }
        const srcVisible = edge.source().style('display') !== 'none';
        const tgtVisible = edge.target().style('display') !== 'none';
        edge.style('display', (srcVisible && tgtVisible) ? 'element' : 'none');
    });

    if (shouldHide) {
        // Re-layout with reduced node set
        runFamilyLayout(cy, { fit: true });
    }

    applyTreeVisualizationClasses();
    if (treeSelectedPersonId) {
        ensureSelectedPersonReadable(treeSelectedPersonId, { reason: 'collateral-visibility' });
    }
}

// ─── Visualization mode UI ────────────────────────────────────────────────────

function updateVizModeUI() {
    const mode = getVisualizationMode(vizMode);
    document.querySelectorAll('.viz-mode-btn').forEach(btn => {
        const active = btn.dataset.vizMode === vizMode;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', String(active));
    });

    const actionControls = document.querySelector('.viz-action-controls');
    if (actionControls) {
        actionControls.classList.toggle('hidden', mode.showBloodlineActions === false);
    }

    const lockBtn = document.getElementById('bloodline-lock-btn');
    if (lockBtn) {
        lockBtn.classList.toggle('is-active', bloodlineLockActive);
        lockBtn.title = bloodlineLockActive ? 'Bloodline lock ON — direct line always emphasized' : 'Bloodline lock OFF';
    }

    const collapseBtn = document.getElementById('collateral-collapse-btn');
    if (collapseBtn) {
        collapseBtn.classList.toggle('is-active', collateralCollapsed);
    }

    renderTreeLegend();
}

function renderBloodlineBreadcrumbs() {
    const rail = document.getElementById('bloodline-rail');
    if (!rail) return;
    if (vizMode === VIZ_MODE.RELATIONSHIP_LENS) {
        rail.classList.add('hidden');
        return;
    }

    const crumbs = getBloodlineBreadcrumbs();
    if (!crumbs.length) {
        rail.classList.add('hidden');
        return;
    }

    rail.classList.remove('hidden');
    rail.innerHTML = '';

    crumbs.forEach((crumb, idx) => {
        if (idx > 0) {
            const sep = document.createElement('span');
            sep.className = 'bloodline-rail-sep';
            sep.textContent = '\u203A';   // ›
            rail.appendChild(sep);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bloodline-rail-item';
        if (crumb.personId === String(linkedPersonId)) btn.classList.add('is-self');
        btn.textContent = crumb.shortName;
        btn.title = crumb.name;
        btn.addEventListener('click', () => {
            if (!cy) return;
            const node = getTreePersonNodeByPersonId(crumb.personId);
            if (!node?.length) return;
            toggleTreePersonCard(crumb.personId, { reason: 'breadcrumb' });
            node.addClass('breadcrumb-focus');
        });
        rail.appendChild(btn);
    });
}

function wireTreeControls() {
    treeDepthDec.onclick = () => {
        if (treeCurrentDepth <= getTreeDepthMinimum()) return;
        treeCurrentDepth--;
        initTree({ preserveViewport: false });
    };

    treeDepthInc.onclick = () => {
        if (treeCurrentDepth >= treeMaxDepth) return;
        treeCurrentDepth++;
        initTree({ preserveViewport: false });
    };

    treeResetLayoutBtn.onclick = () => resetTreeLayout();

    treeRecenterBtn.onclick = () => focusLinkedPerson();
    treeRecenterBtn.classList.toggle('hidden', !linkedPersonId);

    treeSetDefaultBtn.classList.toggle('hidden', !isAdmin);
    treeSetDefaultBtn.disabled = !isAdmin || !treeLayoutPersistenceEnabled;
    treeSetDefaultBtn.title = !treeLayoutPersistenceEnabled
        ? 'Tree layout admin controls are unavailable for this account.'
        : isAdmin
        ? 'Save your current layout as the default for all users'
        : 'Only admins can save the shared default tree layout';
    treeSetDefaultBtn.onclick = () => openSaveDefaultLayoutModal();

    treeModeBtns.forEach(btn => {
        btn.onclick = () => {
            const nextMode = btn.dataset.treeMode;
            if (!nextMode || nextMode === treeMode) return;
            treeMode = nextMode;
            treeCurrentDepth = Math.max(treeCurrentDepth, getTreeDepthMinimum());
            initTree({ preserveViewport: false });
        };
    });

    // ── Visualization mode controls ──────────────────────────────────────────
    document.querySelectorAll('.viz-mode-btn').forEach(btn => {
        btn.onclick = () => {
            const nextViz = btn.dataset.vizMode;
            if (!nextViz || nextViz === vizMode) return;
            vizMode = nextViz;

            // Automatically adjust data mode for best experience
            if (vizMode === VIZ_MODE.BLOODLINE && treeMode === 'descendants') {
                treeMode = 'family';
            }

            if (vizMode === VIZ_MODE.RELATIONSHIP_LENS && linkedPersonId) {
                treeFocusPersonId = String(linkedPersonId);
                treeLastPersonId = String(linkedPersonId);
                initTree({ preserveViewport: false });
                return;
            }

            applyTreePersonCardState();
            applyTreeVisualizationClasses();
            renderBloodlineBreadcrumbs();
            updateVizModeUI();
            updateTreeToolbarTitle();

            // Re-layout in bloodline/household modes for tighter spacing
            if (vizMode === VIZ_MODE.BLOODLINE || vizMode === VIZ_MODE.HOUSEHOLD) {
                runFamilyLayout(cy, { fit: true });
                applyTreeVisualizationClasses();
            }

            if (treeSelectedPersonId) {
                ensureSelectedPersonReadable(treeSelectedPersonId, { reason: 'viz-mode-change' });
            }
        };
    });

    const bloodlineLockBtn = document.getElementById('bloodline-lock-btn');
    if (bloodlineLockBtn) {
        bloodlineLockBtn.onclick = () => {
            bloodlineLockActive = !bloodlineLockActive;
            applyTreeVisualizationClasses();
            updateVizModeUI();
        };
    }

    const collapseBtn = document.getElementById('collateral-collapse-btn');
    if (collapseBtn) {
        collapseBtn.onclick = () => {
            collateralCollapsed = !collateralCollapsed;
            applyCollateralVisibility();
            updateVizModeUI();
        };
    }

    const recenterLineBtn = document.getElementById('recenter-line-btn');
    if (recenterLineBtn) {
        recenterLineBtn.onclick = () => {
            if (!linkedPersonId || !cy) return;
            treeFocusPersonId = String(linkedPersonId);
            treeLastPersonId = String(linkedPersonId);
            vizMode = VIZ_MODE.BLOODLINE;
            treeCurrentDepth = Math.max(treeCurrentDepth, getTreeDepthMinimum());
            initTree({ preserveViewport: false });
        };
    }

    wireTreeKeyboard();

    treeSearchInput.oninput = () => {
        const term = treeSearchInput.value.trim().toLowerCase();
        cy.nodes('[?personId]').removeClass('highlighted');
        if (term.length < 2) return;

        const matches = cy.nodes('[?personId]').filter(n =>
            n.data('name').toLowerCase().includes(term)
        );

        if (matches.length === 0) return;
        matches.addClass('highlighted');
        cy.animate({ fit: { eles: matches, padding: 60 } }, { duration: 400 });
    };

    treeSearchInput.onkeydown = (evt) => {
        if (evt.key !== 'Enter') return;
        const term = treeSearchInput.value.trim();
        if (term.length < 2) return;

        const results = searchFamilyMembers(term);
        const personId = results.map(result => result.personId || extractPersonIdFromLink(result.link)).find(Boolean);
        if (!personId) return;

        treeFocusPersonId = personId;
        treeLastPersonId = personId;
        initTree({ preserveViewport: false });
    };
}

// Register document-level keyboard shortcuts for tree navigation.
// Called once — guard flag prevents duplicate listeners across initTree() calls.
function wireTreeKeyboard() {
    if (treeKeyboardWired) return;
    treeKeyboardWired = true;

    const PAN_STEP = 120;   // rendered pixels per keypress
    const ZOOM_STEP = 1.25; // zoom multiplier per keypress

    document.addEventListener('keydown', (e) => {
        // Only active when tree view is visible
        if (treeView.classList.contains('hidden')) return;
        // Don't intercept while typing in any input / textarea / select
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (!cy) return;

        const W = treeCyContainer.clientWidth;
        const H = treeCyContainer.clientHeight;
        const centre = { x: W / 2, y: H / 2 };

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                cy.stop(true).animate(
                    { pan: { x: cy.pan().x + PAN_STEP, y: cy.pan().y } },
                    { duration: 180 }
                );
                break;
            case 'ArrowRight':
                e.preventDefault();
                cy.stop(true).animate(
                    { pan: { x: cy.pan().x - PAN_STEP, y: cy.pan().y } },
                    { duration: 180 }
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                cy.stop(true).animate(
                    { pan: { x: cy.pan().x, y: cy.pan().y + PAN_STEP } },
                    { duration: 180 }
                );
                break;
            case 'ArrowDown':
                e.preventDefault();
                cy.stop(true).animate(
                    { pan: { x: cy.pan().x, y: cy.pan().y - PAN_STEP } },
                    { duration: 180 }
                );
                break;
            case '+':
            case '=':
                e.preventDefault();
                cy.zoom({ level: Math.min(cy.zoom() * ZOOM_STEP, cy.maxZoom()), renderedPosition: centre });
                break;
            case '-':
                e.preventDefault();
                cy.zoom({ level: Math.max(cy.zoom() / ZOOM_STEP, cy.minZoom()), renderedPosition: centre });
                break;
            case 'Escape':
                cy.$(':selected').unselect();
                break;
        }
    });
}

// Centre the tree viewport on the current user's linked family member.
// Expands depth if the node would be hidden. Safe to call when cy is ready.
function focusLinkedPerson() {
    if (!linkedPersonId) return;
    treeFocusPersonId = String(linkedPersonId);
    treeLastPersonId = String(linkedPersonId);
    treeCurrentDepth = Math.max(treeCurrentDepth, getTreeDepthMinimum());
    initTree({ preserveViewport: false });
}

// ─── Photo Upload ─────────────────────────────────────────────────────────────

// "View in Tree" profile action: navigate to family tree centered on the current profile person.
viewInTreeBtn.addEventListener('click', async () => {
    if (!currentProfilePersonId) return;
    // Record the return context so Back from tree comes back here.
    treeReturnPersonId = currentProfilePersonId;
    treeReturnProfileOpenedFrom = profileOpenedFrom;
    treeFocusPersonId = currentProfilePersonId;
    treeLastPersonId = currentProfilePersonId;
    treeCurrentDepth = TREE_DEFAULT_ENTRY_DEPTH;
    await Promise.all([loadPersonDetails(), loadPersonFamily()]);
    showTreeArea();
    await initTree({ preserveViewport: false, initialFocus: String(currentProfilePersonId) === String(linkedPersonId || '') });
});

researchPersonBtn.addEventListener('click', async () => {
    if (!currentProfilePersonId) return;
    await openResearchLibraryForPerson(currentProfilePersonId);
});

// Load approved user-uploaded photos for a person profile and return them in the
// standard photo object format expected by renderProfilePhotos / the lightbox.
async function loadApprovedUploads(personId) {
    if (!personId || !auth.currentUser) return [];
    try {
        const q = query(
            collection(db, 'photo_uploads'),
            where('personId', '==', personId),
            where('status', '==', 'approved')
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => {
            const data = d.data();
            return {
                path: data.downloadURL,
                caption: data.caption || '',
                file: data.storagePath.split('/').pop(),
                isPrimary: false
            };
        });
    } catch (err) {
        console.error('Error loading approved uploads:', err);
        return [];
    }
}

// ── Upload modal event handlers ───────────────────────────────────────────────

addPhotoBtn.addEventListener('click', () => {
    if (!requireCapability('uploadPhotos')) return;
    uploadPhotoPersonDisplay.textContent = currentProfileName;
    uploadPhotoFile.value = '';
    uploadPhotoPreviewWrap.classList.add('hidden');
    uploadPhotoPreview.src = '';
    uploadPhotoCaption.value = '';
    uploadPhotoProgressWrap.classList.add('hidden');
    uploadPhotoProgressBar.style.width = '0%';
    uploadPhotoStatus.textContent = '';
    uploadPhotoStatus.className = 'status-message';
    submitUploadPhotoBtn.disabled = false;
    uploadPhotoModal.classList.remove('hidden');
    loadMyPhotoUploadHistory();
});

closeUploadPhotoBtn.addEventListener('click', () => {
    uploadPhotoModal.classList.add('hidden');
});

uploadPhotoModal.addEventListener('click', e => {
    if (e.target === uploadPhotoModal) uploadPhotoModal.classList.add('hidden');
});

uploadPhotoFile.addEventListener('change', () => {
    const file = uploadPhotoFile.files[0];
    if (!file) { uploadPhotoPreviewWrap.classList.add('hidden'); return; }
    const reader = new FileReader();
    reader.onload = e => {
        uploadPhotoPreview.src = e.target.result;
        uploadPhotoPreviewWrap.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

submitUploadPhotoBtn.addEventListener('click', () => {
    if (!requireCapability('uploadPhotos', uploadPhotoStatus)) return;
    const file = uploadPhotoFile.files[0];
    if (!file) {
        showMessage(uploadPhotoStatus, 'Please select a photo.', 'error');
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        showMessage(uploadPhotoStatus, 'File exceeds 10 MB. Please choose a smaller image.', 'error');
        return;
    }
    if (!auth.currentUser) {
        showMessage(uploadPhotoStatus, 'You must be signed in to upload.', 'error');
        return;
    }
    const personId = currentProfilePersonId;
    if (!personId) {
        showMessage(uploadPhotoStatus, 'Cannot determine person ID for this profile.', 'error');
        return;
    }

    submitUploadPhotoBtn.disabled = true;
    uploadPhotoProgressWrap.classList.remove('hidden');
    uploadPhotoProgressBar.style.width = '0%';

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `uploads/${personId}/${timestamp}_${safeName}`;
    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on('state_changed',
        snapshot => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            uploadPhotoProgressBar.style.width = `${pct}%`;
        },
        err => {
            console.error('Upload error:', err);
            uploadPhotoProgressWrap.classList.add('hidden');
            uploadPhotoProgressBar.style.width = '0%';
            showMessage(uploadPhotoStatus, 'Upload failed. Please try again.', 'error');
            submitUploadPhotoBtn.disabled = false;
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                await addDoc(collection(db, 'photo_uploads'), {
                    personId,
                    personName: currentProfileName,
                    storagePath: path,
                    downloadURL,
                    caption: uploadPhotoCaption.value.trim() || null,
                    uploaderEmail: auth.currentUser.email,
                    uploadedAt: new Date(),
                    status: 'pending',
                    reviewedBy: null,
                    reviewedAt: null
                });
                uploadPhotoProgressWrap.classList.add('hidden');
                uploadPhotoProgressBar.style.width = '0%';
                showMessage(uploadPhotoStatus, 'Photo submitted — it will appear after admin review.', 'success');
                uploadPhotoFile.value = '';
                uploadPhotoPreviewWrap.classList.add('hidden');
                uploadPhotoCaption.value = '';
                submitUploadPhotoBtn.disabled = false;
                loadMyPhotoUploadHistory();
            } catch (err) {
                console.error('Firestore write error:', err);
                let rolledBack = true;
                try {
                    await deleteObject(fileRef);
                } catch (cleanupError) {
                    console.error('Upload cleanup error:', cleanupError);
                    rolledBack = false;
                }
                uploadPhotoProgressWrap.classList.add('hidden');
                uploadPhotoProgressBar.style.width = '0%';
                showMessage(
                    uploadPhotoStatus,
                    rolledBack
                        ? 'Upload could not be saved for review and the file was rolled back. Please try again.'
                        : 'Upload could not be saved for review. The file may still require admin cleanup before you retry.',
                    'error'
                );
                submitUploadPhotoBtn.disabled = false;
            }
        }
    );
});

// ── Admin: Photo Uploads queue ────────────────────────────────────────────────

function buildAdminPreviewPhoto(data) {
    return {
        path: data.downloadURL,
        caption: data.caption || '',
        file: data.storagePath ? data.storagePath.split('/').pop() : 'Uploaded photo',
        isPrimary: false
    };
}

async function loadPhotoUploadsSnapshotForMode(mode) {
    if (mode === 'pending') {
        try {
            return await getDocs(query(
                collection(db, 'photo_uploads'),
                where('status', '==', 'pending'),
                orderBy('uploadedAt', 'desc')
            ));
        } catch (error) {
            if (!isMissingIndexError(error)) throw error;
            const fallback = await getDocs(query(
                collection(db, 'photo_uploads'),
                where('status', '==', 'pending')
            ));
            const docs = fallback.docs
                .slice()
                .sort((a, b) => compareByDateDesc(a.data(), b.data(), entry => entry.uploadedAt));
            return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
        }
    }

    try {
        return await getDocs(query(
            collection(db, 'photo_uploads'),
            where('status', 'in', ['approved', 'rejected']),
            orderBy('reviewedAt', 'desc')
        ));
    } catch (error) {
        if (!isMissingIndexError(error)) throw error;
        const [approvedSnap, rejectedSnap] = await Promise.all([
            getDocs(query(collection(db, 'photo_uploads'), where('status', '==', 'approved'))),
            getDocs(query(collection(db, 'photo_uploads'), where('status', '==', 'rejected')))
        ]);
        const docs = [...approvedSnap.docs, ...rejectedSnap.docs]
            .sort((a, b) => compareByDateDesc(a.data(), b.data(), entry => entry.reviewedAt));
        return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
    }
}

async function loadPhotoUploadsQueue(mode = 'pending') {
    photoUploadsQueueMode = mode;
    photoUploadsQueue.innerHTML = '<p class="loading-text">Loading…</p>';
    try {
        const snap = await loadPhotoUploadsSnapshotForMode(mode);
        photoUploadsQueue.innerHTML = '';
        if (snap.empty) {
            photoUploadsQueue.innerHTML = `<p class="no-results">${mode === 'pending' ? 'No pending photo uploads.' : 'No review history yet.'}</p>`;
            return;
        }
        snap.forEach(docSnap => photoUploadsQueue.appendChild(buildPhotoUploadItem(docSnap.id, docSnap.data(), mode)));
    } catch (err) {
        console.error('Error loading photo uploads queue:', err);
        photoUploadsQueue.innerHTML = '<p class="no-results">Failed to load uploads.</p>';
    }
}

function ensurePhotoUploadsStatusElement() {
    let statusEl = photoUploadsTab.querySelector('.photo-uploads-status');
    if (statusEl) return statusEl;

    statusEl = document.createElement('div');
    statusEl.className = 'status-message photo-uploads-status hidden';
    photoUploadsQueue.parentNode.insertBefore(statusEl, photoUploadsQueue);
    return statusEl;
}

function showPhotoUploadsStatus(message, type) {
    const statusEl = ensurePhotoUploadsStatusElement();
    statusEl.textContent = message;
    statusEl.className = `status-message photo-uploads-status ${type}`;
    setTimeout(() => {
        if (statusEl.textContent === message) {
            statusEl.textContent = '';
            statusEl.className = 'status-message photo-uploads-status hidden';
        }
    }, 5000);
}

function setPhotoUploadsMode(mode) {
    photoUploadsQueueMode = mode;
    uploadsFilterPending.classList.toggle('active', mode === 'pending');
    uploadsFilterHistory.classList.toggle('active', mode === 'history');
    return loadPhotoUploadsQueue(mode);
}

function buildPhotoUploadItem(docId, data, mode = 'pending') {
    const item = document.createElement('div');
    item.className = 'feedback-item photo-upload-item';

    // Thumbnail with click-to-enlarge
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'photo-upload-thumb-wrap';
    const thumb = document.createElement('img');
    thumb.className = 'photo-upload-thumb';
    thumb.src = data.downloadURL;
    thumb.alt = data.personName || '';
    thumb.title = 'Click to view full size';
    thumb.addEventListener('click', () => {
        openLightbox([buildAdminPreviewPhoto(data)], 0, { enableNotes: false, allowPersonLinks: false });
    });
    const enlargeHint = document.createElement('span');
    enlargeHint.className = 'photo-upload-enlarge-hint';
    enlargeHint.textContent = 'View full size';
    thumbWrap.appendChild(thumb);
    thumbWrap.appendChild(enlargeHint);
    item.appendChild(thumbWrap);

    // Meta block
    const meta = document.createElement('div');
    meta.className = 'photo-upload-meta';

    const person = document.createElement('div');
    person.className = 'feedback-item-from';
    person.textContent = `For: ${data.personName || '(unknown person)'}`;
    if (data.personId) person.textContent += ` (#${data.personId})`;

    const uploader = document.createElement('div');
    uploader.className = 'feedback-item-type';
    uploader.textContent = `Uploaded by ${data.uploaderEmail}`;

    const dateEl = document.createElement('div');
    dateEl.className = 'feedback-item-date';
    dateEl.textContent = formatShortDate(data.uploadedAt) || 'Date unavailable';

    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'feedback-item-date';
    const fileName = data.storagePath ? data.storagePath.split('/').pop() : 'Unknown file';
    fileInfo.textContent = `File: ${fileName}`;

    meta.appendChild(person);
    meta.appendChild(uploader);
    meta.appendChild(dateEl);
    meta.appendChild(fileInfo);

    if (data.caption) {
        const cap = document.createElement('div');
        cap.className = 'feedback-item-message';
        cap.textContent = `"${data.caption}"`;
        meta.appendChild(cap);
    }

    item.appendChild(meta);

    if (mode === 'history') {
        // Show review outcome badge + reviewer info instead of action buttons
        const badge = document.createElement('span');
        badge.className = `upload-reviewed-badge ${data.status}`;
        badge.textContent = data.status === 'approved' ? 'Approved' : 'Rejected';
        meta.appendChild(badge);

        if (data.reviewedBy) {
            const reviewEl = document.createElement('div');
            reviewEl.className = 'feedback-item-date';
            reviewEl.textContent = `Reviewed by ${data.reviewedBy} · ${formatShortDate(data.reviewedAt) || 'date unavailable'}`;
            meta.appendChild(reviewEl);
        }
    } else {
        // Pending — show approve / reject action buttons
        const actions = document.createElement('div');
        actions.className = 'feedback-item-actions';

        const approveBtn = document.createElement('button');
        approveBtn.type = 'button';
        approveBtn.className = 'send-btn';
        approveBtn.textContent = 'Approve';
        approveBtn.addEventListener('click', async () => {
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            try {
                await updateDoc(doc(db, 'photo_uploads', docId), {
                    status: 'approved',
                    reviewedBy: auth.currentUser.email,
                    reviewedAt: new Date()
                });
                await updatePhotoUploadsBadge();
                showPhotoUploadsStatus(`Approved photo upload for ${data.personName || 'this person'}.`, 'success');
                await setPhotoUploadsMode('history');
            } catch (err) {
                console.error('Approve error:', err);
                showPhotoUploadsStatus('Could not approve the upload. Please try again.', 'error');
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
            }
        });

        const rejectBtn = document.createElement('button');
        rejectBtn.type = 'button';
        rejectBtn.className = 'secondary-btn';
        rejectBtn.textContent = 'Reject';
        rejectBtn.addEventListener('click', async () => {
            approveBtn.disabled = true;
            rejectBtn.disabled = true;
            try {
                await updateDoc(doc(db, 'photo_uploads', docId), {
                    status: 'rejected',
                    reviewedBy: auth.currentUser.email,
                    reviewedAt: new Date()
                });
                await updatePhotoUploadsBadge();
                showPhotoUploadsStatus(`Rejected photo upload for ${data.personName || 'this person'}.`, 'success');
                await setPhotoUploadsMode('history');
            } catch (err) {
                console.error('Reject error:', err);
                showPhotoUploadsStatus('Could not reject the upload. Please try again.', 'error');
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
            }
        });

        actions.appendChild(approveBtn);
        actions.appendChild(rejectBtn);
        item.appendChild(actions);
    }

    return item;
}

async function updatePhotoUploadsBadge() {
    try {
        const q = query(collection(db, 'photo_uploads'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const count = snap.size;
        if (count > 0) {
            photoUploadsBadge.textContent = String(count);
            photoUploadsBadge.classList.remove('hidden');
        } else {
            photoUploadsBadge.classList.add('hidden');
        }
    } catch {
        photoUploadsBadge.classList.add('hidden');
    }
}

// ─── Evidence Uploads ────────────────────────────────────────────────────────

const EVIDENCE_FACT_LABELS = {
    birth: 'Birth',
    marriage: 'Marriage',
    death: 'Death',
    residence: 'Residence / Census',
    burial: 'Burial / Cemetery',
    general: 'General record'
};

let evidenceUploadsQueueMode = 'pending';
// Transient handle when the Suggest-a-Change flow has a draft artifact queued
// for upload. Holds the raw File + user-entered metadata until submission.
let pendingCorrectionEvidence = null;
// Mode for the evidence modal: 'standalone' (Add Evidence) vs
// 'attach_to_submission' (opened from Suggest-a-Change "Attach an artifact").
let evidenceModalMode = 'standalone';

function factTargetLabel(value) {
    return EVIDENCE_FACT_LABELS[value] || 'Record';
}

function resetEvidenceModal() {
    evidenceUploadFile.value = '';
    evidenceUploadPreviewWrap.innerHTML = '';
    evidenceUploadPreviewWrap.classList.add('hidden');
    evidenceCitation.value = '';
    evidenceNote.value = '';
    evidenceFactTarget.value = 'birth';
    evidenceUploadProgressWrap.classList.add('hidden');
    evidenceUploadProgressBar.style.width = '0%';
    evidenceUploadStatus.textContent = '';
    evidenceUploadStatus.className = 'status-message';
    submitEvidenceUploadBtn.disabled = false;
    attachEvidenceToSubmissionBtn.disabled = false;
}

function openEvidenceModal({ mode = 'standalone', prefill = {} } = {}) {
    evidenceModalMode = mode;
    resetEvidenceModal();

    const personName = prefill.personName || currentProfileName || '';
    evidenceUploadPersonDisplay.textContent = personName;

    if (prefill.factTarget && EVIDENCE_FACT_LABELS[prefill.factTarget]) {
        evidenceFactTarget.value = prefill.factTarget;
    }
    if (prefill.citation) evidenceCitation.value = prefill.citation;
    if (prefill.note) evidenceNote.value = prefill.note;

    if (mode === 'attach_to_submission') {
        evidenceUploadTitle.textContent = 'Attach Evidence to Your Suggestion';
        evidenceUploadIntro.textContent = 'Attach an artifact to submit alongside your proposed change. Admins will review the artifact and the suggestion together.';
        submitEvidenceUploadBtn.classList.add('hidden');
        attachEvidenceToSubmissionBtn.classList.remove('hidden');
    } else {
        evidenceUploadTitle.textContent = 'Add Evidence';
        evidenceUploadIntro.textContent = 'Attach a source document (birth/marriage/death certificate, obituary, family Bible page, census scan) that supports this person\'s record. An admin will review before the artifact appears on the profile.';
        submitEvidenceUploadBtn.classList.remove('hidden');
        attachEvidenceToSubmissionBtn.classList.add('hidden');
    }

    evidenceUploadModal.classList.remove('hidden');
    loadMyEvidenceHistory();
}

function buildEvidencePreview(file) {
    evidenceUploadPreviewWrap.innerHTML = '';
    if (!file) {
        evidenceUploadPreviewWrap.classList.add('hidden');
        return;
    }
    if (file.type === 'application/pdf') {
        const wrap = document.createElement('div');
        wrap.className = 'evidence-upload-preview-pdf';
        const icon = document.createElement('span');
        icon.className = 'pdf-icon';
        icon.textContent = '📄';
        const name = document.createElement('span');
        name.textContent = file.name;
        wrap.appendChild(icon);
        wrap.appendChild(name);
        evidenceUploadPreviewWrap.appendChild(wrap);
        evidenceUploadPreviewWrap.classList.remove('hidden');
        return;
    }
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(file);
        img.alt = 'Evidence preview';
        evidenceUploadPreviewWrap.appendChild(img);
        evidenceUploadPreviewWrap.classList.remove('hidden');
    }
}

function validateEvidenceFile(file) {
    if (!file) return 'Please select a file to attach.';
    if (file.size > 15 * 1024 * 1024) return 'File exceeds 15 MB. Please choose a smaller artifact.';
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) return 'Please choose an image (JPEG, PNG, WebP) or a PDF.';
    return null;
}

async function uploadEvidenceFile(file, personId) {
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `evidence/${personId}/${timestamp}_${safeName}`;
    const fileRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(fileRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                evidenceUploadProgressBar.style.width = `${pct}%`;
            },
            (err) => reject(err),
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ path, downloadURL, fileRef });
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

async function submitStandaloneEvidence() {
    if (!requireCapability('uploadEvidence', evidenceUploadStatus)) return;
    if (!auth.currentUser) {
        showMessage(evidenceUploadStatus, 'You must be signed in to upload.', 'error');
        return;
    }
    const personId = currentProfilePersonId;
    if (!personId) {
        showMessage(evidenceUploadStatus, 'Cannot determine person ID for this profile.', 'error');
        return;
    }
    const file = evidenceUploadFile.files[0];
    const validationError = validateEvidenceFile(file);
    if (validationError) {
        showMessage(evidenceUploadStatus, validationError, 'error');
        return;
    }

    submitEvidenceUploadBtn.disabled = true;
    evidenceUploadProgressWrap.classList.remove('hidden');
    evidenceUploadProgressBar.style.width = '0%';

    let uploaded = null;
    try {
        uploaded = await uploadEvidenceFile(file, personId);
        await addDoc(collection(db, 'evidence_uploads'), {
            personId,
            personName: currentProfileName,
            factTarget: evidenceFactTarget.value,
            storagePath: uploaded.path,
            downloadURL: uploaded.downloadURL,
            mimeType: file.type,
            fileSize: file.size,
            fileName: file.name,
            citationText: evidenceCitation.value.trim() || null,
            contributorNote: evidenceNote.value.trim() || null,
            contributorEmail: auth.currentUser.email,
            contributorName: currentUser?.displayName || auth.currentUser.email,
            submittedAt: new Date(),
            status: 'pending',
            relatedSubmissionId: null,
            reviewedBy: null,
            reviewedAt: null,
            reviewerNote: null
        });
        evidenceUploadProgressWrap.classList.add('hidden');
        evidenceUploadProgressBar.style.width = '0%';
        showMessage(evidenceUploadStatus, 'Evidence submitted — it will appear after admin review.', 'success');
        evidenceUploadFile.value = '';
        evidenceUploadPreviewWrap.innerHTML = '';
        evidenceUploadPreviewWrap.classList.add('hidden');
        evidenceCitation.value = '';
        evidenceNote.value = '';
        submitEvidenceUploadBtn.disabled = false;
        loadMyEvidenceHistory();
    } catch (err) {
        console.error('Evidence upload error:', err);
        if (uploaded?.fileRef) {
            try { await deleteObject(uploaded.fileRef); } catch (cleanupError) { console.error('Evidence cleanup error:', cleanupError); }
        }
        evidenceUploadProgressWrap.classList.add('hidden');
        evidenceUploadProgressBar.style.width = '0%';
        showMessage(evidenceUploadStatus, 'Evidence could not be saved for review. Please try again.', 'error');
        submitEvidenceUploadBtn.disabled = false;
    }
}

function stagePendingCorrectionEvidence() {
    if (!requireCapability('uploadEvidence', evidenceUploadStatus)) return;
    const file = evidenceUploadFile.files[0];
    const validationError = validateEvidenceFile(file);
    if (validationError) {
        showMessage(evidenceUploadStatus, validationError, 'error');
        return;
    }
    pendingCorrectionEvidence = {
        file,
        factTarget: evidenceFactTarget.value,
        citation: evidenceCitation.value.trim(),
        note: evidenceNote.value.trim()
    };
    if (!correctionSource.value.trim() && pendingCorrectionEvidence.citation) {
        correctionSource.value = pendingCorrectionEvidence.citation;
    }
    correctionEvidenceAttachedName.textContent = file.name;
    correctionEvidenceAttached.classList.remove('hidden');
    correctionEvidenceAttach.classList.add('hidden');
    evidenceUploadModal.classList.add('hidden');
}

function clearPendingCorrectionEvidence() {
    pendingCorrectionEvidence = null;
    correctionEvidenceAttachedName.textContent = '';
    correctionEvidenceAttached.classList.add('hidden');
    correctionEvidenceAttach.classList.remove('hidden');
}

async function uploadPendingCorrectionEvidenceFor(submissionId, personId, personName) {
    if (!pendingCorrectionEvidence || !submissionId || !personId) return null;
    const { file, factTarget, citation, note } = pendingCorrectionEvidence;
    let uploaded = null;
    try {
        uploaded = await uploadEvidenceFile(file, personId);
        await addDoc(collection(db, 'evidence_uploads'), {
            personId,
            personName: personName || '',
            factTarget,
            storagePath: uploaded.path,
            downloadURL: uploaded.downloadURL,
            mimeType: file.type,
            fileSize: file.size,
            fileName: file.name,
            citationText: citation || null,
            contributorNote: note || null,
            contributorEmail: auth.currentUser.email,
            contributorName: currentUser?.displayName || auth.currentUser.email,
            submittedAt: new Date(),
            status: 'pending',
            relatedSubmissionId: submissionId,
            relatedSubmissionType: 'correction',
            reviewedBy: null,
            reviewedAt: null,
            reviewerNote: null
        });
        clearPendingCorrectionEvidence();
        return true;
    } catch (err) {
        console.error('Linked evidence upload error:', err);
        if (uploaded?.fileRef) {
            try { await deleteObject(uploaded.fileRef); } catch (cleanupError) { console.error('Evidence cleanup error:', cleanupError); }
        }
        return false;
    }
}

async function loadMyEvidenceHistory() {
    if (!auth.currentUser || !currentUser?.email) {
        setQueueEmpty(evidenceUploadHistory, 'Sign in to review your evidence submissions.');
        return;
    }
    setQueueLoading(evidenceUploadHistory, 'Loading your evidence…');
    try {
        const snap = await getDocs(query(collection(db, 'evidence_uploads'), where('contributorEmail', '==', currentUser.email)));
        const uploads = snap.docs
            .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.submittedAt));
        const entries = uploads.slice(0, 6).map((entry) => ({
            title: `${entry.personName || 'Person'} — ${factTargetLabel(entry.factTarget)}`,
            statusLabel: formatStatusLabel(entry.status),
            statusClass: getStatusClass(entry.status),
            meta: `Submitted ${formatShortDate(entry.submittedAt) || 'recently'}`,
            message: entry.citationText || entry.fileName || '',
            review: entry.reviewedBy
                ? `Reviewed by ${entry.reviewedBy} on ${formatShortDate(entry.reviewedAt) || 'a recent date'}`
                : 'Awaiting admin review'
        }));
        renderUserHistoryCards(evidenceUploadHistory, entries, 'You have not submitted any evidence yet.');
    } catch (error) {
        console.error('Error loading evidence history:', error);
        evidenceUploadHistory.innerHTML = '<p class="queue-error">Could not load your evidence history.</p>';
    }
}

// ── Evidence modal event handlers ───────────────────────────────────────────

if (addEvidenceBtn) {
    addEvidenceBtn.addEventListener('click', () => {
        if (!requireCapability('uploadEvidence')) return;
        openEvidenceModal({ mode: 'standalone' });
    });
}

closeEvidenceUploadBtn.addEventListener('click', () => {
    evidenceUploadModal.classList.add('hidden');
});

evidenceUploadModal.addEventListener('click', (e) => {
    if (e.target === evidenceUploadModal) evidenceUploadModal.classList.add('hidden');
});

evidenceUploadFile.addEventListener('change', () => {
    const file = evidenceUploadFile.files[0];
    buildEvidencePreview(file);
});

submitEvidenceUploadBtn.addEventListener('click', () => submitStandaloneEvidence());
attachEvidenceToSubmissionBtn.addEventListener('click', () => stagePendingCorrectionEvidence());

correctionEvidenceAttach.addEventListener('click', () => {
    if (!requireCapability('uploadEvidence')) return;
    openEvidenceModal({
        mode: 'attach_to_submission',
        prefill: {
            personName: submissionPerson.value || currentProfileName,
            citation: correctionSource.value
        }
    });
});

correctionEvidenceRemove.addEventListener('click', () => clearPendingCorrectionEvidence());

// ── Evidence viewer (image or PDF) ──────────────────────────────────────────

function openEvidenceViewer(entry) {
    evidenceViewerBody.innerHTML = '';
    const mime = entry.mimeType || '';
    if (mime === 'application/pdf') {
        const obj = document.createElement('object');
        obj.data = entry.downloadURL;
        obj.type = 'application/pdf';
        const fallback = document.createElement('a');
        fallback.href = entry.downloadURL;
        fallback.target = '_blank';
        fallback.rel = 'noopener';
        fallback.textContent = 'Open PDF in a new tab';
        obj.appendChild(fallback);
        evidenceViewerBody.appendChild(obj);
    } else {
        const img = document.createElement('img');
        img.src = entry.downloadURL;
        img.alt = entry.citationText || entry.fileName || 'Evidence artifact';
        evidenceViewerBody.appendChild(img);
    }
    const captionParts = [];
    if (entry.citationText) captionParts.push(entry.citationText);
    if (entry.contributorName) captionParts.push(`Contributed by ${entry.contributorName}`);
    evidenceViewerCaption.textContent = captionParts.join(' · ');
    evidenceViewer.classList.remove('hidden');
}

function closeEvidenceViewer() {
    evidenceViewer.classList.add('hidden');
    evidenceViewerBody.innerHTML = '';
    evidenceViewerCaption.textContent = '';
}

if (evidenceViewerClose) evidenceViewerClose.addEventListener('click', closeEvidenceViewer);
if (evidenceViewer) {
    evidenceViewer.addEventListener('click', (e) => {
        if (e.target === evidenceViewer || e.target.classList.contains('evidence-viewer-backdrop')) {
            closeEvidenceViewer();
        }
    });
}
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && evidenceViewer && !evidenceViewer.classList.contains('hidden')) {
        closeEvidenceViewer();
    }
});

// ── Profile Evidence section (approved artifacts) ───────────────────────────

async function loadApprovedEvidenceForPerson(personId) {
    if (!personId || !auth.currentUser) return [];
    try {
        const snap = await getDocs(query(
            collection(db, 'evidence_uploads'),
            where('personId', '==', personId),
            where('status', '==', 'approved')
        ));
        return snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => compareByDateDesc(a, b, entry => entry.reviewedAt || entry.submittedAt));
    } catch (err) {
        console.error('Error loading evidence for person:', err);
        return [];
    }
}

function renderProfileEvidence(personId, personName) {
    if (!profileEvidence) return;
    profileEvidence.innerHTML = '';
    profileEvidence.classList.add('hidden');

    loadApprovedEvidenceForPerson(personId).then((entries) => {
        if (!entries.length) return;

        const title = document.createElement('h3');
        title.className = 'profile-evidence-title';
        title.textContent = `Evidence — ${personName || 'this person'}`;
        profileEvidence.appendChild(title);

        const intro = document.createElement('p');
        intro.className = 'profile-evidence-intro';
        intro.textContent = 'Source documents contributed by family members and approved by an admin.';
        profileEvidence.appendChild(intro);

        const list = document.createElement('div');
        list.className = 'profile-evidence-list';

        entries.forEach((entry) => {
            const card = document.createElement('div');
            card.className = 'profile-evidence-card';
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Open evidence: ${entry.citationText || entry.fileName || 'artifact'}`);

            if ((entry.mimeType || '').startsWith('image/')) {
                const img = document.createElement('img');
                img.className = 'profile-evidence-thumb';
                img.src = entry.downloadURL;
                img.alt = entry.citationText || 'Evidence artifact';
                card.appendChild(img);
            } else {
                const pdfThumb = document.createElement('div');
                pdfThumb.className = 'profile-evidence-thumb-pdf';
                const icon = document.createElement('span');
                icon.className = 'pdf-icon';
                icon.textContent = '📄';
                const label = document.createElement('span');
                label.textContent = entry.fileName || 'Document (PDF)';
                pdfThumb.appendChild(icon);
                pdfThumb.appendChild(label);
                card.appendChild(pdfThumb);
            }

            const fact = document.createElement('span');
            fact.className = 'profile-evidence-fact';
            fact.textContent = factTargetLabel(entry.factTarget);
            card.appendChild(fact);

            if (entry.citationText) {
                const citation = document.createElement('p');
                citation.className = 'profile-evidence-citation';
                citation.textContent = entry.citationText;
                card.appendChild(citation);
            }

            const meta = document.createElement('p');
            meta.className = 'profile-evidence-meta';
            const parts = [];
            if (entry.contributorName) parts.push(`Contributed by ${entry.contributorName}`);
            if (entry.reviewedAt) parts.push(formatShortDate(entry.reviewedAt));
            meta.textContent = parts.join(' · ');
            card.appendChild(meta);

            const open = () => openEvidenceViewer(entry);
            card.addEventListener('click', open);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
            });

            list.appendChild(card);
        });

        profileEvidence.appendChild(list);
        profileEvidence.classList.remove('hidden');
    });
}

// ── Admin: Evidence review queue ────────────────────────────────────────────

async function loadEvidenceSnapshotForMode(mode) {
    if (mode === 'pending') {
        try {
            return await getDocs(query(
                collection(db, 'evidence_uploads'),
                where('status', '==', 'pending'),
                orderBy('submittedAt', 'desc')
            ));
        } catch (error) {
            if (!isMissingIndexError(error)) throw error;
            const fallback = await getDocs(query(
                collection(db, 'evidence_uploads'),
                where('status', '==', 'pending')
            ));
            const docs = fallback.docs
                .slice()
                .sort((a, b) => compareByDateDesc(a.data(), b.data(), entry => entry.submittedAt));
            return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
        }
    }
    try {
        return await getDocs(query(
            collection(db, 'evidence_uploads'),
            where('status', 'in', ['approved', 'rejected']),
            orderBy('reviewedAt', 'desc')
        ));
    } catch (error) {
        if (!isMissingIndexError(error)) throw error;
        const [approvedSnap, rejectedSnap] = await Promise.all([
            getDocs(query(collection(db, 'evidence_uploads'), where('status', '==', 'approved'))),
            getDocs(query(collection(db, 'evidence_uploads'), where('status', '==', 'rejected')))
        ]);
        const docs = [...approvedSnap.docs, ...rejectedSnap.docs]
            .sort((a, b) => compareByDateDesc(a.data(), b.data(), entry => entry.reviewedAt));
        return { empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
    }
}

async function loadEvidenceQueue(mode = 'pending') {
    evidenceUploadsQueueMode = mode;
    evidenceQueue.innerHTML = '<p class="loading-text">Loading…</p>';
    try {
        const snap = await loadEvidenceSnapshotForMode(mode);
        evidenceQueue.innerHTML = '';
        if (snap.empty) {
            evidenceQueue.innerHTML = `<p class="no-results">${mode === 'pending' ? 'No pending evidence submissions.' : 'No review history yet.'}</p>`;
            return;
        }
        const items = [];
        snap.forEach((docSnap) => items.push({ id: docSnap.id, data: docSnap.data() }));
        for (const item of items) {
            evidenceQueue.appendChild(await buildEvidenceReviewItem(item.id, item.data, mode));
        }
    } catch (err) {
        console.error('Error loading evidence queue:', err);
        evidenceQueue.innerHTML = '<p class="no-results">Failed to load evidence.</p>';
    }
}

function setEvidenceQueueMode(mode) {
    evidenceUploadsQueueMode = mode;
    evidenceFilterPending.classList.toggle('active', mode === 'pending');
    evidenceFilterHistory.classList.toggle('active', mode === 'history');
    return loadEvidenceQueue(mode);
}

async function fetchLinkedSubmission(submissionId) {
    if (!submissionId) return null;
    try {
        const ref = doc(db, 'submissions', submissionId);
        const snap = await getDoc(ref);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (err) {
        console.error('Error fetching linked submission:', err);
        return null;
    }
}

async function buildEvidenceReviewItem(docId, data, mode) {
    const item = document.createElement('div');
    item.className = 'evidence-review-item';

    const head = document.createElement('div');
    head.className = 'evidence-review-head';

    const headText = document.createElement('div');
    const person = document.createElement('div');
    person.className = 'feedback-item-from';
    person.textContent = `For: ${data.personName || '(unknown)'} · ${factTargetLabel(data.factTarget)}`;
    headText.appendChild(person);

    const contributor = document.createElement('div');
    contributor.className = 'feedback-item-type';
    contributor.textContent = `By ${data.contributorName || data.contributorEmail || 'unknown'}${data.contributorEmail ? ` <${data.contributorEmail}>` : ''}`;
    headText.appendChild(contributor);

    const dateEl = document.createElement('div');
    dateEl.className = 'feedback-item-date';
    dateEl.textContent = `Submitted ${formatShortDate(data.submittedAt) || 'recently'}`;
    headText.appendChild(dateEl);

    const badge = document.createElement('span');
    badge.className = `evidence-review-badge ${data.relatedSubmissionId ? 'supports-change' : 'supports-existing'}`;
    badge.textContent = data.relatedSubmissionId ? 'Supports proposed change' : 'Supports existing fact';
    head.appendChild(headText);
    head.appendChild(badge);
    item.appendChild(head);

    // Inline preview
    const preview = document.createElement('div');
    preview.className = 'evidence-review-preview';
    if ((data.mimeType || '') === 'application/pdf') {
        const obj = document.createElement('object');
        obj.data = data.downloadURL;
        obj.type = 'application/pdf';
        const link = document.createElement('a');
        link.href = data.downloadURL;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open PDF';
        obj.appendChild(link);
        preview.appendChild(obj);
    } else {
        const img = document.createElement('img');
        img.src = data.downloadURL;
        img.alt = data.fileName || 'Evidence';
        img.addEventListener('click', () => openEvidenceViewer(data));
        preview.appendChild(img);
    }
    item.appendChild(preview);

    if (data.citationText) {
        const cite = document.createElement('div');
        cite.className = 'evidence-review-citation';
        cite.innerHTML = `<strong>Citation:</strong> ${escapeHtml(data.citationText)}`;
        item.appendChild(cite);
    }
    if (data.contributorNote) {
        const note = document.createElement('div');
        note.className = 'evidence-review-note';
        note.innerHTML = `<strong>Note:</strong> ${escapeHtml(data.contributorNote)}`;
        item.appendChild(note);
    }

    // If linked to a submission, fetch and show it
    if (data.relatedSubmissionId) {
        const linked = await fetchLinkedSubmission(data.relatedSubmissionId);
        if (linked) {
            const box = document.createElement('div');
            box.className = 'evidence-review-linked';
            const label = document.createElement('div');
            label.className = 'evidence-review-linked-label';
            label.textContent = 'Linked suggestion';
            box.appendChild(label);
            const detail = document.createElement('div');
            detail.textContent = `${linked.correctionField || 'Correction'}: ${linked.proposedValue || ''}${linked.source ? ` · Source: ${linked.source}` : ''} · Status: ${formatStatusLabel(linked.status)}`;
            box.appendChild(detail);
            item.appendChild(box);
        }
    }

    if (mode === 'history') {
        const status = document.createElement('span');
        status.className = `upload-reviewed-badge ${data.status}`;
        status.textContent = data.status === 'approved' ? 'Approved' : 'Rejected';
        item.appendChild(status);
        if (data.reviewedBy) {
            const rev = document.createElement('div');
            rev.className = 'feedback-item-date';
            rev.textContent = `Reviewed by ${data.reviewedBy} · ${formatShortDate(data.reviewedAt) || 'date unavailable'}`;
            item.appendChild(rev);
        }
        if (data.reviewerNote) {
            const rn = document.createElement('div');
            rn.className = 'feedback-item-message';
            rn.textContent = `Admin note: ${data.reviewerNote}`;
            item.appendChild(rn);
        }
        return item;
    }

    // Pending actions — artifact review + (optional) linked submission review
    const actions = document.createElement('div');
    actions.className = 'evidence-review-actions';

    const artifactGroup = document.createElement('div');
    artifactGroup.className = 'evidence-review-actions-group';
    const artifactLabel = document.createElement('span');
    artifactLabel.className = 'evidence-review-actions-label';
    artifactLabel.textContent = 'Artifact';
    artifactGroup.appendChild(artifactLabel);

    const approveBtn = document.createElement('button');
    approveBtn.type = 'button';
    approveBtn.className = 'send-btn';
    approveBtn.textContent = 'Approve';
    const rejectBtn = document.createElement('button');
    rejectBtn.type = 'button';
    rejectBtn.className = 'secondary-btn';
    rejectBtn.textContent = 'Decline';

    async function decideArtifact(decision) {
        approveBtn.disabled = true;
        rejectBtn.disabled = true;
        let note = null;
        if (decision === 'rejected') {
            note = window.prompt('Optional explanation shown to the contributor:');
            if (note === null) {
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                return;
            }
            note = note.trim();
            if (!note) {
                window.alert('Please include a brief explanation when declining an evidence artifact.');
                approveBtn.disabled = false;
                rejectBtn.disabled = false;
                return;
            }
        }
        try {
            await updateDoc(doc(db, 'evidence_uploads', docId), {
                status: decision,
                reviewedBy: auth.currentUser.email,
                reviewedAt: new Date(),
                reviewerNote: note || null
            });
            await updateEvidenceBadge();
            await setEvidenceQueueMode('history');
        } catch (err) {
            console.error('Evidence review error:', err);
            approveBtn.disabled = false;
            rejectBtn.disabled = false;
        }
    }

    approveBtn.addEventListener('click', () => decideArtifact('approved'));
    rejectBtn.addEventListener('click', () => decideArtifact('rejected'));
    artifactGroup.appendChild(approveBtn);
    artifactGroup.appendChild(rejectBtn);
    actions.appendChild(artifactGroup);

    if (data.relatedSubmissionId) {
        const suggGroup = document.createElement('div');
        suggGroup.className = 'evidence-review-actions-group';
        const suggLabel = document.createElement('span');
        suggLabel.className = 'evidence-review-actions-label';
        suggLabel.textContent = 'Suggestion';
        suggGroup.appendChild(suggLabel);

        const suggApprove = document.createElement('button');
        suggApprove.type = 'button';
        suggApprove.className = 'send-btn';
        suggApprove.textContent = 'Approve';
        const suggReject = document.createElement('button');
        suggReject.type = 'button';
        suggReject.className = 'secondary-btn';
        suggReject.textContent = 'Decline';

        async function decideSubmission(decision) {
            suggApprove.disabled = true;
            suggReject.disabled = true;
            try {
                await updateDoc(doc(db, 'submissions', data.relatedSubmissionId), {
                    status: decision,
                    reviewedBy: auth.currentUser.email,
                    reviewedAt: new Date()
                });
            } catch (err) {
                console.error('Linked submission review error:', err);
                suggApprove.disabled = false;
                suggReject.disabled = false;
            }
        }
        suggApprove.addEventListener('click', () => decideSubmission('approved'));
        suggReject.addEventListener('click', () => decideSubmission('rejected'));
        suggGroup.appendChild(suggApprove);
        suggGroup.appendChild(suggReject);
        actions.appendChild(suggGroup);
    }

    item.appendChild(actions);
    return item;
}

async function updateEvidenceBadge() {
    if (!evidenceBadge) return;
    try {
        const q = query(collection(db, 'evidence_uploads'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const count = snap.size;
        if (count > 0) {
            evidenceBadge.textContent = String(count);
            evidenceBadge.classList.remove('hidden');
        } else {
            evidenceBadge.classList.add('hidden');
        }
    } catch {
        evidenceBadge.classList.add('hidden');
    }
}

if (evidenceFilterPending) evidenceFilterPending.addEventListener('click', () => setEvidenceQueueMode('pending'));
if (evidenceFilterHistory) evidenceFilterHistory.addEventListener('click', () => setEvidenceQueueMode('history'));

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ─── Analytics ───────────────────────────────────────────────────────────────

async function ensureCitedSourcesLoaded() {
    if (citedSourcesCache.length) return citedSourcesCache;
    citedSourcesCache = await loadCitedSources();
    populateSourceTypeFilter(citedSourcesCache);
    return citedSourcesCache;
}

function getPeopleByIds(personIds) {
    return [...personIds]
        .map((id) => getPersonById(id))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function calculateCitationCoverage(sources) {
    const details = getPersonDetailsData() || {};
    const allIds = Object.keys(details);
    const knownIds = new Set(allIds);
    const citedIds = new Set();
    const sourceTypePeople = new Map();

    for (const source of sources || []) {
        const sourceType = source.sourceType || 'Record Collection';
        if (!sourceTypePeople.has(sourceType)) {
            sourceTypePeople.set(sourceType, new Set());
        }

        for (const person of source.relatedPeople || []) {
            const personId = String(person.id || '').trim();
            if (!knownIds.has(personId)) continue;
            citedIds.add(personId);
            sourceTypePeople.get(sourceType).add(personId);
        }
    }

    const uncitedIds = allIds.filter((id) => !citedIds.has(id));
    const deceasedIds = allIds.filter((id) => details[id]?.deathYear);
    const livingIds = allIds.filter((id) => !details[id]?.deathYear);
    const deceasedCitedIds = deceasedIds.filter((id) => citedIds.has(id));
    const livingCitedIds = livingIds.filter((id) => citedIds.has(id));
    const bySourceType = [...sourceTypePeople.entries()]
        .map(([type, ids]) => [type, ids.size])
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    return {
        total: allIds.length,
        cited: citedIds.size,
        uncited: uncitedIds.length,
        citedIds: [...citedIds],
        uncitedIds,
        percent: allIds.length ? citedIds.size / allIds.length : 0,
        deceasedTotal: deceasedIds.length,
        deceasedCited: deceasedCitedIds.length,
        deceasedCitedIds,
        livingTotal: livingIds.length,
        livingCited: livingCitedIds.length,
        livingCitedIds,
        sourceCount: (sources || []).length,
        bySourceType
    };
}

async function openAnalyticsView({ scroll = true } = {}) {
    showAnalyticsArea();
    currentAnalyticsStats = null;

    await Promise.all([loadPersonDetails(), loadPersonPhotos(), loadPhotos(), loadPersonFamily()]);
    const stats = computeAnalytics();

    if (stats) {
        try {
            const sources = await ensureCitedSourcesLoaded();
            stats.citationCoverage = calculateCitationCoverage(sources);
            stats.userAccuracyProfile = linkedPersonId
                ? computeUserAccuracyProfile(linkedPersonId, sources)
                : null;
        } catch (error) {
            console.error('Error loading citation coverage metrics:', error);
            stats.citationCoverageError = true;
        }
    }

    currentAnalyticsStats = stats;
    renderAnalytics(stats);
    if (scroll) scrollToExplorePanel(analyticsView);
}

// Return family member result objects matching a given filter, sorted alphabetically by name.
// filterType: 'gender' | 'decade' | 'surname' | 'givenName' | 'living' | 'deceased'
function getPeopleForFilter(filterType, value) {
    const skipPrefixes = new Set(['dr', 'mr', 'mrs', 'rev', 'sr', 'jr', 'prof', 'capt']);
    const details = getPersonDetailsData() || {};
    const matched = Object.entries(details).filter(([, p]) => {
        if (filterType === 'living') return !p.deathYear;
        if (filterType === 'deceased') return !!p.deathYear;
        if (filterType === 'gender') {
            if (value === 'Unknown') return !p.sex || (p.sex !== 'Male' && p.sex !== 'Female');
            return p.sex === value;
        }
        if (filterType === 'decade') {
            return p.birthYear != null && Math.floor(p.birthYear / 10) * 10 === value;
        }
        if (filterType === 'surname') {
            const parts = (p.name || '').trim().split(/\s+/);
            return parts.length >= 2 && parts[parts.length - 1] === value;
        }
        if (filterType === 'givenName') {
            const parts = (p.name || '').trim().split(/\s+/);
            const first = parts.find(w => w.length > 1 && !skipPrefixes.has(w.toLowerCase()));
            return first === value;
        }
        return false;
    });
    return matched
        .map(([id]) => getPersonById(id))
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
}

function renderAnalyticsDirectory(title, people) {
    analyticsDirectoryState = { title, people };
    analyticsContent.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.type = 'button';
    backBtn.className = 'analytics-directory-back-btn';
    backBtn.textContent = '← Back to Analytics';
    backBtn.addEventListener('click', () => {
        analyticsDirectoryState = null;
        renderAnalytics(currentAnalyticsStats || computeAnalytics());
    });
    analyticsContent.appendChild(backBtn);

    const header = document.createElement('div');
    header.className = 'analytics-directory-header';
    const titleEl = document.createElement('span');
    titleEl.className = 'analytics-directory-title';
    titleEl.textContent = title;
    const countEl = document.createElement('span');
    countEl.className = 'analytics-directory-count';
    countEl.textContent = `${people.length} ${people.length === 1 ? 'person' : 'people'}`;
    header.appendChild(titleEl);
    header.appendChild(countEl);
    analyticsContent.appendChild(header);

    if (people.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'no-results';
        empty.textContent = 'No family members found for this filter.';
        analyticsContent.appendChild(empty);
        return;
    }

    const list = document.createElement('div');
    list.className = 'analytics-directory-list';
    for (const result of people) {
        const row = document.createElement('div');
        row.className = 'analytics-directory-row';

        const nameEl = document.createElement('span');
        nameEl.className = 'analytics-directory-name';
        nameEl.textContent = result.name;

        const datesEl = document.createElement('span');
        datesEl.className = 'analytics-directory-dates';
        datesEl.textContent = result.dates || '';

        row.appendChild(nameEl);
        row.appendChild(datesEl);
        row.addEventListener('click', () => {
            profileOpenedFrom = 'analytics-directory';
            openPersonProfile(result);
        });
        list.appendChild(row);
    }
    analyticsContent.appendChild(list);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatAnalyticsPercent(ratio) {
    return Number.isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : '0.0%';
}

function appendCitationCoverageMetric(section, coverage) {
    const meter = document.createElement('div');
    meter.className = 'analytics-quality-meter';

    const value = document.createElement('div');
    value.className = 'analytics-quality-value';
    value.textContent = formatAnalyticsPercent(coverage.percent);

    const label = document.createElement('div');
    label.className = 'analytics-quality-label';
    label.textContent = `${coverage.cited} of ${coverage.total} family members have at least one linked cited source.`;

    const backlog = document.createElement('div');
    backlog.className = 'analytics-quality-backlog';
    backlog.textContent = `${coverage.uncited} profiles still need source-backed research.`;

    meter.appendChild(value);
    meter.appendChild(label);
    meter.appendChild(backlog);
    section.appendChild(meter);
}

function appendCitationCoverageSection(stats) {
    const section = buildAnalyticsSection('Research Quality');

    if (stats.citationCoverageError) {
        const errorNote = document.createElement('p');
        errorNote.className = 'analytics-note';
        errorNote.textContent = 'Citation coverage could not be loaded right now.';
        section.appendChild(errorNote);
        analyticsContent.appendChild(section);
        return;
    }

    const coverage = stats.citationCoverage;
    if (!coverage) return;

    const note = document.createElement('p');
    note.className = 'analytics-note';
    note.textContent = 'Baseline standard: a family member counts as cited when at least one linked source is attached. This tracks research coverage, not proof quality.';
    section.appendChild(note);

    appendCitationCoverageMetric(section, coverage);

    section.appendChild(buildBarRow(
        'Cited family members',
        coverage.cited,
        coverage.total,
        'bar-citation',
        () => renderAnalyticsDirectory('Family members with cited sources', getPeopleByIds(coverage.citedIds)),
        { countText: `${coverage.cited}/${coverage.total}` }
    ));

    section.appendChild(buildBarRow(
        'Uncited research backlog',
        coverage.uncited,
        coverage.total,
        'bar-research-backlog',
        () => renderAnalyticsDirectory('Family members needing citations', getPeopleByIds(coverage.uncitedIds)),
        { countText: `${coverage.uncited}/${coverage.total}` }
    ));

    if (coverage.deceasedTotal > 0) {
        section.appendChild(buildBarRow(
            'Deceased with citations',
            coverage.deceasedCited,
            coverage.deceasedTotal,
            'bar-citation',
            () => renderAnalyticsDirectory('Deceased family members with cited sources', getPeopleByIds(coverage.deceasedCitedIds)),
            { countText: `${coverage.deceasedCited}/${coverage.deceasedTotal}` }
        ));
    }

    if (coverage.livingTotal > 0) {
        section.appendChild(buildBarRow(
            'Living with citations',
            coverage.livingCited,
            coverage.livingTotal,
            'bar-citation',
            () => renderAnalyticsDirectory('Living family members with cited sources', getPeopleByIds(coverage.livingCitedIds)),
            { countText: `${coverage.livingCited}/${coverage.livingTotal}` }
        ));
    }

    if (coverage.bySourceType.length) {
        const typeHeading = document.createElement('p');
        typeHeading.className = 'analytics-subsection-label';
        typeHeading.style.marginTop = '1rem';
        typeHeading.textContent = 'People reached by record type';
        section.appendChild(typeHeading);

        const maxTypeCount = coverage.bySourceType[0][1] || 1;
        for (const [sourceType, count] of coverage.bySourceType.slice(0, 8)) {
            section.appendChild(buildBarRow(sourceType, count, maxTypeCount, 'bar-primary'));
        }
    }

    analyticsContent.appendChild(section);
}

function formatScoreComponentLabel(key) {
    const labels = {
        profileCompleteness: 'Profile facts',
        sourceCoverage: 'Source coverage',
        relationshipConsistency: 'Family links',
        conflictReview: 'Conflict review'
    };
    return labels[key] || key;
}

function appendUserAccuracySection(stats) {
    const section = buildAnalyticsSection('My Data Confidence');

    if (!linkedPersonId) {
        const note = document.createElement('p');
        note.className = 'analytics-note';
        note.textContent = 'Sign in with a linked family profile to see a personal documentation score and country ratio summary.';
        section.appendChild(note);
        analyticsContent.appendChild(section);
        return;
    }

    if (stats.citationCoverageError) {
        const note = document.createElement('p');
        note.className = 'analytics-note';
        note.textContent = 'Personal confidence metrics could not be loaded because cited-source coverage is unavailable right now.';
        section.appendChild(note);
        analyticsContent.appendChild(section);
        return;
    }

    const profile = stats.userAccuracyProfile;
    if (!profile) {
        const note = document.createElement('p');
        note.className = 'analytics-note';
        note.textContent = 'A linked family profile was found, but there is not enough structured family data to calculate this yet.';
        section.appendChild(note);
        analyticsContent.appendChild(section);
        return;
    }

    const card = document.createElement('div');
    card.className = `analytics-accuracy-card analytics-accuracy-card--${profile.insufficientData ? 'low' : profile.confidenceBand.toLowerCase()}`;

    const scoreWrap = document.createElement('div');
    scoreWrap.className = 'analytics-accuracy-score';

    const score = document.createElement('div');
    score.className = 'analytics-accuracy-value';
    score.textContent = profile.insufficientData ? 'Review' : String(profile.score);

    const label = document.createElement('div');
    label.className = 'analytics-accuracy-label';
    label.textContent = profile.insufficientData
        ? 'Insufficient linked evidence'
        : `${profile.confidenceBand} confidence`;

    scoreWrap.appendChild(score);
    scoreWrap.appendChild(label);
    card.appendChild(scoreWrap);

    const body = document.createElement('div');
    body.className = 'analytics-accuracy-body';

    const summary = document.createElement('p');
    summary.className = 'analytics-accuracy-summary';
    summary.textContent = `Based on ${profile.coverageStats.peopleInWindow} linked people from your profile through ${profile.coverageStats.ancestorDepth} ancestor generations. This is a documentation score, not a DNA, ethnicity, or citizenship estimate.`;
    body.appendChild(summary);

    const meta = document.createElement('div');
    meta.className = 'analytics-accuracy-meta';
    meta.textContent = `${profile.modelVersion} · ${new Date(profile.computedAt).toLocaleString()} · ${profile.coverageStats.citedPeople} cited people`;
    body.appendChild(meta);

    card.appendChild(body);
    section.appendChild(card);

    const ratioHeading = document.createElement('p');
    ratioHeading.className = 'analytics-subsection-label';
    ratioHeading.textContent = 'Documentation-based country ratio';
    section.appendChild(ratioHeading);

    Object.entries(profile.nationalityRatio).slice(0, 6).forEach(([country, percent]) => {
        section.appendChild(buildBarRow(country, percent, 100, country === 'Unknown' ? 'bar-unknown' : 'bar-primary', null, {
            countText: `${percent.toFixed(1)}%`
        }));
    });

    const componentHeading = document.createElement('p');
    componentHeading.className = 'analytics-subsection-label';
    componentHeading.style.marginTop = '1rem';
    componentHeading.textContent = 'How this is calculated';
    section.appendChild(componentHeading);

    Object.entries(profile.components).forEach(([key, ratio]) => {
        section.appendChild(buildBarRow(formatScoreComponentLabel(key), Math.round(ratio * 100), 100, 'bar-coverage', null, {
            countText: `${Math.round(ratio * 100)}%`
        }));
    });

    const explanationList = document.createElement('ul');
    explanationList.className = 'analytics-explanation-list';
    profile.explanations.forEach((text) => {
        const item = document.createElement('li');
        item.textContent = text;
        explanationList.appendChild(item);
    });
    section.appendChild(explanationList);

    analyticsContent.appendChild(section);
}

function renderAnalytics(stats) {
    analyticsContent.innerHTML = '';

    if (!stats) {
        const msg = document.createElement('p');
        msg.className = 'no-results';
        msg.textContent = 'Analytics data is not yet available. Please try again shortly.';
        analyticsContent.appendChild(msg);
        return;
    }

    // ── Summary cards ──────────────────────────────────────────────────────────
    const summaryEl = document.createElement('div');
    summaryEl.className = 'analytics-summary';

    const spanLabel = stats.minBirthYear && stats.maxBirthYear
        ? `${stats.minBirthYear}\u2013${stats.maxBirthYear}`
        : '\u2014';

    const cards = [
        { value: stats.total, label: 'Family Members' },
        { value: stats.living, label: 'Living' },
        { value: stats.deceased, label: 'Deceased' },
        { value: stats.totalPhotos !== null ? stats.totalPhotos : '\u2014', label: 'Photographs' },
        { value: stats.withPhotos, label: 'People with Photos' },
        { value: spanLabel, label: 'Records Span' }
    ];
    if (stats.citationCoverage) {
        cards.push(
            { value: formatAnalyticsPercent(stats.citationCoverage.percent), label: 'Citation Coverage' },
            { value: stats.citationCoverage.uncited, label: 'Uncited Profiles' }
        );
    }

    for (const card of cards) {
        const el = document.createElement('div');
        el.className = 'analytics-card';
        const val = document.createElement('div');
        val.className = 'analytics-card-value';
        val.textContent = String(card.value);
        const lbl = document.createElement('div');
        lbl.className = 'analytics-card-label';
        lbl.textContent = card.label;
        el.appendChild(val);
        el.appendChild(lbl);
        summaryEl.appendChild(el);
    }
    analyticsContent.appendChild(summaryEl);

    appendUserAccuracySection(stats);
    appendCitationCoverageSection(stats);

    // ── Gender distribution ────────────────────────────────────────────────────
    const genderSection = buildAnalyticsSection('Gender Distribution');
    const genderTotal = stats.gender.Male + stats.gender.Female + stats.gender.Unknown;
    const genderRows = [
        { label: 'Male', count: stats.gender.Male, colorClass: 'bar-male' },
        { label: 'Female', count: stats.gender.Female, colorClass: 'bar-female' },
        { label: 'Unknown', count: stats.gender.Unknown, colorClass: 'bar-unknown' }
    ];
    for (const row of genderRows) {
        const genderValue = row.label;
        genderSection.appendChild(buildBarRow(row.label, row.count, genderTotal, row.colorClass, () => {
            renderAnalyticsDirectory(`${genderValue} family members`, getPeopleForFilter('gender', genderValue));
        }));
    }
    analyticsContent.appendChild(genderSection);

    // ── Living vs Deceased ────────────────────────────────────────────────────
    const livingSection = buildAnalyticsSection('Living vs. Deceased');
    const livingNote = document.createElement('p');
    livingNote.className = 'analytics-note';
    livingNote.textContent = `"Deceased" means a death year is recorded. Members without a death year are counted as living.`;
    livingSection.appendChild(livingNote);
    const livingTotal = stats.living + stats.deceased;
    const livingRows = [
        { label: 'Living', count: stats.living, colorClass: 'bar-living', filter: 'living' },
        { label: 'Deceased', count: stats.deceased, colorClass: 'bar-deceased', filter: 'deceased' }
    ];
    for (const row of livingRows) {
        const f = row.filter;
        livingSection.appendChild(buildBarRow(row.label, row.count, livingTotal, row.colorClass, () => {
            renderAnalyticsDirectory(`${row.label} family members`, getPeopleForFilter(f));
        }));
    }
    analyticsContent.appendChild(livingSection);

    // ── Birth decades ──────────────────────────────────────────────────────────
    const decadeSection = buildAnalyticsSection('Births by Decade');
    const decadeNote = document.createElement('p');
    decadeNote.className = 'analytics-note';
    decadeNote.textContent = `Based on ${stats.withBirthYear} of ${stats.total} people with a recorded birth year.`;
    decadeSection.appendChild(decadeNote);

    const sortedDecades = Object.entries(stats.birthDecades)
        .sort((a, b) => Number(a[0]) - Number(b[0]));
    const maxDecadeCount = Math.max(...sortedDecades.map(d => d[1]));
    for (const [decade, count] of sortedDecades) {
        const decadeNum = Number(decade);
        decadeSection.appendChild(buildBarRow(`${decade}s`, count, maxDecadeCount, 'bar-primary', () => {
            renderAnalyticsDirectory(`Born in the ${decade}s`, getPeopleForFilter('decade', decadeNum));
        }));
    }
    analyticsContent.appendChild(decadeSection);

    // ── Lifespan ──────────────────────────────────────────────────────────────
    if (stats.lifespan) {
        const lifespanSection = buildAnalyticsSection('Recorded Lifespans');
        const note = document.createElement('p');
        note.className = 'analytics-note';
        note.textContent = `Based on ${stats.lifespan.count} people with both birth and death years recorded.`;
        lifespanSection.appendChild(note);

        const lifespanCards = document.createElement('div');
        lifespanCards.className = 'analytics-lifespan-cards';
        const lsItems = [
            { label: 'Average', value: `${stats.lifespan.avg} yrs` },
            { label: 'Longest', value: `${stats.lifespan.max} yrs` },
            { label: 'Shortest', value: `${stats.lifespan.min} yrs` }
        ];
        for (const item of lsItems) {
            const card = document.createElement('div');
            card.className = 'analytics-lifespan-card';
            const val = document.createElement('div');
            val.className = 'analytics-card-value';
            val.textContent = item.value;
            const lbl = document.createElement('div');
            lbl.className = 'analytics-card-label';
            lbl.textContent = item.label;
            card.appendChild(val);
            card.appendChild(lbl);
            lifespanCards.appendChild(card);
        }
        lifespanSection.appendChild(lifespanCards);
        analyticsContent.appendChild(lifespanSection);
    }

    // ── Top surnames ──────────────────────────────────────────────────────────
    const surnameSection = buildAnalyticsSection('Top Surnames');
    const maxSurnameCount = stats.topSurnames[0]?.[1] || 1;
    for (const [name, count] of stats.topSurnames) {
        const sname = name;
        surnameSection.appendChild(buildBarRow(name, count, maxSurnameCount, 'bar-primary', () => {
            renderAnalyticsDirectory(`Family members named ${sname}`, getPeopleForFilter('surname', sname));
        }));
    }
    analyticsContent.appendChild(surnameSection);

    // ── Top given names ───────────────────────────────────────────────────────
    const givenSection = buildAnalyticsSection('Top Given Names');
    const maxGivenCount = stats.topGivenNames[0]?.[1] || 1;
    for (const [name, count] of stats.topGivenNames) {
        const gname = name;
        givenSection.appendChild(buildBarRow(name, count, maxGivenCount, 'bar-primary', () => {
            renderAnalyticsDirectory(`Family members named ${gname}`, getPeopleForFilter('givenName', gname));
        }));
    }
    analyticsContent.appendChild(givenSection);

    // ── Quad Cities connection ────────────────────────────────────────────────
    if (stats.qc && stats.qc.connected > 0) {
        const qcSection = buildAnalyticsSection('Quad Cities Connection');

        const qcNote = document.createElement('p');
        qcNote.className = 'analytics-note';
        const qcPct = ((stats.qc.connected / stats.total) * 100).toFixed(1);
        qcNote.textContent = `${stats.qc.connected} of ${stats.total} family members (${qcPct}%) have at least one recorded life event in the Quad Cities area (Rock Island County, IL and the Iowa-side metro).`;
        qcSection.appendChild(qcNote);

        // Event type breakdown
        const typeHeading = document.createElement('p');
        typeHeading.className = 'analytics-subsection-label';
        typeHeading.textContent = 'How they are connected';
        qcSection.appendChild(typeHeading);

        const qcTotal = stats.qc.connected;
        for (const [type, count] of stats.qc.byEventType) {
            qcSection.appendChild(buildBarRow(type, count, qcTotal, 'bar-primary'));
        }

        // City breakdown
        const cityHeading = document.createElement('p');
        cityHeading.className = 'analytics-subsection-label';
        cityHeading.style.marginTop = '1rem';
        cityHeading.textContent = 'By city (event occurrences)';
        qcSection.appendChild(cityHeading);

        const maxCityCount = stats.qc.byCity[0]?.[1] || 1;
        for (const [city, count] of stats.qc.byCity) {
            qcSection.appendChild(buildBarRow(city, count, maxCityCount, 'bar-coverage'));
        }

        analyticsContent.appendChild(qcSection);
    }

    // ── Data coverage ─────────────────────────────────────────────────────────
    const coverageSection = buildAnalyticsSection('Data Coverage');
    const coverageNote = document.createElement('p');
    coverageNote.className = 'analytics-note';
    coverageNote.textContent = 'Statistics reflect what is recorded in the RootsMagic source database. Missing or unrecorded data is not included in calculations.';
    coverageSection.appendChild(coverageNote);

    const coverageItems = [
        { label: 'Have birth year', count: stats.withBirthYear, total: stats.total },
        { label: 'Have death year', count: stats.withDeathYear, total: stats.total },
        { label: 'Have photos', count: stats.withPhotos, total: stats.total }
    ];
    for (const item of coverageItems) {
        coverageSection.appendChild(buildBarRow(item.label, item.count, item.total, 'bar-coverage'));
    }
    analyticsContent.appendChild(coverageSection);
}

function buildAnalyticsSection(title) {
    const section = document.createElement('div');
    section.className = 'analytics-section';
    const heading = document.createElement('h3');
    heading.className = 'analytics-section-title';
    heading.textContent = title;
    section.appendChild(heading);
    return section;
}

function buildBarRow(label, count, maxCount, colorClass, onClick = null, options = {}) {
    const row = document.createElement('div');
    row.className = 'analytics-bar-row';
    if (onClick) {
        row.classList.add('analytics-bar-clickable');
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.addEventListener('click', onClick);
        row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } });
    }

    const lbl = document.createElement('span');
    lbl.className = 'analytics-bar-label';
    lbl.textContent = label;

    const track = document.createElement('div');
    track.className = 'analytics-bar-track';
    const fill = document.createElement('div');
    fill.className = `analytics-bar-fill ${colorClass}`;
    const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
    fill.style.width = `${pct}%`;
    track.appendChild(fill);

    const cnt = document.createElement('span');
    cnt.className = 'analytics-bar-count';
    cnt.textContent = options.countText || String(count);

    row.appendChild(lbl);
    row.appendChild(track);
    row.appendChild(cnt);
    return row;
}

// ─── Research Library ──────────────────────────────────────────────────────────

// Open the Cited Sources view pre-filtered to a specific record type or place/year clue.
async function openCitedSourcesWithFilter(sourceTypeOrOptions) {
    const options = typeof sourceTypeOrOptions === 'object'
        ? (sourceTypeOrOptions || {})
        : { sourceType: sourceTypeOrOptions };
    profileOpenedFrom = 'sources';
    await openCitedSourcesView();
    if (sourcesTypeFilter) {
        const sourceType = options.sourceType || '';
        const hasSourceType = sourceType && [...sourcesTypeFilter.options].some((option) => option.value === sourceType);
        sourcesTypeFilter.value = hasSourceType ? sourceType : 'all';
    }
    if (sourcesPlaceFilter) sourcesPlaceFilter.value = options.place || '';
    if (sourcesYearStartFilter) sourcesYearStartFilter.value = options.yearStart || '';
    if (sourcesYearEndFilter) sourcesYearEndFilter.value = options.yearEnd || '';
    if (sourcesHasExternalFilter) sourcesHasExternalFilter.checked = Boolean(options.requireExternal);
    refreshCitedSourcesView();
}

const RESEARCH_CATEGORIES = [
    {
        id: 'Census',
        label: 'Census & Population Records',
        icon: '🏠',
        description: 'Federal and state census records list every member of a household — name, age, birthplace, occupation, and relationships — at a specific point in time.',
        whyItMatters: 'Census records are one of the best ways to place a family at a specific address, confirm who lived together, and estimate birth years for people without birth certificates.',
        whatYouFind: 'Names, ages, birthplaces, occupations, relationships, and home addresses. Later censuses (1880–1940) include parents\' birthplaces and can confirm family groupings.',
        sourceType: 'Census',
    },
    {
        id: 'Military',
        label: 'Military Service Records',
        icon: '🎖️',
        description: 'Military records include draft registrations, service cards, and pension files that document a person\'s military experience.',
        whyItMatters: 'Veterans in the family often left behind some of the most detailed paper trails available — physical descriptions, home addresses, next-of-kin names, and discharge dates.',
        whatYouFind: 'Physical descriptions, dates of enlistment and discharge, rank, unit assignments, and sometimes family contact information.',
        sourceType: 'Military',
    },
    {
        id: 'Vital Record',
        label: 'Vital Records — Birth, Marriage & Death',
        icon: '📋',
        description: 'Official records that document the three key milestones in a person\'s life: when they were born, who they married, and when they died.',
        whyItMatters: 'Vital records are among the most reliable genealogical documents because they were created at or near the time of the event and often include parents\' names, witnesses, and places.',
        whatYouFind: 'Birth certificates give parents\' names. Marriage records give ages and sometimes parents. Death certificates give cause of death and informant details.',
        sourceType: 'Vital Record',
    },
    {
        id: 'Newspaper',
        label: 'Newspapers & Obituaries',
        icon: '📰',
        description: 'Local newspapers recorded marriages, deaths, anniversaries, community events, and family news that official records often missed.',
        whyItMatters: 'Obituaries frequently mention surviving relatives by name — including married daughters whose surnames changed. Wedding announcements name both families and sometimes the church.',
        whatYouFind: 'Obituaries, wedding notices, anniversary announcements, letters to the editor, social columns, and local news items.',
        sourceType: 'Newspaper',
    },
    {
        id: 'Cemetery',
        label: 'Cemetery & Burial Records',
        icon: '⛪',
        description: 'Cemetery records and grave inscriptions confirm death dates and burial locations, and often reveal family groupings through nearby plots.',
        whyItMatters: 'Families were often buried together. Finding one person\'s grave can reveal siblings, spouses, and parents buried in the same section — sometimes not otherwise documented.',
        whatYouFind: 'Death dates, birth dates (when inscribed), military service markers, and the names of others buried in adjacent plots.',
        sourceType: 'Cemetery',
    },
    {
        id: 'Yearbook',
        label: 'School Yearbooks',
        icon: '🎓',
        description: 'School yearbooks capture a person at a specific age, place them in a community, and name classmates who may be connected to other family members.',
        whyItMatters: 'A yearbook photograph can put a human face on a name in the archive. Classmates named may be cousins, neighbors, or future spouses.',
        whatYouFind: 'Photographs, class years, activity lists, and sometimes graduation quotes or career plans.',
        sourceType: 'Yearbook',
    },
    {
        id: 'Immigration',
        label: 'Immigration & Naturalization',
        icon: '🚢',
        description: 'Passenger manifests and naturalization papers document the journey from one country to another and the process of becoming a citizen.',
        whyItMatters: 'These records can reveal the exact village or town of origin in Europe — information that connects the American branch of the family to its roots abroad.',
        whatYouFind: 'Port of departure, date of arrival, last residence abroad, closest relative in the home country, and the name of the contact in the destination country.',
        sourceType: 'Immigration',
    },
    {
        id: 'Directory',
        label: 'Directories & Local Records',
        icon: '📖',
        description: 'City directories, county histories, and local public records place a person in a specific community and occupation at a given time.',
        whyItMatters: 'Directories were published annually and capture moves year to year. They can confirm an address, a profession, and a neighborhood long before or after a census year.',
        whatYouFind: 'Names, addresses, occupations, and sometimes business listings. County histories may include biographical sketches of prominent residents.',
        sourceType: 'Directory/Public Record',
    },
];

const RESEARCH_PATHWAYS = [
    {
        id: 'immigration',
        label: 'Immigration Pathway',
        intro: 'Trace the family\'s roots from the Midwest back to Europe. This pathway follows the evidence from arrival records to the villages and towns the first generation left behind.',
        steps: [
            { heading: 'Start with what you know', body: 'Find a family member who immigrated. Census records from around 1900–1930 will list their birthplace and their parents\' birthplaces — start there.' },
            { heading: 'Check passenger lists', body: 'Search the archive\'s Immigration records for passenger manifests. These often list the last place of residence abroad and a contact in the origin country.' },
            { heading: 'Look for naturalization papers', body: 'Naturalization records frequently name the specific town or village of origin. Look for declarations of intent and final papers filed in the county courthouse.' },
            { heading: 'Research the origin community', body: 'Once you have a specific place — a village in Germany, Bohemia, or elsewhere — church records, civil registration, and emigration lists there may extend the family back several more generations.' },
        ],
        categories: ['Immigration', 'Census'],
    },
    {
        id: 'military',
        label: 'Military Service Pathway',
        intro: 'The family archive contains military records spanning several conflicts. This pathway helps you understand what each record type reveals and how to connect a service record to a person\'s broader life.',
        steps: [
            { heading: 'Identify the conflict and branch', body: 'World War I, World War II, and other eras each have different record sets. Draft registrations, service records, and discharge papers come from different repositories.' },
            { heading: 'Check draft registrations', body: 'WWI and WWII draft cards are among the most widely available military records. They include the registrant\'s physical description, employer, and next of kin — sometimes revealing a spouse or parents not found elsewhere.' },
            { heading: 'Look for pension and benefits records', body: 'Veterans who applied for pensions left behind detailed files. Widow\'s pension applications are especially rich — they often include marriage certificates, birth records, and affidavits from neighbors.' },
            { heading: 'Connect to newspapers and cemeteries', body: 'Many veterans were remembered in local newspaper obituaries with full service histories. Cemetery records may show military service markers.' },
        ],
        categories: ['Military', 'Newspaper', 'Cemetery'],
    },
    {
        id: 'local-life',
        label: 'Local Life Pathway — Quad Cities Area',
        intro: 'Much of the family\'s history is rooted in the Quad Cities area — Rock Island, Moline, East Moline, and Davenport. This pathway guides you through the local records that document everyday life in that region.',
        steps: [
            { heading: 'Use census records to anchor the family', body: 'Federal census records from 1880 through 1940 track Rock Island and Scott County households year by year. Find the family address and look for neighbors — many will be relatives or people who knew the family.' },
            { heading: 'Search local newspapers', body: 'The Rock Island Argus, Moline Daily Dispatch, and Davenport newspapers all covered local family news. Births, deaths, church events, school graduations, and community activities were regularly reported.' },
            { heading: 'Check cemetery records', body: 'Rock Island County has dozens of cemeteries. Many family members are buried at Chippiannock, Lincoln Memorial Park, or smaller township cemeteries. Cemetery records often include plot maps showing adjacent burials.' },
            { heading: 'Look at city directories', body: 'Annual city directories for Rock Island, Moline, and Davenport list residents by name and address, year by year. These can track moves within the metro area and confirm occupations.' },
        ],
        categories: ['Census', 'Newspaper', 'Cemetery', 'Directory'],
    },
    {
        id: 'maiden-name',
        label: 'Marriage & Maiden Name Pathway',
        intro: 'Tracing women in the family tree can be challenging because surnames change at marriage. This pathway walks through the record types most likely to preserve a woman\'s full identity.',
        steps: [
            { heading: 'Start with the marriage record', body: 'Marriage certificates and licenses record the bride\'s maiden name, age, birthplace, and often her parents\' names. County courthouse records or vital records offices hold these.' },
            { heading: 'Check the bride\'s parents in earlier censuses', body: 'Once you have the maiden name, search earlier censuses (before the marriage) for a household with that surname and a daughter matching the right age. This can reveal her siblings and parents.' },
            { heading: 'Look for maiden name in obituaries', body: 'Newspaper obituaries frequently mention a woman\'s maiden name, especially in communities where families had long roots. "née [maiden name]" or "formerly of the [surname] family" are common phrasings.' },
            { heading: 'Check vital records under both names', body: 'Birth records for a woman\'s children may list her full maiden name. Death certificates often include the informant — a child or sibling — who may supply the maiden name even if it wasn\'t used in daily life.' },
        ],
        categories: ['Vital Record', 'Census', 'Newspaper'],
    },
];

const RESEARCH_FACTS = [
    {
        key: 'birthDate',
        label: 'Birth date',
        eventType: 'Birth',
        eventPart: 'date',
        correctionField: 'Birth Date',
        sourceTypes: ['Vital Record', 'Church', 'Census', 'Newspaper', 'Cemetery'],
        searchTip: 'Start with birth, baptism, delayed birth, census, and obituary records. Census ages can estimate a year, but birth or baptism records are stronger.'
    },
    {
        key: 'birthPlace',
        label: 'Birth place',
        eventType: 'Birth',
        eventPart: 'place',
        correctionField: 'Birth Place',
        sourceTypes: ['Vital Record', 'Church', 'Census', 'Immigration', 'Naturalization'],
        searchTip: 'Look for a birthplace in birth records, census entries, naturalization papers, obituaries, and records for siblings.'
    },
    {
        key: 'deathDate',
        label: 'Death date',
        eventType: 'Death',
        eventPart: 'date',
        correctionField: 'Death Date',
        sourceTypes: ['Vital Record', 'Cemetery', 'Newspaper', 'Record Collection'],
        searchTip: 'Death certificates, obituaries, cemetery memorials, and funeral home records are the strongest starting points.'
    },
    {
        key: 'deathPlace',
        label: 'Death place',
        eventType: 'Death',
        eventPart: 'place',
        correctionField: 'Death Place',
        sourceTypes: ['Vital Record', 'Cemetery', 'Newspaper', 'Record Collection'],
        searchTip: 'Death certificates and obituaries usually name the death place. Burial records can identify a likely county when the exact place is missing.'
    },
    {
        key: 'burialPlace',
        label: 'Burial place',
        eventType: 'Burial',
        eventPart: 'place',
        correctionField: 'Other',
        sourceTypes: ['Cemetery', 'Newspaper', 'Vital Record'],
        searchTip: 'Search cemetery indexes, Find a Grave or BillionGraves entries, funeral notices, and death certificates.'
    },
    {
        key: 'sourceCitation',
        label: 'Source-backed evidence',
        eventType: null,
        eventPart: null,
        correctionField: 'Other',
        sourceTypes: ['Vital Record', 'Census', 'Newspaper', 'Cemetery', 'Directory/Public Record'],
        searchTip: 'Find at least one source that directly supports a key life event, then include the exact citation with your suggested update.'
    }
];

const RESEARCH_FACT_LOOKUP = new Map(RESEARCH_FACTS.map((fact) => [fact.key, fact]));

function normalizeResearchText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function getResearchPersonName(personId, details = null) {
    const member = getPersonById(personId) || {};
    return buildProfileDisplayName(member, details || getDetailsForPerson(personId));
}

function getResearchDates(value) {
    const dates = normalizeResearchText(value);
    if (!dates || dates === '-' || dates === '?-?') return '';
    if (/^-\d/.test(dates)) return `d. ${dates.slice(1)}`;
    if (/^\d{3,4}-(\?)?$/.test(dates)) return `b. ${dates.replace(/-\??$/, '')}`;
    return dates;
}

function getResearchEvent(details, eventType) {
    if (!eventType) return null;
    return (details?.events || []).find((event) => event.type === eventType) || null;
}

function getResearchFactValue(details, fact) {
    if (!fact.eventType) return '';
    const event = getResearchEvent(details, fact.eventType);
    return normalizeResearchText(event?.[fact.eventPart]);
}

function getResearchKnownFacts(details) {
    const rows = [];
    for (const type of ['Birth', 'Baptism', 'Death', 'Burial', 'Residence', 'Military', 'Immigration', 'Naturalization']) {
        (details?.events || [])
            .filter((event) => event.type === type)
            .slice(0, 3)
            .forEach((event) => {
                const parts = [event.date, event.place || event.details].filter(Boolean);
                if (!parts.length) return;
                rows.push({ label: event.type, value: parts.join(' · ') });
            });
    }
    return rows.slice(0, 8);
}

function getCitedPersonIdSet() {
    const citedIds = new Set();
    for (const source of citedSourcesCache || []) {
        (source.relatedPeople || []).forEach((person) => citedIds.add(String(person.id)));
    }
    return citedIds;
}

function getMissingResearchFacts(personId, details, citedIds = getCitedPersonIdSet()) {
    const missing = [];
    const isLiving = details?.living === true;

    for (const fact of RESEARCH_FACTS) {
        if ((fact.key === 'deathDate' || fact.key === 'deathPlace' || fact.key === 'burialPlace') && isLiving) {
            continue;
        }
        if (fact.key === 'sourceCitation') {
            if (!citedIds.has(String(personId))) missing.push(fact);
            continue;
        }
        if (!getResearchFactValue(details, fact)) {
            missing.push(fact);
        }
    }

    return missing;
}

function getSourceLeadsForPerson(personId, fact = null) {
    const id = String(personId);
    const preferredTypes = new Set(fact?.sourceTypes || []);
    return (citedSourcesCache || [])
        .filter((source) => (source.relatedPeople || []).some((person) => String(person.id) === id))
        .sort((a, b) => {
            const aPreferred = preferredTypes.has(a.sourceType) ? 0 : 1;
            const bPreferred = preferredTypes.has(b.sourceType) ? 0 : 1;
            if (aPreferred !== bPreferred) return aPreferred - bPreferred;
            return String(a.title || '').localeCompare(String(b.title || ''));
        })
        .slice(0, 8);
}

function buildResearchOpportunities() {
    const detailsById = getPersonDetailsData() || {};
    const citedIds = getCitedPersonIdSet();

    return Object.entries(detailsById)
        .map(([personId, details]) => {
            const missingFacts = getMissingResearchFacts(personId, details, citedIds);
            if (!missingFacts.length) return null;
            const name = getResearchPersonName(personId, details);
            const member = getPersonById(personId);
            const sourceCount = (citedSourcesCache || []).filter((source) => (
                source.relatedPeople || []
            ).some((person) => String(person.id) === String(personId))).length;

            return {
                personId: String(personId),
                name,
                dates: getResearchDates(member?.dates) || profileYearSpan(details),
                living: details?.living === true,
                details,
                sourceCount,
                missingFacts,
                searchText: `${name} ${member?.surname || ''} ${getResearchDates(member?.dates)} ${missingFacts.map((fact) => fact.label).join(' ')}`.toLowerCase()
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            const aScore = getResearchOpportunityScore(a);
            const bScore = getResearchOpportunityScore(b);
            if (aScore !== bScore) return bScore - aScore;
            return a.name.localeCompare(b.name);
        });
}

function profileYearSpan(details = {}) {
    if (!details?.birthYear && !details?.deathYear) return '';
    return `${details.birthYear || '?'}-${details.deathYear || '?'}`;
}

function getResearchOpportunityScore(opportunity) {
    let score = opportunity.missingFacts.length;
    if (!opportunity.living) score += 2;
    if (opportunity.missingFacts.some((fact) => fact.key === 'birthDate' || fact.key === 'deathDate')) score += 3;
    if (opportunity.missingFacts.some((fact) => fact.key === 'birthPlace' || fact.key === 'deathPlace')) score += 2;
    if (!opportunity.sourceCount) score += 2;
    return score;
}

function getFilteredResearchOpportunities(opportunities) {
    const queryText = researchFilterText.trim().toLowerCase();
    if (!queryText) return opportunities;
    return opportunities.filter((opportunity) => opportunity.searchText.includes(queryText));
}

function selectResearchPerson(personId, factKey = '') {
    selectedResearchPersonId = String(personId || '');
    selectedResearchFactKey = factKey || '';
    renderResearchLibrary();
}

function getDefaultResearchFact(opportunity) {
    if (!opportunity) return RESEARCH_FACTS[0];
    const selected = RESEARCH_FACT_LOOKUP.get(selectedResearchFactKey);
    if (selected && opportunity.missingFacts.some((fact) => fact.key === selected.key)) return selected;
    return opportunity.missingFacts[0] || RESEARCH_FACTS[0];
}

function renderResearchSummary(container, opportunities) {
    const allMissing = opportunities.flatMap((opportunity) => opportunity.missingFacts);
    const counts = [
        ['People needing research', opportunities.length],
        ['Missing dates', allMissing.filter((fact) => fact.key.endsWith('Date')).length],
        ['Missing places', allMissing.filter((fact) => fact.key.endsWith('Place')).length],
        ['Uncited profiles', allMissing.filter((fact) => fact.key === 'sourceCitation').length]
    ];

    const summary = document.createElement('div');
    summary.className = 'research-workbench-summary';
    counts.forEach(([label, value]) => {
        const item = document.createElement('div');
        item.className = 'research-workbench-stat';
        const valueEl = document.createElement('span');
        valueEl.className = 'research-workbench-stat-value';
        valueEl.textContent = String(value);
        const labelEl = document.createElement('span');
        labelEl.className = 'research-workbench-stat-label';
        labelEl.textContent = label;
        item.appendChild(valueEl);
        item.appendChild(labelEl);
        summary.appendChild(item);
    });
    container.appendChild(summary);
}

function renderResearchWorkbench() {
    const section = document.createElement('section');
    section.className = 'research-section research-workbench';

    const heading = document.createElement('h3');
    heading.className = 'research-section-title';
    heading.textContent = 'Research Workbench';
    section.appendChild(heading);

    const intro = document.createElement('p');
    intro.className = 'research-pathway-intro-text';
    intro.textContent = 'Find relatives with missing dates, places, or source-backed evidence. Choose a person, review known facts, follow source leads, then send a citation-backed suggestion to the admin.';
    section.appendChild(intro);

    const opportunities = buildResearchOpportunities();
    if (!selectedResearchPersonId && opportunities.length) {
        selectedResearchPersonId = opportunities[0].personId;
    }
    renderResearchSummary(section, opportunities);

    const tools = document.createElement('div');
    tools.className = 'research-workbench-tools';

    const searchLabel = document.createElement('label');
    searchLabel.className = 'sources-filter research-workbench-search';
    const searchText = document.createElement('span');
    searchText.textContent = 'Find a person or missing fact';
    const searchInputEl = document.createElement('input');
    searchInputEl.type = 'search';
    searchInputEl.placeholder = 'Search by name, date, place, or citation need';
    searchInputEl.value = researchFilterText;
    searchInputEl.addEventListener('input', () => {
        const cursorPosition = searchInputEl.selectionStart || searchInputEl.value.length;
        researchFilterText = searchInputEl.value;
        renderResearchLibrary();
        requestAnimationFrame(() => {
            const nextInput = researchLibraryContent.querySelector('.research-workbench-search input');
            if (!nextInput) return;
            nextInput.focus();
            nextInput.setSelectionRange(cursorPosition, cursorPosition);
        });
    });
    searchLabel.appendChild(searchText);
    searchLabel.appendChild(searchInputEl);
    tools.appendChild(searchLabel);

    section.appendChild(tools);

    const layout = document.createElement('div');
    layout.className = 'research-workbench-layout';

    const list = document.createElement('div');
    list.className = 'research-opportunity-list';
    renderResearchOpportunityList(list, getFilteredResearchOpportunities(opportunities));
    layout.appendChild(list);

    const detail = document.createElement('div');
    detail.className = 'research-detail-panel';
    renderSelectedResearchPerson(detail, opportunities);
    layout.appendChild(detail);

    section.appendChild(layout);
    return section;
}

function renderResearchOpportunityList(container, opportunities) {
    container.innerHTML = '';
    if (!opportunities.length) {
        const empty = document.createElement('p');
        empty.className = 'sources-empty';
        empty.textContent = 'No matching research opportunities found.';
        container.appendChild(empty);
        return;
    }

    opportunities.slice(0, 80).forEach((opportunity) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'research-opportunity-item';
        button.classList.toggle('is-active', opportunity.personId === selectedResearchPersonId);
        button.addEventListener('click', () => selectResearchPerson(opportunity.personId));

        const name = document.createElement('span');
        name.className = 'research-opportunity-name';
        name.textContent = opportunity.name;
        button.appendChild(name);

        const meta = document.createElement('span');
        meta.className = 'research-opportunity-meta';
        const sourceText = opportunity.sourceCount === 1 ? '1 linked source' : `${opportunity.sourceCount} linked sources`;
        meta.textContent = [getResearchDates(opportunity.dates), sourceText].filter(Boolean).join(' · ');
        button.appendChild(meta);

        const facts = document.createElement('span');
        facts.className = 'research-missing-chip-row';
        opportunity.missingFacts.slice(0, 4).forEach((fact) => {
            const chip = document.createElement('span');
            chip.className = 'research-missing-chip';
            chip.textContent = fact.label;
            facts.appendChild(chip);
        });
        button.appendChild(facts);

        container.appendChild(button);
    });
}

function renderSelectedResearchPerson(container, opportunities) {
    container.innerHTML = '';
    const selected = opportunities.find((opportunity) => opportunity.personId === selectedResearchPersonId) || opportunities[0];

    if (!selected) {
        const empty = document.createElement('p');
        empty.className = 'sources-empty';
        empty.textContent = 'Research data is unavailable right now.';
        container.appendChild(empty);
        return;
    }

    const fact = getDefaultResearchFact(selected);
    selectedResearchPersonId = selected.personId;
    selectedResearchFactKey = fact.key;
    const sourceLeads = getSourceLeadsForPerson(selected.personId, fact);

    const header = document.createElement('div');
    header.className = 'research-detail-header';
    const title = document.createElement('h4');
    title.textContent = selected.name;
    const subtitle = document.createElement('p');
    subtitle.textContent = getResearchDates(selected.dates) || (selected.living ? 'Living relative' : 'Dates not yet recorded');
    header.appendChild(title);
    header.appendChild(subtitle);

    const profileBtn = document.createElement('button');
    profileBtn.type = 'button';
    profileBtn.className = 'research-sources-link';
    profileBtn.textContent = 'Open profile';
    profileBtn.addEventListener('click', () => {
        const result = getPersonById(selected.personId);
        if (!result) return;
        profileOpenedFrom = 'research';
        openPersonProfile(result);
    });
    header.appendChild(profileBtn);
    container.appendChild(header);

    const factPicker = document.createElement('div');
    factPicker.className = 'research-fact-picker';
    selected.missingFacts.forEach((missingFact) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'research-fact-chip';
        button.classList.toggle('is-active', missingFact.key === fact.key);
        button.textContent = missingFact.label;
        button.addEventListener('click', () => selectResearchPerson(selected.personId, missingFact.key));
        factPicker.appendChild(button);
    });
    container.appendChild(factPicker);

    const knownFacts = getResearchKnownFacts(selected.details);
    const knownSection = document.createElement('div');
    knownSection.className = 'research-detail-section';
    const knownTitle = document.createElement('h5');
    knownTitle.textContent = 'Known facts';
    knownSection.appendChild(knownTitle);
    if (knownFacts.length) {
        const list = document.createElement('dl');
        list.className = 'research-known-list';
        knownFacts.forEach((row) => {
            const dt = document.createElement('dt');
            dt.textContent = row.label;
            const dd = document.createElement('dd');
            dd.textContent = row.value;
            list.appendChild(dt);
            list.appendChild(dd);
        });
        knownSection.appendChild(list);
    } else {
        const empty = document.createElement('p');
        empty.className = 'research-detail-note';
        empty.textContent = 'No structured life events are recorded yet.';
        knownSection.appendChild(empty);
    }
    container.appendChild(knownSection);

    const strategy = document.createElement('div');
    strategy.className = 'research-detail-section';
    const strategyTitle = document.createElement('h5');
    strategyTitle.textContent = `How to research ${fact.label.toLowerCase()}`;
    const strategyText = document.createElement('p');
    strategyText.className = 'research-detail-note';
    strategyText.textContent = fact.searchTip;
    strategy.appendChild(strategyTitle);
    strategy.appendChild(strategyText);

    const sourceTypeRow = document.createElement('div');
    sourceTypeRow.className = 'research-source-type-row';
    fact.sourceTypes.forEach((sourceType) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'research-pathway-link-chip';
        button.textContent = sourceType;
        button.addEventListener('click', () => openCitedSourcesWithFilter({ sourceType }));
        sourceTypeRow.appendChild(button);
    });
    strategy.appendChild(sourceTypeRow);
    container.appendChild(strategy);

    const citationOutput = renderCitationBuilder(container, selected, fact);
    renderSourceLeads(container, selected, fact, sourceLeads, citationOutput);
}

function renderCitationBuilder(container, selected, fact) {
    const builder = document.createElement('div');
    builder.className = 'research-citation-builder';

    const title = document.createElement('h5');
    title.textContent = 'Citation builder';
    builder.appendChild(title);

    const help = document.createElement('p');
    help.className = 'research-detail-note';
    help.textContent = 'Use enough detail that an admin can find the same record: collection title, website or repository, date/page/image, and what the record proves.';
    builder.appendChild(help);

    const fields = document.createElement('div');
    fields.className = 'research-citation-fields';

    const foundValue = createCitationInput('What you found', `Proposed ${fact.label.toLowerCase()}`);
    const recordTitle = createCitationInput('Record title or collection', 'e.g., Illinois death certificate index');
    const repository = createCitationInput('Where found', 'Website, archive, courthouse, cemetery, or family record');
    const locator = createCitationInput('Record detail', 'Certificate number, page, image, URL, or access date');
    const note = createCitationInput('Research note', 'Why this supports the update');

    [foundValue, recordTitle, repository, locator, note].forEach((field) => fields.appendChild(field.wrap));
    builder.appendChild(fields);

    const output = document.createElement('textarea');
    output.className = 'research-citation-output';
    output.rows = 4;
    output.placeholder = 'Citation note will appear here.';
    builder.appendChild(output);

    function refreshOutput() {
        const parts = [];
        if (recordTitle.input.value.trim()) parts.push(recordTitle.input.value.trim());
        if (repository.input.value.trim()) parts.push(repository.input.value.trim());
        if (locator.input.value.trim()) parts.push(locator.input.value.trim());
        const evidence = [`Evidence for ${selected.name} ${fact.label.toLowerCase()}`];
        if (foundValue.input.value.trim()) evidence.push(`proposed value: ${foundValue.input.value.trim()}`);
        if (note.input.value.trim()) evidence.push(note.input.value.trim());
        output.value = [parts.join(', '), evidence.join('; ')].filter(Boolean).join('. ');
    }

    [foundValue, recordTitle, repository, locator, note].forEach((field) => {
        field.input.addEventListener('input', refreshOutput);
    });
    refreshOutput();

    const actions = document.createElement('div');
    actions.className = 'research-citation-actions';

    const suggestBtn = document.createElement('button');
    suggestBtn.type = 'button';
    suggestBtn.className = 'research-sources-link';
    suggestBtn.textContent = 'Use in Suggest a Change';
    suggestBtn.addEventListener('click', () => {
        openSuggestionModal({
            personId: selected.personId,
            personName: selected.name,
            field: fact.correctionField,
            proposedValue: foundValue.input.value.trim(),
            source: output.value.trim(),
            focusSource: !foundValue.input.value.trim()
        });
    });
    actions.appendChild(suggestBtn);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'research-secondary-btn';
    copyBtn.textContent = 'Copy citation';
    copyBtn.addEventListener('click', async () => {
        if (!output.value.trim()) return;
        try {
            await navigator.clipboard.writeText(output.value);
            copyBtn.textContent = 'Copied';
            setTimeout(() => { copyBtn.textContent = 'Copy citation'; }, 1200);
        } catch {
            output.select();
        }
    });
    actions.appendChild(copyBtn);
    builder.appendChild(actions);

    container.appendChild(builder);
    return {
        output,
        foundValue: foundValue.input,
        recordTitle: recordTitle.input,
        repository: repository.input,
        locator: locator.input,
        note: note.input
    };
}

function createCitationInput(labelText, placeholder) {
    const wrap = document.createElement('label');
    wrap.className = 'research-citation-field';
    const label = document.createElement('span');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = placeholder;
    wrap.appendChild(label);
    wrap.appendChild(input);
    return { wrap, input };
}

function renderSourceLeads(container, selected, fact, sourceLeads, citationRefs) {
    const section = document.createElement('div');
    section.className = 'research-detail-section';
    const title = document.createElement('h5');
    title.textContent = 'Source leads already in this archive';
    section.appendChild(title);

    if (!sourceLeads.length) {
        const empty = document.createElement('p');
        empty.className = 'research-detail-note';
        empty.textContent = 'No linked source is attached to this person yet. Use the recommended record types above to search Cited Sources or an outside repository, then include the citation in your suggestion.';
        section.appendChild(empty);
    } else {
        const list = document.createElement('div');
        list.className = 'research-source-leads';
        sourceLeads.forEach((source) => {
            const item = document.createElement('div');
            item.className = 'research-source-lead';

            const leadTitle = document.createElement('strong');
            leadTitle.textContent = source.title;
            item.appendChild(leadTitle);

            const meta = document.createElement('span');
            meta.textContent = [source.sourceType, source.provider, source.jurisdiction].filter(Boolean).join(' · ');
            item.appendChild(meta);

            const actions = document.createElement('div');
            actions.className = 'research-source-lead-actions';

            const useBtn = document.createElement('button');
            useBtn.type = 'button';
            useBtn.className = 'research-secondary-btn';
            useBtn.textContent = 'Use citation';
            useBtn.addEventListener('click', () => {
                citationRefs.recordTitle.value = source.title || '';
                citationRefs.repository.value = [source.provider, source.repository, source.jurisdiction].filter(Boolean).join(', ');
                citationRefs.locator.value = source.externalUrl || source.citationUrl || '';
                citationRefs.output.value = source.citationText || '';
                citationRefs.note.value = `Review this ${source.sourceType || 'source'} for ${selected.name}'s ${fact.label.toLowerCase()}.`;
                citationRefs.output.focus();
            });
            actions.appendChild(useBtn);

            const viewBtn = document.createElement('button');
            viewBtn.type = 'button';
            viewBtn.className = 'research-secondary-btn';
            viewBtn.textContent = 'View source type';
            viewBtn.addEventListener('click', () => openCitedSourcesWithFilter({ sourceType: source.sourceType }));
            actions.appendChild(viewBtn);

            item.appendChild(actions);
            list.appendChild(item);
        });
        section.appendChild(list);
    }

    container.appendChild(section);
}

function renderResearchLibrary() {
    researchLibraryContent.innerHTML = '';

    researchLibraryContent.appendChild(renderResearchWorkbench());

    // ── Category Cards ──
    const catSection = document.createElement('section');
    catSection.className = 'research-section';

    const catHeading = document.createElement('h3');
    catHeading.className = 'research-section-title';
    catHeading.textContent = 'Record Types in This Archive';
    catSection.appendChild(catHeading);

    const catGrid = document.createElement('div');
    catGrid.className = 'research-category-grid';

    for (const cat of RESEARCH_CATEGORIES) {
        const card = document.createElement('div');
        card.className = 'research-category-card';

        const cardHeader = document.createElement('div');
        cardHeader.className = 'research-category-header';

        const iconEl = document.createElement('span');
        iconEl.className = 'research-category-icon';
        iconEl.setAttribute('aria-hidden', 'true');
        iconEl.textContent = cat.icon;

        const labelEl = document.createElement('span');
        labelEl.className = 'research-category-label';
        labelEl.textContent = cat.label;

        cardHeader.appendChild(iconEl);
        cardHeader.appendChild(labelEl);
        card.appendChild(cardHeader);

        const descEl = document.createElement('p');
        descEl.className = 'research-category-desc';
        descEl.textContent = cat.description;
        card.appendChild(descEl);

        const whyEl = document.createElement('p');
        whyEl.className = 'research-category-why';

        const whyLabel = document.createElement('strong');
        whyLabel.textContent = 'Why it matters: ';
        whyEl.appendChild(whyLabel);
        whyEl.appendChild(document.createTextNode(cat.whyItMatters));
        card.appendChild(whyEl);

        const findEl = document.createElement('p');
        findEl.className = 'research-category-find';

        const findLabel = document.createElement('strong');
        findLabel.textContent = 'What you\'ll find: ';
        findEl.appendChild(findLabel);
        findEl.appendChild(document.createTextNode(cat.whatYouFind));
        card.appendChild(findEl);

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'research-sources-link';
        viewBtn.textContent = `View ${cat.label} in Cited Sources →`;
        viewBtn.addEventListener('click', () => openCitedSourcesWithFilter(cat.sourceType));
        card.appendChild(viewBtn);

        catGrid.appendChild(card);
    }

    catSection.appendChild(catGrid);
    researchLibraryContent.appendChild(catSection);

    // ── Research Pathways ──
    const pathSection = document.createElement('section');
    pathSection.className = 'research-section';

    const pathHeading = document.createElement('h3');
    pathHeading.className = 'research-section-title';
    pathHeading.textContent = 'Guided Research Pathways';
    pathSection.appendChild(pathHeading);

    const pathIntro = document.createElement('p');
    pathIntro.className = 'research-pathway-intro-text';
    pathIntro.textContent = 'Each pathway walks through a common family-history question step by step. Suggestions point to records that may exist; what you find will depend on the specific people and places involved.';
    pathSection.appendChild(pathIntro);

    for (const pathway of RESEARCH_PATHWAYS) {
        const pathCard = document.createElement('div');
        pathCard.className = 'research-pathway-card';

        const pathTitle = document.createElement('h4');
        pathTitle.className = 'research-pathway-title';
        pathTitle.textContent = pathway.label;
        pathCard.appendChild(pathTitle);

        const pathDesc = document.createElement('p');
        pathDesc.className = 'research-pathway-desc';
        pathDesc.textContent = pathway.intro;
        pathCard.appendChild(pathDesc);

        const stepsList = document.createElement('ol');
        stepsList.className = 'research-pathway-steps';

        for (const step of pathway.steps) {
            const li = document.createElement('li');
            li.className = 'research-pathway-step';

            const stepHeading = document.createElement('strong');
            stepHeading.textContent = step.heading;
            li.appendChild(stepHeading);

            const stepBody = document.createElement('span');
            stepBody.textContent = ' — ' + step.body;
            li.appendChild(stepBody);

            stepsList.appendChild(li);
        }

        pathCard.appendChild(stepsList);

        const catLinks = document.createElement('div');
        catLinks.className = 'research-pathway-links';

        const catLinksLabel = document.createElement('span');
        catLinksLabel.className = 'research-pathway-links-label';
        catLinksLabel.textContent = 'Related records in this archive: ';
        catLinks.appendChild(catLinksLabel);

        for (const catId of pathway.categories) {
            const catInfo = RESEARCH_CATEGORIES.find(c => c.id === catId);
            if (!catInfo) {
                console.warn(`Research Library: pathway '${pathway.id}' references unknown category id '${catId}'`);
                continue;
            }
            const link = document.createElement('button');
            link.type = 'button';
            link.className = 'research-pathway-link-chip';
            link.textContent = catInfo.label;
            link.addEventListener('click', () => openCitedSourcesWithFilter(catInfo.sourceType));
            catLinks.appendChild(link);
        }

        pathCard.appendChild(catLinks);
        pathSection.appendChild(pathCard);
    }

    researchLibraryContent.appendChild(pathSection);
}

// ─── Photo Notes ──────────────────────────────────────────────────────────────

// Derive a stable Firestore document ID from a photo path (base64url, no slashes).
function photoPathToDocId(photoPath) {
    return btoa(unescape(encodeURIComponent(photoPath)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Fetch the photo_descriptions document for a given photo path.
// Returns the doc data object, or null if not found.
async function loadPhotoNote(photoPath) {
    if (!auth.currentUser) return null;
    try {
        const snap = await getDoc(doc(db, 'photo_descriptions', photoPathToDocId(photoPath)));
        return snap.exists() ? snap.data() : null;
    } catch {
        return null;
    }
}

// Render the published photo note block for family members.
function renderPublishedPhotoNote(note) {
    lightboxPhotoNote.innerHTML = '';
    lightboxPhotoNote.classList.remove('hidden');

    const sections = [
        { heading: 'Photo Note',       body: note.visualSummary },
        { heading: 'Historical Note',  body: note.historicalContext },
        { heading: 'Research Clue',    body: note.researchLead }
    ];
    for (const { heading, body } of sections) {
        const h = document.createElement('h4');
        h.className = 'photo-note-heading';
        h.textContent = heading;
        const p = document.createElement('p');
        p.className = 'photo-note-body';
        p.textContent = body;
        lightboxPhotoNote.appendChild(h);
        lightboxPhotoNote.appendChild(p);
    }
}

// Render the admin note management panel (generate / preview draft / publish / regenerate).
function renderAdminNotePanel(photoPath, note) {
    lightboxAdminNote.innerHTML = '';
    lightboxAdminNote.classList.remove('hidden');

    const panel = document.createElement('div');
    panel.className = 'admin-note-panel';

    if (!note) {
        // No note yet — show Generate button and helper text
        const help = document.createElement('p');
        help.className = 'admin-note-help';
        help.textContent = 'Generate a draft photo note based on visible details in the image. Notes may include a brief description, possible historical context, and a research lead. Generated content should be reviewed before publishing.';
        panel.appendChild(help);

        const generateBtn = document.createElement('button');
        generateBtn.type = 'button';
        generateBtn.className = 'send-btn admin-note-generate-btn';
        generateBtn.textContent = 'Generate Photo Note';
        generateBtn.addEventListener('click', () => handleGeneratePhotoNote(photoPath, generateBtn));
        panel.appendChild(generateBtn);

    } else if (note.status === 'draft') {
        // Draft exists — show editable preview with Publish and Regenerate
        renderAdminDraftPreview(panel, photoPath, note);

    } else if (note.status === 'published') {
        // Published — show Regenerate only (family view is already rendered above)
        const label = document.createElement('p');
        label.className = 'admin-note-help';
        label.textContent = 'This photo note is published. You can regenerate to replace it with a new draft.';
        panel.appendChild(label);

        const regenBtn = document.createElement('button');
        regenBtn.type = 'button';
        regenBtn.className = 'secondary-btn';
        regenBtn.textContent = 'Regenerate';
        regenBtn.addEventListener('click', () => {
            if (confirm('Regenerate will replace the current note with a new draft and unpublish it. Continue?')) {
                handleGeneratePhotoNote(photoPath, regenBtn);
            }
        });
        panel.appendChild(regenBtn);
    }

    lightboxAdminNote.appendChild(panel);
}

// Render the three-field draft preview panel with inline editing.
function renderAdminDraftPreview(container, photoPath, note) {
    const fields = [
        { key: 'visualSummary',    label: 'Photo Note' },
        { key: 'historicalContext', label: 'Historical Note' },
        { key: 'researchLead',     label: 'Research Clue' }
    ];

    const heading = document.createElement('p');
    heading.className = 'admin-note-help';
    heading.textContent = 'Review and edit the draft before publishing. Changes are saved when you publish.';
    container.appendChild(heading);

    const textareas = {};
    for (const { key, label } of fields) {
        const lbl = document.createElement('label');
        lbl.className = 'admin-note-field-label';
        lbl.textContent = label;
        const ta = document.createElement('textarea');
        ta.className = 'admin-note-field-input';
        ta.rows = 3;
        ta.value = note[key] || '';
        textareas[key] = ta;
        container.appendChild(lbl);
        container.appendChild(ta);
    }

    const actions = document.createElement('div');
    actions.className = 'admin-note-actions';

    const publishBtn = document.createElement('button');
    publishBtn.type = 'button';
    publishBtn.className = 'send-btn';
    publishBtn.textContent = 'Publish';
    publishBtn.addEventListener('click', async () => {
        publishBtn.disabled = true;
        regenBtn.disabled = true;
        try {
            const updates = {};
            for (const { key } of fields) {
                updates[key] = textareas[key].value.trim();
                if (!updates[key]) {
                    alert(`${key} cannot be empty.`);
                    publishBtn.disabled = false;
                    regenBtn.disabled = false;
                    return;
                }
            }
            updates.status = 'published';
            updates.editedBy = auth.currentUser.email;
            updates.editedAt = new Date();
            await updateDoc(doc(db, 'photo_descriptions', photoPathToDocId(photoPath)), updates);
            // Refresh the lightbox note display
            const refreshed = await loadPhotoNote(photoPath);
            renderPublishedPhotoNote(refreshed);
            renderAdminNotePanel(photoPath, refreshed);
        } catch (err) {
            console.error('Publish error:', err);
            publishBtn.disabled = false;
            regenBtn.disabled = false;
        }
    });

    const regenBtn = document.createElement('button');
    regenBtn.type = 'button';
    regenBtn.className = 'secondary-btn';
    regenBtn.textContent = 'Regenerate';
    regenBtn.addEventListener('click', () => {
        if (confirm('Regenerate will replace this draft with a new one. Continue?')) {
            handleGeneratePhotoNote(photoPath, regenBtn);
        }
    });

    actions.appendChild(publishBtn);
    actions.appendChild(regenBtn);
    container.appendChild(actions);
}

// Call the generatePhotoNote Cloud Function, then refresh the admin panel.
async function handleGeneratePhotoNote(photoPath, triggerBtn) {
    triggerBtn.disabled = true;
    const origText = triggerBtn.textContent;
    triggerBtn.textContent = 'Generating…';

    try {
        const personNames = getPersonsForPhoto(photoPath).map(p => p.name);
        const generatePhotoNote = httpsCallable(fbFunctions, 'generatePhotoNote');
        await generatePhotoNote({ photoPath, personNames });

        // Reload the note and re-render both panels
        const note = await loadPhotoNote(photoPath);
        lightboxPhotoNote.classList.add('hidden');
        lightboxPhotoNote.innerHTML = '';
        renderAdminNotePanel(photoPath, note);
    } catch (err) {
        console.error('Generate photo note error:', err);
        const detail = err?.message || err?.code || 'Unknown error';
        triggerBtn.textContent = 'Generation failed — retry';
        triggerBtn.title = `Error: ${detail}`;
        triggerBtn.disabled = false;
        return;
    }

    triggerBtn.textContent = origText;
    triggerBtn.disabled = false;
}

// Load and render both the family-facing note and the admin panel for the current lightbox photo.
async function loadAndRenderPhotoNote(photoPath) {
    // Reset both areas while loading
    lightboxPhotoNote.classList.add('hidden');
    lightboxPhotoNote.innerHTML = '';
    lightboxAdminNote.classList.add('hidden');
    lightboxAdminNote.innerHTML = '';

    const note = await loadPhotoNote(photoPath);

    if (note && note.status === 'published') {
        renderPublishedPhotoNote(note);
    }

    if (isAdmin) {
        renderAdminNotePanel(photoPath, note);
    }
}

// ─── User Photo Notes (Community Notes) ──────────────────────────────────────

async function loadUserNotes(photoPath) {
    if (!auth.currentUser) return [];
    try {
        const q = query(
            collection(db, 'photo_notes'),
            where('photoPath', '==', photoPath),
            orderBy('createdAt', 'asc')
        );
        const snap = await getDocs(q);
        const notes = [];
        snap.forEach(d => notes.push({ id: d.id, ...d.data() }));
        return notes;
    } catch {
        return [];
    }
}

function renderUserNotes(photoPath, notes) {
    lightboxUserNotes.innerHTML = '';
    lightboxUserNotes.classList.remove('hidden');

    const heading = document.createElement('h4');
    heading.className = 'user-notes-heading';
    heading.textContent = 'Community Notes';
    lightboxUserNotes.appendChild(heading);

    if (notes.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'user-notes-empty';
        empty.textContent = 'No notes yet. Be the first to add one.';
        lightboxUserNotes.appendChild(empty);
    } else {
        for (const note of notes) {
            const item = document.createElement('div');
            item.className = 'user-note-item';

            const content = document.createElement('div');
            content.className = 'user-note-content';

            const text = document.createElement('p');
            text.className = 'user-note-text';
            text.textContent = note.text;
            content.appendChild(text);

            const meta = document.createElement('div');
            meta.className = 'user-note-meta';
            const author = document.createElement('span');
            author.className = 'user-note-author';
            author.textContent = note.authorName || note.authorEmail;
            meta.appendChild(author);

            if (note.createdAt) {
                const date = document.createElement('span');
                const ts = note.createdAt.toDate ? note.createdAt.toDate() : new Date(note.createdAt);
                date.textContent = '· ' + ts.toLocaleDateString();
                meta.appendChild(date);
            }
            content.appendChild(meta);
            item.appendChild(content);

            // Show delete button for the note author or admins
            const canDelete = isAdmin || (currentUser && note.authorEmail === currentUser.email);
            if (canDelete) {
                const delBtn = document.createElement('button');
                delBtn.type = 'button';
                delBtn.className = 'user-note-delete';
                delBtn.title = 'Delete note';
                delBtn.textContent = '×';
                delBtn.addEventListener('click', async () => {
                    if (!confirm('Delete this note?')) return;
                    try {
                        await deleteDoc(doc(db, 'photo_notes', note.id));
                        item.remove();
                        // If no notes remain, show empty message
                        if (!lightboxUserNotes.querySelector('.user-note-item')) {
                            const existingEmpty = lightboxUserNotes.querySelector('.user-notes-empty');
                            if (!existingEmpty) {
                                const emp = document.createElement('p');
                                emp.className = 'user-notes-empty';
                                emp.textContent = 'No notes yet. Be the first to add one.';
                                lightboxUserNotes.insertBefore(emp, lightboxUserNotes.querySelector('.user-note-form'));
                            }
                        }
                    } catch (err) {
                        console.error('Error deleting note:', err);
                    }
                });
                item.appendChild(delBtn);
            }

            lightboxUserNotes.appendChild(item);
        }
    }

    // Add note form
    const form = document.createElement('div');
    form.className = 'user-note-form';

    const input = document.createElement('textarea');
    input.className = 'user-note-input';
    input.placeholder = 'Add a note about this photo…';
    input.rows = 1;

    const submitBtn = document.createElement('button');
    submitBtn.type = 'button';
    submitBtn.className = 'user-note-submit';
    submitBtn.textContent = 'Add Note';
    submitBtn.disabled = true;
    if (!hasCapability('postPhotoNotes')) {
        input.disabled = true;
        input.placeholder = getCapabilityBlockedMessage('postPhotoNotes');
    }

    input.addEventListener('input', () => {
        submitBtn.disabled = !input.value.trim() || !hasCapability('postPhotoNotes');
    });

    submitBtn.addEventListener('click', async () => {
        if (!requireCapability('postPhotoNotes')) return;
        const text = input.value.trim();
        if (!text || !auth.currentUser) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';
        try {
            await addDoc(collection(db, 'photo_notes'), {
                photoPath,
                text,
                authorEmail: currentUser.email,
                authorName: currentUser.displayName || currentUser.email,
                createdAt: new Date()
            });
            // Reload and re-render
            const refreshed = await loadUserNotes(photoPath);
            renderUserNotes(photoPath, refreshed);
        } catch (err) {
            console.error('Error adding note:', err);
            submitBtn.textContent = 'Add Note';
            submitBtn.disabled = false;
        }
    });

    form.appendChild(input);
    form.appendChild(submitBtn);
    lightboxUserNotes.appendChild(form);
}

async function loadAndRenderUserNotes(photoPath) {
    lightboxUserNotes.classList.add('hidden');
    lightboxUserNotes.innerHTML = '';
    const notes = await loadUserNotes(photoPath);
    renderUserNotes(photoPath, notes);
}

// ─── Photo Person Tags ───────────────────────────────────────────────────────

async function loadPhotoPersonTags(photoPath) {
    if (!auth.currentUser) return [];
    try {
        const q = query(
            collection(db, 'photo_person_tags'),
            where('photoPath', '==', photoPath)
        );
        const snap = await getDocs(q);
        const tags = [];
        snap.forEach(d => tags.push({ id: d.id, ...d.data() }));
        return tags;
    } catch {
        return [];
    }
}

function renderPeopleAndTags(photoPath, databasePeople, userTags) {
    lightboxPeople.innerHTML = '';

    const allEntries = databasePeople.length > 0 || userTags.length > 0;

    if (allEntries) {
        const label = document.createElement('span');
        label.className = 'lightbox-people-label';
        label.textContent = 'People in this photo:';
        lightboxPeople.appendChild(label);
    }

    // Database-linked people (from RootsMagic / admin media links)
    for (const person of databasePeople) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'lightbox-person-chip';
        chip.textContent = person.name;
        chip.addEventListener('click', () => {
            closeLightbox();
            const result = getPersonById(person.id);
            if (result) {
                profileOpenedFrom = 'gallery';
                openPersonProfile(result);
            }
        });
        lightboxPeople.appendChild(chip);
    }

    // User-tagged people
    const taggedPersonIds = new Set(databasePeople.map(p => String(p.id)));
    for (const tag of userTags) {
        // Skip if already shown from database
        if (taggedPersonIds.has(String(tag.personId))) continue;
        taggedPersonIds.add(String(tag.personId));

        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'lightbox-person-chip lightbox-person-chip--tagged';
        chip.title = `Tagged by ${tag.taggedByName || tag.taggedBy}`;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = tag.personName;
        chip.appendChild(nameSpan);

        // Show remove X for tagger or admin
        const canRemove = isAdmin || (currentUser && tag.taggedBy === currentUser.email);
        if (canRemove) {
            const x = document.createElement('span');
            x.className = 'tag-remove-x';
            x.textContent = '×';
            chip.appendChild(x);

            chip.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (!confirm(`Remove tag "${tag.personName}"?`)) return;
                try {
                    await deleteDoc(doc(db, 'photo_person_tags', tag.id));
                    chip.remove();
                } catch (err) {
                    console.error('Error removing tag:', err);
                }
            });
        } else {
            chip.addEventListener('click', () => {
                closeLightbox();
                const result = getPersonById(tag.personId);
                if (result) {
                    profileOpenedFrom = 'gallery';
                    openPersonProfile(result);
                }
            });
        }

        lightboxPeople.appendChild(chip);
    }

    // Tag person button + inline search
    const tagBtn = document.createElement('button');
    tagBtn.type = 'button';
    tagBtn.className = 'lightbox-tag-btn';
    tagBtn.textContent = '+ Tag Person';
    tagBtn.disabled = !hasCapability('tagPhotos');
    tagBtn.title = hasCapability('tagPhotos') ? '' : getCapabilityBlockedMessage('tagPhotos');

    const searchContainer = document.createElement('div');
    searchContainer.className = 'lightbox-tag-search';
    searchContainer.style.display = 'none';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'lightbox-tag-input';
    searchInput.placeholder = 'Search by name…';

    const resultsDropdown = document.createElement('div');
    resultsDropdown.className = 'lightbox-tag-results';
    resultsDropdown.style.display = 'none';

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(resultsDropdown);

    tagBtn.addEventListener('click', () => {
        if (!requireCapability('tagPhotos')) return;
        tagBtn.style.display = 'none';
        searchContainer.style.display = 'inline-flex';
        searchInput.value = '';
        searchInput.focus();
    });

    // Close search on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchContainer.style.display = 'none';
            tagBtn.style.display = '';
            resultsDropdown.style.display = 'none';
        }
    });

    let tagSearchDebounce = null;
    searchInput.addEventListener('input', () => {
        clearTimeout(tagSearchDebounce);
        const term = searchInput.value.trim();
        resultsDropdown.innerHTML = '';
        if (term.length < 2) { resultsDropdown.style.display = 'none'; return; }

        tagSearchDebounce = setTimeout(() => {
            const results = searchFamilyMembers(term).slice(0, 8);
            resultsDropdown.innerHTML = '';
            if (results.length === 0) { resultsDropdown.style.display = 'none'; return; }

            for (const r of results) {
                const idMatch = r.link && r.link.match(/#P(\d+)/);
                if (!idMatch) continue;
                const personId = idMatch[1];

                // Skip if already tagged or in database
                if (taggedPersonIds.has(personId)) continue;

                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'lightbox-tag-result-item';
                btn.textContent = `${r.name} (${r.dates || 'n.d.'})`;
                btn.addEventListener('click', async () => {
                    if (!requireCapability('tagPhotos')) return;
                    btn.disabled = true;
                    btn.textContent = 'Tagging…';
                    try {
                        await addDoc(collection(db, 'photo_person_tags'), {
                            photoPath,
                            personId,
                            personName: r.name,
                            taggedBy: currentUser.email,
                            taggedByName: currentUser.displayName || currentUser.email,
                            taggedAt: new Date()
                        });
                        // Reload tags and re-render people section
                        const refreshedTags = await loadPhotoPersonTags(photoPath);
                        const dbPeople = lightboxOptions.allowPersonLinks ? getPersonsForPhoto(photoPath) : [];
                        renderPeopleAndTags(photoPath, dbPeople, refreshedTags);
                    } catch (err) {
                        console.error('Error tagging person:', err);
                    }
                });
                resultsDropdown.appendChild(btn);
            }
            resultsDropdown.style.display = resultsDropdown.children.length > 0 ? '' : 'none';
        }, 200);
    });

    lightboxPeople.appendChild(tagBtn);
    lightboxPeople.appendChild(searchContainer);
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function openLightbox(photos, index, options = {}) {
    lightboxPhotos = photos;
    lightboxIndex = index;
    lightboxOptions = {
        enableNotes: true,
        allowPersonLinks: true,
        ...options
    };
    renderLightboxSlide();
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lightboxClose.focus();
}

function closeLightbox() {
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    lightboxOptions = { enableNotes: true, allowPersonLinks: true };
}

function renderLightboxSlide() {
    const photo = lightboxPhotos[lightboxIndex];
    lightboxImg.src = photo.path;
    lightboxImg.alt = photo.caption || '';
    lightboxCaption.textContent = photo.caption || photo.file || '';

    const total = lightboxPhotos.length;
    lightboxCounter.textContent = total > 1 ? `${lightboxIndex + 1} of ${total}` : '';

    lightboxPrev.classList.toggle('hidden', total <= 1);
    lightboxNext.classList.toggle('hidden', total <= 1);

    // Render people chips (database + user-tagged) with tag UI
    const databasePeople = lightboxOptions.allowPersonLinks ? getPersonsForPhoto(photo.path) : [];
    loadPhotoPersonTags(photo.path).then(tags => {
        renderPeopleAndTags(photo.path, databasePeople, tags);
    }).catch(() => {
        // Fallback: render database people only
        renderPeopleAndTags(photo.path, databasePeople, []);
    });

    if (lightboxOptions.enableNotes) {
        loadAndRenderPhotoNote(photo.path);
        loadAndRenderUserNotes(photo.path);
    } else {
        lightboxPhotoNote.classList.add('hidden');
        lightboxPhotoNote.innerHTML = '';
        lightboxAdminNote.classList.add('hidden');
        lightboxAdminNote.innerHTML = '';
        lightboxUserNotes.classList.add('hidden');
        lightboxUserNotes.innerHTML = '';
    }
}

lightboxClose.addEventListener('click', closeLightbox);

lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);

lightboxPrev.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + lightboxPhotos.length) % lightboxPhotos.length;
    renderLightboxSlide();
});

lightboxNext.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % lightboxPhotos.length;
    renderLightboxSlide();
});

document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev.click();
    if (e.key === 'ArrowRight') lightboxNext.click();
});

// ─── Feedback ─────────────────────────────────────────────────────────────────

feedbackBtn.addEventListener('click', () => {
    if (!requireCapability('submitFeedback')) return;
    // Pre-fill related person if a profile is currently open
    feedbackPerson.value = currentProfileName;
    feedbackMessage.value = '';
    feedbackStatus.textContent = '';
    feedbackStatus.className = 'status-message';
    feedbackModal.classList.remove('hidden');
    loadMyFeedbackHistory();
    feedbackMessage.focus();
});

closeFeedbackBtn.addEventListener('click', () => feedbackModal.classList.add('hidden'));
feedbackModal.addEventListener('click', (e) => {
    if (e.target === feedbackModal) feedbackModal.classList.add('hidden');
});

updatesBtn.addEventListener('click', () => {
    updatesModal.classList.remove('hidden');
    loadUserNotificationsList();
});

closeUpdatesBtn.addEventListener('click', () => updatesModal.classList.add('hidden'));
updatesModal.addEventListener('click', (e) => {
    if (e.target === updatesModal) updatesModal.classList.add('hidden');
});

submitFeedbackBtn.addEventListener('click', async () => {
    if (!requireCapability('submitFeedback', feedbackStatus)) return;
    const message = feedbackMessage.value.trim();
    if (!message) {
        showMessage(feedbackStatus, 'Please enter a message before submitting.', 'error');
        return;
    }

    submitFeedbackBtn.disabled = true;
    try {
        await addDoc(collection(db, 'feedback'), {
            type: feedbackType.value,
            person: feedbackPerson.value.trim(),
            message,
            submittedBy: currentUser.email,
            submittedByName: currentUser.displayName || currentUser.email,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        });
        showMessage(feedbackStatus, 'Thank you — your feedback has been submitted.', 'success');
        feedbackMessage.value = '';
        feedbackPerson.value = '';
        loadMyFeedbackHistory();
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showMessage(feedbackStatus, 'Something went wrong. Please try again.', 'error');
    } finally {
        submitFeedbackBtn.disabled = false;
    }
});

// ─── Suggest a Change ─────────────────────────────────────────────────────────

function openSuggestionModal(context = {}) {
    if (!requireCapability('submitCorrections')) return;
    const personName = context.personName || currentProfileName || '';
    currentSubmissionPersonId = context.personId || currentProfilePersonId || '';
    submissionPerson.value = personName;
    photoPerson.value = personName;
    setSubmissionType('correction');
    if (context.field && [...correctionFieldName.options].some((option) => option.value === context.field)) {
        correctionFieldName.value = context.field;
    } else {
        correctionFieldName.value = context.field ? 'Other' : 'Name';
    }
    correctionProposed.value = context.proposedValue || '';
    correctionSource.value = context.source || '';
    photoDescription.value = '';
    photoSourceInput.value = '';
    clearPendingCorrectionEvidence();
    submissionStatus.textContent = '';
    submissionStatus.className = 'status-message';
    submissionModal.classList.remove('hidden');
    loadMySubmissionHistory();
    if (context.focusSource) {
        correctionSource.focus();
    } else {
        correctionProposed.focus();
    }
}

suggestChangeBtn.addEventListener('click', () => {
    openSuggestionModal({ personId: currentProfilePersonId, personName: currentProfileName });
});

closeSubmissionBtn.addEventListener('click', () => {
    submissionModal.classList.add('hidden');
    clearPendingCorrectionEvidence();
});
submissionModal.addEventListener('click', (e) => {
    if (e.target === submissionModal) submissionModal.classList.add('hidden');
});

submissionTypeBtns.forEach(btn => {
    btn.addEventListener('click', () => setSubmissionType(btn.dataset.type));
});

function setSubmissionType(type) {
    currentSubmissionType = type;
    submissionTypeBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.type === type);
    });
    correctionFields.classList.toggle('hidden', type !== 'correction');
    photoFields.classList.toggle('hidden', type !== 'photo');
}

submitSubmissionBtn.addEventListener('click', async () => {
    if (!requireCapability('submitCorrections', submissionStatus)) return;
    submissionStatus.textContent = '';
    submissionStatus.className = 'status-message';

    let payload;

    if (currentSubmissionType === 'correction') {
        const person = submissionPerson.value.trim();
        const proposed = correctionProposed.value.trim();
        const source = correctionSource.value.trim();

        if (!person) {
            showMessage(submissionStatus, 'Please enter the person\'s name.', 'error');
            return;
        }
        if (!proposed) {
            showMessage(submissionStatus, 'Please enter the proposed correction.', 'error');
            return;
        }

        payload = {
            submissionType: 'correction',
            person,
            correctionField: correctionFieldName.value,
            proposedValue: proposed,
            source,
            submittedBy: currentUser.email,
            submittedByName: currentUser.displayName || currentUser.email,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
    } else {
        const description = photoDescription.value.trim();

        if (!description) {
            showMessage(submissionStatus, 'Please describe the photo before submitting.', 'error');
            return;
        }

        payload = {
            submissionType: 'photo',
            person: photoPerson.value.trim(),
            description,
            photoSource: photoSourceInput.value.trim(),
            submittedBy: currentUser.email,
            submittedByName: currentUser.displayName || currentUser.email,
            submittedAt: new Date().toISOString(),
            status: 'pending'
        };
    }

    submitSubmissionBtn.disabled = true;
    try {
        const ref = await addDoc(collection(db, 'submissions'), payload);
        let evidenceOutcome = 'none';
        if (currentSubmissionType === 'correction' && pendingCorrectionEvidence) {
            const personIdForEvidence = currentSubmissionPersonId || currentProfilePersonId || '';
            if (personIdForEvidence) {
                const ok = await uploadPendingCorrectionEvidenceFor(ref.id, personIdForEvidence, payload.person);
                evidenceOutcome = ok ? 'uploaded' : 'failed';
            } else {
                evidenceOutcome = 'failed';
            }
        }
        const noCitation = currentSubmissionType === 'correction' && !payload.source;
        let successMsg;
        if (evidenceOutcome === 'uploaded') {
            successMsg = 'Thank you — your suggestion and supporting evidence have been sent for review.';
        } else if (evidenceOutcome === 'failed') {
            successMsg = 'Your suggestion was sent, but the evidence artifact did not upload. You can add it separately with the Add Evidence button.';
        } else if (noCitation) {
            successMsg = 'Your submission has been sent for review. Including a source next time helps verify corrections, but is not required.';
        } else {
            successMsg = 'Thank you — your submission has been sent for review.';
        }
        showMessage(submissionStatus, successMsg, evidenceOutcome === 'failed' ? 'warning' : 'success');
        // Reset form
        correctionProposed.value = '';
        correctionSource.value = '';
        photoDescription.value = '';
        photoSourceInput.value = '';
        clearPendingCorrectionEvidence();
        loadMySubmissionHistory();
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showMessage(submissionStatus, 'Something went wrong. Please try again.', 'error');
    } finally {
        submitSubmissionBtn.disabled = false;
    }
});

// ─── Admin Panel ──────────────────────────────────────────────────────────────

// Photo uploads Pending / History filter toggle
const uploadsFilterPending = document.getElementById('uploads-filter-pending');
const uploadsFilterHistory = document.getElementById('uploads-filter-history');

uploadsFilterPending.addEventListener('click', () => {
    setPhotoUploadsMode('pending');
});

uploadsFilterHistory.addEventListener('click', () => {
    setPhotoUploadsMode('history');
});

// Admin tab switching
adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        adminTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('admin-tab-users').classList.toggle('hidden', target !== 'users');
        document.getElementById('admin-tab-governance').classList.toggle('hidden', target !== 'governance');
        document.getElementById('admin-tab-feedback').classList.toggle('hidden', target !== 'feedback');
        document.getElementById('admin-tab-submissions').classList.toggle('hidden', target !== 'submissions');
        document.getElementById('admin-tab-profile-edits').classList.toggle('hidden', target !== 'profile-edits');
        document.getElementById('admin-tab-media-links').classList.toggle('hidden', target !== 'media-links');
        document.getElementById('admin-tab-photo-uploads').classList.toggle('hidden', target !== 'photo-uploads');
        document.getElementById('admin-tab-evidence').classList.toggle('hidden', target !== 'evidence');
        document.getElementById('admin-tab-diagnostics').classList.toggle('hidden', target !== 'diagnostics');
        if (target === 'feedback') loadFeedbackQueue();
        if (target === 'governance') {
            updateGovernanceUi();
            loadGovernanceAudit();
        }
        if (target === 'submissions') loadSubmissionsQueue();
        if (target === 'profile-edits') loadPersonEditHistory();
        if (target === 'media-links') loadExistingMediaLinks();
        if (target === 'photo-uploads') {
            setPhotoUploadsMode(photoUploadsQueueMode || 'pending');
        }
        if (target === 'evidence') {
            setEvidenceQueueMode(evidenceUploadsQueueMode || 'pending');
        }
        if (target === 'diagnostics') renderDiagnosticsTab();
    });
});

adminBtn.addEventListener('click', () => {
    // Always open on Users tab
    adminTabs.forEach(t => t.classList.remove('active'));
    adminTabs[0].classList.add('active');
    document.getElementById('admin-tab-users').classList.remove('hidden');
    document.getElementById('admin-tab-governance').classList.add('hidden');
    document.getElementById('admin-tab-feedback').classList.add('hidden');
    document.getElementById('admin-tab-submissions').classList.add('hidden');
    document.getElementById('admin-tab-profile-edits').classList.add('hidden');
    document.getElementById('admin-tab-media-links').classList.add('hidden');
    document.getElementById('admin-tab-photo-uploads').classList.add('hidden');
    document.getElementById('admin-tab-evidence').classList.add('hidden');
    document.getElementById('admin-tab-diagnostics').classList.add('hidden');
    adminPanel.classList.remove('hidden');
    loadAuthorizedUsers();
    loadInviteTemplate();
    loadFeedbackBadge();
    loadSubmissionsBadge();
    loadProfileEditsBadge();
    updatePhotoUploadsBadge();
    updateEvidenceBadge();
});

closeAdminBtn.addEventListener('click', () => {
    adminPanel.classList.add('hidden');
});

adminPanel.addEventListener('click', (e) => {
    if (e.target === adminPanel) adminPanel.classList.add('hidden');
});

if (saveGovernanceModeBtn) {
    saveGovernanceModeBtn.addEventListener('click', async () => {
        if (!requireCapability('manageGovernance', governanceStatus)) return;
        const nextMode = governanceModeSelect.value === APP_MODE.HISTORICAL_READ_ONLY
            ? APP_MODE.HISTORICAL_READ_ONLY
            : APP_MODE.NORMAL;
        const before = { ...(appGovernance || defaultGovernance()) };
        if (before.mode === nextMode) {
            showMessage(governanceStatus, 'Archive mode is already set to that value.', 'success');
            return;
        }
        const confirmed = window.confirm(
            nextMode === APP_MODE.HISTORICAL_READ_ONLY
                ? 'Enable historical read-only mode?\n\nFamily members will still be able to browse, but feedback, suggestions, uploads, profile presentation edits, photo notes, and photo tags will be paused.'
                : 'Return the archive to normal mode?\n\nPermitted contribution actions will be available again based on each user role.'
        );
        if (!confirmed) return;

        saveGovernanceModeBtn.disabled = true;
        try {
            const after = {
                mode: nextMode,
                policyVersion: GOVERNANCE_POLICY_VERSION,
                updatedAt: new Date().toISOString(),
                updatedBy: currentUser.email
            };
            await setDoc(doc(db, 'app_config', 'governance'), after, { merge: true });
            await addDoc(collection(db, 'governance_audit'), {
                action: 'mode_change',
                before: {
                    mode: before.mode || APP_MODE.NORMAL,
                    policyVersion: before.policyVersion || GOVERNANCE_POLICY_VERSION
                },
                after,
                actorEmail: currentUser.email,
                actorName: currentUser.displayName || currentUser.email,
                changedAt: new Date().toISOString()
            });
            appGovernance = { ...defaultGovernance(), ...after };
            updateGovernanceUi();
            loadGovernanceAudit();
            showMessage(governanceStatus, 'Archive mode updated and audit logged.', 'success');
        } catch (error) {
            console.error('Error saving governance mode:', error);
            showMessage(governanceStatus, 'Could not update archive mode. Check permissions and try again.', 'error');
        } finally {
            saveGovernanceModeBtn.disabled = false;
        }
    });
}

profileEditsFilter.addEventListener('input', () => {
    renderProfileEditsQueue(personEditHistoryCache, profileEditsFilter.value);
});

// Save-default layout modal buttons
const saveDefaultModal = document.getElementById('save-default-layout-modal');
document.getElementById('close-save-default-btn').addEventListener('click', () => saveDefaultModal.classList.add('hidden'));
document.getElementById('cancel-save-default-btn').addEventListener('click', () => saveDefaultModal.classList.add('hidden'));
document.getElementById('confirm-save-default-btn').addEventListener('click', () => executeSaveDefaultLayout());
saveDefaultModal.addEventListener('click', (e) => {
    if (e.target === saveDefaultModal) saveDefaultModal.classList.add('hidden');
});

// ─── Invitation Template ─────────────────────────────────────────────────────

const DEFAULT_INVITE_TEMPLATE =
    `You've been invited to the Fuhr Family Archive — a private collection of family photos, records, and stories.\n\n` +
    `Visit {url} to sign in. You'll need to use your Google account with this email address: {email}\n\n` +
    `If you have any trouble accessing the site, reply to this message and I'll make sure your account is set up correctly.`;

let cachedInviteTemplate = null;

async function loadInviteTemplate() {
    try {
        const snap = await getDoc(doc(db, 'app_config', 'invitation'));
        if (snap.exists() && snap.data().template) {
            cachedInviteTemplate = snap.data().template;
            if (inviteTemplateText) inviteTemplateText.value = cachedInviteTemplate;
        } else {
            cachedInviteTemplate = null;
            if (inviteTemplateText) inviteTemplateText.value = DEFAULT_INVITE_TEMPLATE;
        }
    } catch (err) {
        console.error('Error loading invite template:', err);
        if (inviteTemplateText) inviteTemplateText.value = DEFAULT_INVITE_TEMPLATE;
    }
}

function buildInviteMessage(email) {
    const template = cachedInviteTemplate || DEFAULT_INVITE_TEMPLATE;
    const appUrl = window.location.origin;
    return template.replace(/\{email\}/g, email).replace(/\{url\}/g, appUrl);
}

if (saveInviteTemplateBtn) {
    saveInviteTemplateBtn.addEventListener('click', async () => {
        const template = inviteTemplateText.value.trim();
        if (!template) {
            showMessage(inviteTemplateStatus, 'Template cannot be empty.', 'error');
            return;
        }
        try {
            await setDoc(doc(db, 'app_config', 'invitation'), { template, updatedAt: new Date().toISOString(), updatedBy: currentUser.email });
            cachedInviteTemplate = template;
            showMessage(inviteTemplateStatus, 'Template saved.', 'success');
        } catch (err) {
            console.error('Error saving invite template:', err);
            showMessage(inviteTemplateStatus, 'Failed to save. Check permissions.', 'error');
        }
    });
}

if (resetInviteTemplateBtn) {
    resetInviteTemplateBtn.addEventListener('click', async () => {
        try {
            await deleteDoc(doc(db, 'app_config', 'invitation'));
            cachedInviteTemplate = null;
            inviteTemplateText.value = DEFAULT_INVITE_TEMPLATE;
            showMessage(inviteTemplateStatus, 'Reset to default.', 'success');
        } catch (err) {
            console.error('Error resetting invite template:', err);
            showMessage(inviteTemplateStatus, 'Failed to reset. Check permissions.', 'error');
        }
    });
}

sendInviteBtn.addEventListener('click', async () => {
    const email = inviteEmailInput.value.trim();
    if (!isValidEmail(email)) {
        showMessage(inviteStatus, 'Please enter a valid email address.', 'error');
        return;
    }
    try {
        await setDoc(doc(db, 'authorized_users', email), {
            email,
            role: 'contributor',
            invitedBy: currentUser.email,
            invitedAt: new Date().toISOString(),
            status: 'invited'
        });
        showMessage(inviteStatus, 'User invited successfully.', 'success');
        inviteMessageText.value = buildInviteMessage(email);
        inviteMessageArea.classList.remove('hidden');
        copyInviteConfirm.classList.add('hidden');
        inviteEmailInput.value = '';
        loadAuthorizedUsers();
    } catch (error) {
        console.error('Error sending invitation:', error);
        showMessage(inviteStatus, 'Failed to send invitation. Please try again.', 'error');
    }
});

copyInviteBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(inviteMessageText.value).then(() => {
        copyInviteConfirm.classList.remove('hidden');
        setTimeout(() => copyInviteConfirm.classList.add('hidden'), 2500);
    });
});

async function loadFeedbackBadge() {
    if (!auth.currentUser) return;
    try {
        const q = query(collection(db, 'feedback'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const count = snap.size;
        if (count > 0) {
            feedbackBadge.textContent = count;
            feedbackBadge.classList.remove('hidden');
        } else {
            feedbackBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading feedback badge:', error);
    }
}

async function loadFeedbackQueue() {
    if (!auth.currentUser) { feedbackQueue.innerHTML = '<p class="queue-empty">Sign in with Google to manage feedback.</p>'; return; }
    feedbackQueue.innerHTML = '<p class="queue-loading">Loading feedback...</p>';
    try {
        const q = query(collection(db, 'feedback'), orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);

        feedbackQueue.innerHTML = '';

        if (snap.empty) {
            feedbackQueue.innerHTML = '<p class="queue-empty">No feedback submissions yet.</p>';
            return;
        }

        snap.forEach(docSnap => {
            const fb = docSnap.data();
            const item = document.createElement('div');
            item.className = `feedback-item feedback-item--${fb.status || 'pending'}`;

            const meta = document.createElement('div');
            meta.className = 'feedback-item-meta';

            const typeBadge = document.createElement('span');
            typeBadge.className = 'feedback-type-badge';
            typeBadge.textContent = fb.type || 'other';

            const statusBadge = document.createElement('span');
            statusBadge.className = `feedback-status-badge feedback-status-badge--${fb.status || 'pending'}`;
            statusBadge.textContent = fb.status || 'pending';

            const who = document.createElement('span');
            who.className = 'feedback-who';
            who.textContent = fb.submittedByName || fb.submittedBy || 'Unknown';

            const when = document.createElement('span');
            when.className = 'feedback-when';
            when.textContent = formatShortDate(fb.submittedAt);

            meta.appendChild(typeBadge);
            meta.appendChild(statusBadge);
            meta.appendChild(who);
            meta.appendChild(when);

            const body = document.createElement('div');
            body.className = 'feedback-item-body';

            if (fb.person) {
                const personEl = document.createElement('div');
                personEl.className = 'feedback-item-person';
                personEl.textContent = `Re: ${fb.person}`;
                body.appendChild(personEl);
            }

            const msg = document.createElement('p');
            msg.className = 'feedback-item-message';
            msg.textContent = fb.message;
            body.appendChild(msg);

            if (fb.reviewedBy) {
                const reviewEl = document.createElement('div');
                reviewEl.className = 'submission-review-info';
                reviewEl.textContent = `Reviewed by ${fb.reviewedBy} on ${formatShortDate(fb.reviewedAt) || 'a recent date'}`;
                body.appendChild(reviewEl);
            }

            item.appendChild(meta);
            item.appendChild(body);

            // Action buttons — only for pending items
            if (fb.status === 'pending') {
                const actions = document.createElement('div');
                actions.className = 'feedback-actions';

                const resolveBtn = document.createElement('button');
                resolveBtn.type = 'button';
                resolveBtn.className = 'feedback-action-btn feedback-action-btn--resolve';
                resolveBtn.textContent = 'Mark Resolved';
                resolveBtn.addEventListener('click', () => updateFeedbackStatus(docSnap.id, 'resolved', item));

                const dismissBtn = document.createElement('button');
                dismissBtn.type = 'button';
                dismissBtn.className = 'feedback-action-btn feedback-action-btn--dismiss';
                dismissBtn.textContent = 'Dismiss';
                dismissBtn.addEventListener('click', () => updateFeedbackStatus(docSnap.id, 'dismissed', item));

                actions.appendChild(resolveBtn);
                actions.appendChild(dismissBtn);
                item.appendChild(actions);
            }

            feedbackQueue.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading feedback queue:', error);
        feedbackQueue.innerHTML = '<p class="queue-error">Could not load feedback. Check console for details.</p>';
    }
}

async function updateFeedbackStatus(feedbackId, newStatus, itemEl) {
    try {
        await updateDoc(doc(db, 'feedback', feedbackId), {
            status: newStatus,
            reviewedBy: currentUser.email,
            reviewedAt: new Date().toISOString()
        });
        // Refresh the queue and badge in place
        await loadFeedbackQueue();
        await loadFeedbackBadge();
    } catch (error) {
        console.error('Error updating feedback status:', error);
    }
}

// ─── Manual Media Links ───────────────────────────────────────────────────────

async function loadManualMediaLinks() {
    if (manualLinksLoaded) return;
    try {
        const snap = await getDocs(collection(db, 'media_links'));
        if (snap.empty) { manualLinksLoaded = true; return; }
        const links = [];
        snap.forEach(d => links.push(d.data()));
        await loadPersonPhotos();
        mergeManualMediaLinks(links);
        manualLinksLoaded = true;
    } catch (error) {
        console.error('Error loading manual media links:', error);
    }
}

// Person search for media-link form
mlPersonSearch.addEventListener('input', () => {
    const term = mlPersonSearch.value.trim();
    mlPersonResults.innerHTML = '';
    if (term.length < 2) { mlPersonResults.classList.add('hidden'); return; }

    const results = searchFamilyMembers(term).slice(0, 8);
    if (results.length === 0) { mlPersonResults.classList.add('hidden'); return; }

    results.forEach(r => {
        const idMatch = r.link && r.link.match(/#P(\d+)/);
        if (!idMatch) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ml-result-item';
        btn.textContent = `${r.name} (${r.dates || 'n.d.'})`;
        btn.addEventListener('click', () => {
            mlSelectedPersonId = idMatch[1];
            mlSelectedPersonName = r.name;
            mlPersonSelected.textContent = r.name;
            mlPersonSelected.classList.remove('hidden');
            mlPersonResults.classList.add('hidden');
            mlPersonSearch.value = '';
            updateMlAddBtn();
        });
        mlPersonResults.appendChild(btn);
    });
    mlPersonResults.classList.remove('hidden');
});

// Photo search for media-link form
mlPhotoSearch.addEventListener('input', async () => {
    const term = mlPhotoSearch.value.trim().toLowerCase();
    mlPhotoResults.innerHTML = '';
    if (term.length < 2) { mlPhotoResults.classList.add('hidden'); return; }

    const photos = await loadPhotos();
    const matches = photos.filter(p => p.name.toLowerCase().includes(term) ||
        p.path.toLowerCase().includes(term)).slice(0, 8);

    if (matches.length === 0) { mlPhotoResults.classList.add('hidden'); return; }

    matches.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ml-result-item ml-result-photo';

        const thumb = document.createElement('img');
        thumb.src = p.path;
        thumb.alt = p.name;
        thumb.className = 'ml-result-thumb';

        const label = document.createElement('span');
        label.textContent = p.name;

        btn.appendChild(thumb);
        btn.appendChild(label);
        btn.addEventListener('click', () => {
            mlSelectedPhotoPath = p.path;
            mlPhotoSelected.innerHTML = '';
            const img = document.createElement('img');
            img.src = p.path;
            img.alt = p.name;
            img.className = 'ml-preview-thumb';
            const name = document.createElement('span');
            name.textContent = p.name;
            mlPhotoSelected.appendChild(img);
            mlPhotoSelected.appendChild(name);
            mlPhotoSelected.classList.remove('hidden');
            mlPhotoResults.classList.add('hidden');
            mlPhotoSearch.value = '';
            updateMlAddBtn();
        });
        mlPhotoResults.appendChild(btn);
    });
    mlPhotoResults.classList.remove('hidden');
});

function updateMlAddBtn() {
    mlAddBtn.disabled = !(mlSelectedPersonId && mlSelectedPhotoPath);
}

mlAddBtn.addEventListener('click', async () => {
    if (!mlSelectedPersonId || !mlSelectedPhotoPath) return;

    // Prevent duplicate links
    const existingSnap = await getDocs(
        query(collection(db, 'media_links'),
            where('personId', '==', mlSelectedPersonId),
            where('photoPath', '==', mlSelectedPhotoPath))
    );
    if (!existingSnap.empty) {
        showMessage(mlStatus, 'This photo is already linked to that person.', 'error');
        return;
    }

    mlAddBtn.disabled = true;
    try {
        await addDoc(collection(db, 'media_links'), {
            personId: mlSelectedPersonId,
            personName: mlSelectedPersonName,
            photoPath: mlSelectedPhotoPath,
            caption: mlCaption.value.trim(),
            addedBy: currentUser.email,
            addedAt: new Date().toISOString()
        });
        // Inject immediately into the runtime maps
        mergeManualMediaLinks([{
            personId: mlSelectedPersonId,
            personName: mlSelectedPersonName,
            photoPath: mlSelectedPhotoPath,
            caption: mlCaption.value.trim()
        }]);
        showMessage(mlStatus, 'Photo linked successfully.', 'success');
        // Reset form
        mlSelectedPersonId = null;
        mlSelectedPersonName = '';
        mlSelectedPhotoPath = '';
        mlPersonSelected.classList.add('hidden');
        mlPhotoSelected.classList.add('hidden');
        mlCaption.value = '';
        updateMlAddBtn();
        loadExistingMediaLinks();
    } catch (error) {
        console.error('Error adding media link:', error);
        showMessage(mlStatus, 'Something went wrong. Please try again.', 'error');
    } finally {
        mlAddBtn.disabled = false;
    }
});

async function loadExistingMediaLinks() {
    if (!auth.currentUser) { mlExistingList.innerHTML = '<p class="queue-empty">Sign in with Google to manage media links.</p>'; return; }
    mlExistingList.innerHTML = '<p class="queue-loading">Loading...</p>';
    try {
        const snap = await getDocs(query(collection(db, 'media_links'), orderBy('addedAt', 'desc')));
        mlExistingList.innerHTML = '';

        if (snap.empty) {
            mlExistingList.innerHTML = '<p class="queue-empty">No manual links yet.</p>';
            return;
        }

        snap.forEach(docSnap => {
            const link = docSnap.data();
            const row = document.createElement('div');
            row.className = 'ml-existing-row';

            const thumb = document.createElement('img');
            thumb.src = link.photoPath;
            thumb.alt = link.caption || link.personName;
            thumb.className = 'ml-existing-thumb';

            const info = document.createElement('div');
            info.className = 'ml-existing-info';
            const nameEl = document.createElement('span');
            nameEl.className = 'ml-existing-name';
            nameEl.textContent = link.personName || `Person ${link.personId}`;
            const fileEl = document.createElement('span');
            fileEl.className = 'ml-existing-file';
            fileEl.textContent = link.photoPath.split('/').pop();
            info.appendChild(nameEl);
            info.appendChild(fileEl);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'feedback-action-btn feedback-action-btn--dismiss';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', async () => {
                try {
                    await deleteDoc(doc(db, 'media_links', docSnap.id));
                    row.remove();
                    if (mlExistingList.children.length === 0) {
                        mlExistingList.innerHTML = '<p class="queue-empty">No manual links yet.</p>';
                    }
                } catch (error) {
                    console.error('Error removing media link:', error);
                }
            });

            row.appendChild(thumb);
            row.appendChild(info);
            row.appendChild(removeBtn);
            mlExistingList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading media links:', error);
        mlExistingList.innerHTML = '<p class="queue-error">Could not load links.</p>';
    }
}

async function loadSubmissionsBadge() {
    if (!auth.currentUser) return;
    try {
        const q = query(collection(db, 'submissions'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const count = snap.size;
        if (count > 0) {
            submissionsBadge.textContent = count;
            submissionsBadge.classList.remove('hidden');
        } else {
            submissionsBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error loading submissions badge:', error);
    }
}

async function loadSubmissionsQueue() {
    if (!auth.currentUser) { submissionsQueue.innerHTML = '<p class="queue-empty">Sign in with Google to manage submissions.</p>'; return; }
    submissionsQueue.innerHTML = '<p class="queue-loading">Loading submissions...</p>';
    try {
        const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
        const snap = await getDocs(q);

        submissionsQueue.innerHTML = '';

        if (snap.empty) {
            submissionsQueue.innerHTML = '<p class="queue-empty">No submissions yet.</p>';
            return;
        }

        snap.forEach(docSnap => {
            const sub = docSnap.data();
            const item = document.createElement('div');
            item.className = `feedback-item feedback-item--${sub.status || 'pending'}`;

            const meta = document.createElement('div');
            meta.className = 'feedback-item-meta';

            const typeBadge = document.createElement('span');
            typeBadge.className = 'feedback-type-badge';
            typeBadge.textContent = sub.submissionType === 'photo' ? 'Photo' : 'Correction';

            const statusBadge = document.createElement('span');
            statusBadge.className = `feedback-status-badge feedback-status-badge--${sub.status || 'pending'}`;
            statusBadge.textContent = sub.status || 'pending';

            const who = document.createElement('span');
            who.className = 'feedback-who';
            who.textContent = sub.submittedByName || sub.submittedBy || 'Unknown';

            const when = document.createElement('span');
            when.className = 'feedback-when';
            when.textContent = formatShortDate(sub.submittedAt);

            meta.appendChild(typeBadge);
            meta.appendChild(statusBadge);
            meta.appendChild(who);
            meta.appendChild(when);

            const body = document.createElement('div');
            body.className = 'feedback-item-body';

            if (sub.person) {
                const personEl = document.createElement('div');
                personEl.className = 'feedback-item-person';
                personEl.textContent = `Re: ${sub.person}`;
                body.appendChild(personEl);
            }

            if (sub.submissionType === 'correction') {
                const corrEl = document.createElement('div');
                corrEl.className = 'submission-correction-detail';
                corrEl.innerHTML = `<span class="submission-field-label">${sub.correctionField}:</span> ${sub.proposedValue || ''}`;
                body.appendChild(corrEl);

                if (sub.source) {
                    const srcEl = document.createElement('div');
                    srcEl.className = 'submission-source';
                    srcEl.textContent = `Source: ${sub.source}`;
                    body.appendChild(srcEl);
                }
            } else {
                const descEl = document.createElement('p');
                descEl.className = 'feedback-item-message';
                descEl.textContent = sub.description || '';
                body.appendChild(descEl);

                if (sub.photoSource) {
                    const srcEl = document.createElement('div');
                    srcEl.className = 'submission-source';
                    srcEl.textContent = `Location: ${sub.photoSource}`;
                    body.appendChild(srcEl);
                }
            }

            if (sub.reviewedBy) {
                const reviewEl = document.createElement('div');
                reviewEl.className = 'submission-review-info';
                reviewEl.textContent = `Reviewed by ${sub.reviewedBy} on ${formatShortDate(sub.reviewedAt) || 'a recent date'}`;
                body.appendChild(reviewEl);
            }

            item.appendChild(meta);
            item.appendChild(body);

            // Approve / Reject — only for pending items
            if (sub.status === 'pending') {
                const actions = document.createElement('div');
                actions.className = 'feedback-actions';

                const approveBtn = document.createElement('button');
                approveBtn.type = 'button';
                approveBtn.className = 'feedback-action-btn feedback-action-btn--approve';
                approveBtn.textContent = 'Approve';
                approveBtn.addEventListener('click', () => updateSubmissionStatus(docSnap.id, 'approved'));

                const rejectBtn = document.createElement('button');
                rejectBtn.type = 'button';
                rejectBtn.className = 'feedback-action-btn feedback-action-btn--dismiss';
                rejectBtn.textContent = 'Reject';
                rejectBtn.addEventListener('click', () => updateSubmissionStatus(docSnap.id, 'rejected'));

                actions.appendChild(approveBtn);
                actions.appendChild(rejectBtn);
                item.appendChild(actions);
            }

            submissionsQueue.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading submissions queue:', error);
        submissionsQueue.innerHTML = '<p class="queue-error">Could not load submissions. Check console for details.</p>';
    }
}

async function updateSubmissionStatus(submissionId, newStatus) {
    try {
        await updateDoc(doc(db, 'submissions', submissionId), {
            status: newStatus,
            reviewedBy: currentUser.email,
            reviewedAt: new Date().toISOString()
        });
        await loadSubmissionsQueue();
        await loadSubmissionsBadge();
    } catch (error) {
        console.error('Error updating submission status:', error);
    }
}

async function loadAuthorizedUsers() {
    if (!auth.currentUser) { usersList.innerHTML = '<p class="queue-empty">Sign in with Google to manage users.</p>'; return; }
    try {
        const usersSnapshot = await getDocs(collection(db, 'authorized_users'));
        usersList.innerHTML = '';

        if (usersSnapshot.empty) {
            usersList.innerHTML = '<p class="queue-empty">No authorized users found.</p>';
            return;
        }

        usersSnapshot.forEach(docSnapshot => {
            const userData = docSnapshot.data();
            const userId = docSnapshot.id; // doc ID is the user's email

            const userItem = document.createElement('div');
            userItem.className = 'user-item';

            // ── Identity row (original structure preserved) ───────────────
            const infoDiv = document.createElement('div');
            infoDiv.className = 'user-item-top';
            const emailDiv = document.createElement('div');
            emailDiv.className = 'user-email';
            emailDiv.textContent = userData.email || userId;
            const roleDiv = document.createElement('div');
            roleDiv.className = 'user-role';
            roleDiv.textContent = `${getRoleDisplayLabel(userData.role)} • ${userData.status || 'active'}`;
            infoDiv.appendChild(emailDiv);
            infoDiv.appendChild(roleDiv);
            userItem.appendChild(infoDiv);

            // ── Person-link row ───────────────────────────────────────────
            const linkRow = document.createElement('div');
            linkRow.className = 'user-link-row';

            const linkedLabel = document.createElement('span');
            linkedLabel.className = userData.personId ? 'user-linked-label linked' : 'user-linked-label';
            linkedLabel.textContent = userData.personId
                ? (userData.personName || `Person #${userData.personId}`)
                : 'No person linked';

            const linkBtn = document.createElement('button');
            linkBtn.type = 'button';
            linkBtn.className = 'link-person-btn';
            linkBtn.textContent = userData.personId ? 'Change' : 'Link';

            linkRow.appendChild(linkedLabel);
            linkRow.appendChild(linkBtn);

            const roleSelect = document.createElement('select');
            roleSelect.className = 'feedback-select user-role-select';
            roleSelect.title = 'Governed role assignment';
            ['viewer', 'contributor', 'moderator', 'admin'].forEach((role) => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = ROLE_LABELS[role];
                roleSelect.appendChild(option);
            });
            roleSelect.value = normalizeRole(userData.role);
            roleSelect.disabled = userId === currentUser?.email || !hasCapability('manageUsers');
            roleSelect.addEventListener('change', async () => {
                const beforeRole = normalizeRole(userData.role);
                const afterRole = roleSelect.value;
                if (beforeRole === afterRole) return;
                const confirmed = window.confirm(`Change ${userData.email || userId} from ${ROLE_LABELS[beforeRole]} to ${ROLE_LABELS[afterRole]}?`);
                if (!confirmed) {
                    roleSelect.value = beforeRole;
                    return;
                }
                roleSelect.disabled = true;
                try {
                    await updateDoc(doc(db, 'authorized_users', userId), {
                        role: afterRole,
                        roleUpdatedAt: new Date().toISOString(),
                        roleUpdatedBy: currentUser.email
                    });
                    await addDoc(collection(db, 'governance_audit'), {
                        action: 'role_change',
                        targetEmail: userData.email || userId,
                        before: { role: beforeRole },
                        after: { role: afterRole },
                        actorEmail: currentUser.email,
                        actorName: currentUser.displayName || currentUser.email,
                        changedAt: new Date().toISOString()
                    });
                    userData.role = afterRole;
                    roleDiv.textContent = `${getRoleDisplayLabel(afterRole)} • ${userData.status || 'active'}`;
                } catch (err) {
                    console.error('Error changing user role:', err);
                    roleSelect.value = beforeRole;
                    alert('Failed to change role. Check the console for details.');
                } finally {
                    roleSelect.disabled = userId === currentUser?.email || !hasCapability('manageUsers');
                }
            });
            linkRow.appendChild(roleSelect);

            // Unlink button — appended to linkRow, visible only when linked
            const appendUnlinkBtn = () => {
                const unlinkBtn = document.createElement('button');
                unlinkBtn.type = 'button';
                unlinkBtn.className = 'link-person-btn link-person-btn--danger';
                unlinkBtn.textContent = 'Unlink';
                unlinkBtn.onclick = async () => {
                    try {
                        await updateDoc(doc(db, 'authorized_users', userId), { personId: null, personName: null });
                        linkedLabel.textContent = 'No person linked';
                        linkedLabel.classList.remove('linked');
                        linkBtn.textContent = 'Link';
                        unlinkBtn.remove();
                    } catch (err) {
                        console.error('Error unlinking person:', err);
                    }
                };
                linkRow.appendChild(unlinkBtn);
            };
            if (userData.personId) appendUnlinkBtn();

            // ── Remove user button (not shown for the admin's own row) ──
            const isSelf = userId === currentUser?.email;
            if (!isSelf) {
                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'link-person-btn link-person-btn--danger';
                removeBtn.textContent = 'Remove';
                removeBtn.title = 'Revoke access for this user';
                removeBtn.onclick = async () => {
                    const confirmed = window.confirm(
                        `Remove ${userData.email || userId} from the family archive?\n\nThis will revoke their access. They can be re-invited later if needed.`
                    );
                    if (!confirmed) return;
                    try {
                        await deleteDoc(doc(db, 'authorized_users', userId));
                        userItem.remove();
                    } catch (err) {
                        console.error('Error removing user:', err);
                        alert('Failed to remove user. Check the console for details.');
                    }
                };
                linkRow.appendChild(removeBtn);
            }

            userItem.appendChild(linkRow);

            // ── Inline search area (hidden until Link/Change is clicked) ──
            const personSearchArea = document.createElement('div');
            personSearchArea.className = 'user-link-search hidden';

            const personSearchInput = document.createElement('input');
            personSearchInput.type = 'text';
            personSearchInput.className = 'user-link-search-input';
            personSearchInput.placeholder = 'Search by name…';

            const personSearchResults = document.createElement('div');
            personSearchResults.className = 'user-link-results';

            personSearchArea.appendChild(personSearchInput);
            personSearchArea.appendChild(personSearchResults);
            userItem.appendChild(personSearchArea);

            linkBtn.onclick = () => {
                personSearchArea.classList.toggle('hidden');
                if (!personSearchArea.classList.contains('hidden')) {
                    personSearchInput.value = '';
                    personSearchResults.innerHTML = '';
                    personSearchInput.focus();
                }
            };

            personSearchInput.oninput = () => {
                const term = personSearchInput.value.trim();
                personSearchResults.innerHTML = '';
                if (term.length < 2) return;

                const matches = searchFamilyMembers(term).slice(0, 8);
                if (matches.length === 0) {
                    const empty = document.createElement('div');
                    empty.className = 'user-link-result-item user-link-result-item--empty';
                    empty.textContent = 'No matches found';
                    personSearchResults.appendChild(empty);
                    return;
                }

                matches.forEach(member => {
                    const personId = member.personId || extractPersonIdFromLink(member.link);
                    if (!personId) return;
                    const resultItem = document.createElement('div');
                    resultItem.className = 'user-link-result-item';
                    resultItem.textContent = member.dates
                        ? `${member.name} (${member.dates})`
                        : member.name;
                    resultItem.onclick = async () => {
                        try {
                            await updateDoc(doc(db, 'authorized_users', userId), {
                                personId,
                                personName: member.name
                            });
                            linkedLabel.textContent = member.name;
                            linkedLabel.classList.add('linked');
                            linkBtn.textContent = 'Change';
                            personSearchArea.classList.add('hidden');
                            if (!linkRow.querySelector('.link-person-btn--danger')) appendUnlinkBtn();
                        } catch (err) {
                            console.error('Error linking person:', err);
                        }
                    };
                    personSearchResults.appendChild(resultItem);
                });
            };

            usersList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<p class="queue-error">Could not load users. Check console for details.</p>';
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function showMessage(element, message, type) {
    element.textContent = message;
    const baseClass = element.className ? element.className.split(' ')[0] : 'message';
    element.className = `${baseClass} ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = baseClass;
    }, 5000);
}

// ─── Admin Diagnostics ────────────────────────────────────────────────────────

// State for the last diagnostics run (used by "Copy Diagnostics")
let lastDiagnosticsResult = null;

function renderDiagnosticsTab() {
    // Config table
    const tbody = document.querySelector('#diag-config-table tbody');
    if (tbody) {
        const safeKeys = [
            ['projectId',      firebaseConfig.projectId],
            ['authDomain',     firebaseConfig.authDomain],
            ['storageBucket',  firebaseConfig.storageBucket],
            ['appId',          firebaseConfig.appId],
            ['App Version',    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'],
        ];
        tbody.innerHTML = safeKeys.map(([k, v]) =>
            `<tr><td>${k}</td><td>${v || '<em>not set</em>'}</td></tr>`
        ).join('');
    }

    // Auth status
    const authDiv = document.getElementById('diag-auth-status');
    if (authDiv) {
        if (currentUser) {
            authDiv.textContent = `Signed in as: ${currentUser.email} | Admin: ${isAdmin ? 'Yes' : 'No'}`;
        } else {
            authDiv.textContent = 'Not signed in';
        }
    }

    // Render placeholder check rows (pending state)
    renderDiagCheckRows([
        { name: 'Firestore Read',      status: 'pending' },
        { name: 'Storage: places.json', status: 'pending' },
        { name: 'Storage: person-details.json', status: 'pending' },
        { name: 'Storage: person-photos.json',  status: 'pending' },
    ]);

    // Wire up buttons
    const runBtn = document.getElementById('diag-run-btn');
    const copyBtn = document.getElementById('diag-copy-btn');
    const copyConfirm = document.getElementById('diag-copy-confirm');

    // Replace with clones to remove stale listeners from previous renders
    if (runBtn) {
        const newRunBtn = runBtn.cloneNode(true);
        runBtn.parentNode.replaceChild(newRunBtn, runBtn);
        newRunBtn.addEventListener('click', () => runAllDiagnosticsChecks());
    }
    if (copyBtn) {
        const newCopyBtn = copyBtn.cloneNode(true);
        copyBtn.parentNode.replaceChild(newCopyBtn, copyBtn);
        newCopyBtn.addEventListener('click', () => {
            const text = buildDiagnosticsText();
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                if (copyConfirm) {
                    copyConfirm.classList.remove('hidden');
                    setTimeout(() => copyConfirm.classList.add('hidden'), 2000);
                }
            }).catch(err => {
                console.error('Copy failed:', err);
            });
        });
    }
}

function renderDiagCheckRows(checks) {
    const container = document.getElementById('diag-checks');
    if (!container) return;
    container.innerHTML = checks.map(c => {
        let icon = '⏳';
        let cls = '';
        let detail = c.message || '';
        let latency = c.latency != null ? `${c.latency} ms` : '';
        if (c.status === 'pass')    { icon = '✅'; cls = 'pass'; }
        if (c.status === 'fail')    { icon = '❌'; cls = 'fail'; }
        if (c.status === 'running') { icon = '⏳'; cls = 'running'; }
        return `<div class="diag-check-row ${cls}">
            <span class="diag-check-icon">${icon}</span>
            <span class="diag-check-name">${c.name}</span>
            <span class="diag-check-detail">${detail}</span>
            <span class="diag-check-latency">${latency}</span>
        </div>`;
    }).join('');
}

async function runAllDiagnosticsChecks() {
    const runBtn = document.getElementById('diag-run-btn');
    if (runBtn) runBtn.disabled = true;

    const checks = [
        { name: 'Firestore Read',                status: 'running' },
        { name: 'Storage: places.json',          status: 'running' },
        { name: 'Storage: person-details.json',  status: 'running' },
        { name: 'Storage: person-photos.json',   status: 'running' },
    ];
    renderDiagCheckRows(checks);

    const results = await Promise.all([
        runFirestoreCheck(),
        runStorageCheck('data/places.json'),
        runStorageCheck('data/person-details.json'),
        runStorageCheck('data/person-photos.json'),
    ]);

    checks[0] = { name: 'Firestore Read',                ...results[0] };
    checks[1] = { name: 'Storage: places.json',          ...results[1] };
    checks[2] = { name: 'Storage: person-details.json',  ...results[2] };
    checks[3] = { name: 'Storage: person-photos.json',   ...results[3] };
    renderDiagCheckRows(checks);

    lastDiagnosticsResult = { ts: new Date().toISOString(), checks };

    // Optionally log to Firestore (only when authenticated as admin)
    if (currentUser && isAdmin) {
        try {
            await addDoc(collection(db, 'adminDiagnosticsLogs'), {
                timestamp: new Date(),
                userEmail: currentUser.email,
                results: checks.map(c => ({
                    name: c.name,
                    status: c.status,
                    message: c.message || '',
                    latency: c.latency ?? null,
                })),
            });
            showMessage(document.getElementById('diag-log-status'), 'Results logged to Firestore.', 'success');
        } catch (logErr) {
            console.warn('Diagnostics log write failed (non-critical):', logErr);
        }
    }

    if (runBtn) runBtn.disabled = false;
}

async function runFirestoreCheck() {
    if (!currentUser) {
        return { status: 'fail', message: 'Not signed in', latency: 0 };
    }
    const start = Date.now();
    try {
        // Perform a lightweight read from the authorized_users collection using the current user's doc
        await getDoc(doc(db, 'authorized_users', currentUser.email));
        return { status: 'pass', message: 'Read succeeded', latency: Date.now() - start };
    } catch (err) {
        return { status: 'fail', message: `${err.code || err.name}: ${err.message}`, latency: Date.now() - start };
    }
}

async function runStorageCheck(path) {
    const start = Date.now();
    try {
        await getDownloadURL(storageRef(storage, path));
        return { status: 'pass', message: 'Object accessible', latency: Date.now() - start };
    } catch (err) {
        return { status: 'fail', message: `${err.code || err.name}: ${err.message}`, latency: Date.now() - start };
    }
}

function buildDiagnosticsText() {
    const lines = ['=== Living Family Archive Diagnostics ==='];
    lines.push(`Time: ${new Date().toISOString()}`);
    lines.push(`User: ${currentUser?.email || 'n/a'} | Admin: ${isAdmin ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push('-- Firebase Config (safe fields) --');
    lines.push(`projectId:     ${firebaseConfig.projectId || 'n/a'}`);
    lines.push(`authDomain:    ${firebaseConfig.authDomain || 'n/a'}`);
    lines.push(`storageBucket: ${firebaseConfig.storageBucket || 'n/a'}`);
    lines.push(`appId:         ${firebaseConfig.appId || 'n/a'}`);
    const appVer = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'n/a';
    lines.push(`App Version:   ${appVer}`);
    lines.push('');
    if (lastDiagnosticsResult) {
        lines.push('-- Health Check Results --');
        lastDiagnosticsResult.checks.forEach(c => {
            const icon = c.status === 'pass' ? 'PASS' : c.status === 'fail' ? 'FAIL' : 'PENDING';
            const latency = c.latency != null ? ` (${c.latency} ms)` : '';
            lines.push(`[${icon}] ${c.name}${latency}: ${c.message || ''}`);
        });
    } else {
        lines.push('-- Health Checks: not yet run --');
    }
    return lines.join('\n');
}
