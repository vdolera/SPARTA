const express = require("express");
const Team = require("../models/Team");
const Game = require("../models/Game");

const router = express.Router();

// CREATE team
router.post('/team', async (req, res) => {
  // (use the same logic you pasted)
});

// GET teams
router.get('/teams', async (req, res) => {
  // (same logic)
});

// GET single team
router.get('/team', async (req, res) => {
  // (same logic)
});

// GET detailed team scores
router.get("/teams/scores", async (req, res) => {
  // (same logic you pasted for detailed scores)
});

// GET teams with scores directly
router.get("/teams-with-scores", async (req, res) => {
  // (same logic you pasted)
});

module.exports = router;
