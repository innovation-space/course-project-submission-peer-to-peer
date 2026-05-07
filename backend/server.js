require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ethers } = require("ethers");
const Artwork = require("./models/Artwork");
const ArtRegistryABI = require("./ArtRegistryABI.json");

const app = express();
const PORT = process.env.PORT || 5000;

const RPC_URL = process.env.RPC_URL || "https://polygon-rpc.com"; 
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
const EXPECTED_CHAIN_ID = 137; 
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/artchain";

app.use(cors());
app.use(express.json());

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ArtRegistryABI, provider);

async function syncHistoricalEvents() {
  try {
    const currentBlock = await provider.getBlockNumber();
    const startBlock = currentBlock - 5000; 
    const filter = contract.filters.ArtworkRegistered();
    const logs = await contract.queryFilter(filter, startBlock, "latest");
    for (const log of logs) {
      const { imageHash, title } = log.args;
      const existing = await Artwork.findOne({ imageHash });
      if (!existing || existing.isGasless) {
        const data = await contract.verifyArtwork(imageHash);
        await Artwork.findOneAndUpdate({ imageHash }, {
          imageHash, title: data.title, artist: data.artist, ipfsURI: data.ipfsURI, owner: data.owner, timestamp: Number(data.timestamp), isGasless: false
        }, { upsert: true });
      }
    }
  } catch (err) { console.error(err); }
}

async function startEventListener() {
  await syncHistoricalEvents();
  contract.on("ArtworkRegistered", async (imageHash, owner, title, timestamp, event) => {
    const receipt = await provider.getTransactionReceipt(event.log.transactionHash);
    if (receipt && receipt.status === 1) {
      const data = await contract.verifyArtwork(imageHash);
      await Artwork.findOneAndUpdate({ imageHash }, {
        imageHash, title: data.title, artist: data.artist, ipfsURI: data.ipfsURI, owner: data.owner, timestamp: Number(data.timestamp), isGasless: false
      }, { upsert: true });
    }
  });
}

mongoose.connect(MONGODB_URI).then(() => { startEventListener(); });

app.get("/api/artworks", async (req, res) => {
  const artworks = await Artwork.find().sort({ createdAt: -1 });
  res.json(artworks);
});

app.post("/api/artworks", async (req, res) => {
  const { imageHash, isGasless } = req.body;
  if (isGasless) {
    const art = new Artwork(req.body);
    await art.save();
    return res.status(201).json(art);
  }
  res.status(202).json({ message: "Awaiting on-chain verification @manoov" });
});

app.listen(PORT);
