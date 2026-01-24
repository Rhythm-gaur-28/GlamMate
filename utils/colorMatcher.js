/**
 * GlamMate Fashion Color Harmony Engine
 * Production-grade color matching based on fashion theory
 * Handles 100+ color variations and edge cases
 */

// ============================================================
// COMPREHENSIVE COLOR FAMILIES
// ============================================================

const colorFamilies = {
    // Neutrals (go with EVERYTHING)
    neutrals: [
        'black', 'white', 'gray', 'grey', 'charcoal', 'slate',
        'beige', 'cream', 'ivory', 'nude', 'tan', 'taupe',
        'brown', 'khaki', 'camel', 'sand', 'ecru', 'champagne',
        'off-white', 'eggshell', 'bone', 'vanilla'
    ],
    
    // Warm colors (energetic, bold)
    warm: [
        'red', 'crimson', 'scarlet', 'burgundy', 'maroon', 'wine',
        'orange', 'coral', 'peach', 'salmon', 'apricot', 'tangerine',
        'yellow', 'gold', 'mustard', 'amber', 'honey', 'saffron',
        'rust', 'terracotta', 'brick', 'cinnamon', 'copper'
    ],
    
    // Cool colors (calm, sophisticated)
    cool: [
        'blue', 'navy', 'royal blue', 'cobalt', 'sapphire', 'cerulean',
        'teal', 'turquoise', 'aqua', 'cyan', 'sky blue', 'steel blue',
        'green', 'emerald', 'jade', 'forest green', 'sage', 'mint',
        'purple', 'violet', 'indigo', 'plum', 'mauve', 'lavender',
        'lilac', 'periwinkle', 'amethyst'
    ],
    
    // Earth tones (natural, versatile)
    earth: [
        'brown', 'chocolate', 'coffee', 'espresso', 'mocha',
        'tan', 'camel', 'sand', 'khaki', 'olive', 'moss',
        'terracotta', 'clay', 'rust', 'burnt orange', 'sienna',
        'beige', 'taupe', 'mushroom', 'stone'
    ],
    
    // Pastels (soft, romantic)
    pastels: [
        'pink', 'blush', 'rose', 'baby pink', 'powder pink',
        'lavender', 'lilac', 'periwinkle', 'baby blue', 'powder blue',
        'mint', 'seafoam', 'pistachio', 'peach', 'apricot',
        'lemon', 'butter', 'cream', 'ivory'
    ],
    
    // Jewel tones (rich, luxurious)
    jewel: [
        'emerald', 'ruby', 'sapphire', 'amethyst', 'topaz',
        'garnet', 'onyx', 'pearl', 'jade', 'turquoise',
        'burgundy', 'wine', 'royal blue', 'deep purple'
    ],
    
    // Metallics (statement, accent)
    metallics: [
        'gold', 'silver', 'bronze', 'copper', 'rose gold',
        'platinum', 'metallic', 'chrome', 'pewter'
    ],
    
    // Neons/Brights (bold statements)
    neon: [
        'neon', 'fluorescent', 'hot pink', 'electric blue',
        'lime', 'bright yellow', 'neon green', 'highlighter'
    ]
};

// ============================================================
// COLOR VARIATIONS & NORMALIZATION
// ============================================================

const colorVariations = {
    // Grays
    'grey': 'gray',
    'charcoal': 'gray',
    'slate': 'gray',
    'ash': 'gray',
    'silver': 'gray',
    
    // Browns
    'chocolate': 'brown',
    'coffee': 'brown',
    'espresso': 'brown',
    'mocha': 'brown',
    'caramel': 'brown',
    
    // Beiges
    'sand': 'beige',
    'ecru': 'beige',
    'champagne': 'beige',
    'mushroom': 'beige',
    'stone': 'beige',
    
    // Blues
    'navy': 'blue',
    'royal blue': 'blue',
    'cobalt': 'blue',
    'sapphire': 'blue',
    'cerulean': 'blue',
    'sky blue': 'blue',
    'baby blue': 'blue',
    'powder blue': 'blue',
    'steel blue': 'blue',
    'denim': 'blue',
    'indigo': 'blue',
    
    // Greens
    'emerald': 'green',
    'jade': 'green',
    'forest green': 'green',
    'olive': 'green',
    'moss': 'green',
    'mint': 'green',
    'seafoam': 'green',
    'lime': 'green',
    'pistachio': 'green',
    'sage': 'green',
    
    // Reds
    'crimson': 'red',
    'scarlet': 'red',
    'burgundy': 'red',
    'maroon': 'red',
    'wine': 'red',
    'ruby': 'red',
    'brick': 'red',
    
    // Pinks
    'rose': 'pink',
    'blush': 'pink',
    'hot pink': 'pink',
    'baby pink': 'pink',
    'powder pink': 'pink',
    'salmon': 'pink',
    'coral': 'pink',
    'fuchsia': 'pink',
    'magenta': 'pink',
    
    // Purples
    'violet': 'purple',
    'plum': 'purple',
    'mauve': 'purple',
    'lavender': 'purple',
    'lilac': 'purple',
    'periwinkle': 'purple',
    'amethyst': 'purple',
    
    // Yellows
    'mustard': 'yellow',
    'gold': 'yellow',
    'amber': 'yellow',
    'honey': 'yellow',
    'lemon': 'yellow',
    'butter': 'yellow',
    'saffron': 'yellow',
    
    // Oranges
    'peach': 'orange',
    'coral': 'orange',
    'apricot': 'orange',
    'tangerine': 'orange',
    'rust': 'orange',
    'terracotta': 'orange',
    'burnt orange': 'orange',
    
    // Teals/Turquoise
    'teal': 'teal',
    'turquoise': 'teal',
    'aqua': 'teal',
    'cyan': 'teal',
    
    // Multi-color patterns
    'multi': 'multicolor',
    'multicolored': 'multicolor',
    'multi-color': 'multicolor',
    'rainbow': 'multicolor',
    'print': 'multicolor',
    'floral': 'multicolor',
    'pattern': 'multicolor'
};

