const ClosetItem = require('../models/ClosetItem');
const fs = require('fs').promises;
const path = require('path');

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

    // Create new closet item
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

            // Parse arrays from form data
            const colorsArray = colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim()).filter(Boolean)) : [];
            const occasionArray = occasion ? (Array.isArray(occasion) ? occasion : occasion.split(',').map(o => o.trim()).filter(Boolean)) : [];
            const styleArray = style ? (Array.isArray(style) ? style : style.split(',').map(s => s.trim()).filter(Boolean)) : [];

            const item = new ClosetItem({
                userId: user._id,
                name,
                imagePath: `/uploads/closet/${req.file.filename}`,
                category,
                colors: colorsArray,
                occasion: occasionArray,
                season: season || 'all-season',
                style: styleArray,
                brand: brand || '',
                price: price ? parseFloat(price) : undefined,
                notes: notes || ''
            });

            await item.save();
            res.json({ ok: true, item: item.toObject() });
        } catch (error) {
            console.error('Create closet item error:', error);
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
                    { brand: { $regex: search, $options: 'i' } }
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
    }
};

module.exports = closetController;
