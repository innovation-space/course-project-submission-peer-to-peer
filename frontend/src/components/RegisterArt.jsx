import { useState, useRef } from "react";
import { hashFile, uploadToIPFS } from "../utils/contract";

export default function RegisterArt({ contract, account }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

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
      setStatus("⛓️ Sending transaction to Polygon...");

      const tx = await contract.registerArtwork(imageHash, title, artist, ipfsURI);
      setStatus("⏳ Waiting for confirmation...");
      await tx.wait();

      setTxHash(tx.hash);
      setStatus("✅ Artwork registered on Polygon!");
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
    <div style={s.card}>
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
            <div style={s.dropIcon}>🖼️</div>
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
          <><span style={s.spinner} />Processing…</>
        ) : (
          "🚀 Register on Polygon"
        )}
      </button>

      {/* Status */}
      {status && (
        <div style={statusType === "success" ? s.statusSuccess : statusType === "error" ? s.statusError : s.status}>
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
          🔗 View on Polygonscan ↗
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
    borderRadius: 24,
    padding: "28px 28px 24px",
    backdropFilter: "blur(12px)",
  },
  dropZone: {
    border: "2px dashed rgba(124,58,237,0.35)",
    borderRadius: 18,
    cursor: "pointer",
    marginBottom: 20,
    overflow: "hidden",
    minHeight: 160,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(124,58,237,0.04)",
    transition: "border-color 0.2s, background 0.2s",
  },
  dropZoneActive: {
    borderColor: "#7c3aed",
    background: "rgba(124,58,237,0.1)",
  },
  dropZoneHasImage: {
    border: "2px solid rgba(124,58,237,0.4)",
    minHeight: 200,
  },
  dropInner: { textAlign: "center", padding: "24px 16px" },
  dropIcon: { fontSize: 40, marginBottom: 10 },
  dropText: { fontSize: 15, fontWeight: 600, color: "#c4b5fd", marginBottom: 6 },
  dropSub: { fontSize: 12, color: "#475569" },
  preview: {
    width: "100%", maxHeight: 240,
    objectFit: "cover", borderRadius: 16,
  },
  fields: { display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" },
  field: { flex: 1, minWidth: 200 },
  label: {
    display: "block", fontSize: 11, fontWeight: 700,
    color: "#64748b", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: "0.6px",
  },
  input: {
    display: "block", width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "#f1f5f9",
    fontSize: 14, outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'Inter', sans-serif",
  },
  walletRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 14px", marginBottom: 16,
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.15)",
    borderRadius: 12,
  },
  walletLabel: { fontSize: 12, color: "#475569", fontWeight: 500 },
  walletAddr: { fontSize: 13, fontFamily: "monospace", color: "#10b981", fontWeight: 700 },
  btn: {
    width: "100%", padding: "15px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none", borderRadius: 14,
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
    fontFamily: "'Inter', sans-serif",
  },
  btnDisabled: {
    width: "100%", padding: "15px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, color: "#475569",
    fontWeight: 700, fontSize: 15, cursor: "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    display: "inline-block", width: 15, height: 15,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
  status: {
    marginTop: 14, padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, fontSize: 14, color: "#94a3b8", lineHeight: 1.5,
  },
  statusSuccess: {
    marginTop: 14, padding: "12px 16px",
    background: "rgba(16,185,129,0.08)",
    border: "1px solid rgba(16,185,129,0.25)",
    borderRadius: 12, fontSize: 14, color: "#34d399", lineHeight: 1.5,
    fontWeight: 600,
  },
  statusError: {
    marginTop: 14, padding: "12px 16px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.25)",
    borderRadius: 12, fontSize: 14, color: "#f87171", lineHeight: 1.5,
  },
  link: {
    display: "block", marginTop: 12,
    color: "#818cf8", fontSize: 14,
    textDecoration: "none", fontWeight: 600,
    textAlign: "center",
  },
  resetBtn: {
    display: "block", width: "100%", marginTop: 10,
    padding: "12px",
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14, color: "#64748b",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
  },
};