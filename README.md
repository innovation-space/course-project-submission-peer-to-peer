# 🎨 Blockchain Art Registry

A decentralized application (DApp) for registering and verifying digital artwork ownership using blockchain and IPFS.

---

## 🚀 Features

* Register artwork on blockchain
* Store file hashes via IPFS
* Verify ownership securely
* MetaMask wallet integration

---

## 🛠 Tech Stack

* Solidity (Smart Contracts)
* Hardhat (Development & Testing)
* React + Vite (Frontend)
* Ethers.js (Blockchain Interaction)
* IPFS (Storage)

---

## 📦 Setup & Run

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Compile contracts
npx hardhat compile

# Start local blockchain
npx hardhat node

# Deploy contract (new terminal)
npx hardhat run scripts/deploy.js --network localhost

# Run frontend
cd frontend && npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in root:

```
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
```

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