// ============================================================
// COMPLEMENTARY COLOR PAIRS (Opposite on color wheel)
// High contrast but fashionable
// ============================================================

const complementaryPairs = {
    'red': ['green', 'teal', 'mint', 'emerald', 'sage'],
    'blue': ['orange', 'coral', 'peach', 'rust', 'terracotta'],
    'yellow': ['purple', 'lavender', 'violet', 'plum', 'mauve'],
    'green': ['red', 'pink', 'burgundy', 'wine', 'coral'],
    'purple': ['yellow', 'gold', 'mustard', 'amber', 'lemon'],
    'orange': ['blue', 'navy', 'teal', 'turquoise', 'cobalt'],
    'pink': ['green', 'mint', 'sage', 'olive', 'emerald'],
    'teal': ['coral', 'peach', 'rust', 'orange', 'terracotta']
};

// ============================================================
// ANALOGOUS GROUPS (Adjacent on color wheel)
// Harmonious combinations
// ============================================================

const analogousGroups = [
    ['red', 'orange', 'yellow', 'coral', 'peach'],
    ['yellow', 'green', 'lime', 'chartreuse'],
    ['green', 'blue', 'teal', 'turquoise', 'cyan'],
    ['blue', 'purple', 'indigo', 'violet'],
    ['purple', 'red', 'pink', 'magenta', 'burgundy'],
    ['orange', 'red', 'rust', 'terracotta', 'brick'],
    ['blue', 'teal', 'green', 'mint', 'aqua']
];

// ============================================================
// MONOCHROMATIC VARIATIONS (Same color, different shades)
// ============================================================

const monochromaticGroups = {
    'blue': ['navy', 'royal blue', 'cobalt', 'sky blue', 'baby blue', 'powder blue'],
    'pink': ['hot pink', 'rose', 'blush', 'baby pink', 'coral'],
    'green': ['emerald', 'jade', 'forest green', 'mint', 'sage', 'olive'],
    'purple': ['violet', 'plum', 'lavender', 'lilac', 'mauve'],
    'brown': ['chocolate', 'coffee', 'tan', 'camel', 'beige'],
    'gray': ['charcoal', 'slate', 'silver', 'ash']
};

// ============================================================
// CLASHING COMBINATIONS (Generally avoid)
// ============================================================

const clashingPairs = [
    ['red', 'pink'],           // Too similar, clash
    ['orange', 'pink'],        // Warm clash
    ['purple', 'pink'],        // Unless intentional
    ['brown', 'black'],        // Traditional fashion no-no
    ['navy', 'black'],         // Too dark together (modern fashion accepts this)
    ['red', 'purple'],         // Clash unless done carefully
    ['green', 'blue']          // Can work but tricky (teal is the bridge)
];

// ============================================================
// SEASONAL COLOR GUIDELINES
// ============================================================

const seasonalColors = {
    'summer': ['white', 'cream', 'yellow', 'orange', 'coral', 'turquoise', 'mint', 'pink'],
    'winter': ['black', 'gray', 'navy', 'burgundy', 'forest green', 'purple', 'brown'],
    'spring': ['pastel', 'pink', 'lavender', 'mint', 'yellow', 'white', 'light blue'],
    'fall': ['brown', 'rust', 'orange', 'burgundy', 'olive', 'mustard', 'camel', 'tan']
};

// ============================================================
// FUNCTIONS
// ============================================================

/**
 * Normalize color name to base color
 */
