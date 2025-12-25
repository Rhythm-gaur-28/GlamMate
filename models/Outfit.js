const mongoose = require('mongoose');

const outfitSchema = new mongoose.Schema({
    // Unique identifier
    outfit_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // File information
    file_name: {
        type: String,
        required: true
    },
    file_path: {
        type: String,
        required: true
    },
    split: {
        type: String,
        enum: ['train', 'validation', 'test', 'curated'],
        default: 'curated'
    },
    
    // Image metadata
    width: Number,
    height: Number,
    quality_score: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
    },
    is_commercial: {
        type: Boolean,
        default: false
    },
    
    // CLIP AI EMBEDDING (512 dimensions)
    embedding_vector: {
        type: [Number],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 512;
            },
            message: 'Embedding must be 512 dimensions'
        }
    },
    
    // AI-Generated Fashion Attributes (automatic!)
    occasions: [{
        type: String,
        enum: ['casual', 'formal', 'party', 'wedding', 'gym', 'beach', 'romantic', 'work', 'date', 'vacation']
    }],
    
    style: {
        type: String,
        enum: ['casual', 'formal', 'trendy', 'classic', 'bohemian', 'minimalist', 'elegant']
    },
    
    colors: [{
        type: String,
        enum: ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'brown', 'gray', 'purple', 'orange', 'beige', 'multicolor']
    }],
    
    season: [{
        type: String,
        enum: ['summer', 'winter', 'spring', 'fall', 'all']
    }],
    
    formality: {
        type: String,
        enum: ['very casual', 'smart casual', 'business casual', 'semi-formal', 'formal', 'black-tie']
    },
    
    // AI Confidence scores
    confidence: {
        occasion: { type: Number, min: 0, max: 1 },
        style: { type: Number, min: 0, max: 1 },
        color: { type: Number, min: 0, max: 1 }
    },
    
    // Processing status
    processed: {
        type: Boolean,
        default: false
    },
    
    // Optional: Shopping links (for future)
    shopping_links: [{
        provider: String,
        url: String,
        price: Number,
        currency: String
    }],
    
    // User engagement (for future)
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    }
    
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

// Indexes for fast searching
outfitSchema.index({ occasions: 1 });
outfitSchema.index({ style: 1 });
outfitSchema.index({ formality: 1 });
outfitSchema.index({ season: 1 });
outfitSchema.index({ quality_score: -1 });
outfitSchema.index({ processed: 1 });

// Virtual for image URL (if serving static files)
outfitSchema.virtual('image_url').get(function() {
    return `/uploads/outfits/${this.file_name}`;
});

module.exports = mongoose.model('Outfit', outfitSchema);
