/**
 * GlamMate AI Outfit Generator
 * Combines CLIP embeddings + color theory + fashion rules
 * to create complete outfits from user's closet
 */

const axios = require('axios');
const { checkOutfitColorHarmony, areColorsCompatible } = require('./colorMatcher');

// ============================================================
// CATEGORY COMPATIBILITY RULES
// ============================================================

// Which categories can be combined in a single outfit
const categoryRules = {
    // Core pieces (required)
    core: {
        'top': { compatibleWith: ['bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory'], required: false },
        'bottom': { compatibleWith: ['top', 'outerwear', 'shoes', 'bag', 'accessory'], required: false },
        'dress': { compatibleWith: ['outerwear', 'shoes', 'bag', 'accessory'], required: false, standsAlone: true }
    },
    
    // Supporting pieces
    supporting: {
        'outerwear': { compatibleWith: ['top', 'bottom', 'dress', 'shoes', 'bag', 'accessory'], optional: true },
        'shoes': { compatibleWith: ['top', 'bottom', 'dress', 'outerwear', 'bag', 'accessory'], required: true },
        'bag': { compatibleWith: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory'], optional: true },
        'accessory': { compatibleWith: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag'], optional: true }
    }
};

// Style consistency (don't mix formal with gym)
const styleCompatibility = {
    'formal': ['elegant', 'sophisticated', 'professional', 'business', 'classic'],
    'casual': ['relaxed', 'comfortable', 'everyday', 'streetwear', 'bohemian'],
    'sporty': ['athletic', 'gym', 'active', 'workout', 'sportswear'],
    'party': ['glamorous', 'trendy', 'festive', 'cocktail', 'nightlife'],
    'bohemian': ['casual', 'relaxed', 'artistic', 'eclectic']
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = unrelated, -1 = opposite)
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Generate text embedding for user's prompt
 */
async function getPromptEmbedding(promptText) {
    try {
        const response = await axios.post('http://localhost:5000/text-embedding', {
            text: promptText
        }, {
            timeout: 15000
        });
        
        if (response.data.success) {
            return response.data.embedding;
        }
    } catch (error) {
        console.warn('⚠️ Failed to generate prompt embedding:', error.message);
    }
    return null;
}

/**
 * Check if two items' styles are compatible
 */
function areStylesCompatible(item1, item2) {
    // If either has no style tags, assume compatible
    if (!item1.style?.length || !item2.style?.length) return true;
    
    const styles1 = item1.style.map(s => s.toLowerCase());
    const styles2 = item2.style.map(s => s.toLowerCase());
    
    // Check if they share any style tags
    const sharedStyles = styles1.filter(s => styles2.includes(s));
    if (sharedStyles.length > 0) return true;
    
    // Check if they're in compatible style groups
    for (const [group, compatibleStyles] of Object.entries(styleCompatibility)) {
        const item1InGroup = styles1.some(s => compatibleStyles.includes(s));
        const item2InGroup = styles2.some(s => compatibleStyles.includes(s));
        if (item1InGroup && item2InGroup) return true;
    }
    
    // Default: allow combination (fashion is subjective)
    return true;
}

/**
 * Check if two items' occasions match
 */
function areOccasionsCompatible(item1, item2) {
    // If either has no occasion tags, assume compatible
    if (!item1.occasion?.length || !item2.occasion?.length) return true;
    
    const occasions1 = item1.occasion.map(o => o.toLowerCase());
    const occasions2 = item2.occasion.map(o => o.toLowerCase());
    
    // Check for shared occasions
    const shared = occasions1.filter(o => occasions2.includes(o));
    return shared.length > 0;
}

/**
 * Score an item's relevance to the user's prompt
 */
function scoreItemRelevance(item, promptEmbedding, promptText) {
    let score = 0;
    const weights = {
        embedding: 0.5,    // 50% - AI semantic similarity
        occasion: 0.25,    // 25% - Occasion match
        aiTags: 0.15,      // 15% - AI detected attributes
        textMatch: 0.10    // 10% - Simple text matching
    };
    
    // 1. CLIP embedding similarity (most important)
    if (item.embedding && promptEmbedding) {
        const similarity = cosineSimilarity(item.embedding, promptEmbedding);
        score += Math.max(0, similarity) * weights.embedding;
    }
    
    // 2. Occasion matching
    if (item.occasion && item.occasion.length > 0) {
        const promptLower = promptText.toLowerCase();
        const occasionMatch = item.occasion.some(occ => 
            promptLower.includes(occ.toLowerCase())
        );
        if (occasionMatch) score += weights.occasion;
    }
    
    // 3. AI tags matching
    if (item.aiTags && item.aiTags.length > 0) {
        const promptLower = promptText.toLowerCase();
        const tagMatch = item.aiTags.some(tag => 
            promptLower.includes(tag.toLowerCase())
        );
        if (tagMatch) score += weights.aiTags;
    }
    
    // 4. Simple text matching (name, notes)
    const promptLower = promptText.toLowerCase();
    const itemText = `${item.name} ${item.notes || ''}`.toLowerCase();
    const words = promptText.split(' ').filter(w => w.length > 3);
    const matchCount = words.filter(word => itemText.includes(word)).length;
    if (matchCount > 0) {
        score += (matchCount / words.length) * weights.textMatch;
    }
    
    return score;
}

/**
 * Validate if an outfit combination is valid
 */
function isValidOutfitCombination(items) {
    // Must have at least 2 items
    if (items.length < 2) return false;
    
    const categories = items.map(item => item.category);
    
    // Check 1: Must have either (top + bottom) OR dress/outerwear (standalone)
    const hasTop = categories.includes('top');
    const hasBottom = categories.includes('bottom');
    const hasDress = categories.includes('dress');
    const hasOuterwear = categories.includes('outerwear');
    
    // STRICT RULE: If item is dress or traditional outfit (lehenga, saree, etc.)
    // it should NEVER be combined with regular top or bottom
    if (hasDress && (hasTop || hasBottom)) {
        return false; // Dress can't mix with top/bottom
    }
    
    // Check if outerwear is actually a complete outfit (lehenga, kurta set, etc.)
    // by checking if it has "dress-like" keywords in name or tags
    const outerwearItems = items.filter(i => i.category === 'outerwear');
    if (outerwearItems.length > 0) {
        const dressLikeKeywords = ['lehenga', 'saree', 'gown', 'kurta set', 'kurti set', 'jumpsuit', 'romper'];
        
        for (const item of outerwearItems) {
            const itemText = `${item.name} ${item.notes || ''}`.toLowerCase();
            const isDressLike = dressLikeKeywords.some(keyword => itemText.includes(keyword));
            
            if (isDressLike && (hasTop || hasBottom)) {
                return false; // Traditional outfits can't mix with top/bottom
            }
        }
    }
    
    // Check 2: Must have core clothing
    if (!hasDress && !hasOuterwear && !(hasTop || hasBottom)) {
        return false; // Need at least some core clothing
    }
    
    // Check 3: Top + Bottom combinations need at least one of them
    if (hasTop && !hasBottom && !hasDress && !hasOuterwear) {
        return false; // Top alone isn't a complete outfit
    }
    if (hasBottom && !hasTop && !hasDress && !hasOuterwear) {
        return false; // Bottom alone isn't a complete outfit
    }
    
    return true;
}


/**
 * Score a complete outfit combination
 */
function scoreOutfit(items, promptEmbedding, promptText) {
    const scores = {
        items: [],
        colorHarmony: 0,
        styleConsistency: 0,
        occasionMatch: 0,
        varietyBonus: 0,
        total: 0
    };
    
    // 1. Individual item relevance scores
    items.forEach(item => {
        const relevance = scoreItemRelevance(item, promptEmbedding, promptText);
        scores.items.push({ item: item.name, score: relevance });
    });
    const avgItemScore = scores.items.reduce((sum, s) => sum + s.score, 0) / items.length;
    
    // 2. Color harmony (20% weight)
    const colorResult = checkOutfitColorHarmony(items);
    scores.colorHarmony = colorResult.score * 0.2;
    
    // 3. Style consistency (15% weight)
    let styleScore = 1.0;
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (!areStylesCompatible(items[i], items[j])) {
                styleScore -= 0.2;
            }
        }
    }
    scores.styleConsistency = Math.max(0, styleScore) * 0.15;
    
    // 4. Occasion matching (10% weight)
    let occasionScore = 1.0;
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            if (!areOccasionsCompatible(items[i], items[j])) {
                occasionScore -= 0.15;
            }
        }
    }
    scores.occasionMatch = Math.max(0, occasionScore) * 0.1;
    
    // 5. Variety bonus (5% weight)
    const categories = new Set(items.map(item => item.category));
    const varietyRatio = categories.size / items.length;
    scores.varietyBonus = varietyRatio * 0.05;
    
    // 6. Total score (Item relevance 50% + others 50%)
    scores.total = (avgItemScore * 0.5) + 
                   scores.colorHarmony + 
                   scores.styleConsistency + 
                   scores.occasionMatch + 
                   scores.varietyBonus;
    
    return scores;
}

