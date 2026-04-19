#!/usr/bin/env node

/**
 * Photo Catalog Generator
 * 
 * This script scans the FamilyTreeMedia directory for images
 * and generates a list that can be used in src/family-data.js
 * 
 * Run with: node scripts/catalog-photos.js
 */

const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
const BASE_DIR = path.join(__dirname, '..', 'FamilyTreeMedia');

function scanDirectory(dir, baseDir = dir) {
    const photos = [];
    
    try {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                photos.push(...scanDirectory(fullPath, baseDir));
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if (IMAGE_EXTENSIONS.includes(ext)) {
                    const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
                    const name = path.basename(item, ext);
                    photos.push({
                        name: name,
                        path: relativePath.replace(/\\/g, '/')
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning ${dir}:`, error.message);
    }
    
    return photos;
}

function generatePhotoList() {
    console.log('Scanning for photos in FamilyTreeMedia directory...\n');
    
    if (!fs.existsSync(BASE_DIR)) {
        console.error('Error: FamilyTreeMedia directory not found!');
        process.exit(1);
    }
    
    const photos = scanDirectory(BASE_DIR);
    
    console.log(`Found ${photos.length} photos\n`);
    console.log('Copy the following array into src/family-data.js:\n');
    console.log('photoData = [');
    
    photos.forEach(photo => {
        // Safely output by using JSON.stringify to escape special characters
        console.log(`    { name: ${JSON.stringify(photo.name)}, path: ${JSON.stringify(photo.path)} },`);
    });
    
    console.log('];\n');
    
    // Also save to a file
    const outputPath = path.join(__dirname, '..', 'photo-catalog.json');
    fs.writeFileSync(outputPath, JSON.stringify(photos, null, 2));
    console.log(`Photo catalog saved to: photo-catalog.json`);
}

generatePhotoList();
