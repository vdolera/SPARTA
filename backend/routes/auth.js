const express = require('express');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Coordinator = require('../models/Coordinator')
const Player = require('../models/Player');
const Institution = require('../models/Institution');

const router = express.Router();

// Helps get model by role
const getModelByRole = (role) => {
  if (role === 'admin') return Admin;
  if (role === 'sub-organizer' || role === 'co-organizer') return Coordinator;
  if (role === 'player') return Player;
  return null;
};

// REGISTER
router.post('/auth/register/:role', async (req, res) => {
  const { role } = req.params;
  const { email, password, institution, eventName } = req.body;
  const Model = getModelByRole(role);
  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const existing = await Model.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new Model({ email, password: hashed, institution, ...(role === 'player' && { eventName }) });
    await user.save();

    res.status(201).json({ message: `${role} registered successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// LOGIN
router.post('/auth/login/:role', async (req, res) => {
  const { role } = req.params;
  const { email, password, accessKey } = req.body;
  const Model = getModelByRole(role);

  if (!Model) return res.status(400).json({ message: 'Invalid role' });

  try {
    const query = { email };
    if (role === 'co-organizer' || role === 'sub-organizer') query.role = role;

    const user = await Model.findOne(query);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Check ADMIN password
    if (role === 'admin') {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).json({ message: 'Invalid password' });
    }

    // Check PLAYER password
    if (role === 'player') {
      if (!user.approved) {
        return res.status(403).json({ message: 'Your account is not approved yet. Please wait for approval.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).json({ message: 'Invalid password' });
    }

    // Check COORDINATORS accessKey
    if (role === 'co-organizer' || role === 'sub-organizer') {
      if (!user.accessKey) return res.status(403).json({ message: 'Your account is not approved yet.' });
      if (user.accessKey !== accessKey) return res.status(403).json({ message: 'Invalid access key' });
    }

    res.json({ message: `${role} logged in successfully`, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});


// Get INSTITUTIONS
router.get('/institutions', async (req, res) => {
  try {
    const institutions = await Institution.find().sort({ name: 1 });
    res.json(institutions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching institutions' });
  }
});

module.exports = router;