// ============================================================
// MAIN OUTFIT GENERATION FUNCTION
// ============================================================

/**
 * Generate outfit suggestions from user's closet based on prompt
 * 
 * @param {string} userId - User's MongoDB ID
 * @param {string} promptText - User's text prompt (e.g., "casual brunch with friends")
 * @param {Object} options - Configuration options
 * @returns {Array} Array of outfit suggestions with scores
 */
async function generateOutfits(userId, promptText, options = {}) {
    const {
        maxOutfits = 5,           // Return top 5 outfits
        minItems = 2,             // Min items per outfit
        maxItems = 6,             // Max items per outfit
        includeScores = false     // Include detailed scoring
    } = options;
    
    console.log(`\n🎨 Generating outfits for prompt: "${promptText}"`);
    
    try {
        // Step 1: Get user's closet items
        const ClosetItem = require('../models/ClosetItem');
        const allItems = await ClosetItem.find({ userId }).lean();
        
        if (allItems.length === 0) {
            return { 
                success: false, 
                error: 'Your closet is empty. Please add some items first!' 
            };
        }
        
        console.log(`📦 Found ${allItems.length} items in closet`);
        
        // Step 2: Generate embedding for user's prompt
        const promptEmbedding = await getPromptEmbedding(promptText);
        
        if (!promptEmbedding) {
            console.warn('⚠️ Could not generate prompt embedding, using text matching only');
        }
        
        // Step 3: Score and rank all items by relevance
        const scoredItems = allItems.map(item => ({
            ...item,
            relevanceScore: scoreItemRelevance(item, promptEmbedding, promptText)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        console.log(`🎯 Top 3 relevant items:`);
        scoredItems.slice(0, 3).forEach(item => {
            console.log(`   • ${item.name} (${item.category}): ${(item.relevanceScore * 100).toFixed(0)}%`);
        });
        
        // Step 4: Group items by category
        const itemsByCategory = {
            top: scoredItems.filter(i => i.category === 'top'),
            bottom: scoredItems.filter(i => i.category === 'bottom'),
            dress: scoredItems.filter(i => i.category === 'dress'),
            outerwear: scoredItems.filter(i => i.category === 'outerwear'),
            shoes: scoredItems.filter(i => i.category === 'shoes'),
            bag: scoredItems.filter(i => i.category === 'bag'),
            accessory: scoredItems.filter(i => i.category === 'accessory')
        };
        
        // Step 5: Generate outfit combinations
        const outfitCombinations = [];
        
        // Strategy 1: Top + Bottom combinations
        const topCount = Math.min(3, itemsByCategory.top.length);
        const bottomCount = Math.min(3, itemsByCategory.bottom.length);
        
        for (let t = 0; t < topCount; t++) {
            for (let b = 0; b < bottomCount; b++) {
                const outfit = [
                    itemsByCategory.top[t],
                    itemsByCategory.bottom[b]
                ];
                
                // Add shoes if available
                if (itemsByCategory.shoes.length > 0) {
                    outfit.push(itemsByCategory.shoes[0]);
                }
                
                // Add outerwear if available and relevant
                if (itemsByCategory.outerwear.length > 0 && 
                    itemsByCategory.outerwear[0].relevanceScore > 0.3) {
                    outfit.push(itemsByCategory.outerwear[0]);
                }
                
                // Add bag if available
                if (itemsByCategory.bag.length > 0) {
                    outfit.push(itemsByCategory.bag[0]);
                }
                
                if (isValidOutfitCombination(outfit)) {
                    outfitCombinations.push(outfit);
                }
            }
        }
        
        // Strategy 2: Dress-based outfits
        const dressCount = Math.min(2, itemsByCategory.dress.length);
        for (let d = 0; d < dressCount; d++) {
            const outfit = [itemsByCategory.dress[d]];
            
            // Add shoes
            if (itemsByCategory.shoes.length > 0) {
                outfit.push(itemsByCategory.shoes[0]);
            }
            
            // Add outerwear if relevant
            if (itemsByCategory.outerwear.length > 0 && 
                itemsByCategory.outerwear[0].relevanceScore > 0.3) {
                outfit.push(itemsByCategory.outerwear[0]);
            }
            
            // Add accessories
            if (itemsByCategory.bag.length > 0) {
                outfit.push(itemsByCategory.bag[0]);
            }
            if (itemsByCategory.accessory.length > 0) {
                outfit.push(itemsByCategory.accessory[0]);
            }
            
            if (isValidOutfitCombination(outfit)) {
                outfitCombinations.push(outfit);
            }
        }
        
        console.log(`🔄 Generated ${outfitCombinations.length} outfit combinations`);
        
        // Step 6: Score all outfits
        const scoredOutfits = outfitCombinations.map(items => {
            const scores = scoreOutfit(items, promptEmbedding, promptText);
            return {
                items: items.map(item => ({
                    _id: item._id,
                    name: item.name,
                    category: item.category,
                    imagePath: item.imagePath,
                    colors: item.colors,
                    occasion: item.occasion,
                    style: item.style
                })),
                score: scores.total,
                details: includeScores ? scores : undefined
            };
        }).sort((a, b) => b.score - a.score);
        
        // Step 7: Return top outfits
        const topOutfits = scoredOutfits.slice(0, maxOutfits);
        
        console.log(`✅ Returning top ${topOutfits.length} outfits\n`);
        
        return {
            success: true,
            outfits: topOutfits,
            totalGenerated: outfitCombinations.length,
            prompt: promptText
        };
        
    } catch (error) {
        console.error('❌ Outfit generation error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    generateOutfits,
    
    // Utility exports (for testing)
    cosineSimilarity,
    scoreItemRelevance,
    scoreOutfit,
    isValidOutfitCombination,
    areStylesCompatible,
    areOccasionsCompatible
};
