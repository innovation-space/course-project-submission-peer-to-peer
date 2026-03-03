// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArtRegistry
 * @notice Registers digital artworks with immutable timestamps on the blockchain
 * @dev Each artwork is identified by its SHA-256 hash (generated off-chain)
 */
contract ArtRegistry {

    // ─── Data Structure ───────────────────────────────────────────────────────

    struct Artwork {
        string  imageHash;      // SHA-256 hash of the image file
        string  title;          // Name of the artwork
        string  artist;         // Artist's name
        string  ipfsURI;        // IPFS link to the stored image
        address owner;          // Wallet address of registrant
        uint256 timestamp;      // Block timestamp = proof of existence
        bool    exists;         // Guard flag to check duplicates
    }

    // ─── State Variables ──────────────────────────────────────────────────────

    // Maps imageHash → Artwork record
    mapping(string => Artwork) private registry;

    // Maps wallet address → list of their image hashes
    mapping(address => string[]) private ownerArtworks;

    // Total artworks registered
    uint256 public totalArtworks;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ArtworkRegistered(
        string  indexed imageHash,
        address indexed owner,
        string  title,
        uint256 timestamp
    );

    // ─── Errors ───────────────────────────────────────────────────────────────

    error AlreadyRegistered(string imageHash);
    error NotFound(string imageHash);
    error EmptyField(string fieldName);

    // ─── Functions ────────────────────────────────────────────────────────────

    /**
     * @notice Register a new artwork
     * @param _imageHash SHA-256 hash of the image (computed in the browser)
     * @param _title     Title of the artwork
     * @param _artist    Artist name
     * @param _ipfsURI   IPFS URI where the image is stored
     */
    function registerArtwork(
        string memory _imageHash,
        string memory _title,
        string memory _artist,
        string memory _ipfsURI
    ) external {
        // Validate inputs
        if (bytes(_imageHash).length == 0) revert EmptyField("imageHash");
        if (bytes(_title).length == 0)     revert EmptyField("title");
        if (bytes(_artist).length == 0)    revert EmptyField("artist");

        // Prevent duplicate registration
        if (registry[_imageHash].exists) {
            revert AlreadyRegistered(_imageHash);
        }

        // Store on-chain
        registry[_imageHash] = Artwork({
            imageHash : _imageHash,
            title     : _title,
            artist    : _artist,
            ipfsURI   : _ipfsURI,
            owner     : msg.sender,
            timestamp : block.timestamp,   // ← THE KEY: immutable proof of time
            exists    : true
        });

        ownerArtworks[msg.sender].push(_imageHash);
        totalArtworks++;

        emit ArtworkRegistered(_imageHash, msg.sender, _title, block.timestamp);
    }

    /**
     * @notice Verify an artwork — returns full record
     * @param _imageHash SHA-256 hash to look up
     */
    function verifyArtwork(string memory _imageHash)
        external
        view
        returns (
            string  memory title,
            string  memory artist,
            string  memory ipfsURI,
            address        owner,
            uint256        timestamp
        )
    {
        if (!registry[_imageHash].exists) revert NotFound(_imageHash);

        Artwork memory art = registry[_imageHash];
        return (art.title, art.artist, art.ipfsURI, art.owner, art.timestamp);
    }

    /**
     * @notice Check if an artwork hash is already registered
     */
    function isRegistered(string memory _imageHash) external view returns (bool) {
        return registry[_imageHash].exists;
    }

    /**
     * @notice Get all artwork hashes owned by a wallet
     */
    function getArtworksByOwner(address _owner)
        external
        view
        returns (string[] memory)
    {
        return ownerArtworks[_owner];
    }
}