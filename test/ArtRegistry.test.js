const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ArtRegistry", function () {
  let artRegistry, owner, otherUser;

  // Deploy fresh contract before each test
  beforeEach(async () => {
    [owner, otherUser] = await ethers.getSigners();
    const ArtRegistry = await ethers.getContractFactory("ArtRegistry");
    artRegistry = await ArtRegistry.deploy();
  });

  it("should register a new artwork", async () => {
    await artRegistry.registerArtwork(
      "abc123hash",
      "Sunset in Pixels",
      "Alice",
      "ipfs://QmXyz..."
    );
    expect(await artRegistry.isRegistered("abc123hash")).to.equal(true);
    expect(await artRegistry.totalArtworks()).to.equal(1);
  });

  it("should reject duplicate registration", async () => {
    await artRegistry.registerArtwork("abc123hash", "Art1", "Alice", "ipfs://1");
    await expect(
      artRegistry.registerArtwork("abc123hash", "Art2", "Bob", "ipfs://2")
    ).to.be.revertedWithCustomError(artRegistry, "AlreadyRegistered");
  });

  it("should return correct artwork data on verify", async () => {
    await artRegistry.registerArtwork("xyz789", "My Art", "Carol", "ipfs://abc");
    const [title, artist, , ownerAddr] = await artRegistry.verifyArtwork("xyz789");
    expect(title).to.equal("My Art");
    expect(artist).to.equal("Carol");
    expect(ownerAddr).to.equal(owner.address);
  });

  it("should track artworks per owner", async () => {
    await artRegistry.registerArtwork("hash1", "Art1", "Alice", "ipfs://1");
    await artRegistry.registerArtwork("hash2", "Art2", "Alice", "ipfs://2");
    const arts = await artRegistry.getArtworksByOwner(owner.address);
    expect(arts.length).to.equal(2);
  });

  it("should revert on empty fields", async () => {
    await expect(
      artRegistry.registerArtwork("", "title", "artist", "ipfs://1")
    ).to.be.revertedWithCustomError(artRegistry, "EmptyField");
  });
});