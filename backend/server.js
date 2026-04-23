require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");
const Artwork = require("./models/Artwork");
const ArtRegistryABI = require("./ArtRegistryABI.json");

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // ArtRegistry on Amoy
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artchain";

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain Setup
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ArtRegistryABI, provider);

/**
 * 📡 Blockchain Event Listener
 * Listens for new artwork registrations on Polygon and syncs to MongoDB.
 * This is the primary "source of truth" to prevent spoofing.
 */
async function startEventListener() {
  console.log("📡 Starting Blockchain Event Listener...");
  
  contract.on("ArtworkRegistered", async (imageHash, owner, title, timestamp, event) => {
    console.log(`🔔 New On-Chain Artwork Detected: ${title} (Hash: ${imageHash})`);
    
    try {
      // Fetch full details from contract (including fields not in event)
      const data = await contract.verifyArtwork(imageHash);
      
      const artworkData = {
        imageHash: imageHash,
        title: data.title,
        artist: data.artist,
        ipfsURI: data.ipfsURI,
        owner: data.owner,
        timestamp: Number(data.timestamp),
        isGasless: false
      };

      // Upsert to DB
      await Artwork.findOneAndUpdate(
        { imageHash: artworkData.imageHash },
        artworkData,
        { upsert: true, new: true }
      );
      
      console.log(`✅ Successfully synced: ${artworkData.title}`);
    } catch (err) {
      console.error("❌ Error syncing artwork from event:", err.message);
    }
  });
}

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected!");
    startEventListener(); // Start listening after DB is ready
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Routes

/**
 * 1. GET all artworks (Optimized for gallery speed)
 */
app.get("/api/artworks", async (req, res) => {
  try {
    const artworks = await Artwork.find().sort({ createdAt: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. POST /api/artworks (SECURED Sync Endpoint)
 * Instead of trusting body data, we now verify the Transaction Hash or the Chain State.
 */
app.post("/api/artworks", async (req, res) => {
  try {
    const { imageHash, title, artist, ipfsURI, owner, timestamp, isGasless, txHash } = req.body;
    
    // 🛡️ SECURITY CHECK: If NOT gasless, we must verify the transaction exists on-chain
    if (!isGasless) {
      if (txHash) {
        console.log(`🔍 Verifying transaction: ${txHash}`);
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || receipt.status !== 1) {
          return res.status(400).json({ error: "Invalid or failed transaction hash." });
        }
      }

      // Final check: Query the contract to ensure it's actually registered
      const isRegistered = await contract.isRegistered(imageHash);
      if (!isRegistered) {
        return res.status(400).json({ error: "Artwork not found on blockchain. Spoofing attempt blocked." });
      }

      // Fetch official data from chain to override any spoofed body data
      const chainData = await contract.verifyArtwork(imageHash);
      const syncedArtwork = {
        imageHash,
        title: chainData.title,
        artist: chainData.artist,
        ipfsURI: chainData.ipfsURI,
        owner: chainData.owner,
        timestamp: Number(chainData.timestamp),
        isGasless: false
      };

      const art = await Artwork.findOneAndUpdate({ imageHash }, syncedArtwork, { upsert: true, new: true });
      return res.status(201).json(art);
    }

    // Handle Gasless (Guest/Local) artworks
    let existing = await Artwork.findOne({ imageHash });
    if (existing) return res.status(200).json(existing);

    const newArtwork = new Artwork({
      imageHash, title, artist, ipfsURI, owner, timestamp, isGasless
    });

    await newArtwork.save();
    console.log(`🌱 New Gasless artwork saved: ${title}`);
    res.status(201).json(newArtwork);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("ArtChain API is Operational // STATUS: OK // LISTENER: ACTIVE");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
