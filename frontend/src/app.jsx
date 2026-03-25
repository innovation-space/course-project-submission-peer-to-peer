import { useState, useEffect } from "react";
import { ethers } from "ethers";
import RegisterArt from "./components/RegisterArt";
import VerifyArt from "./components/VerifyArt";
import ART_REGISTRY_ABI from "./abi/ArtRegistry.json";

// ← Paste your deployed contract address here after deploying
const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE";

export default function App() {
  const [account, setAccount]     = useState(null);
  const [contract, setContract]   = useState(null);
  const [tab, setTab]             = useState("register");

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask!");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer   = await provider.getSigner();
    const addr     = await signer.getAddress();
    const ct       = new ethers.Contract(CONTRACT_ADDRESS, ART_REGISTRY_ABI, signer);
    setAccount(addr);
    setContract(ct);
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>🎨 Blockchain Art Registry</h1>
        <p style={styles.subtitle}>Register & verify digital art ownership on-chain</p>
        {account ? (
          <div style={styles.wallet}>
            ✅ {account.slice(0,6)}...{account.slice(-4)}
          </div>
        ) : (
          <button style={styles.btn} onClick={connectWallet}>
            🦊 Connect MetaMask
          </button>
        )}
      </header>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={tab === "register" ? styles.tabActive : styles.tab}
          onClick={() => setTab("register")}
        >📝 Register Art</button>
        <button
          style={tab === "verify" ? styles.tabActive : styles.tab}
          onClick={() => setTab("verify")}
        >🔍 Verify Art</button>
      </div>

      {/* Content */}
      <main style={styles.main}>
        {!account ? (
          <div style={styles.notice}>
            👆 Connect your MetaMask wallet to get started
          </div>
        ) : tab === "register" ? (
          <RegisterArt contract={contract} account={account} />
        ) : (
          <VerifyArt contract={contract} />
        )}
      </main>
    </div>
  );
}

const styles = {
  app:       { minHeight: "100vh", background: "#0b0b18", color: "#e2e2f0", fontFamily: "Segoe UI, sans-serif" },
  header:    { background: "linear-gradient(135deg,#0f0c29,#302b63)", padding: "40px 32px", textAlign: "center", borderBottom: "1px solid #2e2b5a" },
  title:     { fontSize: "2rem", fontWeight: 800, background: "linear-gradient(90deg,#b48bff,#5eaeff,#38e8a8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  subtitle:  { color: "#8892a4", marginTop: 8 },
  wallet:    { display: "inline-block", marginTop: 16, padding: "8px 20px", background: "rgba(56,232,168,.15)", border: "1px solid rgba(56,232,168,.3)", borderRadius: 20, color: "#38e8a8", fontSize: 14 },
  btn:       { marginTop: 16, padding: "10px 24px", background: "linear-gradient(90deg,#b48bff,#5eaeff)", border: "none", borderRadius: 24, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15 },
  tabs:      { display: "flex", justifyContent: "center", gap: 12, padding: "24px 32px 0" },
  tab:       { padding: "10px 28px", background: "#12122a", border: "1px solid #2e2b5a", borderRadius: 24, color: "#8892a4", cursor: "pointer", fontSize: 14, fontWeight: 600 },
  tabActive: { padding: "10px 28px", background: "linear-gradient(90deg,#b48bff,#5eaeff)", border: "none", borderRadius: 24, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700 },
  main:      { maxWidth: 700, margin: "0 auto", padding: "32px 24px" },
  notice:    { textAlign: "center", color: "#8892a4", padding: "60px 0", fontSize: 18 }
};