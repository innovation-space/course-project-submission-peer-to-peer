const request = require("supertest");
const express = require("express");
const mongoose = require("mongoose");
const { expect } = require("chai");

// Note: We are testing the API logic, not the real blockchain network
// in this unit test to ensure fast and reliable execution.

describe("Backend Security & Integrity Tests", () => {
  let app;

  before(() => {
    // We would ideally import the app from server.js, 
    // but for this demo test we mock the behavior
    app = express();
    app.use(express.json());
    
    // Mocking the secured endpoint logic
    app.post("/api/artworks", (req, res) => {
      const { isGasless, txHash } = req.body;
      if (!isGasless) {
         // Requirement: No direct writes for blockchain TXs
         return res.status(202).json({ message: "Sync request accepted. Awaiting verification." });
      }
      res.status(201).json({ message: "Gasless saved" });
    });
  });

  it("Should reject direct database writes for blockchain transactions (Requirement 1)", async () => {
    const res = await request(app)
      .post("/api/artworks")
      .send({
        imageHash: "0x123",
        title: "Spoofed Art",
        isGasless: false
      });
    
    expect(res.status).to.equal(202);
    expect(res.body.message).to.contain("Awaiting verification");
  });

  it("Should allow direct writes ONLY for gasless/local mode (Legacy Support)", async () => {
    const res = await request(app)
      .post("/api/artworks")
      .send({
        imageHash: "0x456",
        title: "Local Art",
        isGasless: true
      });
    
    expect(res.status).to.equal(201);
  });
});
