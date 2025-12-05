const mongoose = require('mongoose');
const express = require("express");
const Game = require("../models/Game");
const Team = require("../models/Team");
const Event = require("../models/Event");

// File uploads
const multer = require("multer");
const supabase = require("./supabaseClient");
const path = require("path");
const upload = multer({ storage: multer.memoryStorage() });

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

// --- HELPER: Generate Round Robin Matches ---
const generateRRMatches = (teams, bracketName) => {
  const matches = [];
  // If odd number of teams, add dummy "BLANK"
  const teamList = teams.length % 2 === 0 ? [...teams] : [...teams, "BLANK"];
  const numTeams = teamList.length;
  const numRounds = numTeams - 1;
  const half = numTeams / 2;

  for (let r = 0; r < numRounds; r++) {
    for (let i = 0; i < half; i++) {
      const t1 = teamList[i];
      const t2 = teamList[numTeams - 1 - i];

      if (t1 !== "BLANK" && t2 !== "BLANK") {
        matches.push({
          bracket: bracketName,
          round: r + 1,
          matchIndex: i,
          teams: [{ name: t1, score: null }, { name: t2, score: null }],
          winner: null,
          finalizeWinner: false
        });
      }
    }
    // Rotate teams (keep index 0 fixed)
    teamList.splice(1, 0, teamList.pop());
  }
  return matches;
};

// Function to save the medals to each team
async function awardMedal(teamName, eventName, game, medal) {
  try {
    if (!teamName || teamName === "TBD") return;

    const gameName = `${game.category} ${game.gameType}`;

    // Use find team and add medal
    await Team.updateOne(
      { teamName: teamName, eventName: eventName },
      {
        // prevents duplicate medals
        $addToSet: {
          medals: {
            gameId: game._id,
            gameName: gameName,
            medal: medal
          }
        }
      }
    );
    console.log(`Awarded ${medal} to ${teamName} for ${gameName}`);
  } catch (err) {
    console.error(`Failed to award ${medal} to ${teamName}`, err);
  }
}

