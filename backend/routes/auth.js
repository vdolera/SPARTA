const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Player = require('../models/Player');
const Institution = require('../models/Institution');
const Event = require('../models/Event');
const Game = require('../models/Game');
const Team = require('../models/Team');
const router = express.Router();

// Check or Get User Role
const getModelByRole = (role) => {
  if (role === 'admin') return Admin;
  if (role === 'player') return Player;
  return null;
};

// REGISTER Auth
router.post('/register/:role', async (req, res) => {
  const { role } = req.params;
  const { email, password, institution, event } = req.body;

  console.log("📥 Incoming registration:", { role, email, institution, event });

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
      ...(role === 'player' && { event })
    });

    await user.save();
    console.log(`${role} saved successfully`);
    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// LOGIN Auth
router.post('/login/:role', async (req, res) => {
    const { role } = req.params;
    const { email, password, accessKey } = req.body;
  
    const Model = getModelByRole(role);
    if (!Model) return res.status(400).json({ message: 'Invalid role' });
  
    try {
      const user = await Model.findOne({ email });
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
  
      if (role === 'player' && accessKey !== '123456') {
        return res.status(403).json({ message: 'Invalid access key' });
      }
  
      res.status(200).json({ message: `${role} logged in successfully`, user: { email: user.email, role, institution: user.institution } });
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

 // POST Create Event
router.post('/event', async (req, res) => {
    const { userName, email, institution, eventName, eventStartDate, eventEndDate, description, eventColor } = req.body;
  
    try {
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
      console.log('Event saved successfully');
      res.status(201).json({ message: 'Event created successfully' });
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

  // POST /api/games
  router.post('/games', async (req, res) => {
    try {
    const { institution, gameType, category, schedule, teams, requirements, rules } = req.body;

    if (!institution || !gameType || !category || !schedule || !teams.length || !requirements.length || !rules) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const newGame = new Game({
      institution,
      gameType,
      category,
      schedule,
      teams,
      requirements,
      rules
    });

    await newGame.save();
    res.status(201).json({ message: 'Game created successfully.' });
  } catch (err) {
    console.error("Error creating game:", err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/games?institution=ADNU
router.get('/games', async (req, res) => {
  try {
    const { institution } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required.' });
    }

    const games = await Game.find({ institution });
    res.json(games); // Full game objects
  } catch (err) {
    console.error('Error fetching games:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

//POST Teams
router.post('/team', async (req, res) => {
  try {
    const { teamName, teamManager, managerEmail, institution } = req.body;

    if (!teamName || !teamManager || !managerEmail || !institution) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Optional: prevent duplicate team names per institution
    const existing = await Team.findOne({ teamName, institution });
    if (existing) {
      return res.status(409).json({ message: 'Team already exists in this institution.' });
    }

    const team = new Team({ teamName, teamManager, managerEmail, institution });
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
    const { institution } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required' });
    }

    const teams = await Team.find({ institution });
    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;

// Will reuse laterz
/*
// Create inventory item
app.post("/inventory", async (req, res) => {
    try {
      const newItem = new Inventory(req.body);
      const savedItem = await newItem.save();
      res.json(savedItem);
    } catch (err) {
      res.status(400).json({ message: "Error creating item", error: err });
    }
  });
  
  // Read all inventory items
  app.get("/inventory", async (req, res) => {
    try {
      const items = await Inventory.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Error fetching items", error: err });
    }
  });
  
  // Update item
  app.put("/inventory/:id", async (req, res) => {
    try {
      const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error updating item", error: err });
    }
  });
  
  // Delete item
  app.delete("/inventory/:id", async (req, res) => {
    try {
      await Inventory.findByIdAndDelete(req.params.id);
      res.json({ message: "Item deleted" });
    } catch (err) {
      res.status(400).json({ message: "Error deleting item", error: err });
    }
  });
  */