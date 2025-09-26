// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  images: [{ type: String, required: true }], // changed from imageUrl to images array
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  uploadedByName: { type: String, default: "GlamMate" },
  uploadedByAvatar: { type: String, default: "/images/default-avatar.jpg" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);
