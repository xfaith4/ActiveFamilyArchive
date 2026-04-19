import {
    computeKinship,
    getDetailsForPerson,
    getFamilyForPerson,
    getPersonDetailsData
} from '../family-data.js';

const MAX_RELATIONSHIP_DEPTH = 30;

const RELATIONSHIP_BUCKETS = [
    { min: 100, className: 'rl-self', label: 'Self' },
    { min: 50, className: 'rl-close', label: '~50%' },
    { min: 25, className: 'rl-strong', label: '~25%' },
    { min: 12.5, className: 'rl-medium', label: '~12.5%' },
    { min: 6.25, className: 'rl-light', label: '~6.25%' },
    { min: 0.000001, className: 'rl-distant', label: '~3.125% or less' }
];

function normalizeId(value) {
    return value === undefined || value === null ? '' : String(value);
}

function getPersonSex(personId) {
    return getDetailsForPerson(personId)?.sex || '';
}

function gendered(personId, maleLabel, femaleLabel, neutralLabel) {
    const sex = getPersonSex(personId);
    if (sex === 'Male') return maleLabel;
    if (sex === 'Female') return femaleLabel;
    return neutralLabel;
}

function possessive(label) {
    if (!label) return '';
    return label.endsWith('s') ? `${label}'` : `${label}'s`;
}

function formatAncestorLabel(generations, personId) {
    if (generations === 1) return gendered(personId, 'Father', 'Mother', 'Parent');
    if (generations === 2) return gendered(personId, 'Grandfather', 'Grandmother', 'Grandparent');
    const greatPrefix = generations === 3 ? 'Great' : `${ordinal(generations - 2)}-Great`;
    return gendered(personId, `${greatPrefix}-Grandfather`, `${greatPrefix}-Grandmother`, `${greatPrefix}-Grandparent`);
}

function formatDescendantLabel(generations, personId) {
    if (generations === 1) return gendered(personId, 'Son', 'Daughter', 'Child');
    if (generations === 2) return gendered(personId, 'Grandson', 'Granddaughter', 'Grandchild');
    const greatPrefix = generations === 3 ? 'Great' : `${ordinal(generations - 2)}-Great`;
    return gendered(personId, `${greatPrefix}-Grandson`, `${greatPrefix}-Granddaughter`, `${greatPrefix}-Grandchild`);
}

function refineRelationshipLabel(relationship, bloodConnection, targetId) {
    const label = relationship?.label || '';
    if (!bloodConnection) return label || 'Relationship unknown';

    if (bloodConnection.genA === 0 && bloodConnection.genB === 0) return 'You';
    if (bloodConnection.genB === 0) return formatAncestorLabel(bloodConnection.genA, targetId);
    if (bloodConnection.genA === 0) return formatDescendantLabel(bloodConnection.genB, targetId);

    if (label === 'Sibling') return gendered(targetId, 'Brother', 'Sister', 'Sibling');
    if (label === 'Half-Sibling') return gendered(targetId, 'Half-Brother', 'Half-Sister', 'Half-Sibling');
    if (label === 'Aunt/Uncle') return gendered(targetId, 'Uncle', 'Aunt', 'Aunt/Uncle');
    if (label === 'Great-Aunt/Uncle') return gendered(targetId, 'Great-Uncle', 'Great-Aunt', 'Great-Aunt/Uncle');
    if (label.endsWith('-Grand-Aunt/Uncle')) {
        const prefix = label.replace('-Grand-Aunt/Uncle', '');
        return gendered(targetId, `${prefix}-Grand-Uncle`, `${prefix}-Grand-Aunt`, label);
    }
    if (label === 'Niece/Nephew') return gendered(targetId, 'Nephew', 'Niece', 'Niece/Nephew');
    if (label === 'Grand-Niece/Nephew') return gendered(targetId, 'Grand-Nephew', 'Grand-Niece', 'Grand-Niece/Nephew');
    if (label.endsWith('-Grand-Niece/Nephew')) {
        const prefix = label.replace('-Grand-Niece/Nephew', '');
        return gendered(targetId, `${prefix}-Grand-Nephew`, `${prefix}-Grand-Niece`, label);
    }

    return label || 'Related through shared family branch';
}

function ordinal(n) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getParents(personId) {
    return (getFamilyForPerson(personId)?.parents || [])
        .map(parent => normalizeId(parent.id))
        .filter(Boolean);
}

function getSpouses(personId) {
    return (getFamilyForPerson(personId)?.spouses || [])
        .map(spouse => normalizeId(spouse.id))
        .filter(Boolean);
}

function buildAncestorPathMap(personId, maxDepth = MAX_RELATIONSHIP_DEPTH) {
    const startId = normalizeId(personId);
    const result = new Map();
    if (!startId) return result;

    const queue = [{ id: startId, depth: 0, path: [startId] }];
    const visited = new Set();

    while (queue.length > 0) {
        const current = queue.shift();
        if (visited.has(current.id)) continue;
        visited.add(current.id);
        result.set(current.id, current);
        if (current.depth >= maxDepth) continue;

        getParents(current.id).forEach(parentId => {
            if (!visited.has(parentId)) {
                queue.push({
                    id: parentId,
                    depth: current.depth + 1,
                    path: [...current.path, parentId]
                });
            }
        });
    }

    return result;
}

