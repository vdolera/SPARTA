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

// Helper: Generate Single Elim Bracket for a Group
const generateGroupSE = (teams, groupName) => {
  const matches = [];
  const totalRounds = Math.ceil(Math.log2(teams.length));
  
  // 1. Create Round 1 Matches
  const round1Matches = [];
  for (let i = 0; i < teams.length; i += 2) {
    round1Matches.push({
      _id: new mongoose.Types.ObjectId(), // Generate ID now
      bracket: groupName,
      round: 1,
      matchIndex: i / 2,
      teams: [
        { name: teams[i] || "TBD", score: null },
        { name: teams[i + 1] || "TBD", score: null }
      ],
      winner: null,
      finalizeWinner: false,
      nextMatch: null // Will link below
    });
  }
  matches.push(...round1Matches);

  // 2. Create Subsequent Rounds
  let prevRoundMatches = round1Matches;
  for (let r = 2; r <= totalRounds; r++) {
    const currentRoundMatches = [];
    const numMatches = Math.pow(2, totalRounds - r);

    for (let i = 0; i < numMatches; i++) {
      const matchId = new mongoose.Types.ObjectId();
      currentRoundMatches.push({
        _id: matchId,
        bracket: groupName,
        round: r,
        matchIndex: i,
        teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }],
        winner: null,
        finalizeWinner: false,
        nextMatch: null
      });

      // Link previous round to this match
      // The 2 matches from prev round (indices 2*i and 2*i+1) go here
      const m1 = prevRoundMatches[i * 2];
      const m2 = prevRoundMatches[i * 2 + 1];
      if (m1) m1.nextMatch = matchId;
      if (m2) m2.nextMatch = matchId;
    }
    matches.push(...currentRoundMatches);
    prevRoundMatches = currentRoundMatches;
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
      const wbMatches = [];
      const lbMatches = [];

      // WB Round 1 (seeded from shuffledTeams)
      for (let i = 0; i < shuffledTeams.length; i += 2) {
        wbMatches.push({
          bracket: "WB",
          round: 1,
          matchIndex: Math.floor(i / 2),
          teams: [
            { name: shuffledTeams[i] || "TBD", score: null },
            { name: shuffledTeams[i + 1] || "TBD", score: null },
          ],
          winner: null,
          finalizeWinner: false,
          nextMatch: null,
        });
      }

      // WB later-round placeholders
      for (let r = 2; r <= totalRounds; r++) {
        // number of matches in this WB round
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
            finalizeWinner: false,
            nextMatch: null,
          });
        }
      }

      // LB placeholders using canonical double-elim sizing
      const teamCount = shuffledTeams.length;
      let lbRoundTemplate = [];

      // For standard double-elim,
      // rounds = 2 * (log2(n)) - 1  (excluding the grand final)

      switch (teamCount) {
        case 4:
          // LB rounds: 1 match, 1 match
          lbRoundTemplate = [1, 1];
          break;
        case 8:
          // LB rounds: 0, 2, 2, 1
          lbRoundTemplate = [0, 2, 2, 1];
          break;
        case 16:
          // LB rounds: 0, 4, 4, 4, 2, 2, 1
          lbRoundTemplate = [0, 4, 4, 4, 2, 2, 1];
          break;
        default: {
          // fallback: keep the symmetric pattern from before
          const lbTotalRounds = Math.max(1, 2 * (totalRounds - 1));
          const lbMid = Math.ceil(lbTotalRounds / 2);
          for (let r = 1; r <= lbTotalRounds; r++) {
            const numMatches =
              r <= lbMid
                ? Math.pow(2, r - 1)
                : Math.pow(2, lbTotalRounds - r);
            lbRoundTemplate.push(numMatches);
          }
        }
      }

      // now actually create LB placeholders
      lbRoundTemplate.forEach((numMatches, roundIndex) => {
        for (let i = 0; i < numMatches; i++) {
          lbMatches.push({
            bracket: "LB",
            round: roundIndex + 1,
            matchIndex: i,
            teams: [
              { name: "TBD", score: null },
              { name: "TBD", score: null },
            ],
            winner: null,
            finalizeWinner: false,
          });
        }
      });


      // push WB then LB placeholders
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

    // NEW: ADNU (Group Single Elim + Crossover)
    if (bracketType === "ADNU") {
      const mid = Math.ceil(shuffledTeams.length / 2);
      const groupA = shuffledTeams.slice(0, mid);
      const groupB = shuffledTeams.slice(mid);

      // 1. Generate Single Elim Brackets for A and B
      matches.push(...generateGroupSE(groupA, "Group A"));
      matches.push(...generateGroupSE(groupB, "Group B"));

      // 2. Crossover Semi-Finals (SF)
      // SF1: Winner A vs Loser B (Runner-up) 
      // SF2: Winner B vs Loser A (Runner-up)
      // *Note: "Loser" here means the loser of the Group Final (Rank 2)
      matches.push({
        bracket: "SF", round: 100, matchIndex: 0,
        teams: [{ name: "Winner Group A", score: null }, { name: "Runner-Up Group B", score: null }],
        finalizeWinner: false
      });
      matches.push({
        bracket: "SF", round: 100, matchIndex: 1,
        teams: [{ name: "Winner Group B", score: null }, { name: "Runner-Up Group A", score: null }],
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

        // Adding Medals to the team
        // Single Elimination
        if (game.bracketType === "Single Elimination") {
          const totalRounds = Math.ceil(Math.log2(game.teams.length));
          if (match.round === totalRounds) {
            await awardMedal(winnerName, game.eventName, game, 'gold');
            await awardMedal(loserName, game.eventName, game, 'silver');
          }
        }

        // Double Elimination
        if (game.bracketType === "Double Elimination") {
          if (match.bracket === "GF") { // This is the Grand Final
            await awardMedal(winnerName, game.eventName, game, 'gold');
            await awardMedal(loserName, game.eventName, game, 'silver');

            // Find Bronze Medallist (Loser of the LB Final)
            const lbMatches = game.matches.filter(m => m.bracket === "LB");
            const maxLbRound = Math.max(...lbMatches.map(m => m.round));
            const lbFinal = lbMatches.find(m => m.round === maxLbRound);

            if (lbFinal && lbFinal.finalizeWinner) {
              const bronzeWinnerName = lbFinal.teams.find(t => t.name !== lbFinal.winner)?.name;
              await awardMedal(bronzeWinnerName, game.eventName, game, 'bronze');
            }
          }
        }

        // Round Robin
        if (game.bracketType === "Round Robin") {
          // Check if all matches are now finalized
          const allMatchesDone = game.matches.every(m => m.finalizeWinner || m._id === match._id);

          if (allMatchesDone) {
            const winCount = {};
            game.teams.forEach(team => { winCount[team] = 0; });

            game.matches.forEach(m => {
              if (m.winner) {
                winCount[m.winner] = (winCount[m.winner] || 0) + 1;
              }
            });

            const sortedTeams = Object.entries(winCount).sort(([, winsA], [, winsB]) => winsB - winsA);

            if (sortedTeams[0]) await awardMedal(sortedTeams[0][0], game.eventName, game, 'gold');
            if (sortedTeams[1]) await awardMedal(sortedTeams[1][0], game.eventName, game, 'silver');
            if (sortedS[2]) await awardMedal(sortedS[2][0], game.eventName, game, 'bronze');
          }
        }

        // Handle Winner Bracket
        if (match.bracket === "WB") {
          // compute LB ranges from current game (defensive)
          const totalWBRounds = Math.ceil(Math.log2((game.teams && game.teams.length) || 1));
          const lbTotalRounds = Math.max(1, 2 * (totalWBRounds - 1));

          // Desired LB round for a WB loser: 2*WBround - 1 (1-indexed)
          const desiredLbRound = Math.min(match.round * 2 - 1, lbTotalRounds);

          // Try to find an LB match in desired round (or later) that has an empty slot
          let candidateLBMatches = game.matches
            .filter((m) => m.bracket === "LB" && m.round >= desiredLbRound)
            .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);

          let lbTarget = candidateLBMatches.find((m) =>
            m.teams.some((t) => !t?.name || t.name === "TBD")
          );

          if (!lbTarget) {
            const allLB = game.matches
              .filter((m) => m.bracket === "LB")
              .sort((a, b) => a.round - b.round || a.matchIndex - b.matchIndex);
            lbTarget = allLB.find((m) => m.teams.some((t) => !t?.name || t.name === "TBD"));
          }

          // final fallback: take the first LB match (we'll push into a slot)
          if (!lbTarget) {
            lbTarget = game.matches.find((m) => m.bracket === "LB");
          }

          if (lbTarget) {
            // choose an empty slot if available, else append into first slot (defensive)
            const emptySlot = lbTarget.teams.findIndex((t) => !t?.name || t.name === "TBD");
            if (emptySlot !== -1) {
              lbTarget.teams[emptySlot] = { name: loserName, score: null };
            } else {
              // all slots filled — append to teams array as worst-case fallback
              lbTarget.teams.push({ name: loserName, score: null });
            }
          }

          // advance winner to next WB round slot (unchanged logic but defensive)
          const nextWB = game.matches.find(
            (m) =>
              m.bracket === "WB" &&
              m.round === match.round + 1 &&
              m.matchIndex === Math.floor(match.matchIndex / 2)
          );
          if (nextWB) {
            const slot = match.matchIndex % 2; // 0 or 1
            nextWB.teams[slot] = { name: winnerName, score: null };
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

 // NEW: ADNU Advancement (Math-Based Logic)
 if (game.bracketType === "ADNU") {

  // --- LOGIC FOR GROUP STAGES (A & B) ---
  if (match.bracket === "Group A" || match.bracket === "Group B") {
    
    // 1. Find out how many rounds are in this group
    const groupMatches = game.matches.filter(m => m.bracket === match.bracket);
    const maxRound = Math.max(...groupMatches.map(m => m.round));

    // SCENARIO A: Standard Advancement (e.g., Round 1 -> Round 2)
    if (match.round < maxRound) {
       // Calculate the destination match mathematically
       const nextRound = match.round + 1;
       const nextMatchIndex = Math.floor(match.matchIndex / 2);
       const nextTeamSlot = match.matchIndex % 2; // 0 = Top, 1 = Bottom

       const nextMatch = game.matches.find(m => 
         m.bracket === match.bracket && 
         m.round === nextRound && 
         m.matchIndex === nextMatchIndex
       );

       if (nextMatch) {
         nextMatch.teams[nextTeamSlot].name = winnerName;
         nextMatch.teams[nextTeamSlot].score = null; // Reset score for next game
         game.markModified('matches'); // CRITICAL: Tell Mongo array changed
       }
    } 
    
    // SCENARIO B: Group Final (The Winner moves to SF)
    else if (match.round === maxRound) {
      
      const isGroupA = match.bracket === "Group A";
      
      // Find the Semi-Final Matches
      // SF Match 0 = SF1, SF Match 1 = SF2
      const sf1 = game.matches.find(m => m.bracket === "SF" && m.matchIndex === 0);
      const sf2 = game.matches.find(m => m.bracket === "SF" && m.matchIndex === 1);

      if (isGroupA) {
         // Winner of Group A -> Goes to SF1 (Slot 0)
         if (sf1) {
           sf1.teams[0].name = winnerName;
           sf1.teams[0].score = null;
         }
         // Runner-Up (Loser) of Group A -> Goes to SF2 (Slot 1)
         if (sf2) {
           sf2.teams[1].name = loserName;
           sf2.teams[1].score = null;
         }
      } else {
         // Winner of Group B -> Goes to SF2 (Slot 0)
         if (sf2) {
           sf2.teams[0].name = winnerName;
           sf2.teams[0].score = null;
         }
         // Runner-Up (Loser) of Group B -> Goes to SF1 (Slot 1)
         if (sf1) {
           sf1.teams[1].name = loserName;
           sf1.teams[1].score = null;
         }
      }
      game.markModified('matches');
    }
  }

  // --- LOGIC FOR SEMI-FINALS ---
  if (match.bracket === "SF") {
    const finalMatch = game.matches.find(m => m.bracket === "Championship");
    const thirdMatch = game.matches.find(m => m.bracket === "3rd Place");
    
    // SF1 (Index 0) fills Slot 0 in Finals
    // SF2 (Index 1) fills Slot 1 in Finals
    const slot = match.matchIndex; 

    // Winner goes to Championship
    if(finalMatch) {
        finalMatch.teams[slot].name = winnerName;
        finalMatch.teams[slot].score = null;
    }
    // Loser goes to 3rd Place
    if(thirdMatch) {
        thirdMatch.teams[slot].name = loserName;
        thirdMatch.teams[slot].score = null;
    }
    game.markModified('matches');
  }

  // --- LOGIC FOR MEDALS ---
  if (match.bracket === "Championship") {
    await awardMedal(winnerName, game.eventName, game, 'gold');
    await awardMedal(loserName, game.eventName, game, 'silver');
  }
  if (match.bracket === "3rd Place") {
    await awardMedal(winnerName, game.eventName, game, 'bronze');
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
