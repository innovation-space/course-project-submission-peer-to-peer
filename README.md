# 🎨 Blockchain Art Registry (Polygon)

A decentralized full-stack application (DApp) to register, verify, and showcase digital artwork ownership using the Polygon blockchain, IPFS, and a modern React-based gallery interface.

---

## 🚀 Final Submission Highlights

* ✅ Fixed IPFS image rendering in gallery
* ✅ Implemented dynamic artwork gallery (Blockchain + Backend sync)
* ✅ Added gasless/local artwork fallback support
* ✅ Improved UI with interactive card hover effects
* ✅ Integrated backend API for faster data retrieval
* ✅ Enhanced user experience with loading states and empty states

---

## 🔥 Features

* Register digital artwork on blockchain
* Store artwork metadata securely via IPFS
* Verify artwork ownership using smart contracts
* Real-time gallery display of registered artworks
* MetaMask wallet integration for authentication
* Gasless mode for local/offline artwork storage
* Responsive and modern UI design

---

## 🛠 Tech Stack

* **Solidity** – Smart Contracts
* **Hardhat** – Development & Deployment
* **React + Vite** – Frontend
* **Ethers.js** – Blockchain Interaction
* **Node.js + Express** – Backend API
* **MongoDB** – Database (for fast retrieval)
* **IPFS (Pinata)** – File Storage
* **Polygon Amoy Testnet** – Blockchain Network

---

## 🧠 Architecture Overview

```
User → React Frontend → Backend API → MongoDB
                     → Smart Contract (Polygon)
                     → IPFS (Pinata)
```

---

## 📦 Setup & Run

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Compile smart contracts
npx hardhat compile

# Deploy contract
npx hardhat run scripts/deploy.js --network polygon

# Start backend server
cd backend
npm install
node server.js

# Run frontend
cd ../frontend
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in root:

```
PRIVATE_KEY=your_private_key
RPC_URL=your_polygon_rpc_url
PINATA_API_KEY=your_pinata_key
PINATA_SECRET=your_pinata_secret
MONGO_URI=your_mongodb_connection
```

---

## 🌐 Network Details

Deployed on **Polygon Amoy Testnet**:

* Fast transaction confirmation
* Low gas fees
* Ethereum-compatible ecosystem

---

## 📁 Project Structure

```
contracts/   → Smart contracts  
scripts/     → Deployment scripts  
backend/     → Express API + MongoDB  
frontend/    → React application  
test/        → Contract testing  
```

---

## 📸 Final UI Improvements

* Fixed broken image loading from IPFS
* Added fallback image handling
* Smooth hover animations on artwork cards
* Cleaner and more responsive gallery layout

---

## 👨‍💻 Author

**Aditya Singh**
B.Tech CSE (Blockchain Technology)
VIT Vellore

---

## 📜 License

MIT
