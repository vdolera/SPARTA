const express = require("express");
const multer = require("multer");
const path = require("path");
const Game = require("../models/Game");
const Team = require("../models/Team");

const router = express.Router();

// Randomize Team Matchup
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rules");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// CREATE Game
router.post("/games", upload.single("rules"), async (req, res) => {
  try {
    const {
      institution,
      gameType,
      category,
      startDate,
      endDate,
      teams,
      requirements,
      rules,
      eventName,
      bracketType,
      coordinators,
      referees,
    } = req.body;

    // Translation(Parsing) thingy chuchu
    const parsedTeams = JSON.parse(teams || "[]");
    const parsedRequirements = JSON.parse(requirements || "[]");
    const parsedCoordinators = JSON.parse(coordinators || "[]");

    // Check if Text or Uploaded Rules
    let finalRules = null;
    if (req.file) {
      finalRules = `/uploads/rules/${req.file.filename}`; // file 
    } else if (rules) {
      finalRules = rules; // plain text
    }

    if (
      !institution ||
      !gameType ||
      !category ||
      !startDate ||
      !endDate ||
      !teams?.length ||
      !parsedRequirements.length ||
      (!rules && !req.file) ||
      !eventName ||
      !bracketType
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const matches = [];
    const totalRounds = Math.ceil(Math.log2(parsedTeams.length));
    const shuffledTeams = shuffleArray(parsedTeams);

    if (bracketType === "Single Elimination") {
      // Round 1
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        matches.push({
          round: 1,
          matchIndex: i / 2,
          teams: [
            { name: shuffledTeams[i] || "TBD", score: null },
            { name: shuffledTeams[i + 1] || "TBD", score: null },
          ],
          winner: null,
          nextMatch: null,
        });
      }

      // Later rounds placeholders
      for (let round = 2; round <= totalRounds; round++) {
        const numMatches = Math.pow(2, totalRounds - round);
        for (let i = 0; i < numMatches; i++) {
          matches.push({
            round,
            matchIndex: i,
            teams: [
              { name: "TBD", score: null },
              { name: "TBD", score: null },
            ],
            winner: null,
            nextMatch: null,
          });
        }
      }
    }

    if (bracketType === "Double Elimination") {
      const wbMatches = [];
      const lbMatches = [];

      // WB Round 1
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        wbMatches.push({
          bracket: "WB",
          round: 1,
          matchIndex: i / 2,
          teams: [
            { name: shuffledTeams[i] || "TBD", score: null },
            { name: shuffledTeams[i + 1] || "TBD", score: null },
          ],
          winner: null,
          nextMatch: null, // will assign after saving
        });
      }

      // WB later rounds placeholders
      for (let r = 2; r <= totalRounds; r++) {
        const numMatches = Math.pow(2, totalRounds - r);
        for (let i = 0; i < numMatches; i++) {
          wbMatches.push({
            bracket: "WB",
            round: r,
            matchIndex: i,
            teams: [
              { name: "TBD", score: null },
              { name: "TBD", score: null },
            ],
            winner: null,
            nextMatch: null,
          });
        }
      }

      // LB placeholders
      const lbTotalRounds = 2 * (totalRounds - 1);
      for (let r = 1; r <= lbTotalRounds; r++) {
        const numMatches = Math.pow(2, lbTotalRounds - r);
        for (let i = 0; i < numMatches; i++) {
          lbMatches.push({
            bracket: "LB",
            round: r,
            matchIndex: i,
            teams: [
              { name: "TBD", score: null },
              { name: "TBD", score: null },
            ],
            winner: null,
            nextMatch: null,
          });
        }
      }

      matches.push(...wbMatches, ...lbMatches);
    }

    if (bracketType === "Round Robin") {
      const rrMatches = [];
      const teamCount = shuffledTeams.length;

      // If odd number of teams, add a dummy "BLANK"
      const teamsList = teamCount % 2 === 0 ? [...shuffledTeams] : [...shuffledTeams, "BLANK"];
      const n = teamsList.length;
      const rounds = n - 1;

      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < n / 2; i++) {
          const home = teamsList[i];
          const away = teamsList[n - 1 - i];

          if (home !== "BLANK" && away !== "BLANK") {
            rrMatches.push({
              bracket: "RR",
              round: r + 1,
              matchIndex: i,
              teams: [
                { name: home, score: null },
                { name: away, score: null },
              ],
              winner: null,
              finalizeWinner: false,
            });
          }
        }
        // Rotate teams (keep first fixed)
        teamsList.splice(1, 0, teamsList.pop());
      }

      matches.push(...rrMatches);
    }

    if (bracketType === "Swiss") {
      const swissMatches = [];
      const rounds = Math.ceil(Math.log2(shuffledTeams.length)); // Common Swiss: log2(N) rounds

      for (let r = 1; r <= rounds; r++) {
        // Initial random pairings for round 1
        for (let i = 0; i < shuffledTeams.length; i += 2) {
          swissMatches.push({
            bracket: "Swiss",
            round: r,
            matchIndex: i / 2,
            teams: [
              { name: shuffledTeams[i] || "TBD", score: null },
              { name: shuffledTeams[i + 1] || "TBD", score: null },
            ],
            winner: null,
            finalizeWinner: false,
          });
        }
      }

      matches.push(...swissMatches);
    }

    const newGame = new Game({
      institution,
      gameType,
      category,
      startDate,
      endDate,
      teams: shuffledTeams,
      requirements: parsedRequirements,
      rules,
      eventName,
      bracketType,
      matches,
      coordinators: parsedCoordinators,
      referees,
      rules: finalRules,
    });

    await newGame.save();

    // Assign nextMatch IDs for Single Elimination WB if needed
    if (bracketType === "Single Elimination") {
      const allMatches = newGame.matches;
      for (let round = 1; round < totalRounds; round++) {
        const currentMatches = allMatches.filter((m) => m.round === round);
        const nextMatches = allMatches.filter((m) => m.round === round + 1);
        currentMatches.forEach((m, i) => {
          m.nextMatch = nextMatches[Math.floor(i / 2)]._id;
        });
      }
      await newGame.save();
    }

    res.status(201).json(newGame);
  } catch (error) {
    console.error("Error creating game:", error);
    res.status(500).json({ message: "Failed to create game" });
  }
});

