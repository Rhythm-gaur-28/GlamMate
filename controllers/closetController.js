const ClosetItem = require('../models/ClosetItem');
const fs = require('fs').promises;
const fsSync = require('fs'); // For synchronous read during upload
const path = require('path');
const axios = require('axios');

// Helper to get current user (reuse your pattern)
async function getCurrentUser(req) {
    if (req.user) return req.user;
    if (req.session && req.session.userId) {
        const User = require('../models/User');
        return await User.findById(req.session.userId);
    }
    return null;
}

const closetController = {
    // Render closet page
    async getCloset(req, res) {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                req.session.message = { type: 'error', text: 'Login required' };
                return res.redirect('/auth');
            }

            res.render('closet', {
                title: 'My Closet - GlamMate',
                user: user
            });
        } catch (error) {
            console.error('Closet page error:', error);
            res.status(500).send('Server error');
        }
    },

    // Create new closet item WITH AI EMBEDDING (IMPROVED MERGING)
async createItem(req, res) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ ok: false, message: 'Login required' });
        }

        const { name, category, colors, occasion, season, style, brand, price, notes } = req.body;
        
        // Validation
        if (!req.file) {
            return res.status(400).json({ ok: false, message: 'Image is required' });
        }
        if (!name || !category) {
            return res.status(400).json({ ok: false, message: 'Name and category are required' });
        }

        // Parse user's manual input
        const userColors = colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim().toLowerCase()).filter(Boolean)) : [];
        const userOccasions = occasion ? (Array.isArray(occasion) ? occasion : occasion.split(',').map(o => o.trim().toLowerCase()).filter(Boolean)) : [];
        const userStyles = style ? (Array.isArray(style) ? style : style.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)) : [];

        // ============================================================
        // AI PROCESSING: Generate embedding and auto-tags
        // ============================================================
        let embedding = [];
        let aiTags = [];
        let aiColors = [];
        let aiOccasions = [];
        let aiStyles = [];
        
        try {
            // Read uploaded image and convert to base64
            const imageFullPath = path.join(__dirname, '..', 'public', 'uploads', 'closet', req.file.filename);
            const imageBuffer = fsSync.readFileSync(imageFullPath);
            const base64Image = imageBuffer.toString('base64');

            console.log('🤖 Generating AI embedding for:', name);

            // Step 1: Get AI-detected attributes
            try {
                const attributesResponse = await axios.post('http://localhost:5000/classify-attributes', {
                    image: `data:image/jpeg;base64,${base64Image}`
                }, {
                    timeout: 30000
                });

                if (attributesResponse.data.success) {
                    const attributes = attributesResponse.data.attributes;
                    
                    // Extract AI-detected attributes by type
                    aiColors = (attributes.colors || []).map(c => c.toLowerCase());
                    aiOccasions = (attributes.occasions || []).map(o => o.toLowerCase());
                    
                    // Extract style from AI
                    if (attributes.style) {
                        aiStyles.push(attributes.style.toLowerCase());
                    }
                    if (attributes.formality) {
                        aiStyles.push(attributes.formality.toLowerCase());
                    }

                    // Store all AI tags for reference
                    aiTags = [
                        ...aiOccasions,
                        ...aiColors,
                        ...aiStyles
                    ].filter(Boolean);

                    console.log('✅ AI detected - Colors:', aiColors, '| Occasions:', aiOccasions, '| Styles:', aiStyles);
                }
            } catch (attrError) {
                console.warn('⚠️ AI attribute detection failed:', attrError.message);
            }

            // Step 2: Generate CLIP embedding vector
            try {
                const embeddingResponse = await axios.post('http://localhost:5000/generate-embedding', {
                    image: `data:image/jpeg;base64,${base64Image}`
                }, {
                    timeout: 30000
                });

                if (embeddingResponse.data.success) {
                    embedding = embeddingResponse.data.embedding;
                    console.log('✅ Embedding generated:', embedding.length, 'dimensions');
                }
            } catch (embedError) {
                console.warn('⚠️ Embedding generation failed:', embedError.message);
            }

        } catch (aiError) {
            console.warn('⚠️ AI processing failed (continuing without it):', aiError.message);
        }
        // ============================================================

        // ============================================================
        // SMART MERGING: Combine user input + AI detection
        // Remove duplicates and keep unique values
        // ============================================================
        const mergeUnique = (userArray, aiArray) => {
            const combined = [...userArray, ...aiArray];
            return [...new Set(combined)]; // Remove duplicates
        };

        const finalColors = mergeUnique(userColors, aiColors);
        const finalOccasions = mergeUnique(userOccasions, aiOccasions);
        const finalStyles = mergeUnique(userStyles, aiStyles);

        console.log('📦 Final merged data:');
        console.log('   Colors:', finalColors);
        console.log('   Occasions:', finalOccasions);
        console.log('   Styles:', finalStyles);
        // ============================================================

        // Create closet item with merged data
        const item = new ClosetItem({
            userId: user._id,
            name,
            imagePath: `/uploads/closet/${req.file.filename}`,
            category,
            colors: finalColors,           // User + AI colors
            occasion: finalOccasions,      // User + AI occasions
            season: season || 'all-season',
            style: finalStyles,            // User + AI styles
            brand: brand || '',
            price: price ? parseFloat(price) : undefined,
            notes: notes || '',
            aiTags: aiTags,                // Pure AI tags for reference
            embedding: embedding           // 512-dimensional CLIP vector
        });

        await item.save();
        console.log('✅ Closet item saved with merged user + AI data');
        
        res.json({ 
            ok: true, 
            item: item.toObject(),
            aiProcessed: embedding.length > 0,
            mergedData: {
                colors: { user: userColors, ai: aiColors, final: finalColors },
                occasions: { user: userOccasions, ai: aiOccasions, final: finalOccasions },
                styles: { user: userStyles, ai: aiStyles, final: finalStyles }
            }
        });
    } catch (error) {
        console.error('❌ Create closet item error:', error);
        res.status(500).json({ ok: false, message: 'Failed to create item' });
    }
},


    // Get items with filters
    async getItems(req, res) {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Login required' });
            }

            const { category, colors, occasion, season, style, search, limit = 50 } = req.query;
            
            const query = { userId: user._id };

            // Apply filters
            if (category && category !== 'all') {
                query.category = category;
            }
            if (colors) {
                const colorArray = colors.split(',').map(c => c.trim()).filter(Boolean);
                if (colorArray.length > 0) {
                    query.colors = { $in: colorArray };
                }
            }
            if (occasion) {
                const occasionArray = occasion.split(',').map(o => o.trim()).filter(Boolean);
                if (occasionArray.length > 0) {
                    query.occasion = { $in: occasionArray };
                }
            }
            if (season && season !== 'all') {
                query.season = season;
            }
            if (style) {
                const styleArray = style.split(',').map(s => s.trim()).filter(Boolean);
                if (styleArray.length > 0) {
                    query.style = { $in: styleArray };
                }
            }
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { notes: { $regex: search, $options: 'i' } },
                    { brand: { $regex: search, $options: 'i' } },
                    { aiTags: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            const items = await ClosetItem.find(query)
                .sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .lean();

            res.json({ ok: true, items, count: items.length });
        } catch (error) {
            console.error('Get closet items error:', error);
            res.status(500).json({ ok: false, message: 'Failed to fetch items' });
        }
    },

    // Get single item by ID
    async getItemById(req, res) {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Login required' });
            }

            const item = await ClosetItem.findOne({ 
                _id: req.params.id, 
                userId: user._id 
            }).lean();

            if (!item) {
                return res.status(404).json({ ok: false, message: 'Item not found' });
            }

            res.json({ ok: true, item });
        } catch (error) {
            console.error('Get item error:', error);
            res.status(500).json({ ok: false, message: 'Failed to fetch item' });
        }
    },

    // Update item
    async updateItem(req, res) {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Login required' });
            }

            const item = await ClosetItem.findOne({ 
                _id: req.params.id, 
                userId: user._id 
            });

            if (!item) {
                return res.status(404).json({ ok: false, message: 'Item not found' });
            }

            // Update allowed fields
            const { name, category, colors, occasion, season, style, brand, price, notes } = req.body;
            
            if (name !== undefined) item.name = name;
            if (category !== undefined) item.category = category;
            if (colors !== undefined) {
                item.colors = Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim()).filter(Boolean);
            }
            if (occasion !== undefined) {
                item.occasion = Array.isArray(occasion) ? occasion : occasion.split(',').map(o => o.trim()).filter(Boolean);
            }
            if (season !== undefined) item.season = season;
            if (style !== undefined) {
                item.style = Array.isArray(style) ? style : style.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (brand !== undefined) item.brand = brand;
            if (price !== undefined) item.price = price ? parseFloat(price) : undefined;
            if (notes !== undefined) item.notes = notes;

            await item.save();
            res.json({ ok: true, item: item.toObject() });
        } catch (error) {
            console.error('Update item error:', error);
            res.status(500).json({ ok: false, message: 'Failed to update item' });
        }
    },

    // Delete item
    async deleteItem(req, res) {
        try {
            const user = await getCurrentUser(req);
            if (!user) {
                return res.status(401).json({ ok: false, message: 'Login required' });
            }

            const item = await ClosetItem.findOne({ 
                _id: req.params.id, 
                userId: user._id 
            });

            if (!item) {
                return res.status(404).json({ ok: false, message: 'Item not found' });
            }

            // Delete image file
            try {
                const imagePath = path.join(__dirname, '..', 'public', item.imagePath);
                await fs.unlink(imagePath);
            } catch (fsError) {
                console.warn('Image file delete failed (may not exist):', fsError.message);
            }

            await ClosetItem.deleteOne({ _id: item._id });
            res.json({ ok: true, message: 'Item deleted successfully' });
        } catch (error) {
            console.error('Delete item error:', error);
            res.status(500).json({ ok: false, message: 'Failed to delete item' });
        }
    },
    // Generate AI outfit suggestions from closet
