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
      // 1. Clone and Pad Teams
      const bracketTeams = [...shuffledTeams];
      const numTeams = bracketTeams.length;
      const size = Math.pow(2, Math.ceil(Math.log2(numTeams)));
      
      while (bracketTeams.length < size) {
        bracketTeams.push("No Opponent");
      }

      const wbMatches = [];
      const lbMatches = [];
      const totalWBRounds = Math.log2(size);

      // --- A. Generate Empty WB Matches ---
      for (let r = 1; r <= totalWBRounds; r++) {
        const numMatches = size / Math.pow(2, r);
        for (let i = 0; i < numMatches; i++) {
          // Fill Round 1 immediately, others are TBD
          let teams = [{ name: "TBD", score: null }, { name: "TBD", score: null }];
          if (r === 1) {
            teams = [
              { name: bracketTeams[i * 2], score: null },
              { name: bracketTeams[i * 2 + 1], score: null }
            ];
          }
          
          wbMatches.push({
            bracket: "WB", round: r, matchIndex: i,
            teams: teams,
            winner: null, finalizeWinner: false
          });
        }
      }

      // --- B. Generate Empty LB Matches ---
      const totalLBRounds = (totalWBRounds - 1) * 2;
      let matchesInRound = size / 4; 
      for (let r = 1; r <= totalLBRounds; r++) {
        for (let i = 0; i < matchesInRound; i++) {
          lbMatches.push({
            bracket: "LB", round: r, matchIndex: i,
            teams: [{ name: "TBD", score: null }, { name: "TBD", score: null }],
            winner: null, finalizeWinner: false
          });
        }
        if (r % 2 === 0) matchesInRound /= 2;
      }

      // --- C. Generate Grand Final ---
      const gfMatch = {
        bracket: "GF", round: totalWBRounds + 1, matchIndex: 0,
        teams: [{ name: "Winner WB", score: null }, { name: "Winner LB", score: null }],
        winner: null, finalizeWinner: false,
      };

      //Combine all matches temporarily for easier processing
      const allMatches = [...wbMatches, ...lbMatches];

      // --- D. ITERATIVE RESOLUTION (The Fix) ---
      // We process WB rounds, then LB rounds, sequentially to handle "Chain Reactions"
      
      const resolveMatch = (m) => {
         // Skip if already decided or not ready (TBD)
         if (m.finalizeWinner) return;
         if (m.teams[0].name === "TBD" || m.teams[1].name === "TBD") return;

         let winner = null;
         let loser = null;

         // Check for No Opponent
         if (m.teams[1].name === "No Opponent") {
            winner = m.teams[0].name;
            loser = "No Opponent";
         } else if (m.teams[0].name === "No Opponent") {
            winner = m.teams[1].name;
            loser = "No Opponent";
         } else if (m.teams[0].name === "No Opponent" && m.teams[1].name === "No Opponent") {
            winner = "No Opponent";
            loser = "No Opponent";
         }

         if (winner) {
            m.winner = winner;
            m.finalizeWinner = true;
            
            // Note: We do NOT set score to "Auto" string here to avoid DB errors. 
            // We leave score as null, frontend handles the "Auto" label.

            // 1. Advance Winner
            if (m.bracket === "WB") {
               const nextRound = m.round + 1;
               const nextIndex = Math.floor(m.matchIndex / 2);
               const nextSlot = m.matchIndex % 2;
               
               // Look in WB
               const nextWB = allMatches.find(x => x.bracket === "WB" && x.round === nextRound && x.matchIndex === nextIndex);
               if (nextWB) {
                  nextWB.teams[nextSlot].name = winner;
                  // RECURSIVE: Try to resolve the next match immediately if it's now fully populated
                  resolveMatch(nextWB);
               } else if (nextRound > totalWBRounds) {
                  // Send to GF
                  gfMatch.teams[0].name = winner;
               }

               // 2. Drop Loser to LB
               // Logic: WB R1 -> LB R1. WB R2 -> LB R2 (Simplified mapping)
               let lbRound = (m.round === 1) ? 1 : (m.round - 1) * 2; 
               // Specific correction for Round 1 mapping:
               // WB Match 0,1 -> LB Match 0. WB Match 2,3 -> LB Match 1.
               let lbIndex = Math.floor(m.matchIndex / 2); 
               
               // For later rounds, standard DE mapping is complex, using simplified "fill first available":
               // But for R1/R2 this math holds.
               
               // Find target LB Match
               let targetLB = allMatches.find(x => x.bracket === "LB" && x.round === lbRound && x.matchIndex === lbIndex);
               
               // Fallback: If specific index mapping fails (due to different bracket structures), find first TBD in that round
               if (!targetLB && lbRound > 0) {
                 targetLB = allMatches.find(x => x.bracket === "LB" && x.round === lbRound && x.teams.some(t=>t.name==="TBD"));
               }

               if (targetLB) {
                  const lbSlot = targetLB.teams.findIndex(t => t.name === "TBD" || t.name === "No Opponent"); // Overwrite No Opponent if overlapping
                  if (lbSlot !== -1) {
                     targetLB.teams[lbSlot].name = loser;
                     // RECURSIVE: Resolve LB match immediately (e.g., Real Team vs No Opponent)
                     resolveMatch(targetLB);
                  }
               }

            } else if (m.bracket === "LB") {
               // Advance LB Winner
               const nextRound = m.round + 1;
               // LB Logic: Round 1->2 (halves matches), Round 2->3 (same matches)
               // Determine if we shrink matches or keep same count
               const currentCount = allMatches.filter(x => x.bracket === "LB" && x.round === m.round).length;
               const nextCount = allMatches.filter(x => x.bracket === "LB" && x.round === nextRound).length;
               
               let nextIndex = (currentCount === nextCount) ? m.matchIndex : Math.floor(m.matchIndex / 2);

               const nextLB = allMatches.find(x => x.bracket === "LB" && x.round === nextRound && x.matchIndex === nextIndex);
               if (nextLB) {
                  const slot = nextLB.teams.findIndex(t => t.name === "TBD");
                  if (slot !== -1) {
                    nextLB.teams[slot].name = winner;
                    resolveMatch(nextLB);
                  }
               } else if (nextRound > totalLBRounds) {
                  // Send to GF
                  gfMatch.teams[1].name = winner;
               }
            }
         }
      };

      // Trigger Resolution for all Round 1 matches to start the chain
      allMatches.filter(m => m.bracket === "WB" && m.round === 1).forEach(m => resolveMatch(m));

      matches.push(...allMatches, gfMatch);
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
        //  2. DOUBLE ELIMINATION ADVANCEMENT (CORRECTED FOR PUT)
        // ===============================================
        if (game.bracketType === "Double Elimination") {
          
          // --- A. Handle Winner Bracket (WB) ---
          if (match.bracket === "WB") {
            const wbMatches = game.matches.filter(m => m.bracket === "WB");
            const maxWBRound = Math.max(...wbMatches.map(m => m.round));

            // 1. Advance Winner in WB
            if (match.round === maxWBRound) {
               // WB Final -> Winner goes to Grand Final (Slot 0)
               const gfMatch = game.matches.find(m => m.bracket === "GF");
               if (gfMatch) {
                 gfMatch.teams[0].name = winnerName; 
                 gfMatch.teams[0].score = null;
               }
            } else {
               // Normal Round -> Winner goes to Next WB Round
               const nextWBRound = match.round + 1;
               const nextWBIndex = Math.floor(match.matchIndex / 2);
               const nextWB = game.matches.find(m => m.bracket === "WB" && m.round === nextWBRound && m.matchIndex === nextWBIndex);
               
               if (nextWB) {
                 const slot = match.matchIndex % 2;
                 nextWB.teams[slot].name = winnerName;
                 nextWB.teams[slot].score = null;
               }
            }

            // 2. Drop Loser to Loser Bracket (LB)
            // If the opponent was "No Opponent", the "loser" is "No Opponent"
            const actualLoserName = loserName || "No Opponent";

            // Calculate where they drop in LB
            // Standard Double Elim drop logic:
            // WB Round 1 -> LB Round 1
            // WB Round 2 -> LB Round 2 (or 3 depending on variant, assuming standard here)
            // *Simplified mapping for this bracket engine:*
            // Drop Round = (match.round === 1) ? 1 : (match.round - 1) * 2;
            
            let lbDropRound;
            if (match.round === 1) {
              lbDropRound = 1;
            } else {
              // WB R2 losers drop to LB R2 (cross-over usually happens here in standard, simplifying to direct drop)
              // Note: Standard DE brackets switch drop patterns. 
              // For valid generation, ensure your POST logic aligns with this. 
              // Assuming standard pattern: WB Loser R(n) drops to LB R(n*2 - 1) or R(n*2 - 2)
              // Let's stick to the previous functional logic you had:
              lbDropRound = (match.round - 1) * 2; 
              if (match.round === 1) lbDropRound = 1; 
            }

            // Find valid target matches in LB
            let lbTargetMatches = game.matches
               .filter(m => m.bracket === "LB" && m.round === lbDropRound)
               .sort((a,b) => a.matchIndex - b.matchIndex);
            
            // Find a spot that is "TBD" or "No Opponent"
            // We search for a slot that hasn't been taken by a real loser yet
            let target = lbTargetMatches.find(m => 
                m.teams.some(t => t.name === "TBD" || t.name === "No Opponent")
            );
            
            // Refined Logic for specific index dropping (better for brackets)
            // If dropping from WB Index 0 -> usually drops to specific LB Index
            if (match.round === 1) {
                // Round 1 drop is direct: WB Index 0,1 -> LB Index 0
                const targetIndex = Math.floor(match.matchIndex / 2);
                target = game.matches.find(m => m.bracket === "LB" && m.round === 1 && m.matchIndex === targetIndex);
            }

            if (target) {
               // Find empty slot (TBD) or No Opponent slot to overwrite
               const slot = target.teams.findIndex(t => t.name === "TBD" || t.name === "No Opponent");
               const safeSlot = slot !== -1 ? slot : 0; // Fallback
               
               target.teams[safeSlot].name = actualLoserName;
               target.teams[safeSlot].score = null;
            }
          }

          // --- B. Handle Loser Bracket (LB) ---
          if (match.bracket === "LB") {
             const lbMatches = game.matches.filter(m => m.bracket === "LB");
             const maxLBRound = Math.max(...lbMatches.map(m => m.round));

             // LB Final -> Winner to Grand Final (Slot 1)
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
                // Calculate next match index
                const currentRoundCount = game.matches.filter(m => m.bracket === "LB" && m.round === match.round).length;
                const nextRoundCount = game.matches.filter(m => m.bracket === "LB" && m.round === nextLBRound).length;
                
                // If round counts are equal, index stays same. If next round is smaller, index halves.
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

          // Medals and GF Logic
          if (match.bracket === "GF") {
             await awardMedal(winnerName, game.eventName, game, 'gold');
             await awardMedal(loserName, game.eventName, game, 'silver');
             
             // Find Bronze (Winner of LB Finals)
             const lbMatches = game.matches.filter(m => m.bracket === "LB");
             const maxLBRound = Math.max(...lbMatches.map(m => m.round));
             const lbFinal = lbMatches.find(m => m.round === maxLBRound);
             
             // The loser of LB final is not Bronze, the loser of LB Final is 4th? 
             // Actually: Gold/Silver are in GF. Bronze is the one who lost to the GF loser.
             // That means Bronze is the loser of the LB Final.
             if (lbFinal && lbFinal.winner) {
                const bronzeWinner = lbFinal.teams.find(t => t.name !== lbFinal.winner)?.name;
                await awardMedal(bronzeWinner, game.eventName, game, 'bronze');
             }
          }
          
          // CRITICAL: Save the array changes
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