function findNearestBloodConnection(centerId, targetId, centerAncestorMap = buildAncestorPathMap(centerId)) {
    const targetAncestorMap = buildAncestorPathMap(targetId);
    const shared = [];

    centerAncestorMap.forEach((centerStep, ancestorId) => {
        const targetStep = targetAncestorMap.get(ancestorId);
        if (!targetStep) return;
        shared.push({
            commonAncestorId: ancestorId,
            genA: centerStep.depth,
            genB: targetStep.depth,
            centerPathToCommon: centerStep.path,
            targetPathToCommon: targetStep.path
        });
    });

    if (!shared.length) return null;

    shared.sort((a, b) => {
        const total = (a.genA + a.genB) - (b.genA + b.genB);
        if (total !== 0) return total;
        return Math.max(a.genA, a.genB) - Math.max(b.genA, b.genB);
    });

    const best = shared[0];
    const sameGenerationAncestors = shared.filter(item => (
        item.genA === best.genA && item.genB === best.genB
    ));

    return {
        ...best,
        sameGenerationAncestors,
        // V1 counts only the nearest shared ancestor pair(s), capped at two.
        // This produces standard full-sibling / first-cousin expectations
        // while avoiding over-counting repeated ancestors from pedigree collapse.
        sharedAncestorCount: Math.min(2, sameGenerationAncestors.length)
    };
}

function inferLineType(bloodConnection, relationshipType) {
    if (relationshipType === 'self') return 'directAncestor';
    if (!bloodConnection) return 'unknown';
    if (bloodConnection.genA === 0 && bloodConnection.genB === 0) return 'directAncestor';
    if (bloodConnection.genB === 0) return 'directAncestor';
    if (bloodConnection.genA === 0) return 'directDescendant';
    return 'collateral';
}

function parentSideFromPath(path) {
    const firstParentId = path?.[1];
    if (!firstParentId) return 'unknown';
    const sex = getPersonSex(firstParentId);
    if (sex === 'Male') return 'paternal';
    if (sex === 'Female') return 'maternal';
    return 'unknown';
}

function inferFamilySide(bloodConnection, lineType) {
    if (!bloodConnection) return 'unknown';
    if (lineType === 'directDescendant') return 'descendant branch';

    const sides = new Set(
        (bloodConnection.sameGenerationAncestors || [bloodConnection])
            .map(item => parentSideFromPath(item.centerPathToCommon))
            .filter(side => side && side !== 'unknown')
    );

    if (sides.size > 1) return 'both';
    return [...sides][0] || 'unknown';
}

function parentStepLabel(parentId) {
    return gendered(parentId, 'Father', 'Mother', 'Parent');
}

function childStepLabel(childId) {
    return gendered(childId, 'Son', 'Daughter', 'Child');
}

function relationshipLevelLabel(generations) {
    if (generations <= 1) return 'parent';
    if (generations === 2) return 'grandparent';
    if (generations === 3) return 'great-grandparent';
    return `${ordinal(generations - 2)}-great-grandparent`;
}

function buildPathSummary(bloodConnection, lineType) {
    if (!bloodConnection) return 'Marriage link';
    if (bloodConnection.genA === 0 && bloodConnection.genB === 0) return 'You';

    if (lineType === 'directAncestor') {
        const steps = bloodConnection.centerPathToCommon.slice(1).map(parentStepLabel);
        return steps.length ? steps.join(' \u2192 ') : 'Direct ancestor';
    }

    if (lineType === 'directDescendant') {
        const centerToTarget = bloodConnection.targetPathToCommon.slice().reverse().slice(1);
        const steps = centerToTarget.map(childStepLabel);
        return steps.length ? steps.join(' \u2192 ') : 'Direct descendant';
    }

    const plural = bloodConnection.sharedAncestorCount > 1 ? 's' : '';
    return `Shared ${relationshipLevelLabel(bloodConnection.genA)}${plural}`;
}

function computeApproxSharedPercent(bloodConnection, relationshipLabel) {
    if (!bloodConnection) return null;
    if (bloodConnection.genA === 0 && bloodConnection.genB === 0) return 100;

    if (bloodConnection.genA === 0 || bloodConnection.genB === 0) {
        return 100 / (2 ** Math.max(bloodConnection.genA, bloodConnection.genB));
    }

    if (/half-/i.test(relationshipLabel || '')) {
        return 100 / (2 ** (bloodConnection.genA + bloodConnection.genB));
    }

    // Standard expected autosomal relatedness for collateral kin:
    // nearest common ancestor contributions are additive. This is approximate:
    // recombination is uneven, distant genealogical relationships may share no
    // detectable DNA, and pedigree collapse can alter true contribution.
    return bloodConnection.sharedAncestorCount * (100 / (2 ** (bloodConnection.genA + bloodConnection.genB)));
}

