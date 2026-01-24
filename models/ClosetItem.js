const mongoose = require('mongoose');

const ClosetItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  imagePath: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory', 'other'],
    required: true,
    index: true
  },
  colors: [{
    type: String,
    lowercase: true,
    trim: true
    // REMOVED: enum restriction - allow any color
  }],
  occasion: [{
    type: String,
    lowercase: true,
    trim: true
    // REMOVED: enum restriction - allow any occasion (indian wedding, brunch, etc.)
  }],
  season: {
    type: String,
    enum: ['summer', 'winter', 'spring', 'fall', 'all-season'],
    default: 'all-season'
  },
  style: [{
    type: String,
    lowercase: true,
    trim: true
    // No enum - already flexible
  }],
  brand: {
    type: String,
    trim: true
  },
  price: Number,
  notes: {
    type: String,
    maxlength: 500
  },
  
  // AI fields
  aiTags: {
    type: [String],
    default: []
  },
  embedding: {
    type: [Number],
    default: undefined
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'closet_items'
});

// Update timestamp on save
ClosetItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound indexes for efficient filtering
ClosetItemSchema.index({ userId: 1, category: 1 });
ClosetItemSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ClosetItem', ClosetItemSchema);
