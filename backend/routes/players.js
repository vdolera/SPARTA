const express = require("express");
const nodemailer = require("nodemailer")
const Player = require("../models/Player");
const Game = require("../models/Game");

const router = express.Router();

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/requirements/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// GET pending players to enter the insitution
router.get("/players/pending", async (req, res) => {
  const { institution } = req.query; 
  try {
    const players = await Player.find({ approved: false, institution });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// GET pending players that are regesting for a team
router.get("/players/team-pending", async (req, res) => {
  const { institution, eventName, team } = req.query; 
  try {
    const players = await Player.find({ approved: true, institution, eventName, team, teamApproval: false });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// APPROVE player by team
router.put("/players/team-approve/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { teamApproval: true },
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
        //Email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    
        await transporter.sendMail({
          from: `"SPARTA Admin" <${process.env.SMTP_USER}>`,
          to: updatedPlayer.email,
          subject: `Approval to join the event in ${updatedPlayer.institution}`,
          html: `<h3>Your request to register in the event have been approved</h3>
            <p>Gratz</p>`,
        });

    res.json({ message: "Player approved by team", player: updatedPlayer });
  } catch (err) {
    res.status(500).json({ message: "Error approving player by team", error: err.message });
  }
});


// APPROVE player
router.put("/players/approve/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });

        //Email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    
        await transporter.sendMail({
          from: `"SPARTA Admin" <${process.env.SMTP_USER}>`,
          to: updatedPlayer.email,
          subject: `Approval to join the event in ${updatedPlayer.institution}`,
          html: `<h3>Your request to register in the event have been approved</h3>
            <p>Gratz</p>`,
        });

    res.json({ message: "Player approved", player: updatedPlayer });
  } catch (err) {
    res.status(500).json({ message: "Error approving player", error: err.message });
  }
});

// DELETE player
router.delete("/players/:id", async (req, res) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Player not found" });
    res.json({ message: "Player deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting player", error: err.message });
  }
})

/*
// REGISTER game for player
router.put("/players/:id/register-game", async (req, res) => {
  const { playerName, team, game } = req.body;
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, { playerName, team, game }, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Game registered", player: updatedPlayer });
});
*/

// REGISTER game for player
router.put(
  "/players/:id/register-game",
  upload.any(), // handles multiple requirement files
  async (req, res) => {
    try {
      const { playerName, team, game } = req.body;

        // Find the game by ID to fetch details
        const gameDoc = await Game.findById(game);
        if (!gameDoc) {
          return res.status(404).json({ message: "Game not found" });
        }

      // Collect uploaded requirements
      const uploadedRequirements = req.files.map((file) => {
        // Match fieldname like "requirements[Medical]" → extract "Medical"
        const match = file.fieldname.match(/requirements\[(.+)\]/);
        const reqName = match ? match[1] : file.fieldname;

        return {
          name: reqName,
          filePath: `/uploads/requirements/${file.filename}`,
        };
      });

      const updatedPlayer = await Player.findByIdAndUpdate(
        req.params.id,
        {
          playerName,
          team,
          game: `${gameDoc.category} ${gameDoc.gameType}`,
          $push: { uploadedRequirements: { $each: uploadedRequirements } },
        },
        { new: true }
      );

      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({ message: "Game registered", player: updatedPlayer });
    } catch (err) {
      console.error("Error registering player:", err);
      res.status(500).json({ message: "Failed to register player" });
    }
  }
);


// GET players by team
router.get("/players", async (req, res) => {
  const { institution, eventName, team, teamApproval } = req.query;
  const players = await Player.find({ institution, team, eventName, teamApproval: true });
  res.json(players);
});

// UPDATE profile
router.put("/players/:id/profile", async (req, res) => {
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json(updatedPlayer);
});

// GET single player
router.get("/players/:id", async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: "Player not found" });
  res.json(player);
});

// Test email endpoint
router.post("/test-email", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
      },
    });

    const testResult = await transporter.sendMail({
      from: `"SPARTA Test" <${process.env.SMTP_USER}>`,
      to: "vincentdolera25@gmail.com", // Use your actual email for testing
      subject: "Test Email from SPARTA",
      html: "<h1>This is a test email</h1>",
    });

    console.log("Test email result:", testResult);
    res.json({ success: true, messageId: testResult.messageId });
  } catch (error) {
    console.error("Test email failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/ping", (req, res) => res.send("pong"));


module.exports = router;
