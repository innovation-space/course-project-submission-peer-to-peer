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
 * 🔄 BLOCKCHAIN RE-SYNC / CATCH-UP
 * Scans historical logs to ensure the database is in sync with the blockchain.
 * Advanced logic: Handles events missed during server downtime.
 */
async function syncHistoricalEvents() {
  console.log("🔍 Scanning for missed historical events...");
  try {
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 5000; // Scan last ~24 hours of activity
    
    const filter = contract.filters.ArtworkRegistered();
    const logs = await contract.queryFilter(filter, startBlock, "latest");
    
    console.log(`📊 Found ${logs.length} historical events in the scan range.`);
    
    for (const log of logs) {
      const { imageHash, owner, title } = log.args;
      const existing = await Artwork.findOne({ imageHash });
      
      if (!existing || existing.isGasless) {
        console.log(`♻️ Syncing missed artwork: ${title}`);
        const chainData = await contract.verifyArtwork(imageHash);
        
        await Artwork.findOneAndUpdate(
          { imageHash },
          {
            imageHash,
            title: chainData.title,
            artist: chainData.artist,
            ipfsURI: chainData.ipfsURI,
            owner: chainData.owner,
            timestamp: Number(chainData.timestamp),
            isGasless: false
          },
          { upsert: true }
        );
      }
    }
    console.log("✅ Historical sync complete.");
  } catch (err) {
    console.error("❌ Catch-up sync failed:", err.message);
  }
}

/**
 * 🛰️ SECURE EVENT-DRIVEN SYNC
 */
async function startEventListener() {
  console.log(`📡 Connecting to Polygon (ChainID: ${EXPECTED_CHAIN_ID})...`);
  
  try {
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== EXPECTED_CHAIN_ID) {
      console.warn(`⚠️ Warning: Connected to ChainID ${network.chainId}, expected ${EXPECTED_CHAIN_ID}.`);
    }

    // 1. Run historical sync first
    await syncHistoricalEvents();

    // 2. Start real-time listener
    console.log("🚀 Event Listener ACTIVE: Monitoring 'ArtworkRegistered'...");
    contract.on("ArtworkRegistered", async (imageHash, owner, title, timestamp, event) => {
      console.log(`\n🔔 New Event Detected: ${title}`);
      console.log(`🔗 Transaction Hash: ${event.log.transactionHash}`);

      try {
        const receipt = await provider.getTransactionReceipt(event.log.transactionHash);
        if (!receipt || receipt.status !== 1) {
          console.error("❌ Transaction failed or status is not 1. Skipping sync.");
          return;
        }

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
    console.error("❌ Initialization failed:", err.message);
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
