/**
 * Hash a file using SHA-256 (runs entirely in the browser)
 * This is the CORE of the registry — the hash is the artwork's identity
 */
export async function hashFile(file) {
  const buffer      = await file.arrayBuffer();
  const hashBuffer  = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray   = Array.from(new Uint8Array(hashBuffer));
  const hashHex     = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

/**
 * Upload a file to IPFS using Pinata
 * Get free API keys at: https://pinata.cloud
 */
export async function uploadToIPFS(file, title, artist) {
  const PINATA_JWT = process.env.REACT_APP_PINATA_JWT; // set in .env file

  // Upload image
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify({ name: title }));

  const imgRes  = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method : "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body   : formData
  });
  const imgData  = await imgRes.json();
  const imageURI = `ipfs://${imgData.IpfsHash}`;

  // Upload metadata JSON
  const metadata = { name: title, artist, image: imageURI };
  const metaRes  = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method : "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${PINATA_JWT}` },
    body   : JSON.stringify({ pinataContent: metadata })
  });
  const metaData = await metaRes.json();
  return `ipfs://${metaData.IpfsHash}`;
}