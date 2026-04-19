// Firebase configuration
// Values are injected at build time via Vite environment variables (VITE_FIREBASE_*).
// For local development, create a .env file (see .env.example) with the required values.

const REQUIRED_ENV_VARS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
];

const FIREBASE_WEB_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;

function readEnvValue(key) {
    const value = import.meta.env[key];
    return typeof value === 'string' ? value.trim() : value;
}

function validateFirebaseApiKey(apiKey) {
    if (!apiKey) return 'is missing or empty';
    if (/PRIVATE KEY/i.test(apiKey)) return 'looks like a service-account private key, not a Firebase Web API key';
    if (apiKey.startsWith('{')) return 'looks like JSON, not a Firebase Web API key';
    if (!FIREBASE_WEB_API_KEY_PATTERN.test(apiKey)) return 'does not match the expected Firebase Web API key format';
    return null;
}

const missingVars = REQUIRED_ENV_VARS.filter((key) => !readEnvValue(key));
const invalidVars = [];

const apiKeyValidationError = validateFirebaseApiKey(readEnvValue('VITE_FIREBASE_API_KEY'));
if (apiKeyValidationError) {
    invalidVars.push(`VITE_FIREBASE_API_KEY ${apiKeyValidationError}`);
}

const firebaseConfigProblems = [];

if (missingVars.length > 0) {
    firebaseConfigProblems.push(
        `missing or empty values: ${missingVars.join(', ')}`
    );
}

if (invalidVars.length > 0) {
    firebaseConfigProblems.push(...invalidVars);
}

export const firebaseConfigErrorMessage = firebaseConfigProblems.length > 0
    ? `Firebase configuration error:\n- ${firebaseConfigProblems.join('\n- ')}\nSet these via VITE_FIREBASE_* environment variables at build time (see .env.example).`
    : '';

if (firebaseConfigErrorMessage) {
    const msg = firebaseConfigErrorMessage;
    // Surface the error prominently so it is not silently swallowed.
    console.error(msg);
    // Show a visible banner so developers notice the misconfiguration immediately.
    if (typeof document !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            const banner = document.createElement('div');
            banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#c62828;color:#fff;padding:12px 16px;font-family:monospace;font-size:14px;white-space:pre-wrap;';
            banner.textContent = msg;
            document.body.prepend(banner);
        });
    }
}

export const firebaseConfig = {
    apiKey:            readEnvValue('VITE_FIREBASE_API_KEY'),
    authDomain:        readEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId:         readEnvValue('VITE_FIREBASE_PROJECT_ID'),
    storageBucket:     readEnvValue('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId:             readEnvValue('VITE_FIREBASE_APP_ID'),
};

// Admin email sourced from env var, with a safe fallback.
// Not included in REQUIRED_ENV_VARS above because the app can still load
// without it (just without admin privileges); the CI workflow validates it separately.
export const ADMIN_EMAIL = readEnvValue('VITE_ADMIN_EMAIL') || "";

// Local development password – only used on localhost for bypassing Google auth during development.
// Set VITE_LOCAL_DEV_PASSWORD in a .env file (see .env.example). If not set, local login is disabled.
export const LOCAL_DEV_PASSWORD = readEnvValue('VITE_LOCAL_DEV_PASSWORD') || null;
