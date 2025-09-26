// models/Collection.js
const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Collection", collectionSchema);