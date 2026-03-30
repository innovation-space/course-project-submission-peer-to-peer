import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import RegisterArt from "./components/RegisterArt";
import VerifyArt from "./components/VerifyArt";
import ArtGallery from "./components/ArtGallery";
import BlockchainBackground from "./components/BlockchainBackground";
import ART_REGISTRY_ABI from "./abi/ArtRegistry.json";
import { getGithubAuthUrl, fetchGithubProfile, hasRealClientId, saveClientId } from "./utils/githubAuth";

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

/** 
 * MockArtRegistry mimics the blockchain contract for Guest Mode.
 * This allows the app to function without MetaMask.
 */
class MockArtRegistry {
  constructor() {
    this.filters = { ArtworkRegistered: () => ({ isMock: true }) };
  }
  async registerArtwork(hash, title, artist, ipfsURI) {
    const art = { 
      hash, title, artist, ipfsURI, 
      owner: "0xGuest_" + Math.random().toString(36).slice(2, 6), 
      timestamp: Math.floor(Date.now() / 1000), 
      isMock: true 
    };
    const local = JSON.parse(localStorage.getItem("MOCK_ART") || "[]");
    localStorage.setItem("MOCK_ART", JSON.stringify([art, ...local]));
    
    // Also save to GASLESS_ART for integrated gallery
    const existingGasless = JSON.parse(localStorage.getItem("GASLESS_ART") || "[]");
    localStorage.setItem("GASLESS_ART", JSON.stringify([
      { ...art, isGasless: true }, 
      ...existingGasless
    ]));

    return { hash: "0x_mock_tx_" + Math.random().toString(36).slice(2), wait: async () => true };
  }
  async verifyArtwork(hash) {
    const local = JSON.parse(localStorage.getItem("MOCK_ART") || "[]");
    const art = local.find(a => a.hash === hash);
    if (!art) throw new Error("NotFound");
    return [art.title, art.artist, art.ipfsURI, art.owner, art.timestamp];
  }
  async queryFilter() { return []; } 
}

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

/** 
 * Floating Orbs have been replaced with the Blockchain Node Network 
 * for a more technical, 3D system feel.
 */

