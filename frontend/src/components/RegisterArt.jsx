import { useState } from "react";
import { ethers } from "ethers";
import { uploadToIPFS, hashFile } from "../utils/contract";

export default function RegisterArt({ contract, account }) {
  const [file, setFile]       = useState(null);
  const [title, setTitle]     = useState("");
  const [artist, setArtist]   = useState("");
  const [status, setStatus]   = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash]   = useState("");
  const [preview, setPreview] = useState(null);

  // Show image preview when file is selected
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleRegister = async () => {
    if (!file)   return alert("Please select an image file!");
    if (!title)  return alert("Please enter the artwork title!");
    if (!artist) return alert("Please enter the artist name!");

    setLoading(true);
    setTxHash("");
    setStatus("🔐 Hashing your image...");

    try {
      // Step 1: Hash the image (runs in browser, no server needed)
      const imageHash = await hashFile(file);
      setStatus("📦 Uploading image to IPFS...");

      // Step 2: Upload to IPFS via Pinata
      const ipfsURI = await uploadToIPFS(file, title, artist);
      setStatus("⛓️ Sending transaction to blockchain...");

      // Step 3: Call the smart contract
      const tx = await contract.registerArtwork(
        imageHash,
        title,
        artist,
        ipfsURI
      );

      setStatus("⏳ Waiting for blockchain confirmation...");
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("✅ Artwork registered successfully on the blockchain!");

    } catch (err) {
      if (err.message.includes("AlreadyRegistered")) {
        setStatus("⚠️ This artwork is already registered in the registry!");
      } else if (err.message.includes("user rejected")) {
        setStatus("❌ Transaction was rejected in MetaMask.");
      } else {
        setStatus("❌ Error: " + err.message);
      }
    }

    setLoading(false);
  };

  const handleReset = () => {
    setFile(null);
    setTitle("");
    setArtist("");
    setStatus("");
    setTxHash("");
    setPreview(null);
  };

  return (
    <div style={s.card}>
      <h2 style={s.h2}>📝 Register Your Artwork</h2>
      <p style={s.sub}>
        Your image will be hashed, stored on IPFS, and registered
        on the blockchain with a permanent timestamp.
      </p>

      {/* Image Preview */}
      {preview && (
        <div style={s.previewWrap}>
          <img src={preview} alt="preview" style={s.preview} />
        </div>
      )}

      {/* File Input */}
      <label style={s.label}>Select Image File</label>
      <input
        style={s.input}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Title Input */}
      <label style={s.label}>Artwork Title</label>
      <input
        style={s.input}
        type="text"
        placeholder="e.g. Sunset in Pixels"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Artist Input */}
      <label style={s.label}>Artist Name</label>
      <input
        style={s.input}
        type="text"
        placeholder="e.g. Aditya Singh"
        value={artist}
        onChange={(e) => setArtist(e.target.value)}
      />

      {/* Wallet Info */}
      <div style={s.walletRow}>
        <span style={s.walletLabel}>Registering from wallet:</span>
        <span style={s.walletAddr}>
          {account ? `${account.slice(0,6)}...${account.slice(-4)}` : "Not connected"}
        </span>
      </div>

      {/* Register Button */}
      <button
        style={loading ? s.btnDisabled : s.btn}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? "⏳ Processing..." : "🚀 Register on Blockchain"}
      </button>

      {/* Status Message */}
      {status && (
        <div style={
          status.startsWith("✅") ? s.statusSuccess :
          status.startsWith("❌") || status.startsWith("⚠️") ? s.statusError :
          s.status
        }>
          {status}
        </div>
      )}

      {/* Etherscan Link — shown after success */}
      {txHash && (
  <a
    href={`https://sepolia.etherscan.io/tx/${txHash}`}
    target="_blank"
    rel="noreferrer"
    style={s.link}
  >
    🔗 View Transaction on Etherscan ↗
  </a>
)}

      {/* Reset Button — shown after success */}
      {txHash && (
        <button style={s.resetBtn} onClick={handleReset}>
          + Register Another Artwork
        </button>
      )}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = {
  card: {
    background   : "#12122a",
    border       : "1px solid #1e1e48",
    borderRadius : 16,
    padding      : "28px 24px",
  },
  h2: {
    marginBottom : 8,
    color        : "#c9aaff",
    fontSize     : "1.3rem",
  },
  sub: {
    color        : "#555a7a",
    fontSize     : "0.84rem",
    marginBottom : 22,
    lineHeight   : 1.6,
  },
  previewWrap: {
    marginBottom : 18,
    textAlign    : "center",
  },
  preview: {
    maxWidth     : "100%",
    maxHeight    : 200,
    borderRadius : 12,
    border       : "1px solid #2e2b5a",
    objectFit    : "cover",
  },
  label: {
    display      : "block",
    fontSize     : "0.78rem",
    color        : "#8892a4",
    marginBottom : 6,
    fontWeight   : 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  input: {
    display      : "block",
    width        : "100%",
    padding      : "12px 16px",
    margin       : "0 0 18px",
    background   : "#0b0b18",
    border       : "1px solid #2e2b5a",
    borderRadius : 10,
    color        : "#e2e2f0",
    fontSize     : 14,
    outline      : "none",
  },
  walletRow: {
    display        : "flex",
    justifyContent : "space-between",
    alignItems     : "center",
    padding        : "10px 14px",
    background     : "#0b0b18",
    borderRadius   : 10,
    marginBottom   : 18,
    border         : "1px solid #1e1e48",
  },
  walletLabel: {
    fontSize : "0.8rem",
    color    : "#555a7a",
  },
  walletAddr: {
    fontSize   : "0.8rem",
    color      : "#38e8a8",
    fontFamily : "monospace",
    fontWeight : 700,
  },
  btn: {
    width        : "100%",
    padding      : "14px",
    background   : "linear-gradient(90deg, #b48bff, #5eaeff)",
    border       : "none",
    borderRadius : 12,
    color        : "#fff",
    fontWeight   : 700,
    cursor       : "pointer",
    fontSize     : 15,
  },
  btnDisabled: {
    width        : "100%",
    padding      : "14px",
    background   : "#2e2b5a",
    border       : "none",
    borderRadius : 12,
    color        : "#555a7a",
    fontWeight   : 700,
    cursor       : "not-allowed",
    fontSize     : 15,
  },
  status: {
    marginTop    : 16,
    padding      : "12px 16px",
    background   : "#0e0e22",
    border       : "1px solid #2e2b5a",
    borderRadius : 10,
    fontSize     : 14,
    color        : "#e2e2f0",
    lineHeight   : 1.5,
  },
  statusSuccess: {
    marginTop    : 16,
    padding      : "12px 16px",
    background   : "rgba(56,232,168,0.08)",
    border       : "1px solid rgba(56,232,168,0.3)",
    borderRadius : 10,
    fontSize     : 14,
    color        : "#38e8a8",
    lineHeight   : 1.5,
  },
  statusError: {
    marginTop    : 16,
    padding      : "12px 16px",
    background   : "rgba(239,68,68,0.08)",
    border       : "1px solid rgba(239,68,68,0.3)",
    borderRadius : 10,
    fontSize     : 14,
    color        : "#f87171",
    lineHeight   : 1.5,
  },
  link: {
    display      : "block",
    marginTop    : 12,
    color        : "#5eaeff",
    fontSize     : 14,
    textDecoration: "none",
    fontWeight   : 600,
  },
  resetBtn: {
    display      : "block",
    width        : "100%",
    marginTop    : 12,
    padding      : "12px",
    background   : "transparent",
    border       : "1px solid #2e2b5a",
    borderRadius : 12,
    color        : "#8892a4",
    cursor       : "pointer",
    fontSize     : 14,
    fontWeight   : 600,
  },
};