// GET games
router.get('/games', async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required' });
    }

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
  try {
    const { id, matchId } = req.params;
    let { score1, score2, finalizeWinner } = req.body;

    score1 = Number(score1);
    score2 = Number(score2);

    const game = await Game.findById(id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const match = game.matches.id(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    // old scores for Team collection adjustment
    const oldScore1 = match.teams[0].score || 0;
    const oldScore2 = match.teams[1].score || 0;

    // update scores
    match.teams[0].score = score1;
    match.teams[1].score = score2;

    if (finalizeWinner) {
      const winnerIdx = score1 > score2 ? 0 : score2 > score1 ? 1 : null;
      const loserIdx = winnerIdx === 0 ? 1 : winnerIdx === 1 ? 0 : null;

      if (winnerIdx !== null) {
        const winnerName = match.teams[winnerIdx].name;
        const loserName = match.teams[loserIdx].name;
        match.winner = winnerName;
        match.finalizeWinner = true;

        // Handle Winner Bracket
        if (match.bracket === "WB") {
          // Find LB matches in the correct LB round
          const lbRound = match.round; // WB round N loser goes to LB round N
          const lbNextMatches = game.matches.filter(
            (m) => m.bracket === "LB" && m.round === lbRound
          );

          // Find the LB match slot based on WB matchIndex
          const lbTarget = lbNextMatches.find(
            (m) => m.matchIndex === Math.floor(match.matchIndex / 2)
          );

          if (lbTarget) {
            // Assign to first empty slot
            const emptySlot = lbTarget.teams.findIndex(t => !t?.name || t.name === "TBD");
            if (emptySlot !== -1) {
              lbTarget.teams[emptySlot] = { name: loserName, score: null };
            }
          }

          // WB next round winner slot (already correct)
          const nextWB = game.matches.find(
            (m) =>
              m.bracket === "WB" &&
              m.round === match.round + 1 &&
              m.matchIndex === Math.floor(match.matchIndex / 2)
          );
          if (nextWB) {
            nextWB.teams[match.matchIndex % 2] = { name: winnerName, score: null };
          }
        }

        // Handle Loser Bracket
        if (match.bracket === "LB") {
          const nextLB = game.matches.find(
            (m) =>
              m.bracket === "LB" &&
              m.round === match.round + 1 &&
              m.matchIndex === Math.floor(match.matchIndex / 2)
          );
          if (nextLB) {
            nextLB.teams[match.matchIndex % 2] = { name: winnerName, score: null };
          }
        }

        // Setup Grand Final safely
        const wbFinal = game.matches
          .filter((m) => m.bracket === "WB" && m.finalizeWinner)
          .sort((a, b) => b.round - a.round)[0];
        const lbFinal = game.matches
          .filter((m) => m.bracket === "LB" && m.finalizeWinner)
          .sort((a, b) => b.round - a.round)[0];

        if (wbFinal && lbFinal) {
          let gf = game.matches.find((m) => m.bracket === "GF");

          if (!gf) {
            // Only create GF if it doesn't exist
            gf = {
              bracket: "GF",
              round: Math.max(wbFinal.round, lbFinal.round) + 1,
              matchIndex: 0,
              teams: [
                { name: wbFinal.winner, score: null },
                { name: lbFinal.winner, score: null },
              ],
              finalizeWinner: false,
              winner: null,
            };
            game.matches.push(gf);
          } else if (!gf.finalizeWinner) {
            // Update GF teams only if not played
            gf.teams = [
              { name: wbFinal.winner, score: gf.teams[0]?.score ?? null },
              { name: lbFinal.winner, score: gf.teams[1]?.score ?? null },
            ];
          }
        }

        // Update Team collection
        const round = match.round;
        const team1 = await Team.findOne({ teamName: match.teams[0].name, eventName: game.eventName });
        const team2 = await Team.findOne({ teamName: match.teams[1].name, eventName: game.eventName });

        if (team1) {
          team1.totalScore = (team1.totalScore || 0) - oldScore1 + score1;
          const roundEntry = team1.roundScores.find((r) => r.round === round);
          if (roundEntry) roundEntry.score = score1;
          else team1.roundScores.push({ round, score: score1 });
          await team1.save();
        }

        if (team2) {
          team2.totalScore = (team2.totalScore || 0) - oldScore2 + score2;
          const roundEntry = team2.roundScores.find((r) => r.round === round);
          if (roundEntry) roundEntry.score = score2;
          else team2.roundScores.push({ round, score: score2 });
          await team2.save();
        }
      }
    }

    await game.save();
    res.json(game);
  } catch (err) {
    console.error("Error updating match:", err);
    res.status(500).json({ message: "Error updating match" });
  }
});


// UPDATE match schedule
router.put("/games/:gameId/matches/:matchId/schedule", async (req, res) => {
  try {
    const { gameId, matchId } = req.params;
    const { date, location, referee, teams } = req.body;

    console.log("Incoming schedule update:", req.body); // debug

    const game = await Game.findById(gameId);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const match = game.matches.id(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    // Date
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        match.date = parsedDate; // always save ISO
      } else {
        console.warn("Invalid date received:", date);
      }
    }

    // Location
    if (location !== undefined) match.location = location;
    if (referee !== undefined) match.referee = referee;

    // Reset teams if passed
    if (teams?.length === 2) {
      match.teams = [
        { name: teams[0], score: null },
        { name: teams[1], score: null },
      ];
      match.winner = null;
      match.finalizeWinner = false;
    }

    await game.save();
    res.json({ match });
  } catch (err) {
    console.error("Error scheduling match:", err);
    res.status(500).json({ message: "Error scheduling match" });
  }
});


module.exports = router;