function normalizeColor(color) {
    if (!color) return '';
    let normalized = color.toLowerCase().trim();
    
    // Remove common prefixes
    normalized = normalized
        .replace(/^light /i, '')
        .replace(/^dark /i, '')
        .replace(/^bright /i, '')
        .replace(/^deep /i, '')
        .replace(/^pale /i, '');
    
    return colorVariations[normalized] || normalized;
}

/**
 * Get all color families a color belongs to
 */
function getColorFamilies(color) {
    const normalized = normalizeColor(color);
    const families = [];
    
    for (const [family, colors] of Object.entries(colorFamilies)) {
        if (colors.some(c => normalizeColor(c) === normalized || c === color.toLowerCase())) {
            families.push(family);
        }
    }
    
    return families.length > 0 ? families : ['other'];
}

/**
 * Check if color is neutral (works with everything)
 */
function isNeutral(color) {
    const families = getColorFamilies(color);
    return families.includes('neutrals') || families.includes('metallics');
}

/**
 * Check if two colors are complementary
 */
function areComplementary(color1, color2) {
    const c1 = normalizeColor(color1);
    const c2 = normalizeColor(color2);
    
    if (complementaryPairs[c1] && complementaryPairs[c1].some(c => normalizeColor(c) === c2)) {
        return true;
    }
    if (complementaryPairs[c2] && complementaryPairs[c2].some(c => normalizeColor(c) === c1)) {
        return true;
    }
    
    return false;
}

/**
 * Check if two colors are analogous
 */
