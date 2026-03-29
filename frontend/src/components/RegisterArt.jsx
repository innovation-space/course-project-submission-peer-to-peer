import { useState, useRef } from "react";
import { hashFile, uploadToIPFS } from "../utils/contract";

export default function RegisterArt({ contract, account, isGasless }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const inputRef = useRef();
  const cardRef = useRef();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const handleFile = (selected) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus("");
    setTxHash("");
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) handleFile(dropped);
  };

  const handleRegister = async () => {
    if (!file) return alert("Please select an image file!");
    if (!title) return alert("Please enter the artwork title!");
    if (!artist) return alert("Please enter the artist name!");

    setLoading(true);
    setTxHash("");
    setStatus("🔐 Hashing your image...");

    try {
      const imageHash = await hashFile(file);
      setStatus("📦 Uploading to IPFS...");

      const ipfsURI = await uploadToIPFS(file, title, artist);
      
      if (isGasless) {
        setStatus("⚡ Optimizing Gasless Registration...");
        await new Promise(r => setTimeout(r, 1500)); // Smooth simulation
        
        // Save to local gallery for demo persistence
        const localArt = {
          hash: imageHash,
          title, artist,
          ipfsURI, 
          owner: account || "0xDemoUser...",
          timestamp: Math.floor(Date.now() / 1000),
          isGasless: true
        };
        const existing = JSON.parse(localStorage.getItem("GASLESS_ART") || "[]");
        localStorage.setItem("GASLESS_ART", JSON.stringify([localArt, ...existing]));

        setTxHash("gasless_demo_" + Math.random().toString(36).slice(2));
        setStatus("✅ Artwork registered (Gasless Mode)!");
      } else {
        if (!contract) throw new Error("Wallet not connected!");
        setStatus("⛓️ Sending transaction to Polygon...");
        const tx = await contract.registerArtwork(imageHash, title, artist, ipfsURI);
        setStatus("⏳ Waiting for confirmation...");
        await tx.wait();
        setTxHash(tx.hash);
        setStatus("✅ Artwork registered on Polygon!");
      }
    } catch (err) {
      if (err.message.includes("AlreadyRegistered")) {
        setStatus("⚠️ This artwork is already registered!");
      } else if (err.message.includes("user rejected")) {
        setStatus("❌ Transaction rejected in MetaMask.");
      } else {
        setStatus("❌ Error: " + err.message);
      }
    }
    setLoading(false);
  };

  const handleReset = () => {
    setFile(null); setTitle(""); setArtist("");
    setStatus(""); setTxHash(""); setPreview(null);
  };

  const statusType =
    status.startsWith("✅") ? "success" :
      (status.startsWith("❌") || status.startsWith("⚠️")) ? "error" : "info";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        ...s.card,
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
      }}
    >
      {/* Drop zone */}
      <div
        style={{
          ...s.dropZone,
          ...(dragging ? s.dropZoneActive : {}),
          ...(preview ? s.dropZoneHasImage : {}),
        }}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="preview" style={s.preview} />
        ) : (
          <div style={s.dropInner}>
            <div style={s.radarContainer}>
              <div style={s.radarPulse} />
              <div style={s.dropIcon}>🖼️</div>
            </div>
            <div style={s.dropText}>Drop your artwork here</div>
            <div style={s.dropSub}>or click to browse · PNG, JPG, GIF, SVG</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>

      {/* Fields */}
      <div style={s.fields}>
        <div style={s.field}>
          <label style={s.label}>Artwork Title</label>
          <input
            style={s.input}
            type="text"
            placeholder="e.g. Sunset in Pixels"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={s.field}>
          <label style={s.label}>Artist Name</label>
          <input
            style={s.input}
            type="text"
            placeholder="e.g. Aditya Singh"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>
      </div>

      {/* Wallet row */}
      <div style={s.walletRow}>
        <span style={s.walletLabel}>Registering from</span>
        <span style={s.walletAddr}>
          {account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "Not connected"}
        </span>
      </div>

      {/* Button */}
      <button
        id="btn-register"
        style={loading ? s.btnDisabled : s.btn}
        onClick={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <><span style={s.spinner} />Processing Transaction…</>
        ) : (
          "Register on Polygon"
        )}
      </button>

      {/* Status */}
      {status && (
        <div style={statusType === "success" ? s.statusSuccess : statusType === "error" ? s.statusError : s.status}>
          <div style={s.statusDot} />
          {status}
        </div>
      )}

      {/* Polygonscan link */}
      {txHash && (
        <a
          href={`https://amoy.polygonscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          style={s.link}
        >
          View on Polygonscan ↗
        </a>
      )}

      {/* Reset */}
      {txHash && (
        <button style={s.resetBtn} onClick={handleReset}>
          + Register Another Artwork
        </button>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 32,
    padding: "40px",
    backdropFilter: "blur(20px)",
    transition: "transform 0.1s ease-out",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  dropZone: {
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: 24,
    cursor: "pointer",
    marginBottom: 32,
    overflow: "hidden",
    minHeight: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(124,58,237,0.02)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
  },
  dropZoneActive: {
    borderColor: "#7c3aed",
    background: "rgba(124,58,237,0.08)",
    transform: "scale(1.02)",
  },
  dropZoneHasImage: {
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(0,0,0,0.2)",
  },
  dropInner: { textAlign: "center", padding: "40px 20px" },
  radarContainer: {
    position: "relative", width: 80, height: 80, margin: "0 auto 20px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  radarPulse: {
    position: "absolute", width: "100%", height: "100%",
    borderRadius: "50%", background: "rgba(124,58,237,0.2)",
    animation: "pulse 2s infinite",
  },
  dropIcon: { fontSize: 48, position: "relative", zIndex: 1 },
  dropText: { fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 },
  dropSub: { fontSize: 13, color: "#475569", fontWeight: 500 },
  preview: {
    width: "100%", maxHeight: 300,
    objectFit: "cover", borderRadius: 16,
  },
  fields: { display: "flex", gap: 20, marginBottom: 24, flexWrap: "wrap" },
  field: { flex: 1, minWidth: 240 },
  label: {
    display: "block", fontSize: 12, fontWeight: 800,
    color: "#64748b", marginBottom: 10,
    textTransform: "uppercase", letterSpacing: "1px",
  },
  input: {
    display: "block", width: "100%",
    padding: "16px 20px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, color: "#fff",
    fontSize: 15, outline: "none",
    transition: "all 0.2s",
    fontFamily: "'Inter', sans-serif",
  },
  walletRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", marginBottom: 24,
    background: "rgba(16,185,129,0.04)",
    border: "1px solid rgba(16,185,129,0.1)",
    borderRadius: 16,
  },
  walletLabel: { fontSize: 12, color: "#475569", fontWeight: 600, textTransform: "uppercase" },
  walletAddr: { fontSize: 14, fontFamily: "monospace", color: "#10b981", fontWeight: 800 },
  btn: {
    width: "100%", padding: "18px",
    background: "#fff",
    border: "none", borderRadius: 20,
    color: "#02020a", fontWeight: 800, fontSize: 16,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    boxShadow: "0 10px 30px rgba(255,255,255,0.1)",
    fontFamily: "'Inter', sans-serif",
    transition: "transform 0.2s",
  },
  btnDisabled: {
    width: "100%", padding: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20, color: "#334155",
    fontWeight: 800, fontSize: 16, cursor: "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    display: "inline-block", width: 18, height: 18,
    border: "3px solid rgba(124,58,237,0.2)",
    borderTopColor: "#7c3aed", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  status: {
    marginTop: 20, padding: "16px 20px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 16, fontSize: 14, color: "#94a3b8", lineHeight: 1.6,
    display: "flex", alignItems: "center", gap: 12,
  },
  statusSuccess: {
    marginTop: 20, padding: "16px 20px",
    background: "rgba(16,185,129,0.04)",
    border: "1px solid rgba(16,185,129,0.15)",
    borderRadius: 16, fontSize: 14, color: "#10b981", lineHeight: 1.6,
    fontWeight: 700, display: "flex", alignItems: "center", gap: 12,
  },
  statusError: {
    marginTop: 20, padding: "16px 20px",
    background: "rgba(239,68,68,0.04)",
    border: "1px solid rgba(239,68,68,0.15)",
    borderRadius: 16, fontSize: 14, color: "#f87171", lineHeight: 1.6,
    display: "flex", alignItems: "center", gap: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: "50%", background: "currentColor", animation: "pulse 2s infinite" },
  link: {
    display: "block", marginTop: 16,
    color: "#a78bfa", fontSize: 13,
    textDecoration: "none", fontWeight: 800,
    textAlign: "center", textTransform: "uppercase", letterSpacing: "1px",
  },
  resetBtn: {
    display: "block", width: "100%", marginTop: 16,
    padding: "16px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20, color: "#475569",
    cursor: "pointer", fontSize: 13, fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
    textTransform: "uppercase", letterSpacing: "1px",
  },
};