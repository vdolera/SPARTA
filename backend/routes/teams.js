const express = require("express");
const Team = require("../models/Team");
const Game = require("../models/Game");
const Coordinator = require("../models/Coordinator")
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Setup multer storage(uplaoding thingz to a storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/teams/"); // folder to store images or files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  },
});
const upload = multer({ storage });

// CREATE team 
router.post("/team", upload.single("teamIcon"), async (req, res) => {
  try {
    const { teamName, teamManager, managerEmail, institution, teamColor, eventName, coordinators } = req.body;

    if (!teamName || !teamManager || !managerEmail || !institution) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Team.findOne({ teamName, institution });
    if (existing) {
      return res.status(409).json({ message: "Team already exists in this institution." });
    }

    const team = new Team({
      teamName,
      teamManager,
      managerEmail,
      institution,
      teamColor,
      eventName,
      teamIcon: req.file ? `/uploads/teams/${req.file.filename}` : null, // save image path
      coordinators: coordinators ? JSON.parse(coordinators) : []
    });

    await team.save();
    res.status(201).json({ message: "Team created successfully.", team });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// GET teams
router.get('/teams', async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required' });
    }

    const query = { institution };

    if (event) {
      query.eventName = event;
    }

    const teams = await Team.find(query);
    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single team
router.get('/team', async (req, res) => {
  const { institution, event, teamName } = req.query;
  try {
    const team = await Team.findOne({ institution, eventName: event, teamName });
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Error fetching team", error: err.message });
  }
});

// GET detailed team scores
router.get("/teams/scores", async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution || !event) {
      return res.status(400).json({ message: "Institution and event are required" });
    }

    // Get teams for this event/institution
    const teams = await Team.find({ institution, eventName: event });

    if (!teams.length) {
      return res.status(404).json({ message: "No teams found for this event" });
    }

    // Map each team to their scores
    const teamsWithScores = await Promise.all(
      teams.map(async (team) => {
        // Get only games where this team has played
        const games = await Game.find({
          eventName: event,
          institution,
          "matches.teams.name": team.teamName,
        });

        let grandTotal = 0;
        let rounds = {};

        games.forEach((game) => {
          game.matches.forEach((match) => {
            match.teams.forEach((t) => {
              if (t.name === team.teamName && t.score != null) {
                grandTotal += t.score;

                if (!rounds[match.round]) {
                  rounds[match.round] = { matches: [], total: 0 };
                }

                rounds[match.round].matches.push({
                  matchId: match._id,
                  gameId: game._id,
                  score: t.score,
                  opponent:
                    match.teams.find((x) => x.name !== team.teamName)?.name ||
                    "TBD",
                  winner: match.winner,
                });

                rounds[match.round].total += t.score;
              }
            });
          });
        });

        return {
          teamName: team.teamName,
          institution: team.institution,
          eventName: team.eventName,
          teamColor: team.teamColor || "#A96B24",
          grandTotal,
          rounds,
        };
      })
    );

    res.status(200).json(teamsWithScores);
  } catch (err) {
    console.error("Error fetching team scores:", err);
    res.status(500).json({ message: "Error fetching team scores" });
  }
});

// Get Coordinators to put assign in teams
router.get("/coordinators", async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution || !event) {
      return res.status(400).json({ message: "Institution and event are required" });
    }

    const coordinators = await Coordinator.find({ institution, eventName: event });

    res.json(coordinators);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE team
router.put("/team/:id", upload.single("teamIcon"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.file) {
      updates.teamIcon = `/uploads/teams/${req.file.filename}`;
    }

    if (updates.coordinators) {
      updates.coordinators = JSON.parse(updates.coordinators);
    }

    const team = await Team.findByIdAndUpdate(id, updates, { new: true });
    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team updated successfully", team });
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE team
router.delete("/team/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findByIdAndDelete(id);

    if (!team) return res.status(404).json({ message: "Team not found" });

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ message: "Server error" });
  }
});




module.exports = router;
