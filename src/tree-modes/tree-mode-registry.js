export const VIZ_MODE = {
    BLOODLINE: 'bloodline',
    HOUSEHOLD: 'household',
    EXPLORE: 'explore',
    RELATIONSHIP_LENS: 'relationshipLens'
};

const DEFAULT_LEGEND_ITEMS = [
    { swatchClass: 'swatch-root', label: 'Focus person — current tree anchor' },
    { swatchClass: 'swatch-linked', label: 'Your profile — tree centres here on open' },
    { swatchClass: 'swatch-trace', label: 'Selected route — path back to your profile' },
    { swatchClass: 'swatch-bloodline', label: 'Direct bloodline — your ancestor path' },
    { swatchClass: 'swatch-male-living', label: 'Living male' },
    { swatchClass: 'swatch-female-living', label: 'Living female' },
    { swatchClass: 'swatch-male', label: 'Male (deceased)' },
    { swatchClass: 'swatch-female', label: 'Female (deceased)' },
    { swatchClass: 'swatch-default', label: 'Unknown sex' },
    { swatchClass: 'swatch-fill-living', label: 'Green fill — living person' }
];

export const TREE_VISUALIZATION_MODES = [
    {
        id: VIZ_MODE.BLOODLINE,
        displayName: 'Bloodline',
        description: 'Direct-line ancestor emphasis with household context.',
        showBloodlineActions: true,
        legendTitle: 'Color Guide',
        legendItems: DEFAULT_LEGEND_ITEMS
    },
    {
        id: VIZ_MODE.HOUSEHOLD,
        displayName: 'Household',
        description: 'Household clustering with direct-line context.',
        showBloodlineActions: true,
        legendTitle: 'Color Guide',
        legendItems: DEFAULT_LEGEND_ITEMS
    },
    {
        id: VIZ_MODE.EXPLORE,
        displayName: 'Explore',
        description: 'Broad family graph with minimal visual interpretation.',
        showBloodlineActions: true,
        legendTitle: 'Color Guide',
        legendItems: DEFAULT_LEGEND_ITEMS
    },
    {
        id: VIZ_MODE.RELATIONSHIP_LENS,
        displayName: 'Me-centered Relationship Lens',
        description: 'Shows who each visible person is in relation to your linked profile.',
        showBloodlineActions: false,
        legendTitle: 'Relationship Lens',
        legendNote: 'Approx. shared DNA values are expected autosomal estimates. Real inheritance varies, and distant genealogical relatives may share little or no detectable DNA.',
        legendItems: [
            { swatchClass: 'swatch-rl-self', label: 'Darkest = you / closest blood relative' },
            { swatchClass: 'swatch-trace', label: 'Selected route — path back to your profile' },
            { swatchClass: 'swatch-rl-close', label: '~50% blood relative' },
            { swatchClass: 'swatch-rl-strong', label: '~25% blood relative' },
            { swatchClass: 'swatch-rl-medium', label: '~12.5% blood relative' },
            { swatchClass: 'swatch-rl-light', label: 'Light = distant blood relative' },
            { swatchClass: 'swatch-rl-marriage', label: 'Grey = related by marriage, 0% expected shared DNA' },
            { swatchClass: 'swatch-rl-unknown', label: 'Unknown = no clear path from your linked profile' }
        ]
    }
];

export const VIZ_MODE_LABELS = Object.fromEntries(
    TREE_VISUALIZATION_MODES.map(mode => [mode.id, mode.displayName])
);

export function getVisualizationMode(modeId) {
    return TREE_VISUALIZATION_MODES.find(mode => mode.id === modeId) || TREE_VISUALIZATION_MODES[0];
}
