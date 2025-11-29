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

// Sending email
const multer = require('multer');
const nodemailer = require('nodemailer');
const upload = multer({ storage: multer.memoryStorage() });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, 
  port: process.env.SMTP_PORT, 
  secure: process.env.SMTP_PORT == 465, 
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
});

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
    const user = new Model({ email, password: hashed, institution, ...(role === 'player' && { eventName }), ...(role === 'admin' && { ok: false }) });
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
      if (!user.ok) {
        return res.status(403).json({ message: 'Admin account not approved yet.' });
      }
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

// Sending Email to sys admin
router.post('/send-request', upload.single('attachment'), async (req, res) => {
  try {
    const { email, body } = req.body;

    // Basic validation
    if (!email || !body) {
      return res.status(400).json({ message: 'Email and message body are required.' });
    }

    let attachments = [];
    if (req.file) {
      attachments.push({
        filename: req.file.originalname, 
        content: req.file.buffer,        
        contentType: req.file.mimetype,  
      });
    }

    // Define email options
    const mailOptions = {
      from: `"SPARTA Service" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, 
      replyTo: email, 
      subject: 'New Institution Request from SPARTA Service Page',
      html: `
        <h2>New Service Request</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="border:1px solid #ddd; padding:10px; background-color:#f9f9f9; border-radius: 5px;">
          <pre>${body}</pre>
        </div>
        <hr>
        <p><i>${attachments.length > 0 ? 'A file was attached to this request.' : 'No file was attached.'}</i></p>
      `,
      attachments: attachments, 
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Request sent successfully! We will get back to you soon.' });

  } catch (err) {
    console.error('Error sending service request email:', err);
    res.status(500).json({ message: 'An error occurred on the server. Please try again.' });
  }
});

module.exports = router;
