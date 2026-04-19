#!/usr/bin/env node
/**
 * Standard local release gate for this repo.
 *
 * This script intentionally mirrors the core CI release verification steps so
 * local release prep and GitHub Actions do not drift apart.
 */

const { execSync } = require('child_process');

const REQUIRED_NODE_MAJOR = 22;

function getNodeMajor() {
    const [major] = process.versions.node.split('.');
    return Number(major);
}

function runStep(label, scriptName) {
    console.log(`\n[verify-release] ${label}`);
    try {
        execSync(`npm run ${scriptName}`, { stdio: 'inherit' });
    } catch (err) {
        throw new Error(`Step failed: npm run ${scriptName}`);
    }
}

function verifyRelease() {
    const nodeMajor = getNodeMajor();
    if (!Number.isInteger(nodeMajor) || nodeMajor < REQUIRED_NODE_MAJOR) {
        throw new Error(
            `Release verification requires Node ${REQUIRED_NODE_MAJOR}+; current runtime is ${process.versions.node}.`
        );
    }

    console.log(`[verify-release] Node ${process.versions.node} detected`);
    runStep('Validating Firebase web configuration', 'validate-firebase-config');
    runStep('Building application and generating protected artifacts', 'build');
    runStep('Validating protected data artifacts', 'validate-protected-data');
    runStep('Running governance read-only integration tests', 'test-governance-integration');
    console.log('\n[verify-release] Release verification passed.');
    console.log('[verify-release] Next step: run the staging smoke checklist in RELEASE_CHECKLIST.md before promotion.');
}

if (require.main === module) {
    try {
        verifyRelease();
    } catch (error) {
        console.error(`[verify-release] ${error.message}`);
        process.exit(1);
    }
}

module.exports = {
    REQUIRED_NODE_MAJOR,
    verifyRelease
};
