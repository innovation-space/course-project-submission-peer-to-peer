# 🎨 Blockchain Art Registry (Polygon)

A decentralized application (DApp) for registering and verifying digital artwork ownership using the Polygon blockchain and IPFS.

---

## 🚀 Features

* Register artwork on blockchain
* Store file hashes via IPFS
* Verify ownership securely
* MetaMask wallet integration
* Low-cost transactions using Polygon

---

## 🛠 Tech Stack

* Solidity (Smart Contracts)
* Hardhat (Development & Testing)
* React + Vite (Frontend)
* Ethers.js (Blockchain Interaction)
* IPFS (Storage)
* Polygon Mumbai Testnet (Blockchain Network)

---

## 📦 Setup & Run

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Compile contracts
npx hardhat compile

# Run local blockchain (optional)
npx hardhat node

# Deploy contract on Polygon
npx hardhat run scripts/deploy.js --network polygon

# Run frontend
cd frontend && npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in root:

```
PRIVATE_KEY=your_private_key
RPC_URL=your_polygon_rpc_url
```

---

## 🌐 Network Configuration

The project is deployed on **Polygon Mumbai Testnet**, providing:

* Faster transactions
* Lower gas fees
* Full EVM compatibility

---

## 📁 Project Structure

```
contracts/   → Smart contracts  
scripts/     → Deployment scripts  
test/        → Unit tests  
frontend/    → React application  
```

---

## 👨‍💻 Author

Aditya Singh
B.Tech CSE (Blockchain Technology), VIT Vellore

---

## 📜 License

MIT
