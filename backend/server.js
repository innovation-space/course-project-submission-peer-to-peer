require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");
const Artwork = require("./models/Artwork");
const ArtRegistryABI = require("./ArtRegistryABI.json");

const app = express();
const PORT = process.env.PORT || 5000;

// ⚙️ CONFIGURATION
const RPC_URL = process.env.RPC_URL || "https://polygon-rpc.com"; // Polygon Mainnet RPC
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
const EXPECTED_CHAIN_ID = 137; // Polygon Mainnet
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artchain";

// Middleware
app.use(cors());
app.use(express.json());

// ⛓️ BLOCKCHAIN SETUP
const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ArtRegistryABI, provider);

/**
 * 🛰️ SECURE EVENT-DRIVEN SYNC
 * Requirement 3-6: Listens to smart contract events and verifies transactions.
 */
async function startEventListener() {
  console.log(`📡 Connecting to Polygon (ChainID: ${EXPECTED_CHAIN_ID})...`);
  
  try {
    const network = await provider.getNetwork();
    
    // Requirement 7: Network check
    if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
      console.warn(`⚠️ Warning: Provider is connected to ChainID ${network.chainId}, expected ${EXPECTED_CHAIN_ID}.`);
    }

    console.log("🚀 Event Listener ACTIVE: Monitoring 'ArtworkRegistered'...");

    contract.on("ArtworkRegistered", async (imageHash, owner, title, timestamp, event) => {
      console.log(`\n🔔 New Event Detected: ${title}`);
      console.log(`🔗 Transaction Hash: ${event.log.transactionHash}`);

      try {
        // Requirement 5: Verify the transaction receipt
        const receipt = await provider.getTransactionReceipt(event.log.transactionHash);
        
        if (!receipt || receipt.status !== 1) {
          console.error("❌ Transaction failed or status is not 1. Skipping sync.");
          return;
        }

        // Requirement 9: Verify state directly from contract (Don't trust event logs alone)
        const chainData = await contract.verifyArtwork(imageHash);
        
        const artworkData = {
          imageHash: imageHash,
          title: chainData.title,
          artist: chainData.artist,
          ipfsURI: chainData.ipfsURI,
          owner: chainData.owner,
          timestamp: Number(chainData.timestamp),
          isGasless: false
        };

        // Requirement 8: Prevent duplicate entries using upsert
        await Artwork.findOneAndUpdate(
          { imageHash: artworkData.imageHash },
          artworkData,
          { upsert: true, new: true }
        );
        
        console.log(`✅ VERIFIED & STORED: ${artworkData.title}`);
      } catch (err) {
        console.error("❌ Verification Error:", err.message);
      }
    });

  } catch (err) {
    console.error("❌ Failed to initialize blockchain provider:", err.message);
  }
}

// Database Connection
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected!");
    startEventListener();
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));

// 🛣️ ROUTES

/**
 * 1. GET /api/artworks
 * Fast retrieval from verified MongoDB cache.
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
 * 2. POST /api/artworks
 * Requirement 1 & 10: DISABLE direct writes for blockchain transactions.
 * This API now only acknowledges submission; the listener handles the actual storage.
 */
app.post("/api/artworks", async (req, res) => {
  try {
    const { imageHash, isGasless, txHash } = req.body;
    
    // Handle Gasless (Local/Guest) mode separately (for demo purposes)
    if (isGasless) {
      const { title, artist, ipfsURI, owner, timestamp } = req.body;
      const existing = await Artwork.findOne({ imageHash });
      if (existing) return res.status(200).json(existing);

      const newArtwork = new Artwork({ imageHash, title, artist, ipfsURI, owner, timestamp, isGasless: true });
      await newArtwork.save();
      return res.status(201).json(newArtwork);
    }

    // Requirement 1 & 10: BLOCKCHAIN TRANSACTIONS
    // We DO NOT store data here. We wait for the event listener to pick it up.
    console.log(`📩 Sync request received for TX: ${txHash || "Pending"}`);
    
    res.status(202).json({
      message: "Sync request accepted. Data will be persisted once verified on the Polygon network.",
      status: "processing",
      txHash: txHash
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send({
    service: "ArtChain Security Layer",
    status: "Operational",
    network: "Polygon (ChainID 137)",
    integrity: "Verified Event-Driven Architecture"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Secure Backend running on port ${PORT}`);
});
