const express = require("express");
const Game = require("../models/Game");
const Team = require("../models/Team");

const router = express.Router();

// shuffle utility
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// CREATE Game (supports all bracket types)
router.post("/games", async (req, res) => {
  // (use the same game creation logic you pasted, Single/Double/RR/Swiss)
  // ...
});

// GET games
router.get('/games', async (req, res) => {
  try {
    const { institution, event } = req.query;
    const query = { institution, ...(event && { eventName: event }) };
    const games = await Game.find(query);
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single game
router.get('/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE match score
router.put("/games/:id/matches/:matchId", async (req, res) => {
  // (use the same score update logic you pasted)
});

module.exports = router;