function buildMarriageMetadata(centerId, targetId, relationship) {
    const isDirectSpouse = getSpouses(centerId).includes(targetId);
    return {
        personId: targetId,
        relationshipLabel: relationship?.label || (isDirectSpouse ? 'Spouse' : 'Related by marriage'),
        connectionType: 'marriage',
        lineType: 'spouseConnection',
        familySide: 'current household / marriage',
        pathSummary: isDirectSpouse ? 'Marriage link' : (relationship?.detail || 'Marriage link'),
        approxSharedPercent: 0,
        isBloodRelative: false,
        isDirectLine: false,
        kinshipType: relationship?.type || 'affinity'
    };
}

function buildUnknownMetadata(targetId) {
    return {
        personId: targetId,
        relationshipLabel: 'Relationship unknown',
        connectionType: 'unknown',
        lineType: 'unknown',
        familySide: 'unknown',
        pathSummary: 'No clear path from your linked profile',
        approxSharedPercent: null,
        isBloodRelative: false,
        isDirectLine: false,
        kinshipType: 'unknown'
    };
}

function computeRelationshipLensForPerson(centerId, targetId, centerAncestorMap) {
    const relationship = computeKinship(centerId, targetId);
    const bloodConnection = findNearestBloodConnection(centerId, targetId, centerAncestorMap);

    if (bloodConnection) {
        const relationshipLabel = refineRelationshipLabel(relationship, bloodConnection, targetId);
        const lineType = inferLineType(bloodConnection, relationship?.type);
        const approxSharedPercent = computeApproxSharedPercent(bloodConnection, relationshipLabel);
        return {
            personId: targetId,
            relationshipLabel,
            connectionType: targetId === centerId ? 'self' : 'blood',
            lineType,
            familySide: targetId === centerId ? 'both' : inferFamilySide(bloodConnection, lineType),
            pathSummary: buildPathSummary(bloodConnection, lineType),
            approxSharedPercent,
            isBloodRelative: targetId !== centerId,
            isDirectLine: lineType === 'directAncestor' || lineType === 'directDescendant',
            kinshipType: relationship?.type || 'blood',
            genA: bloodConnection.genA,
            genB: bloodConnection.genB,
            sharedAncestorCount: bloodConnection.sharedAncestorCount,
            commonAncestorId: bloodConnection.commonAncestorId
        };
    }

    if (relationship?.type === 'spouse' || relationship?.type === 'affinity') {
        return buildMarriageMetadata(centerId, targetId, relationship);
    }

    return buildUnknownMetadata(targetId);
}

export function computeRelationshipLensMap(centerPersonId, personIds = null) {
    const centerId = normalizeId(centerPersonId);
    const detailsData = getPersonDetailsData() || {};
    if (!centerId || !detailsData[centerId]) return new Map();

    const centerAncestorMap = buildAncestorPathMap(centerId);
    const ids = personIds
        ? [...new Set(personIds.map(normalizeId).filter(Boolean))]
        : Object.keys(detailsData);

    return new Map(ids.map(personId => [
        personId,
        computeRelationshipLensForPerson(centerId, personId, centerAncestorMap)
    ]));
}

export function formatApproxSharedPercent(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'Unknown';
    if (Number(value) === 0) return '0%';
    if (Number(value) === 100) return '100%';
    if (Number(value) >= 10) return `~${Number(value).toFixed(1).replace(/\.0$/, '')}%`;
    if (Number(value) >= 1) return `~${Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}%`;
    if (Number(value) >= 0.1) return `~${Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
    return '<0.1%';
}

export function formatRelationshipLensCompactCue(metadata) {
    if (!metadata) return '';
    return `${metadata.relationshipLabel} \u00b7 ${formatApproxSharedPercent(metadata.approxSharedPercent)}`;
}

export function formatConnectionType(metadata) {
    if (!metadata) return 'Unknown';
    if (metadata.connectionType === 'self') return 'Linked profile';
    if (metadata.connectionType === 'blood') {
        if (metadata.lineType === 'directAncestor') return 'Direct ancestor';
        if (metadata.lineType === 'directDescendant') return 'Direct descendant';
        return 'Blood relative';
    }
    if (metadata.connectionType === 'marriage') return 'Related by marriage';
    return 'Unknown';
}

export function getRelationshipLensBucketClass(metadata) {
    if (!metadata) return 'rl-unknown';
    if (metadata.connectionType === 'marriage') return 'rl-marriage';
    if (metadata.connectionType === 'unknown') return 'rl-unknown';

    const percent = Number(metadata.approxSharedPercent);
    if (!Number.isFinite(percent)) return 'rl-unknown';
    const bucket = RELATIONSHIP_BUCKETS.find(item => percent >= item.min);
    return bucket?.className || 'rl-distant';
}
