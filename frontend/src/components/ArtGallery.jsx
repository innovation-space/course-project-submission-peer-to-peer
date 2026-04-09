import { useState, useEffect } from "react";

export default function ArtGallery({ contract }) {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArtworks();
  }, [contract]);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      let items = [];

      // 1. Try fetching from Backend API first (Instant)
      try {
        const response = await fetch("http://localhost:5000/api/artworks");
        const apiData = await response.json();
        if (apiData && apiData.length > 0) {
          items = apiData.map(art => ({
            ...art,
            hash: art.imageHash,
            ipfsURI: art.ipfsURI.replace("ipfs://", "https://ipfs.io/ipfs/"),
            date: new Date(art.timestamp * 1000).toLocaleDateString()
          }));
        }
      } catch (e) {
        console.warn("Backend fetch failed, falling back to blockchain:", e);
      }

      // 2. Fetch real events from blockchain if items is still empty or to verify
      if (contract && items.length === 0) {
        const filter = contract.filters.ArtworkRegistered();
        const events = await contract.queryFilter(filter, -5000);

        items = await Promise.all(
          events.reverse().map(async (event) => {
            const hash = event.args.imageHash;
            try {
              const details = await contract.verifyArtwork(hash);
              return {
                hash,
                title: details.title,
                artist: details.artist,
                ipfsURI: details.ipfsURI.replace("ipfs://", "https://ipfs.io/ipfs/"),
                owner: details.owner,
                date: new Date(Number(details.timestamp) * 1000).toLocaleDateString(),
                isGasless: false
              };
            } catch (e) {
              return null;
            }
          })
        );
      }

      // 3. Fetch local Gasless art (for legacy/offline support)
      const localItems = JSON.parse(localStorage.getItem("GASLESS_ART") || "[]").map(item => ({
        ...item,
        date: new Date(item.timestamp * 1000).toLocaleDateString()
      }));

      // 4. Merge and deduplicate
      const combined = [...localItems, ...items.filter(i => i !== null)];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.hash === v.hash) === i);

      setArtworks(unique);
    } catch (err) {
      console.error("Gallery fetch failed:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={s.loadingContainer}>
        <div style={s.spinner} />
        <p style={s.loadingText}>Syncing with Polygon Amoy...</p>
      </div>
    );
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h2 style={s.heading}>Curated Gallery</h2>
        <button style={s.refreshBtn} onClick={fetchArtworks}>Refresh Feed</button>
      </div>

      {artworks.length === 0 ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>🎨</div>
          <p style={s.emptyText}>The gallery is currently empty.</p>
          <p style={s.emptySub}>Be the first to register an artwork!</p>
        </div>
      ) : (
        <div style={s.grid}>
          {artworks.map((art) => (
            <div
  key={art.hash}
  style={s.card}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "scale(1.03)";
    e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "none";
  }}
>
              <div style={s.imgWrapper}>
                <img src={art.ipfsURI ? art.ipfsURI.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/")
                  : "https://via.placeholder.com/300"
                           }
                              alt={art.title}
                               style={s.img}
                           loading="lazy"
                                        />
                <div style={s.overlay}>
                  {art.isGasless && <div style={s.gaslessBadge}>⚡ Gasless Optimization</div>}
                  <a 
                    href={art.ipfsURI} 
                    target="_blank" 
                    rel="noreferrer" 
                    style={s.viewBtn}
                  >
                    View Original ↗
                  </a>
                </div>
              </div>
              <div style={s.cardBody}>
                <h3 style={s.artTitle}>{art.title}</h3>
                <p style={s.artArtist}>by {art.artist}</p>
                <div style={s.cardFooter}>
                  <div style={s.ownerInfo}>
                    <span style={s.label}>Owner</span>
                    <span style={s.value}>{art.owner.slice(0, 6)}...{art.owner.slice(-4)}</span>
                  </div>
                  <div style={s.dateInfo}>
                    <span style={s.label}>Registered</span>
                    <span style={s.value}>{art.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  container: {
    padding: "20px 0",
    animation: "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "32px",
  },
  heading: {
    fontSize: "24px", fontWeight: 800, color: "#fff",
    margin: 0, letterSpacing: "-0.5px",
  },
  refreshBtn: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", color: "#94a3b8",
    padding: "8px 16px", cursor: "pointer",
    fontSize: "13px", fontWeight: 600,
    transition: "all 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
  card: {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "24px",
  overflow: "hidden",
  backdropFilter: "blur(10px)",
  transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  cursor: "pointer",
},
  imgWrapper: {
    position: "relative",
    aspectRatio: "4/3",
    overflow: "hidden",
    background: "rgba(0,0,0,0.2)",
  },
  img: {
    width: "100%", height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },
  overlay: {
    position: "absolute", inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    opacity: 0, transition: "opacity 0.3s",
  },
  viewBtn: {
    background: "#fff", color: "#000",
    padding: "10px 20px", borderRadius: "12px",
    textDecoration: "none", fontWeight: 700, fontSize: "14px",
    transform: "translateY(10px)", transition: "all 0.3s",
  },
  cardBody: { padding: "20px" },
  artTitle: {
    fontSize: "18px", fontWeight: 800, color: "#fff",
    margin: "0 0 4px 0",
  },
  artArtist: {
    fontSize: "14px", color: "#64748b",
    margin: "0 0 20px 0", fontWeight: 500,
  },
  cardFooter: {
    display: "flex", justifyContent: "space-between",
    paddingTop: "16px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  ownerInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  dateInfo: { display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-end" },
  label: { fontSize: "10px", color: "#475569", fontWeight: 700, textTransform: "uppercase" },
  value: { fontSize: "12px", color: "#cbd5e1", fontWeight: 600, fontFamily: "monospace" },
  loadingContainer: {
    padding: "100px 0", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
  },
  spinner: {
    width: "40px", height: "40px",
    border: "4px solid rgba(124,58,237,0.1)",
    borderTopColor: "#7c3aed", borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: { color: "#94a3b8", fontSize: "15px", fontWeight: 500 },
  emptyState: {
    padding: "100px 0", textAlign: "center",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "32px", border: "1px dashed rgba(255,255,255,0.05)",
  },
  emptyIcon: { fontSize: "40px", marginBottom: "16px" },
  emptyText: { fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "4px" },
  emptySub: { fontSize: "14px", color: "#64748b" },
  gaslessBadge: {
    position: "absolute", top: 12, left: 12,
    background: "rgba(34,197,94,0.9)",
    color: "#fff", fontSize: "10px", fontWeight: 800,
    padding: "4px 8px", borderRadius: "6px",
    textTransform: "uppercase", letterSpacing: "0.5px",
    backdropFilter: "blur(4px)",
  },
};
