require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Artwork = require("./models/Artwork");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artchain";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
// 1. GET all artworks (fast loading)
app.get("/api/artworks", async (req, res) => {
  try {
    const artworks = await Artwork.find().sort({ createdAt: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. POST a new artwork (sync from blockchain/FE)
app.post("/api/artworks", async (req, res) => {
  try {
    const { imageHash, title, artist, ipfsURI, owner, timestamp, isGasless } = req.body;
    
    // Check if already exists
    let existing = await Artwork.findOne({ imageHash });
    if (existing) return res.status(200).json(existing);

    const newArtwork = new Artwork({
      imageHash, title, artist, ipfsURI, owner, timestamp, isGasless
    });

    await newArtwork.save();
    console.log(`🖼️ New artwork synced: ${title}`);
    res.status(201).json(newArtwork);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Health check
app.get("/", (req, res) => {
  res.send("ArtChain API is Operational // STATUS: OK");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
