import { useState } from "react";
import { hashFile } from "../utils/contract";

export default function VerifyArt({ contract }) {
  const [file, setFile]     = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleVerify = async () => {
    if (!file) return alert("Please select an image!");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const imageHash = await hashFile(file);
      const [title, artist, ipfsURI, owner, timestamp] =
        await contract.verifyArtwork(imageHash);

      setResult({
        title, artist, ipfsURI, owner,
        date: new Date(Number(timestamp) * 1000).toLocaleString(),
        hash: imageHash
      });
    } catch (err) {
      if (err.message.includes("NotFound")) {
        setError("❌ This artwork is NOT registered in the registry.");
      } else {
        setError("Error: " + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={s.card}>
      <h2 style={s.h2}>🔍 Verify Artwork Ownership</h2>
      <input style={s.input} type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} />
      <button style={s.btn} onClick={handleVerify} disabled={loading}>
        {loading ? "Verifying..." : "🔍 Verify Ownership"}
      </button>

      {error && <div style={s.error}>{error}</div>}

      {result && (
        <div style={s.result}>
          <div style={s.success}>✅ Artwork Found — Ownership Verified!</div>
          <div style={s.row}><span style={s.lbl}>Title</span><span>{result.title}</span></div>
          <div style={s.row}><span style={s.lbl}>Artist</span><span>{result.artist}</span></div>
          <div style={s.row}><span style={s.lbl}>Owner</span><span style={s.mono}>{result.owner}</span></div>
          <div style={s.row}><span style={s.lbl}>Registered</span><span>{result.date}</span></div>
          <div style={s.row}><span style={s.lbl}>Hash</span><span style={{...s.mono, fontSize:11, wordBreak:"break-all"}}>{result.hash}</span></div>
          {result.ipfsURI && (
            <a href={result.ipfsURI.replace("ipfs://", "https://ipfs.io/ipfs/")} target="_blank" rel="noreferrer" style={s.link}>
              🖼️ View on IPFS
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  card:    { background: "#12122a", border: "1px solid #1e1e48", borderRadius: 16, padding: "28px 24px" },
  h2:      { marginBottom: 20, color: "#c9aaff" },
  input:   { display: "block", width: "100%", padding: "12px 16px", margin: "0 0 14px", background: "#0b0b18", border: "1px solid #2e2b5a", borderRadius: 10, color: "#e2e2f0", fontSize: 14 },
  btn:     { width: "100%", padding: "14px", background: "linear-gradient(90deg,#38e8a8,#5eaeff)", border: "none", borderRadius: 12, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 },
  result:  { marginTop: 18, padding: "16px", background: "#0e0e22", borderRadius: 12 },
  success: { color: "#38e8a8", fontWeight: 700, marginBottom: 14 },
  row:     { display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10, fontSize: 14, alignItems: "flex-start" },
  lbl:     { color: "#555a7a", minWidth: 80 },
  mono:    { fontFamily: "monospace", color: "#c9aaff" },
  error:   { marginTop: 14, padding: "12px 16px", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, color: "#f87171", fontSize: 14 },
  link:    { display: "block", marginTop: 12, color: "#5eaeff", fontSize: 14 }
};