import { useState, useRef } from "react";
import { hashFile } from "../utils/contract";

export default function VerifyArt({ contract, isGasless }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setTilt({ x: x * 8, y: -y * 8 });
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

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
      let details;

      // 1. Try Local Database (Gasless Mode)
      const localArt = JSON.parse(localStorage.getItem("GASLESS_ART") || "[]");
      const foundLocal = localArt.find(a => a.hash === imageHash);

      if (foundLocal) {
        details = {
          ...foundLocal,
          isGasless: true,
          date: new Date(foundLocal.timestamp * 1000).toLocaleString()
        };
      } else if (contract) {
        // 2. Fallback to Blockchain if not found locally or if wallet connected
        const [title, artist, ipfsURI, owner, timestamp] = await contract.verifyArtwork(imageHash);
        details = {
          title, artist, ipfsURI, owner,
          date: new Date(Number(timestamp) * 1000).toLocaleString(),
          hash: imageHash,
          isGasless: false
        };
      } else {
        throw new Error("Artwork not found locally and wallet is not connected.");
      }

      setResult(details);
    } catch (err) {
      if (err.message.includes("NotFound") || err.message.includes("not found")) {
        setError("This artwork is NOT registered in the registry.");
      } else if (err.message.includes("could not decode")) {
        setError("Registry Connection Error: Ensure you are on the Polygon Amoy Testnet.");
      } else {
        setError("Error: " + err.message);
      }
    }
    setLoading(false);
  };

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
          <><span style={s.spinner} />Authenticating…</>
        ) : (
          "Verify Ownership"
        )}
      </button>

      {/* Error */}
      {error && (
        <div style={s.errorBox}>
          <div style={s.errorIcon}>✗</div>
          <div>
            <div style={s.errorTitle}>Verification Failed</div>
            <div style={s.errorSub}>{error}</div>
          </div>
        </div>
      )}

      {/* Result (Certificate Design) */}
      {result && (
        <div style={s.resultBox}>
          <div style={s.certHeader}>
            <div style={{ ...s.certSeal, ...(result.isGasless ? s.gaslessSeal : {}) }}>
              <div style={s.certSealInner}>{result.isGasless ? "⚡" : "✓"}</div>
            </div>
            <div style={s.certHeaderRight}>
              <div style={s.certTitle}>{result.isGasless ? "Eco Authenticity Proof" : "Authenticity Certificate"}</div>
              <div style={s.certID}>ID: {result.hash.slice(2, 14)}</div>
            </div>
          </div>

          <div style={s.divider} />

          <div style={s.certBody}>
            {[
              { label: "Artwork Title", value: result.title },
              { label: "Creator Name", value: result.artist },
              { label: "Current Owner", value: `${result.owner.slice(0, 10)}…${result.owner.slice(-8)}`, mono: true },
              { label: "Registry Date", value: result.date },
            ].map(({ label, value, mono }) => (
              <div key={label} style={s.certRow}>
                <span style={s.certLabel}>{label}</span>
                <span style={{ ...s.certValue, ...(mono ? s.certMono : {}) }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={s.certFooter}>
            <div style={result.isGasless ? s.gaslessBadge : s.certBadge}>
              {result.isGasless ? "ECO VERIFIED" : "POLYGON SECURED"}
            </div>
            {result.ipfsURI && (
              <a
                href={result.ipfsURI.replace("ipfs://", "https://ipfs.io/ipfs/")}
                target="_blank"
                rel="noreferrer"
                style={s.ipfsLink}
              >
                View metadata on IPFS ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 32, padding: "40px",
    backdropFilter: "blur(20px)",
    transition: "transform 0.1s ease-out",
    boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
  },
  dropZone: {
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 24, cursor: "pointer",
    marginBottom: 32, overflow: "hidden",
    minHeight: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(16,185,129,0.02)",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  dropZoneActive: { borderColor: "#10b981", background: "rgba(16,185,129,0.08)", transform: "scale(1.02)" },
  dropZoneHasImage: { border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" },
  dropInner: { textAlign: "center", padding: "40px 20px" },
  dropIcon: { fontSize: 48, marginBottom: 16 },
  dropText: { fontSize: 17, fontWeight: 700, color: "#6ee7b7", marginBottom: 8 },
  dropSub: { fontSize: 13, color: "#475569", fontWeight: 500 },
  preview: { width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 16 },

  btn: {
    width: "100%", padding: "18px",
    background: "#fff",
    border: "none", borderRadius: 20,
    color: "#02020a", fontWeight: 800, fontSize: 16,
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    boxShadow: "0 10px 30px rgba(255,255,255,0.1)",
    fontFamily: "'Inter', sans-serif",
    transition: "transform 0.2s",
    marginBottom: 24,
  },
  btnDisabled: {
    width: "100%", padding: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 20, color: "#334155",
    fontWeight: 800, fontSize: 16, cursor: "not-allowed",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    fontFamily: "'Inter', sans-serif",
    marginBottom: 24,
  },
  spinner: {
    display: "inline-block", width: 18, height: 18,
    border: "3px solid rgba(16,185,129,0.2)",
    borderTopColor: "#10b981", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  errorBox: {
    display: "flex", gap: 14, alignItems: "flex-start",
    padding: "20px", borderRadius: 20,
    background: "rgba(239,68,68,0.04)",
    border: "1px solid rgba(239,68,68,0.15)",
  },
  errorIcon: {
    width: 36, height: 36, borderRadius: "50%",
    background: "rgba(239,68,68,0.1)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#f87171", fontWeight: 800, fontSize: 18, flexShrink: 0,
  },
  errorTitle: { fontSize: 15, fontWeight: 800, color: "#f87171", marginBottom: 4 },
  errorSub: { fontSize: 14, color: "#94a3b8", lineHeight: 1.5 },

  resultBox: {
    padding: "40px",
    background: "linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24,
    animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
    position: "relative", overflow: "hidden",
  },
  certHeader: { display: "flex", gap: 20, alignItems: "center", marginBottom: 32 },
  certSeal: {
    width: 60, height: 60, borderRadius: "50%",
    background: "linear-gradient(135deg,#059669,#0ea5e9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, padding: 4,
  },
  certSealInner: {
    width: "100%", height: "100%", borderRadius: "50%",
    border: "2px dashed rgba(255,255,255,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 900, fontSize: 28,
  },
  certHeaderRight: { flex: 1 },
  certTitle: { fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4, textTransform: "uppercase", letterSpacing: "1px" },
  certID: { fontSize: 12, color: "#475569", fontFamily: "monospace", letterSpacing: "1px" },

  divider: { height: 1, background: "rgba(255,255,255,0.08)", margin: "0 0 32px" },

  certBody: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 },
  certRow: { display: "flex", flexDirection: "column", gap: 6 },
  certLabel: { fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" },
  certValue: { fontSize: 16, color: "#fff", fontWeight: 600 },
  certMono: { fontFamily: "monospace", color: "#60a5fa", fontSize: 14 },

  certFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  certBadge: {
    fontSize: 10, fontWeight: 900, color: "#10b981",
    padding: "6px 12px", background: "rgba(16,185,129,0.1)",
    borderRadius: 8, letterSpacing: "2px",
  },
  gaslessBadge: {
    fontSize: 10, fontWeight: 900, color: "#22c55e",
    padding: "6px 12px", background: "rgba(34,197,94,0.1)",
    borderRadius: 8, letterSpacing: "2px",
  },
  gaslessSeal: { background: "linear-gradient(135deg,#22c55e,#10b981)" },
  ipfsLink: { color: "#475569", fontSize: 12, fontWeight: 700, textDecoration: "none" },
};