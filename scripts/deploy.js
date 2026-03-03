const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying ArtRegistry...");

  // Get the deployer's wallet
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with wallet:", deployer.address);

  // Deploy the contract
  const ArtRegistry = await ethers.getContractFactory("ArtRegistry");
  const artRegistry = await ArtRegistry.deploy();
  await artRegistry.waitForDeployment();

  const address = await artRegistry.getAddress();
  console.log("✅ ArtRegistry deployed to:", address);
  console.log("📋 Save this address — you'll need it in the frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });