// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  username: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, 
  // 🔥 not required anymore, but still must be unique
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String }, // Optional for Google users
  isVerified: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  googleId: { type: String },
  avatar: { type: String, default: "/images/default-avatar.jpg" },
  bio: { type: String, default: "" },
  aboutMe: { type: String, default: "" },
  banner: { type: String, default: "/images/default-banner.jpg" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  collections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }],
  // ADDED default: [] to initialize the array
  saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] }], 
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);