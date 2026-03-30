const mongoose = require("mongoose");

const ArtworkSchema = new mongoose.Schema({
  imageHash: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  ipfsURI: { type: String, required: true },
  owner: { type: String, required: true },
  timestamp: { type: Number, required: true },
  isGasless: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Artwork", ArtworkSchema);
