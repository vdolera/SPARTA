const express = require("express");
const Player = require("../models/Player");
const crypto = require("crypto");

const router = express.Router();

// GET pending players
router.get("/players/pending", async (req, res) => {
  const players = await Player.find({ accessKey: null });
  res.json(players);
});

// APPROVE player
router.put("/players/approve/:id", async (req, res) => {
  const accessKey = crypto.randomBytes(8).toString("hex");
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, { approved: true, accessKey }, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Player approved", accessKey });
});

// DELETE player
router.delete("/players/:id", async (req, res) => {
  const deleted = await Player.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Player deleted" });
});

// REGISTER game for player
router.put("/players/:id/register-game", async (req, res) => {
  const { playerName, team, game } = req.body;
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, { playerName, team, game }, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Game registered", player: updatedPlayer });
});

// GET players by team
router.get("/players", async (req, res) => {
  const { institution, eventName, team } = req.query;
  const players = await Player.find({ institution, eventName, team });
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
