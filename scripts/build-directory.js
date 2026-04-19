#!/usr/bin/env node
/**
 * Build a lightweight member directory from the RootsMagic names index.
 *
 * This replaces browser-side parsing of names.htm so the app can load a
 * stable JSON projection after authentication.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'FamilyTreeMedia', 'Total Family', 'names.htm');
const OUTPUT_FILE = path.join(__dirname, '..', 'directory.json');

function decodeHtml(value) {
    return String(value || '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&');
}

function stripTags(value) {
    return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' '))
        .replace(/\s+/g, ' ')
        .trim();
}

function extractDisplayFields(text) {
    const normalized = String(text || '').trim();
    const separator = ' . . . ';
    const separatorIndex = normalized.indexOf(separator);
    const displayText = (separatorIndex >= 0 ? normalized.slice(0, separatorIndex) : normalized).trim();
    const dateMatch = displayText.match(/^(.*)\(([^()]*)\)\s*$/);

    if (!dateMatch) {
        return { name: displayText, dates: '' };
    }

    return {
        name: dateMatch[1].trim(),
        dates: dateMatch[2].trim()
    };
}

function extractPersonId(link) {
    const match = typeof link === 'string' ? link.match(/#[Pp](\d+)/) : null;
    return match ? String(match[1]) : null;
}

function createMemberRecord({ name = '', surname = '', dates = '', link = null, personId = null }) {
    const normalizedName = String(name || '').trim();
    const normalizedSurname = String(surname || '').trim();
    const normalizedDates = String(dates || '').trim();
    const normalizedLink = typeof link === 'string' && link.trim() ? link.trim() : null;
    const normalizedPersonId = personId != null && personId !== ''
        ? String(personId)
        : extractPersonId(normalizedLink);

    return {
        name: normalizedName,
        surname: normalizedSurname,
        dates: normalizedDates,
        link: normalizedLink,
        personId: normalizedPersonId,
        searchText: `${normalizedName} ${normalizedSurname} ${normalizedDates}`.toLowerCase()
    };
}

function parseDirectory(html) {
    const members = [];
    const blocks = String(html || '').split(/<\/blockquote>/i);

    blocks.forEach((block) => {
        if (!/<blockquote>/i.test(block)) return;

        const parts = block.split(/<blockquote>/i);
        const headerHtml = parts.shift() || '';
        const blockHtml = parts.join('<blockquote>');
        const surnameMatch = headerHtml.match(/>([^<>]*)<\/a>\s*<\/b>\s*$/i);
        const surname = decodeHtml(surnameMatch ? surnameMatch[1] : '').trim();
        const entries = blockHtml
            .split(/<br\s*\/?>/i)
            .map(entry => entry.trim())
            .filter(Boolean);

        entries.forEach((entryHtml) => {
            const text = stripTags(entryHtml);
            const { name, dates } = extractDisplayFields(text);
            if (!name) return;

            const hrefMatch = entryHtml.match(/href="([^"]+)"/i);
            const href = hrefMatch ? decodeHtml(hrefMatch[1]).trim() : '';
            const link = href ? `FamilyTreeMedia/Total Family/${href}` : null;

            members.push(createMemberRecord({
                name,
                surname,
                dates,
                link
            }));
        });
    });

    return members;
}

function buildDirectory() {
    if (!fs.existsSync(SOURCE_FILE)) {
        throw new Error(`Missing source file: ${SOURCE_FILE}`);
    }

    const html = fs.readFileSync(SOURCE_FILE, 'utf8');
    const members = parseDirectory(html);

    if (!members.length) {
        throw new Error('No directory members were parsed from names.htm.');
    }

    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(members, null, 2)}\n`, 'utf8');
    console.log(`Built directory.json with ${members.length} members.`);
}

if (require.main === module) {
    try {
        buildDirectory();
    } catch (error) {
        console.error(`Failed to build directory.json: ${error.message}`);
        process.exit(1);
    }
}

module.exports = {
    buildDirectory,
    parseDirectory
};
