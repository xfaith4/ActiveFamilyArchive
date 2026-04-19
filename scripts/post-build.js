#!/usr/bin/env node

/**
 * Post-build script to copy necessary files to dist
 */

const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
            copyRecursive(
                path.join(src, childItemName),
                path.join(dest, childItemName)
            );
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Copy FamilyTreeMedia to dist
const srcDir = path.join(__dirname, '..', 'FamilyTreeMedia');
const destDir = path.join(__dirname, '..', 'dist', 'FamilyTreeMedia');

console.log('Copying FamilyTreeMedia to dist...');
copyRecursive(srcDir, destDir);

// NOTE: directory.json, sources.json, source-usage.json, places.json,
// photo-catalog.json, person-photos.json, person-family.json, and person-details.json
// are NOT copied here. They are uploaded to Firebase Storage (auth-gated) by the
// CI upload-data-to-storage step instead.

console.log('Post-build copy complete!');