function areAnalogous(color1, color2) {
    const c1 = normalizeColor(color1);
    const c2 = normalizeColor(color2);
    
    for (const group of analogousGroups) {
        const normalizedGroup = group.map(c => normalizeColor(c));
        if (normalizedGroup.includes(c1) && normalizedGroup.includes(c2)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if colors are monochromatic (same hue, different shades)
 */
function areMonochromatic(color1, color2) {
    const c1 = normalizeColor(color1);
    const c2 = normalizeColor(color2);
    
    if (c1 === c2) return true;
    
    for (const [base, variations] of Object.entries(monochromaticGroups)) {
        const normalizedVars = variations.map(v => normalizeColor(v));
        if (normalizedVars.includes(c1) && normalizedVars.includes(c2)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if two colors clash
 */
function doColorsClash(color1, color2) {
    const c1 = normalizeColor(color1);
    const c2 = normalizeColor(color2);
    
    for (const [clr1, clr2] of clashingPairs) {
        const nc1 = normalizeColor(clr1);
        const nc2 = normalizeColor(clr2);
        
        if ((c1 === nc1 && c2 === nc2) || (c1 === nc2 && c2 === nc1)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Check if colors share same family
 */
function shareSameFamily(color1, color2) {
    const families1 = getColorFamilies(color1);
    const families2 = getColorFamilies(color2);
    
    return families1.some(f => families2.includes(f));
}

/**
 * MAIN FUNCTION: Check if two colors are compatible
 * Returns: { compatible: boolean, reason: string, score: number, confidence: string }
 */
function areColorsCompatible(color1, color2) {
    if (!color1 || !color2) {
        return { compatible: true, reason: 'Missing color data', score: 0.7, confidence: 'medium' };
    }
    
    const c1 = normalizeColor(color1);
    const c2 = normalizeColor(color2);
    
    // Identical colors
    if (c1 === c2) {
        return {
            compatible: true,
            reason: 'Same color (monochromatic)',
            score: 1.0,
            confidence: 'very high'
        };
    }
    
    // Multicolor/print items (accept with anything)
    if (c1 === 'multicolor' || c2 === 'multicolor') {
        return {
            compatible: true,
            reason: 'Multicolor/print item (versatile)',
            score: 0.85,
            confidence: 'high'
        };
    }
    
    // Check for clashing FIRST (veto rule)
    if (doColorsClash(c1, c2)) {
        return {
            compatible: false,
            reason: 'Colors tend to clash in fashion',
            score: 0.25,
            confidence: 'low'
        };
    }
    
    // Neutrals work with EVERYTHING (highest priority)
    if (isNeutral(c1) || isNeutral(c2)) {
        return {
            compatible: true,
            reason: 'Neutral base color (universal match)',
            score: 0.98,
            confidence: 'very high'
        };
    }
    
    // Monochromatic (same color family, different shades)
    if (areMonochromatic(c1, c2)) {
        return {
            compatible: true,
            reason: 'Monochromatic (same hue, different shades)',
            score: 0.95,
            confidence: 'very high'
        };
    }
    
    // Complementary colors (bold but fashionable)
    if (areComplementary(c1, c2)) {
        return {
            compatible: true,
            reason: 'Complementary colors (bold contrast)',
            score: 0.88,
            confidence: 'high'
        };
    }
    
    // Analogous colors (harmonious)
    if (areAnalogous(c1, c2)) {
        return {
            compatible: true,
            reason: 'Analogous colors (harmonious blend)',
            score: 0.92,
            confidence: 'very high'
        };
    }
    
    // Same color family
    if (shareSameFamily(c1, c2)) {
        const families = getColorFamilies(c1);
        return {
            compatible: true,
            reason: `Same family (${families[0]} tones)`,
            score: 0.82,
            confidence: 'high'
        };
    }
    
    // Earth tones together (always work)
    const families1 = getColorFamilies(c1);
    const families2 = getColorFamilies(c2);
    
    if (families1.includes('earth') && families2.includes('earth')) {
        return {
            compatible: true,
            reason: 'Earth tones (natural harmony)',
            score: 0.90,
            confidence: 'very high'
        };
    }
    
    // Pastels together
    if (families1.includes('pastels') && families2.includes('pastels')) {
        return {
            compatible: true,
            reason: 'Pastel harmony (soft blend)',
            score: 0.87,
            confidence: 'high'
        };
    }
    
    // Jewel tones together
    if (families1.includes('jewel') && families2.includes('jewel')) {
        return {
            compatible: true,
            reason: 'Jewel tones (rich luxury)',
            score: 0.85,
            confidence: 'high'
        };
    }
    
    // Warm + Cool clash (unless bridged by neutral)
    if (families1.includes('warm') && families2.includes('cool')) {
        return {
            compatible: false,
            reason: 'Warm and cool clash (needs neutral bridge)',
            score: 0.35,
            confidence: 'low'
        };
    }
    
    if (families1.includes('cool') && families2.includes('warm')) {
        return {
            compatible: false,
            reason: 'Cool and warm clash (needs neutral bridge)',
            score: 0.35,
            confidence: 'low'
        };
    }
    
    // Default: neutral territory (might work)
    return {
        compatible: true,
        reason: 'Unconventional but possible (fashion is subjective)',
        score: 0.55,
        confidence: 'medium'
    };
}

/**
 * Check complete outfit color harmony
 * Takes array of items (each with colors array)
 */
function checkOutfitColorHarmony(items) {
    if (!items || items.length === 0) {
        return { 
            compatible: true, 
            score: 1.0, 
            issues: [], 
            strengths: [],
            overallConfidence: 'high' 
        };
    }
    
    // Collect all colors from all items
    const allColors = [];
    items.forEach(item => {
        if (item.colors && Array.isArray(item.colors)) {
            item.colors.forEach(color => {
                if (color && color.trim()) {
                    allColors.push(color.toLowerCase().trim());
                }
            });
        }
    });
    
    if (allColors.length < 2) {
        return { 
            compatible: true, 
            score: 1.0, 
            issues: [], 
            strengths: ['Single color outfit (always safe)'],
            overallConfidence: 'very high'
        };
    }
    
    // Check all color pairs
    const scores = [];
    const issues = [];
    const strengths = [];
    const checkedPairs = new Set();
    
    for (let i = 0; i < allColors.length; i++) {
        for (let j = i + 1; j < allColors.length; j++) {
            const pair = [allColors[i], allColors[j]].sort().join('-');
            if (checkedPairs.has(pair)) continue;
            checkedPairs.add(pair);
            
            const result = areColorsCompatible(allColors[i], allColors[j]);
            scores.push(result.score);
            
            if (!result.compatible || result.score < 0.6) {
                issues.push(`${allColors[i]} + ${allColors[j]}: ${result.reason}`);
            } else if (result.score >= 0.9) {
                strengths.push(`${allColors[i]} + ${allColors[j]}: ${result.reason}`);
            }
        }
    }
    
    // Calculate overall score
    const avgScore = scores.length > 0 
        ? scores.reduce((sum, s) => sum + s, 0) / scores.length 
        : 1.0;
    
    // Determine confidence
    let confidence = 'low';
    if (avgScore >= 0.9) confidence = 'very high';
    else if (avgScore >= 0.8) confidence = 'high';
    else if (avgScore >= 0.65) confidence = 'medium';
    
    return {
        compatible: avgScore >= 0.6,  // 60% threshold
        score: parseFloat(avgScore.toFixed(2)),
        issues: issues,
        strengths: strengths,
        totalPairs: scores.length,
        overallConfidence: confidence,
        colorCount: allColors.length
    };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    // Main functions
    areColorsCompatible,
    checkOutfitColorHarmony,
    
    // Utility functions
    normalizeColor,
    isNeutral,
    areComplementary,
    areAnalogous,
    areMonochromatic,
    doColorsClash,
    getColorFamilies,
    shareSameFamily,
    
    // Constants (for debugging/testing)
    colorFamilies,
    complementaryPairs,
    analogousGroups,
    clashingPairs
};