// CREATE Game
router.post("/games", upload.single("rulesFile"), async (req, res) => {
  try {
    const {
      institution,
      gameType,
      category,
      startDate,
      endDate,
      teams,
      eventName,
      bracketType,
      coordinators,
      referees,
    } = req.body;

    // Stop creating if game already exist
    const existingGame = await Game.findOne({
      institution: institution,
      eventName: eventName,
      gameType: gameType,
      category: category
    });

    if (existingGame) {
      return res.status(409).json({ 
        message: `A ${category} ${gameType} game already exists for this event.` 
      });
    }

    // DATE VALIDATION for game( event date to game)
    const parentEvent = await Event.findOne({
      eventName: eventName,
      institution: institution
    });

    if (!parentEvent) {
      return res.status(404).json({ message: "Parent event not found. Cannot create game." });
    }

    const gameStart = new Date(startDate);
    const gameEnd = new Date(endDate);
    const eventStart = new Date(parentEvent.eventStartDate);
    const eventEnd = new Date(parentEvent.eventEndDate);

    if (isNaN(gameStart.getTime()) || isNaN(gameEnd.getTime())) {
      return res.status(400).json({ message: "Invalid game start or end date." });
    }

    if (gameStart < eventStart) {
      return res.status(400).json({
        message: `Game start date cannot be before the event start date (${eventStart.toLocaleDateString()}).`
      });
    }

    if (gameEnd > eventEnd) {
      return res.status(400).json({
        message: `Game end date cannot be after the event end date (${eventEnd.toLocaleDateString()}).`
      });
    }

    if (gameStart > gameEnd) {
      return res.status(400).json({ message: "Game start date must be before its end date." });
    }

    // Translation(Parsing) thingy chuchu
    const parsedTeams = JSON.parse(teams || "[]");
    const parsedCoordinators = JSON.parse(coordinators || "[]");

    // Check if Text or Uploaded Rules
    let finalRules = null;

    if (req.file) {
      try {
        const fileExt = path.extname(req.file.originalname);
        const fileName = `rules-${Date.now()}${fileExt}`;

        const { data, error } = await supabase.storage
          .from("rules")
          .upload(fileName, req.file.buffer, {
            cacheControl: "3600",
            upsert: false,
            contentType: req.file.mimetype,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          return res.status(500).json({ message: "Failed to upload rules file" });
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("rules").getPublicUrl(fileName);
        finalRules = urlData.publicUrl;

      } catch (err) {
        console.error("File processing error:", err);
        return res.status(500).json({ message: "Error processing rules file" });
      }
    } else if (req.body.rulesText && req.body.rulesText.trim() !== "") {
      finalRules = req.body.rulesText.trim();
    }

    // Final check for rules
    if (!finalRules || finalRules.trim() === "") {
      return res.status(400).json({ message: "Rules (file or text) are required" });
    }

    if (
      !institution ||
      !gameType ||
      !category ||
      !startDate ||
      !endDate ||
      !eventName ||
      !bracketType
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!parsedTeams || parsedTeams.length < 2) {
      return res.status(400).json({ message: "At least 2 teams are required" });
    }

    if (!finalRules || finalRules.trim() === "") {
      return res.status(400).json({ message: "Rules (file or text) are required" });
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
      const numTeams = shuffledTeams.length;
      // Calculate power of 2 size (e.g., 5 teams -> size 8)
      const size = Math.pow(2, Math.ceil(Math.log2(numTeams)));
      
      const wbMatches = [];
      const lbMatches = [];

      // --- Winner Bracket Generation ---
      // We generate a full bracket based on the 'size' (power of 2)
      const totalWBRounds = Math.log2(size); // e.g., 8 teams -> 3 rounds (Q, S, F)

      // WB Round 1
      for (let i = 0; i < size / 2; i++) {
        wbMatches.push({
          bracket: "WB",
          round: 1,
          matchIndex: i,
          teams: [
            { name: shuffledTeams[i * 2] || "TBD", score: null },
            { name: shuffledTeams[i * 2 + 1] || "TBD", score: null },
          ],
          winner: null,
          finalizeWinner: false,
          nextMatch: null, // Will be linked dynamically or by index math
        });
      }

      // WB Later Rounds
      for (let r = 2; r <= totalWBRounds; r++) {
        const numMatches = size / Math.pow(2, r);
        for (let i = 0; i < numMatches; i++) {
          wbMatches.push({
            bracket: "WB",
            round: r,
            matchIndex: i,
            teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }],
            winner: null,
            finalizeWinner: false,
          });
        }
      }

      // --- Loser Bracket Generation ---
      // Standard Formula: Total LB Rounds = (Total WB Rounds - 1) * 2
      // Sequence of matches per round for N=8 (WB Rounds=3): 2, 2, 1, 1
      // Sequence for N=16 (WB Rounds=4): 4, 4, 2, 2, 1, 1
      
      const totalLBRounds = (totalWBRounds - 1) * 2;
      let matchesInRound = size / 4; // Start with half the matches of WB Round 1

      for (let r = 1; r <= totalLBRounds; r++) {
        for (let i = 0; i < matchesInRound; i++) {
          lbMatches.push({
            bracket: "LB",
            round: r,
            matchIndex: i,
            teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }],
            winner: null,
            finalizeWinner: false,
          });
        }
        // In LB, the number of matches halves every *other* round
        // Rounds 1,2 have N matches. Rounds 3,4 have N/2 matches.
        if (r % 2 === 0) {
          matchesInRound /= 2;
        }
      }

      // --- Grand Final ---
      // One GF match to start. If LB winner wins, a bracket reset match might be needed (logic handled in PUT)
      const gfMatch = {
        bracket: "GF",
        round: totalWBRounds + 1, // Visually comes after WB Final
        matchIndex: 0,
        teams: [{ name: "Winner WB", score: null }, { name: "Winner LB", score: null }],
        winner: null,
        finalizeWinner: false,
      };

      matches.push(...wbMatches, ...lbMatches, gfMatch);
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

    // NEW: ADNU (Round Robin Groups + Crossover)
    if (bracketType === "ADNU") {
      const mid = Math.ceil(shuffledTeams.length / 2);
      const groupA = shuffledTeams.slice(0, mid);
      const groupB = shuffledTeams.slice(mid);

      // 1. Generate Round Robin for Group A & B
      matches.push(...generateRRMatches(groupA, "Group A"));
      matches.push(...generateRRMatches(groupB, "Group B"));

      // 2. Crossover Semi-Finals (SF)
      matches.push({
        bracket: "SF", round: 100, matchIndex: 0,
        teams: [{ name: "Group A #1", score: null }, { name: "Group B #2", score: null }],
        finalizeWinner: false
      });
      matches.push({
        bracket: "SF", round: 100, matchIndex: 1,
        teams: [{ name: "Group B #1", score: null }, { name: "Group A #2", score: null }],
        finalizeWinner: false
      });

      // 3. 3rd Place
      matches.push({
        bracket: "3rd Place", round: 101, matchIndex: 0,
        teams: [{ name: "Loser SF1", score: null }, { name: "Loser SF2", score: null }],
        finalizeWinner: false
      });

      // 4. Championship
      matches.push({
        bracket: "Championship", round: 102, matchIndex: 0,
        teams: [{ name: "Winner SF1", score: null }, { name: "Winner SF2", score: null }],
        finalizeWinner: false
      });
    }

    const newGame = new Game({
      institution,
      gameType,
      category,
      startDate,
      endDate,
      teams: shuffledTeams,
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

//Delete games
router.delete("/games/:id", async (req, res) => {
  try {
    const deletedGame = await Game.findByIdAndDelete(req.params.id);
    if (!deletedGame) return res.status(404).json({ message: "Game not found" });
    res.json({ message: "Game deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting game", error: err.message });
  }
});


// GET games
router.get('/games', async (req, res) => {
  try {
    const { institution, eventName } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required' });
    }

    const query = { institution };
    if (eventName) query.eventName = eventName;
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

    const game = await Game.findById(id);
    if (!game) return res.status(404).json({ message: "Game not found" });

    const match = game.matches.id(matchId);
    if (!match) return res.status(404).json({ message: "Match not found" });

    // Store old scores for team stats
    const oldScore1 = match.teams[0].score || 0;
    const oldScore2 = match.teams[1].score || 0;

    // Update current match
    match.teams[0].score = Number(score1);
    match.teams[1].score = Number(score2);

    if (finalizeWinner) {
      const winnerIdx = score1 > score2 ? 0 : score2 > score1 ? 1 : null;
      const loserIdx = winnerIdx === 0 ? 1 : winnerIdx === 1 ? 0 : null;

      if (winnerIdx !== null) {
        const winnerName = match.teams[winnerIdx].name;
        const loserName = match.teams[loserIdx].name;
        match.winner = winnerName;
        match.finalizeWinner = true;

        // ===============================================
        //  1. SINGLE ELIMINATION ADVANCEMENT (FIXED)
        // ===============================================
        if (game.bracketType === "Single Elimination") {
          // Logic: Winner goes to Round+1, MatchIndex/2
          const nextRound = match.round + 1;
          const nextIndex = Math.floor(match.matchIndex / 2);
          const nextSlot = match.matchIndex % 2; // 0 (Top) or 1 (Bottom)

          // Find the destination match dynamically
          const nextM = game.matches.find(m => 
            m.round === nextRound && m.matchIndex === nextIndex
          );

          if (nextM) {
            nextM.teams[nextSlot].name = winnerName;
            nextM.teams[nextSlot].score = null;
            game.markModified('matches'); // Critical for saving array updates
          }

          // Medal logic
          const totalRounds = Math.ceil(Math.log2(game.teams.length));
          if (match.round === totalRounds) {
            await awardMedal(winnerName, game.eventName, game, 'gold');
            await awardMedal(loserName, game.eventName, game, 'silver');
          }
        }

        // ===============================================
        //  2. DOUBLE ELIMINATION ADVANCEMENT
        // ===============================================
        if (game.bracketType === "Double Elimination") {
          
          // --- A. Handle Winner Bracket (WB) ---
          if (match.bracket === "WB") {
            const wbMatches = game.matches.filter(m => m.bracket === "WB");
            const maxWBRound = Math.max(...wbMatches.map(m => m.round));

            // WB Final -> Winner to Grand Final
            if (match.round === maxWBRound) {
               const gfMatch = game.matches.find(m => m.bracket === "GF");
               if (gfMatch) {
                 gfMatch.teams[0].name = winnerName; 
                 gfMatch.teams[0].score = null;
               }
            } 
            // Normal Advancement
            else {
               const nextWBRound = match.round + 1;
               const nextWBIndex = Math.floor(match.matchIndex / 2);
               const nextWB = game.matches.find(m => m.bracket === "WB" && m.round === nextWBRound && m.matchIndex === nextWBIndex);
               if (nextWB) {
                 const slot = match.matchIndex % 2;
                 nextWB.teams[slot].name = winnerName;
                 nextWB.teams[slot].score = null;
               }
            }

            // Drop Loser to LB
            let lbDropRound = (match.round === 1) ? 1 : (match.round - 1) * 2;
            let lbTargetMatches = game.matches
               .filter(m => m.bracket === "LB" && m.round === lbDropRound)
               .sort((a,b) => a.matchIndex - b.matchIndex);
            
            let target = lbTargetMatches.find(m => m.teams.some(t => t.name === "TBD" || t.name === "TBD"));
            if (target) {
               const slot = target.teams.findIndex(t => t.name === "TBD" || t.name === "TBD");
               if (slot !== -1) {
                  target.teams[slot].name = loserName;
                  target.teams[slot].score = null;
               }
            }
          }

          // --- B. Handle Loser Bracket (LB) ---
          if (match.bracket === "LB") {
             const lbMatches = game.matches.filter(m => m.bracket === "LB");
             const maxLBRound = Math.max(...lbMatches.map(m => m.round));

             // LB Final -> Winner to Grand Final
             if (match.round === maxLBRound) {
                const gfMatch = game.matches.find(m => m.bracket === "GF");
                if (gfMatch) {
                  gfMatch.teams[1].name = winnerName;
                  gfMatch.teams[1].score = null;
                }
             }
             // Normal Advancement
             else {
                const nextLBRound = match.round + 1;
                const currentRoundCount = game.matches.filter(m => m.bracket === "LB" && m.round === match.round).length;
                const nextRoundCount = game.matches.filter(m => m.bracket === "LB" && m.round === nextLBRound).length;
                
                let nextLBIndex = (currentRoundCount === nextRoundCount) ? match.matchIndex : Math.floor(match.matchIndex / 2);
                
                const nextLB = game.matches.find(m => m.bracket === "LB" && m.round === nextLBRound && m.matchIndex === nextLBIndex);
                if (nextLB) {
                   const slot = nextLB.teams.findIndex(t => t.name === "TBD");
                   const safeSlot = slot !== -1 ? slot : 0;
                   nextLB.teams[safeSlot].name = winnerName;
                   nextLB.teams[safeSlot].score = null;
                }
             }
          }

          // Medals
          if (match.bracket === "GF") {
             await awardMedal(winnerName, game.eventName, game, 'gold');
             await awardMedal(loserName, game.eventName, game, 'silver');
             
             const lbMatches = game.matches.filter(m => m.bracket === "LB");
             const maxLBRound = Math.max(...lbMatches.map(m => m.round));
             const lbFinal = lbMatches.find(m => m.round === maxLBRound);
             if (lbFinal && lbFinal.winner) {
                const bronzeWinner = lbFinal.teams.find(t => t.name !== lbFinal.winner)?.name;
                await awardMedal(bronzeWinner, game.eventName, game, 'bronze');
             }
          }
          game.markModified('matches');
        }

        // ===============================================
        //  3. ADNU (Round Robin Groups + Knockout)
        // ===============================================
        if (game.bracketType === "ADNU") {
          // Group Stage Logic
          if (match.bracket === "Group A" || match.bracket === "Group B") {
             const groupMatches = game.matches.filter(m => m.bracket === match.bracket);
             const allDone = groupMatches.every(m => m.finalizeWinner);

             if (allDone) {
                // Calculate Rankings
                const stats = {}; 
                groupMatches.forEach(m => {
                   m.teams.forEach(t => {
                      if (!stats[t.name]) stats[t.name] = { wins: 0, score: 0 };
                      stats[t.name].score += (t.score || 0);
                   });
                });
                groupMatches.forEach(m => {
                   if (m.winner && stats[m.winner]) stats[m.winner].wins++;
                });

                const rankedTeams = Object.keys(stats).sort((a, b) => {
                   if (stats[b].wins !== stats[a].wins) return stats[b].wins - stats[a].wins;
                   return stats[b].score - stats[a].score;
                });

                const top1 = rankedTeams[0];
                const top2 = rankedTeams[1];

                const sf1 = game.matches.find(m => m.bracket === "SF" && m.matchIndex === 0);
                const sf2 = game.matches.find(m => m.bracket === "SF" && m.matchIndex === 1);

                if (match.bracket === "Group A") {
                   if (sf1) { sf1.teams[0].name = top1; sf1.teams[0].score = null; }
                   if (sf2) { sf2.teams[1].name = top2; sf2.teams[1].score = null; }
                } else {
                   if (sf2) { sf2.teams[0].name = top1; sf2.teams[0].score = null; }
                   if (sf1) { sf1.teams[1].name = top2; sf1.teams[1].score = null; }
                }
             }
          }

          // Semi-Finals Logic
          if (match.bracket === "SF") {
            const finalMatch = game.matches.find(m => m.bracket === "Championship");
            const thirdMatch = game.matches.find(m => m.bracket === "3rd Place");
            const slot = match.matchIndex; 

            if(finalMatch) {
                finalMatch.teams[slot].name = winnerName;
                finalMatch.teams[slot].score = null;
            }
            if(thirdMatch) {
                thirdMatch.teams[slot].name = loserName;
                thirdMatch.teams[slot].score = null;
            }
          }

          // Medals
          if (match.bracket === "Championship") {
            await awardMedal(winnerName, game.eventName, game, 'gold');
            await awardMedal(loserName, game.eventName, game, 'silver');
          }
          if (match.bracket === "3rd Place") {
            await awardMedal(winnerName, game.eventName, game, 'bronze');
          }
          
          game.markModified('matches');
        }

        // ===============================================
        //  4. ROUND ROBIN
        // ===============================================
        if (game.bracketType === "Round Robin") {
           const allMatchesDone = game.matches.every(m => m.finalizeWinner || m._id === match._id);
           if (allMatchesDone) {
              const winCount = {};
              game.teams.forEach(team => { winCount[team] = 0; });
              game.matches.forEach(m => {
                 if (m.winner) winCount[m.winner] = (winCount[m.winner] || 0) + 1;
              });
              const sortedTeams = Object.entries(winCount).sort(([, a], [, b]) => b - a);
              if (sortedTeams[0]) await awardMedal(sortedTeams[0][0], game.eventName, game, 'gold');
              if (sortedTeams[1]) await awardMedal(sortedTeams[1][0], game.eventName, game, 'silver');
              if (sortedTeams[2]) await awardMedal(sortedTeams[2][0], game.eventName, game, 'bronze');
           }
        }

        // Update Team collection stats
        const round = match.round;
        const team1 = await Team.findOne({ teamName: match.teams[0].name, eventName: game.eventName });
        const team2 = await Team.findOne({ teamName: match.teams[1].name, eventName: game.eventName });

        if (team1) {
          team1.totalScore = (team1.totalScore || 0) - oldScore1 + Number(score1);
          const roundEntry = team1.roundScores.find((r) => r.round === round);
          if (roundEntry) roundEntry.score = Number(score1);
          else team1.roundScores.push({ round, score: Number(score1) });
          await team1.save();
        }

        if (team2) {
          team2.totalScore = (team2.totalScore || 0) - oldScore2 + Number(score2);
          const roundEntry = team2.roundScores.find((r) => r.round === round);
          if (roundEntry) roundEntry.score = Number(score2);
          else team2.roundScores.push({ round, score: Number(score2) });
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

    // Date and date validation
    if (date) {
      const scheduleDate = new Date(date);
      const gameStart = new Date(game.startDate);
      const gameEnd = new Date(game.endDate);

      // Check if valid date format
      if (isNaN(scheduleDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Check if within game duration
      if (scheduleDate < gameStart || scheduleDate > gameEnd) {
        return res.status(400).json({
          message: `Match must be scheduled between Game Start (${gameStart.toLocaleString()}) and Game End (${gameEnd.toLocaleString()})`
        });
      }
      match.date = scheduleDate;
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

//Add VideoLink
router.put("/:gameId/video", async (req, res) => {
  const { videoLink } = req.body;
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.gameId,
      { videoLink },
      { new: true }
    );
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: "Failed to update video link" });
  }
});



module.exports = router;
