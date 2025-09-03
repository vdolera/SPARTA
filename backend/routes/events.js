const express = require('express');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Event = require('../models/Event');
const Coordinator = require("../models/Coordinator");

const router = express.Router();

// CREATE Event (with optional sub-organizers)
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
    coordinators = []   // ✅ changed
  } = req.body;

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

    const coordinatorInvites = [];   // ✅ changed
    for (let coord of coordinators) {
      if (coord.email) {
        const accessKey = crypto.randomBytes(6).toString("hex").toUpperCase();
        const coordinator = new Coordinator({   // ✅ changed
          email: coord.email, 
          name: coord.name,
          role: coord.role || "coordinator", 
          accessKey, 
          institution,
          eventName
        });
        await coordinator.save();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: `"SPARTA Admin" <${process.env.SMTP_USER}>`,
          to: coord.email,
          subject: `Invitation to ${eventName}`,
          html: `<h3>You are invited as ${coord.role || "coordinator"} for ${eventName} in ${institution}</h3>
                 <p>Your Access Key: <b>${accessKey}</b></p>`,
        });

        coordinatorInvites.push({ email: coord.email, accessKey });
      }
    }

    res.status(201).json({ 
      message: "Event created successfully", 
      event, 
      coordinators: coordinatorInvites   // ✅ changed
    });
  } catch (err) {
    res.status(500).json({ message: 'Event creation failed', error: err.message });
  } 
});

// GET all events for institution
router.get('/events', async (req, res) => {
  try {
    const { institution } = req.query;
    const today = new Date();
    const events = await Event.find({ institution, eventEndDate: {$gte:today} });

    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// GET all active events by Institution
router.get('/active-events', async (req, res) => {
  try {
    const { institution } = req.query;
    const today = new Date();
    const events = await Event.find({ institution, eventEndDate: {$gte:today} });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// GET all past events by Institution
router.get('/past-events', async (req, res) => {
  try {
    const { institution } = req.query;
    const today = new Date();
    const events = await Event.find({ institution, eventEndDate: {$lt:today} });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});

// GET single event
router.get('/event', async (req, res) => {
  try {
    const { eventName } = req.query;
    const event = await Event.findOne({ eventName });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