async generateOutfitSuggestions(req, res) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return res.status(401).json({ ok: false, message: 'Login required' });
        }

        const { prompt, maxOutfits = 5 } = req.body;

        // Validation
        if (!prompt || prompt.trim().length === 0) {
            return res.status(400).json({ 
                ok: false, 
                message: 'Please provide a prompt (e.g., "casual brunch with friends")' 
            });
        }

        console.log(`\n🎯 User ${user.username} requested outfit for: "${prompt}"`);

        // Call the outfit generator
        const { generateOutfits } = require('../utils/outfitGenerator');
        const result = await generateOutfits(user._id, prompt, {
            maxOutfits: parseInt(maxOutfits),
            includeScores: true  // Include detailed scoring for debugging
        });

        if (!result.success) {
            return res.status(400).json({ 
                ok: false, 
                message: result.error 
            });
        }

        console.log(`✅ Generated ${result.outfits.length} outfits successfully\n`);

        res.json({
            ok: true,
            outfits: result.outfits,
            totalGenerated: result.totalGenerated,
            prompt: result.prompt
        });

    } catch (error) {
        console.error('❌ Generate outfit error:', error);
        res.status(500).json({ 
            ok: false, 
            message: 'Failed to generate outfits',
            error: error.message 
        });
    }
}

};

module.exports = closetController;
