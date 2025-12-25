const mongoose = require("mongoose");

const LuxuryOutfitSchema = new mongoose.Schema({
  outfit_id: String,
  filename: String,
  image_path: String,

  quality: {
    aesthetic_score: Number,
  },

  category: {
    primary: String,
    confidence: Number,
    multi: mongoose.Schema.Types.Mixed,
  },

  style: {
    primary: String,
    confidence: Number,
    all_scores: mongoose.Schema.Types.Mixed,
  },

  embedding_vector: [Number],

  attributes: {
    occasions: [String],
    colors: [String],
    season: [String],
    formality: String,
    confidence: mongoose.Schema.Types.Mixed,
  },

  search_tags: [String],

  recommendation: mongoose.Schema.Types.Mixed,
  engagement: mongoose.Schema.Types.Mixed,
  source: String,
  processed_date: Date,
  pipeline_version: String,
});

module.exports = mongoose.model("LuxuryOutfit", LuxuryOutfitSchema, "luxury_outfits");
