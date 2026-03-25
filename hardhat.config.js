require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    // Local testing
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    // Ethereum testnet (free ETH from faucet)
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,       // from Alchemy or Infura
      accounts: [process.env.PRIVATE_KEY]     // your MetaMask private key
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY     // to verify contract on Etherscan
  }
};