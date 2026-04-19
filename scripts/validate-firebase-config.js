#!/usr/bin/env node

const REQUIRED_ENV_VARS = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_ADMIN_EMAIL',
];

const FIREBASE_WEB_API_KEY_PATTERN = /^AIza[0-9A-Za-z_-]{35}$/;

function readEnvValue(key) {
    const value = process.env[key];
    return typeof value === 'string' ? value.trim() : value;
}

function validateFirebaseApiKey(apiKey) {
    if (!apiKey) return 'is missing or empty';
    if (/PRIVATE KEY/i.test(apiKey)) return 'looks like a service-account private key, not a Firebase Web API key';
    if (apiKey.startsWith('{')) return 'looks like JSON, not a Firebase Web API key';
    if (!FIREBASE_WEB_API_KEY_PATTERN.test(apiKey)) return 'does not match the expected Firebase Web API key format';
    return null;
}

function main() {
    const missingVars = REQUIRED_ENV_VARS.filter((key) => !readEnvValue(key));
    const problems = [];

    if (missingVars.length > 0) {
        problems.push(`Missing required variables: ${missingVars.join(', ')}`);
    }

    const apiKeyError = validateFirebaseApiKey(readEnvValue('VITE_FIREBASE_API_KEY'));
    if (apiKeyError) {
        problems.push(`VITE_FIREBASE_API_KEY ${apiKeyError}`);
    }

    if (problems.length > 0) {
        problems.forEach((problem) => {
            console.error(`[validate-firebase-config] ${problem}`);
        });
        process.exit(1);
    }

    console.log('[validate-firebase-config] Firebase web configuration looks valid.');
}

main();