export default function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [tab, setTab] = useState("register"); // "register", "verify", or "gallery"
  const [isGasless, setIsGasless] = useState(false); // New: Skip gas for demo
  const [isGuest, setIsGuest] = useState(false); // New: Skip metamask
  const [connecting, setConnecting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [githubUser, setGithubUser] = useState(null); // { username, avatar, profileUrl }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GitHub Auth Listener
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      // Remove code from URL to keep it clean
      window.history.replaceState({}, document.title, "/");
      
      const login = async () => {
        const user = await fetchGithubProfile(code);
        if (user) setGithubUser(user);
      };
      login();
    }
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

  const connectGuest = () => {
    setIsGuest(true);
    setAccount("0xGuest_" + Math.random().toString(36).slice(2, 8));
    setContract(new MockArtRegistry());
    setIsGasless(true); // Auto-enable gasless for guest
  };

  return (
    <div style={s.page}>
      <style>{cssAnimations}</style>
      <BlockchainBackground />

      {/* ── NAV ── */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.navInner}>
          <div style={s.logo}>
            <div style={s.logoHex}>
              <span style={s.logoIcon}>⬡</span>
            </div>
            <span style={s.logoText}>ArtChain</span>
          </div>
          <div style={s.navRight}>
            {/* Gasless Toggle */}
            <div style={s.gaslessToggle} onClick={() => setIsGasless(!isGasless)}>
               <div style={{ ...s.gaslessDot, ...(isGasless ? s.gaslessDotOn : {}) }} />
               <span style={{ ...s.gaslessLabel, ...(isGasless ? s.gaslessLabelOn : {}) }}>
                 {isGasless ? "SYS/GASLESS" : "SYS/STANDARD"}
               </span>
            </div>

            {/* GitHub Profile / Connect */}
            {githubUser ? (
              <a 
                href={githubUser.profileUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={s.githubPill}
              >
                <img src={githubUser.avatar} alt="avatar" style={s.githubAvatar} />
                <span style={s.githubName}>{githubUser.username}</span>
              </a>
            ) : (
              <div style={s.githubActions}>
                <button 
                  style={s.githubBtn} 
                  onClick={() => {
                    if (hasRealClientId()) {
                      window.open(getGithubAuthUrl(), "_blank", "width=600,height=700");
                    } else {
                      alert("⚠️ Action Required: Please setup your GitHub Client ID in githubAuth.js or use the Demo mode below.");
                    }
                  }}
                >
                  <span style={s.githubIcon}>🐙</span> Connect
                </button>
                {!hasRealClientId() && (
                  <button 
                    style={s.demoBtn} 
                    onClick={async () => {
                      const user = prompt("Enter your GitHub username for the demo:", "smaya");
                      if (user) {
                        setConnecting(true);
                        try {
                          const res = await fetch(`https://api.github.com/users/${user}`);
                          const data = await res.json();
                          if (data.login) {
                            setGithubUser({
                              username: data.login,
                              avatar: data.avatar_url,
                              profileUrl: data.html_url
                            });
                          } else {
                            alert("User not found!");
                          }
                        } catch (e) {
                          alert("Failed to fetch profile");
                        }
                        setConnecting(false);
                      }
                    }}
                  >
                    Demo
                  </button>
                )}
              </div>
            )}

            {/* Wallet Profile / Connect */}
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
                  <>Connect Wallet</>
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
          Certified by Polygon
        </div>
        <h1 style={s.heroTitle}>
          The Future of <br />
          <span style={s.heroGradient}>Digital Provenance</span>
        </h1>
        <p style={s.heroSub}>
          Protect your creative legacy with institutional-grade blockchain <br />
          timestamps and decentralized storage.
        </p>

        {!account && (
          <div style={s.heroCtaGroup}>
            <button style={s.heroCta} onClick={connectWallet} disabled={connecting}>
              {connecting ? "Initializing…" : "Secure Your Art"}
            </button>
            <div style={s.heroCtaSub}>No subscription · Pay per registration</div>
          </div>
        )}

        {/* Stats Row */}
        <div style={s.statsGrid}>
          {[
            { label: "Network", value: "Polygon Amoy", icon: "🔗" },
            { label: "Gas Fee", value: "< $0.01", icon: "⚡" },
            { label: "Finality", value: "~2 Seconds", icon: "⏱️" },
            { label: "Storage", value: "IPFS Global", icon: "📦" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={s.statCard}>
              <div style={s.statIcon}>{icon}</div>
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
              <span style={s.tabIcon}>📝</span> Register
            </button>
            <button
              id="tab-verify"
              style={tab === "verify" ? s.tabActive : s.tab}
              onClick={() => setTab("verify")}
            >
              <span style={s.tabIcon}>🔍</span> Verify
            </button>
            <button
              id="tab-gallery"
              style={tab === "gallery" ? s.tabActive : s.tab}
              onClick={() => setTab("gallery")}
            >
              <span style={s.tabIcon}>🖼️</span> Gallery
            </button>
          </div>

          <div style={s.panelWrap}>
            {tab === "register" ? (
              <RegisterArt 
                contract={contract} 
                account={account} 
                isGasless={isGasless} 
              />
            ) : tab === "verify" ? (
              <VerifyArt contract={contract} isGasless={isGasless} />
            ) : (
              <ArtGallery contract={contract} isGasless={isGasless} />
            )}
          </div>
        </main>
      )}

      {(!account && !isGuest) && (
        <div style={s.noWallet}>
          <div style={s.noWalletCard}>
            <div style={s.noWalletIcon}>🦊</div>
            <h3 style={s.noWalletTitle}>Experience ArtChain Today</h3>
            <p style={s.noWalletSub}>No wallet? No problem. Continue as a guest to build your registry for free.</p>
            <div style={s.noWalletActions}>
               <button style={s.connectBtn2} onClick={connectWallet} disabled={connecting}>
                 {connecting ? "Connecting…" : "Connect MetaMask"}
               </button>
               <button style={s.guestBtn} onClick={connectGuest}>
                 Continue as Guest ➔
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer style={s.footer}>
        <span style={s.footerLogo}>⬡ ART_CHAIN_v2.0</span>
        <span style={s.footerText}>PROTOCOL: POLYGON // STORAGE: IPFS // STATUS: OPERATIONAL</span>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────
// CSS keyframe animations (injected via <style>)
// ─────────────────────────────────────────────────
const cssAnimations = `
  @keyframes float1 {
    0%,100% { transform: translate(0,0) scale(1) rotate(0deg); }
    33% { transform: translate(60px,-80px) scale(1.15) rotate(5deg); }
    66% { transform: translate(-40px,40px) scale(0.9) rotate(-3deg); }
  }
  @keyframes float2 {
    0%,100% { transform: translate(0,0) scale(1); }
    40% { transform: translate(-70px,60px) scale(1.1); }
    80% { transform: translate(40px,-70px) scale(0.85); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(30px); filter: blur(10px); }
    to   { opacity:1; transform:translateY(0); filter: blur(0); }
  }
  @keyframes pulse {
    0%,100%{ opacity:1; transform: scale(1); }
    50%{ opacity:0.6; transform: scale(0.98); }
  }
  @keyframes glow {
    0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
    50% { box-shadow: 0 0 40px rgba(124,58,237,0.6); }
  }
  @keyframes borderFlow {
    0% { border-color: rgba(124,58,237,0.2); }
    50% { border-color: rgba(96,165,250,0.5); }
    100% { border-color: rgba(124,58,237,0.2); }
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
    position: "absolute", borderRadius: "50%", filter: "blur(120px)", opacity: 0.12,
  },
  orb1: {
    width: 700, height: 700, background: "radial-gradient(circle,#7c3aed,transparent)",
    top: "-200px", left: "-200px", animation: "float1 25s ease-in-out infinite",
  },
  orb2: {
    width: 600, height: 600, background: "radial-gradient(circle,#2563eb,transparent)",
    top: "20%", right: "-150px", animation: "float2 30s ease-in-out infinite",
  },
  orb3: {
    width: 500, height: 500, background: "radial-gradient(circle,#059669,transparent)",
    bottom: "-100px", left: "10%", animation: "float1 28s ease-in-out infinite reverse",
  },
};

// ─────────────────────────────────────────────────
// Main styles
// ─────────────────────────────────────────────────
const s = {
  page: {
    minHeight: "100vh",
    background: "transparent",
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
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoHex: {
    width: 32, height: 32,
    background: "rgba(124,58,237,0.15)",
    border: "1px solid rgba(124,58,237,0.4)",
    borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    transform: "rotate(15deg)",
  },
  logoIcon: { fontSize: 22, color: "#a78bfa", transform: "rotate(-15deg)" },
  logoText: {
    fontSize: 20, fontWeight: 900,
    color: "#fff",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "2px",
    textTransform: "uppercase"
  },
  navRight: { display: "flex", alignItems: "center", gap: 12 },

  walletPill: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px",
    background: "rgba(16,185,129,0.06)",
    border: "1px solid rgba(16,185,129,0.2)",
    borderRadius: 24,
    backdropFilter: "blur(8px)",
  },
  walletDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#10b981",
    boxShadow: "0 0 12px #10b981",
    animation: "pulse 2s infinite",
    display: "inline-block",
  },
  walletAddr: { fontSize: 13, fontWeight: 700, color: "#10b981", fontFamily: "monospace" },

  connectBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 24px",
    background: "linear-gradient(135deg,#7c3aed,#2563eb)",
    border: "none", borderRadius: 24,
    color: "#fff", fontWeight: 700, fontSize: 13,
    textTransform: "uppercase", letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(124,58,237,0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    animation: "glow 3s infinite",
  },
  spinner: {
    display: "inline-block", width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff", borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },

  githubBtn: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "8px 16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24, color: "#fff",
    fontSize: 13, fontWeight: 700, cursor: "pointer",
    transition: "background 0.2s, transform 0.2s",
    backdropFilter: "blur(4px)",
  },
  githubIcon: { fontSize: 16 },
  githubPill: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "6px 12px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 24, textDecoration: "none", color: "#fff",
    fontSize: 13, fontWeight: 700,
    transition: "background 0.2s",
  },
  githubAvatar: { width: 22, height: 22, borderRadius: "50%", background: "#334155" },
  githubName: { opacity: 0.9 },
  githubActions: { display: "flex", gap: 8 },
  demoBtn: {
    background: "rgba(124,58,237,0.1)",
    border: "1px solid rgba(124,58,237,0.2)",
    borderRadius: 16, color: "#a78bfa",
    padding: "6px 14px", fontSize: "11px", fontWeight: 700,
    cursor: "pointer", textTransform: "uppercase",
  },
  gaslessToggle: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "8px 14px", marginRight: 8,
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 24, cursor: "pointer",
    transition: "all 0.3s",
  },
  gaslessDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#475569", transition: "all 0.3s",
  },
  gaslessDotOn: {
    background: "#22c55e", 
    boxShadow: "0 0 10px #22c55e",
  },
  gaslessLabel: {
    fontSize: 11, fontWeight: 700,
    color: "#475569", textTransform: "uppercase",
    transition: "all 0.3s", letterSpacing: "0.5px",
  },
  gaslessLabelOn: { color: "#fff" },

  // GUEST MODE
  guestBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, color: "#fff",
    padding: "16px 24px", fontSize: "14px", fontWeight: 700,
    cursor: "pointer", transition: "all 0.2s",
    marginTop: 12,
  },
  noWalletActions: { display: "flex", flexDirection: "column", width: "100%", gap: 8 },

  // HERO
  hero: {
    position: "relative", zIndex: 1,
    maxWidth: 900, margin: "0 auto",
    padding: "180px 24px 100px",
    textAlign: "center",
    animation: "fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "8px 18px", marginBottom: 32,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 30, fontSize: 12, color: "#94a3b8", fontWeight: 700,
    textTransform: "uppercase", letterSpacing: "1px",
  },
  heroBadgeDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: "#60a5fa",
    boxShadow: "0 0 8px #60a5fa",
    display: "inline-block",
  },
  heroTitle: {
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
    fontWeight: 900, lineHeight: 1.05,
    letterSpacing: "-0.04em",
    color: "#fff",
    fontFamily: "'Space Mono', monospace",
    marginBottom: 28,
  },
  heroGradient: {
    background: "linear-gradient(135deg,#fff 0%,#a78bfa 40%,#60a5fa 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "clamp(1.1rem, 2vw, 1.25rem)", color: "#64748b",
    lineHeight: 1.6, marginBottom: 48, fontWeight: 400,
  },
  heroCtaGroup: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 80,
  },
  heroCta: {
    display: "inline-flex", alignItems: "center", gap: 10,
    padding: "18px 48px",
    background: "#fff",
    border: "none", borderRadius: 40,
    color: "#02020a", fontWeight: 800, fontSize: 16,
    cursor: "pointer",
    boxShadow: "0 10px 40px rgba(255,255,255,0.15)",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  heroCtaSub: { fontSize: 12, color: "#475569", fontWeight: 500 },

  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "1px", background: "rgba(255,255,255,0.06)",
    borderRadius: 24, overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
    maxWidth: 800, margin: "0 auto",
  },
  statCard: {
    padding: "32px 20px",
    background: "#02020a",
    textAlign: "center",
    transition: "background 0.3s",
  },
  statIcon: { fontSize: 24, marginBottom: 16, filter: "drop-shadow(0 0 8px rgba(124,58,237,0.3))" },
  statVal: { 
    fontSize: 17, fontWeight: 800, color: "#fff", 
    fontFamily: "'Space Mono', monospace", marginBottom: 4 
  },
  statLabel: { fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" },

  // MAIN
  main: {
    position: "relative", zIndex: 1,
    maxWidth: 760, margin: "0 auto", padding: "0 24px 120px",
    animation: "fadeUp 0.8s ease both",
  },
  tabRow: {
    display: "flex", gap: 0, marginBottom: 32,
    padding: "4px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    position: "relative",
  },
  tab: {
    flex: 1, padding: "14px 24px",
    background: "transparent", border: "none",
    borderRadius: 20, color: "#475569",
    cursor: "pointer", fontSize: 14, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    transition: "color 0.3s",
    zIndex: 2,
  },
  tabActive: {
    flex: 1, padding: "14px 24px",
    background: "rgba(255,255,255,0.05)",
    border: "none",
    borderRadius: 20, color: "#fff",
    cursor: "pointer", fontSize: 14, fontWeight: 800,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
    zIndex: 2,
    boxShadow: "inset 0 0 20px rgba(255,255,255,0.02)",
  },
  tabIcon: { fontSize: 18 },
  panelWrap: { animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both" },

  // NO WALLET state
  noWallet: {
    position: "relative", zIndex: 1,
    display: "flex", justifyContent: "center",
    padding: "0 24px 120px",
  },
  noWalletCard: {
    maxWidth: 400, width: "100%", textAlign: "center",
    padding: "50px 40px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 32,
    backdropFilter: "blur(20px)",
  },
  noWalletIcon: { fontSize: 64, marginBottom: 20, filter: "drop-shadow(0 0 20px rgba(124,58,237,0.3))" },
  noWalletTitle: { 
    fontSize: 22, fontWeight: 800, color: "#fff", 
    marginBottom: 12, fontFamily: "'Space Mono', monospace" 
  },
  noWalletSub: { fontSize: 14, color: "#64748b", marginBottom: 32, lineHeight: 1.5 },
  connectBtn2: {
    width: "100%", padding: "16px",
    background: "#fff",
    border: "none", borderRadius: 20,
    color: "#02020a", fontWeight: 800, fontSize: 15,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(255,255,255,0.1)",
    transition: "transform 0.2s",
  },

  // FOOTER
  footer: {
    position: "relative", zIndex: 1,
    padding: "60px 24px",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 16,
  },
  footerLogo: {
    fontSize: 18, fontWeight: 800, color: "#fff",
    fontFamily: "'Space Mono', monospace",
    letterSpacing: "2px",
  },
  footerText: { fontSize: 12, color: "#334155", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" },
};