import { useState } from "react";
import { hashFile } from "../utils/contract";

export default function VerifyArt({ contract }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) handleFile(dropped);
  };

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
        hash: imageHash,
      });
    } catch (err) {
      if (err.message.includes("NotFound")) {
        setError("This artwork is NOT registered in the registry.");
      } else {
        setError("Error: " + err.message);
      }
    }
    setLoading(false);
  };

  return (
    <div style={s.card}>
      {/* Drop zone */}
      <div
        style={{
          ...s.dropZone,
          ...(dragging ? s.dropZoneActive : {}),
          ...(preview ? s.dropZoneHasImage : {}),
        }}
        onClick={() => document.getElementById("verify-file-input").click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {preview ? (
          <img src={preview} alt="preview" style={s.preview} />
        ) : (
          <div style={s.dropInner}>
            <div style={s.dropIcon}>🔍</div>
            <div style={s.dropText}>Drop artwork to verify</div>
            <div style={s.dropSub}>or click to browse · PNG, JPG, GIF, SVG</div>
          </div>
        )}
        <input
          id="verify-file-input"
          type="file"
          accept="image/*"
          onChange={(e) => handleFile(e.target.files[0])}
          style={{ display: "none" }}
        />
      </div>

      <button
        id="btn-verify"
        style={loading ? s.btnDisabled : s.btn}
        onClick={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <><span style={s.spinner} />Verifying…</>
        ) : (
          "🔍 Verify Ownership"
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <div style={s.errorIcon}>✗</div>
          <div>
            <div style={s.errorTitle}>Not Registered</div>
            <div style={s.errorSub}>{error}</div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={s.resultBox}>
          <div style={s.resultHeader}>
            <div style={s.checkCircle}>✓</div>
            <div>
              <div style={s.resultTitle}>Ownership Verified</div>
              <div style={s.resultSub}>This artwork is on-chain</div>
            </div>
          </div>

          <div style={s.divider} />

          {[
            { label: "Title", value: result.title },
            { label: "Artist", value: result.artist },
            { label: "Owner", value: `${result.owner.slice(0, 8)}…${result.owner.slice(-6)}`, mono: true },
            { label: "Registered", value: result.date },
            { label: "Hash", value: `${result.hash.slice(0, 16)}…`, mono: true, small: true },
          ].map(({ label, value, mono, small }) => (
            <div key={label} style={s.row}>
              <span style={s.rowLabel}>{label}</span>
              <span style={{
                ...s.rowValue,
                ...(mono ? s.rowMono : {}),
                ...(small ? { fontSize: 11 } : {}),
              }}>
                {value}
              </span>
            </div>
          ))}

          {result.ipfsURI && (
            <a
              href={result.ipfsURI.replace("ipfs://", "https://ipfs.io/ipfs/")}
              target="_blank"
              rel="noreferrer"
              style={s.ipfsLink}
            >
              🖼️ View on IPFS ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24, padding: "28px 28px 24px",
    backdropFilter: "blur(12px)",
  },
  dropZone: {
    border: "2px dashed rgba(16,185,129,0.3)",
    borderRadius: 18, cursor: "pointer",
    marginBottom: 16, overflow: "hidden",
    minHeight: 160,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(16,185,129,0.03)",
    transition: "border-color 0.2s, background 0.2s",
  },
  dropZoneActive: { borderColor: "#10b981", background: "rgba(16,185,129,0.07)" },
  dropZoneHasImage: { border: "2px solid rgba(16,185,129,0.35)", minHeight: 200 },
  dropInner: { textAlign: "center", padding: "24px 16px" },
  dropIcon: { fontSize: 40, marginBottom: 10 },
  dropText: { fontSize: 15, fontWeight: 600, color: "#6ee7b7", marginBottom: 6 },
  dropSub: { fontSize: 12, color: "#475569" },
  preview: { width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 16 },

  btn: {
    width: "100%", padding: "15px",
    background: "linear-gradient(135deg,#059669,#0ea5e9)",
    border: "none", borderRadius: 14,
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 4px 20px rgba(5,150,105,0.35)",
    fontFamily: "'Inter', sans-serif",
    marginBottom: 16,
  },
  btnDisabled: {
    width: "100%", padding: "15px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, color: "#475569",
    fontWeight: 700, fontSize: 15, cursor: "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "'Inter', sans-serif",
    marginBottom: 16,
  },
  spinner: {
    display: "inline-block", width: 15, height: 15,
    border: "2px solid rgba(255,255,255,0.2)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  errorBox: {
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: "16px", borderRadius: 14,
    background: "rgba(239,68,68,0.07)",
    border: "1px solid rgba(239,68,68,0.2)",
  },
  errorIcon: {
    width: 32, height: 32, borderRadius: "50%",
    background: "rgba(239,68,68,0.15)",
    border: "1px solid rgba(239,68,68,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#f87171", fontWeight: 700, fontSize: 16, flexShrink: 0,
  },
  errorTitle: { fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 4 },
  errorSub: { fontSize: 13, color: "#94a3b8" },

  resultBox: {
    padding: "20px",
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 18,
    animation: "fadeUp 0.4s ease both",
  },
  resultHeader: { display: "flex", gap: 14, alignItems: "center", marginBottom: 16 },
  checkCircle: {
    width: 40, height: 40, borderRadius: "50%",
    background: "linear-gradient(135deg,#059669,#0ea5e9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 900, fontSize: 20, flexShrink: 0,
  },
  resultTitle: { fontSize: 15, fontWeight: 700, color: "#34d399" },
  resultSub: { fontSize: 12, color: "#475569" },
  divider: { height: 1, background: "rgba(255,255,255,0.06)", margin: "0 0 16px" },

  row: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 12, marginBottom: 10,
  },
  rowLabel: { fontSize: 12, color: "#475569", fontWeight: 600, minWidth: 80, paddingTop: 1 },
  rowValue: { fontSize: 13, color: "#e2e8f0", textAlign: "right", wordBreak: "break-all", flex: 1 },
  rowMono: { fontFamily: "monospace", color: "#a78bfa" },

  ipfsLink: {
    display: "block", marginTop: 14,
    color: "#60a5fa", fontSize: 13, fontWeight: 600,
    textDecoration: "none", textAlign: "center",
  },
};