import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import RegisterArt from "./components/RegisterArt";
import VerifyArt from "./components/VerifyArt";
import ART_REGISTRY_ABI from "./abi/ArtRegistry.json";

const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

// Polygon Amoy testnet (chainId 80002)
const POLYGON_AMOY_CHAIN_ID = "0x13882";
const POLYGON_AMOY_PARAMS = {
  chainId: POLYGON_AMOY_CHAIN_ID,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  rpcUrls: ["https://rpc-amoy.polygon.technology"],
  blockExplorerUrls: ["https://amoy.polygonscan.com"]
};

async function switchToPolygonAmoy() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_AMOY_CHAIN_ID }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [POLYGON_AMOY_PARAMS]
      });
    } else {
      throw err;
    }
  }
}

// Animated floating orb component
function FloatingOrbs() {
  return (
    <div style={orb.container}>
      <div style={{ ...orb.orb, ...orb.orb1 }} />
      <div style={{ ...orb.orb, ...orb.orb2 }} />
      <div style={{ ...orb.orb, ...orb.orb3 }} />
      <div style={{ ...orb.orb, ...orb.orb4 }} />
    </div>
  );
}

export default function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tab, setTab] = useState("register");
  const [connecting, setConnecting] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    setConnecting(true);
    try {
      await switchToPolygonAmoy();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const ct = new ethers.Contract(CONTRACT_ADDRESS, ART_REGISTRY_ABI, signer);
      setAccount(addr);
      setContract(ct);
    } catch (err) {
      alert("Failed to connect: " + err.message);
    }
    setConnecting(false);
  };

  return (
    <div style={s.page}>
      <style>{cssAnimations}</style>
      <FloatingOrbs />

      {/* ── NAV ── */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <span style={s.logoIcon}>⬡</span>
            <span style={s.logoText}>ArtChain</span>
          </div>
          <div style={s.navRight}>
            {account ? (
              <div style={s.walletPill}>
                <span style={s.walletDot} />
                <span style={s.walletAddr}>
                  {account.slice(0, 6)}…{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button style={s.connectBtn} onClick={connectWallet} disabled={connecting}>
                {connecting ? (
                  <><span style={s.spinner} />Connecting…</>
                ) : (
                  <>🦊 Connect Wallet</>
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header style={s.hero}>
        <div style={s.heroBadge}>
          <span style={s.heroBadgeDot} />
          Powered by Polygon
        </div>
        <h1 style={s.heroTitle}>
          Prove Your Art Is{" "}
          <span style={s.heroGradient}>Yours — Forever</span>
        </h1>
        <p style={s.heroSub}>
          Register digital artwork with an immutable on-chain timestamp.<br />
          Instant proof of ownership. No middlemen. No takebacks.
        </p>

        {!account && (
          <button style={s.heroCta} onClick={connectWallet} disabled={connecting}>
            {connecting ? "Connecting…" : "🚀 Get Started"}
          </button>
        )}

        {/* Stats row */}
        <div style={s.statsRow}>
          {[
            { label: "Chain", value: "Polygon" },
            { label: "Cost", value: "~$0.001" },
            { label: "Time", value: "< 2 sec" },
            { label: "Storage", value: "IPFS" },
          ].map(({ label, value }) => (
            <div key={label} style={s.statCard}>
              <div style={s.statVal}>{value}</div>
              <div style={s.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── TABS + CONTENT ── */}
      {account && (
        <main style={s.main}>
          <div style={s.tabRow}>
            <button
              id="tab-register"
              style={tab === "register" ? s.tabActive : s.tab}
              onClick={() => setTab("register")}
            >
              <span style={s.tabIcon}>📝</span> Register Art
            </button>
            <button
              id="tab-verify"
              style={tab === "verify" ? s.tabActive : s.tab}
              onClick={() => setTab("verify")}
            >
              <span style={s.tabIcon}>🔍</span> Verify Art
            </button>
          </div>

          <div style={s.panelWrap}>
            {tab === "register"
              ? <RegisterArt contract={contract} account={account} />
              : <VerifyArt contract={contract} />
            }
          </div>
        </main>
      )}

      {!account && (
        <div style={s.noWallet}>
          <div style={s.noWalletCard}>
            <div style={s.noWalletIcon}>🦊</div>
            <h3 style={s.noWalletTitle}>Connect your wallet to begin</h3>
            <p style={s.noWalletSub}>MetaMask required · Polygon Amoy network</p>
            <button style={s.connectBtn2} onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>⬡ ArtChain</span>
        <span style={s.footerText}>Built on Polygon · Stored on IPFS · Open Source</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────
// CSS keyframe animations (injected via <style>)
// ─────────────────────────────────────────────────
const cssAnimations = `
  @keyframes float1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(40px,-60px) scale(1.1); }
    66% { transform: translate(-30px,30px) scale(0.95); }
  }
  @keyframes float2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40% { transform: translate(-50px,40px) scale(1.08); }
    80% { transform: translate(30px,-50px) scale(0.92); }
  }
  @keyframes float3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(60px,30px) scale(1.12); }
  }
  @keyframes float4 {
    0%,100% { transform: translate(0,0) scale(1); }
    60% { transform: translate(-40px,-40px) scale(1.05); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(24px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse {
    0%,100%{ opacity:1; }
    50%{ opacity:0.5; }
  }
`;

// ─────────────────────────────────────────────────
// Floating orbs styles
// ─────────────────────────────────────────────────
const orb = {
  container: {
    position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0,
  },
  orb: {
    position: "absolute", borderRadius: "50%", filter: "blur(80px)", opacity: 0.18,
  },
  orb1: {
    width: 500, height: 500, background: "radial-gradient(circle,#7c3aed,transparent)",
    top: "-100px", left: "-100px", animation: "float1 18s ease-in-out infinite",
  },
  orb2: {
    width: 400, height: 400, background: "radial-gradient(circle,#2563eb,transparent)",
    top: "30%", right: "-80px", animation: "float2 22s ease-in-out infinite",
  },
  orb3: {
    width: 350, height: 350, background: "radial-gradient(circle,#059669,transparent)",
    bottom: "10%", left: "5%", animation: "float3 20s ease-in-out infinite",
  },
  orb4: {
    width: 300, height: 300, background: "radial-gradient(circle,#db2777,transparent)",
    bottom: "20%", right: "10%", animation: "float4 25s ease-in-out infinite",
  },
};

// ─────────────────────────────────────────────────
// Main styles
// ─────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "#060612",
    color: "#e2e8f0",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
  },

  // NAV
  nav: {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    transition: "background 0.3s, backdrop-filter 0.3s, border-color 0.3s",
    borderBottom: "1px solid transparent",
  },
  navScrolled: {
    background: "rgba(6,6,18,0.85)",
    backdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  navInner: {
    maxWidth: 1100, margin: "0 auto", padding: "0 24px",
    height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { fontSize: 26, color: "#7c3aed" },
  logoText: {
    fontSize: 20, fontWeight: 700,
    background: "linear-gradient(90deg,#a78bfa,#60a5fa)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  navRight: { display: "flex", alignItems: "center", gap: 12 },

  walletPill: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px",
    background: "rgba(16,185,129,0.1)",
    border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 24,
  },
  walletDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 8px #10b981",
    animation: "pulse 2s infinite",
    display: "inline-block",
  },
  walletAddr: { fontSize: 13, fontWeight: 600, color: "#10b981", fontFamily: "monospace" },

  connectBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 22px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none", borderRadius: 24,
    color: "#fff", fontWeight: 600, fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(124,58,237,0.4)",
    transition: "opacity 0.2s, transform 0.2s",
  },
  spinner: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  // HERO
  hero: {
    position: "relative", zIndex: 1,
    maxWidth: 800, margin: "0 auto",
    padding: "160px 24px 80px",
    textAlign: "center",
    animation: "fadeUp 0.8s ease both",
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "6px 16px", marginBottom: 28,
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.35)",
    borderRadius: 20, fontSize: 13, color: "#c4b5fd", fontWeight: 600,
  },
  heroBadgeDot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "#8b5cf6",
    boxShadow: "0 0 6px #8b5cf6",
    display: "inline-block",
  },
  heroTitle: {
    fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
    fontWeight: 900, lineHeight: 1.15,
    letterSpacing: "-0.02em",
    color: "#fff",
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: 24,
  },
  heroGradient: {
    background: "linear-gradient(135deg,#a78bfa 0%,#60a5fa 50%,#34d399 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "clamp(1rem,2vw,1.15rem)", color: "#94a3b8",
    lineHeight: 1.8, marginBottom: 40,
  },
  heroCta: {
    display: "inline-flex", alignItems: "center", gap: 10,
    padding: "16px 40px", marginBottom: 60,
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none", borderRadius: 32,
    color: "#fff", fontWeight: 700, fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(124,58,237,0.45)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  statsRow: {
    display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap",
  },
  statCard: {
    padding: "16px 28px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, textAlign: "center",
    backdropFilter: "blur(8px)",
  },
  statVal: { fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: "'Space Grotesk',sans-serif" },
  statLabel: { fontSize: 12, color: "#64748b", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },

  // MAIN
  main: {
    position: "relative", zIndex: 1,
    maxWidth: 720, margin: "0 auto", padding: "0 24px 80px",
    animation: "fadeUp 0.6s ease both",
  },
  tabRow: {
    display: "flex", gap: 8, marginBottom: 24,
    padding: "6px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
  },
  tab: {
    flex: 1, padding: "12px 20px",
    background: "transparent", border: "none",
    borderRadius: 16, color: "#64748b",
    cursor: "pointer", fontSize: 14, fontWeight: 600,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "background 0.2s, color 0.2s",
  },
  tabActive: {
    flex: 1, padding: "12px 20px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none",
    borderRadius: 16, color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
  },
  tabIcon: { fontSize: 16 },
  panelWrap: { animation: "fadeUp 0.4s ease both" },

  // NO WALLET state
  noWallet: {
    position: "relative", zIndex: 1,
    display: "flex", justifyContent: "center",
    padding: "0 24px 80px",
  },
  noWalletCard: {
    maxWidth: 380, width: "100%", textAlign: "center",
    padding: "40px 32px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    backdropFilter: "blur(12px)",
  },
  noWalletIcon: { fontSize: 52, marginBottom: 16 },
  noWalletTitle: { fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 10 },
  noWalletSub: { fontSize: 13, color: "#64748b", marginBottom: 24 },
  connectBtn2: {
    width: "100%", padding: "14px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none", borderRadius: 16,
    color: "#fff", fontWeight: 700, fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
  },

  // FOOTER
  footer: {
    position: "relative", zIndex: 1,
    borderTop: "1px solid rgba(255,255,255,0.05)",
    padding: "28px 24px",
    display: "flex", justifyContent: "center", alignItems: "center",
    gap: 20, flexWrap: "wrap",
  },
  footerLogo: {
    fontSize: 15, fontWeight: 700, color: "#a78bfa",
    fontFamily: "'Space Grotesk',sans-serif",
  },
  footerText: { fontSize: 13, color: "#334155" },
};