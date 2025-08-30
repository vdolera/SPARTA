const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Player = require('../models/Player');
const Institution = require('../models/Institution');
const Event = require('../models/Event');
const Game = require('../models/Game');
const Team = require('../models/Team');
const router = express.Router();
const nodemailer = require("nodemailer");
const SubOrganizer = require("../models/SubOrganizer");


// Check or Get User Role
const getModelByRole = (role) => {
  if (role === 'admin') return Admin;
  if (role === 'player') return Player;
  return null;
};

// REGISTER Auth
router.post('/register/:role', async (req, res) => {
  const { role } = req.params;
  const { email, password, institution, eventName } = req.body;

  console.log("Incoming registration:", { role, email, institution, eventName });

  const Model = getModelByRole(role);
  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const existing = await Model.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new Model({
      email,
      password: hashed,
      institution,
      ...(role === 'player' && { eventName })
    });

    await user.save();
    console.log(`${role} saved successfully`);
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// LOGIN Auth
router.post('/auth/login/:role', async (req, res) => {
  const { role } = req.params;
  const { email, password, accessKey } = req.body;

  const Model = getModelByRole(role);
  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    // Player
    if (role === 'player') {

      if (!user.accessKey) {
        return res.status(403).json({ message: 'Your account is not approved yet.' });
      }
      if (user.accessKey !== accessKey) {
        return res.status(403).json({ message: 'Invalid access key' });
      }
    }

    res.status(200).json({ message: `${role} logged in successfully`, user: { _id: user._id, email: user.email, role, institution: user.institution, ...(role === 'player' && { playerName: user.playerName, team: user.team, game: user.game }) } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// GET institutions
router.get('/institutions', async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ name: 1 });
    res.json(institutions);
  } catch (err) {
    console.error('Failed to fetch institutions:', err.message);
    res.status(500).json({ message: 'Error fetching institutions' });
  }
});

// POST Create Event (with optional sub-organizers + invites)
router.post('/event', async (req, res) => {
  const {
    userName,
    email,
    institution,
    eventName,
    eventStartDate,
    eventEndDate,
    description,
    eventColor,
    subOrganizers = []  // 👈 array from frontend
  } = req.body;

  try {
    // 1. Create Event
    const event = new Event({
      userName,
      email,
      institution,
      eventName,
      eventStartDate,
      eventEndDate,
      description,
      eventColor
    });

    await event.save();
    console.log('✅ Event saved successfully');

    // 2. Process Sub-Organizers (if any)
    let invites = [];
    for (let sub of subOrganizers) {
      if (sub.email) {
        const accessKey = crypto.randomBytes(6).toString("hex").toUpperCase();

        const subOrg = new SubOrganizer({
          email: sub.email,
          role: sub.role || "co-organizer",
          accessKey,
          eventId: event._id,
        });
        await subOrg.save();

        // 3. Send invitation email
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: `"Event Organizer" <${process.env.SMTP_USER}>`,
          to: sub.email,
          subject: `Invitation to ${eventName}`,
          html: `
            <h3>You have been invited as a ${sub.role} for ${eventName}</h3>
            <p>Your Access Key: <b>${accessKey}</b></p>
            <p>Use this key to log in and manage the event.</p>
          `,
        };

        await transporter.sendMail(mailOptions);
        invites.push({ email: sub.email, accessKey });
      }
    }

    res.status(201).json({
      message: "Event created successfully",
      event,
      invites, // return back which invites were sent
    });
  } catch (err) {
    console.error('❌ Failed to create event:', err.message);
    res.status(500).json({ message: 'Event creation failed', error: err.message });
  }
});




// GET Event
router.get('/events', async (req, res) => {
  const userInstitution = req.query.institution;
  try {
    const events = await Event.find({ institution: userInstitution });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// Get single event by eventName
router.get('/event', async (req, res) => {
  try {
    const { eventName } = req.query;
    if (!eventName) {
      return res.status(400).json({ message: 'Event name is required' });
    }

    const event = await Event.findOne({ eventName });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (err) {
    console.error("Error fetching event:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Fisher-Yates Shuffle
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// POST /api/games
router.post("/games", async (req, res) => {
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
    } = req.body;

    if (
      !institution ||
      !gameType ||
      !category ||
      !startDate ||
      !endDate ||
      !teams?.length ||
      !requirements?.length ||
      !rules ||
      !eventName ||
      !bracketType
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const matches = [];
    const totalRounds = Math.ceil(Math.log2(teams.length));
    const shuffledTeams = shuffleArray(teams);

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

      // LB placeholders: max rounds = 2*(totalRounds-1)
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
    
      // If odd number of teams, add a dummy "BYE"
      const teamsList = teamCount % 2 === 0 ? [...shuffledTeams] : [...shuffledTeams, "BYE"];
      const n = teamsList.length;
      const rounds = n - 1;
    
      for (let r = 0; r < rounds; r++) {
        for (let i = 0; i < n / 2; i++) {
          const home = teamsList[i];
          const away = teamsList[n - 1 - i];
    
          if (home !== "BYE" && away !== "BYE") {
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
    

    const newGame = new Game({
      institution,
      gameType,
      category,
      startDate,
      endDate,
      teams: shuffledTeams,
      requirements,
      rules,
      eventName,
      bracketType,
      matches,
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



// GET /api/games?institution=ADNU&event=Intramurals
router.get('/games', async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required.' });
    }

    const query = { institution };
    if (event) query.eventName = event;

    const games = await Game.find(query);
    res.json(games); // now includes startDate, endDate, bracketType
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/games/:id
router.get('/games/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: "Game not found" });
    res.json(game);
  } catch (err) {
    console.error("Error fetching game:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// Game score update and next round
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
       // Handle Winner Bracket → Loser Bracket
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


//POST Teams
router.post('/team', async (req, res) => {
  try {
    const { teamName, teamManager, managerEmail, institution, teamColor, eventName } = req.body;

    if (!teamName || !teamManager || !managerEmail || !institution) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Optional: prevent duplicate team names per institution
    const existing = await Team.findOne({ teamName, institution });
    if (existing) {
      return res.status(409).json({ message: 'Team already exists in this institution.' });
    }

    const team = new Team({ teamName, teamManager, managerEmail, institution, teamColor, eventName });
    await team.save();

    res.status(201).json({ message: 'Team created successfully.' });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: 'Server error.' });
  }
});

//Get Teams
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

// GET teams with detailed scores (per round & game)
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

// GET teams with scores directly from Team model
router.get("/teams-with-scores", async (req, res) => {
  try {
    const { institution, event } = req.query;
    const query = { institution, eventName: event };
    const teams = await Team.find(query).sort({ totalScore: -1 }); // ✅ already has totalScore
    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams with scores:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// GET pending players
router.get("/players/pending", async (req, res) => {
  try {
    const players = await Player.find({ accessKey: null });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending players" });
  }
});

const crypto = require("crypto");

// PUT approve player
router.put("/players/approve/:id", async (req, res) => {
  try {
    const accessKey = crypto.randomBytes(8).toString("hex"); // random key
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { approved: true, accessKey },
      { new: true }
    );
    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json({ message: "Player approved", accessKey });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve player" });
  }
});

// DELETE player
router.delete("/players/:id", async (req, res) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json({ message: "Player deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete player" });
  }
});

// PUT /api/players/:id/register-game
router.put("/players/:id/register-game", async (req, res) => {
  try {
    const { playerName, team, game } = req.body;

    if (!playerName || !team || !game) {
      return res.status(400).json({ message: "All fields required" });
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { playerName, team, game },
      { new: true }
    );

    if (!updatedPlayer) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.json({ message: "Game registered successfully", player: updatedPlayer });
  } catch (err) {
    console.error("Error updating player registration:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET players by event, institution, and team
router.get("/players", async (req, res) => {
  try {
    const { institution, eventName, team } = req.query;

    if (!institution || !eventName || !team) {
      return res.status(400).json({ message: "Institution, event, and team are required" });
    }

    const players = await Player.find({ institution, eventName, team });
    res.json(players);
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ message: "Failed to fetch players" });
  }
});

// PUT update player profile
router.put("/players/:id/profile", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
    res.json(updatedPlayer);
  } catch (err) {
    res.status(500).json({ message: "Failed to update player profile" });
  }
});

// GET single player by ID
router.get("/players/:id", async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    res.json(player);
  } catch (err) {
    console.error("Error fetching player:", err);
    res.status(500).json({ message: "Failed to fetch player" });
  }
});

const Feedback = require("../models/Feedback");

// POST feedback
router.post("/feedback", async (req, res) => {
  try {
    const { eventName, institution, userId, playerName, message } = req.body;

    if (!eventName || !institution || !userId || !message) {
      return res.status(400).json({ message: "All fields required" });
    }

    const newFeedback = new Feedback({
      eventName,
      institution,
      userId,
      playerName,
      message
    });

    await newFeedback.save();
    res.status(201).json({ message: "Feedback posted successfully", feedback: newFeedback });
  } catch (err) {
    console.error("Error posting feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET feedbacks by event
router.get("/feedback/:eventName", async (req, res) => {
  try {
    const { eventName } = req.params;
    const feedbacks = await Feedback.find({ eventName }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    console.error("Error fetching feedbacks:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;