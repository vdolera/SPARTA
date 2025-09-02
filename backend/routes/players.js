const express = require("express");
const Player = require("../models/Player");
const crypto = require("crypto");

const router = express.Router();

// GET pending players
router.get("/players/pending", async (req, res) => {
  const { institution } = req.query; 
  try {
    const players = await Player.find({ approved: false, institution });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// GET pending players
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
      { teamApproval: true }, // ✅ mark teamApproval
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
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

// REGISTER game for player
router.put("/players/:id/register-game", async (req, res) => {
  const { playerName, team, game } = req.body;
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, { playerName, team, game }, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Game registered", player: updatedPlayer });
});

// GET players by team
router.get("/players", async (req, res) => {
  const { institution, eventName, team, teamApproval } = req.query;
  const players = await Player.find({ institution, eventName, teamApproval: true });
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

module.exports = router;
