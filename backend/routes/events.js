const express = require('express');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Event = require('../models/Event');
const SubOrganizer = require("../models/SubOrganizer");

const router = express.Router();

// CREATE Event (with optional sub-organizers)
router.post('/event', async (req, res) => {
  const { userName, email, institution, eventName, eventStartDate, eventEndDate, description, eventColor, subOrganizers = [] } = req.body;
  try {
    const event = new Event({ userName, email, institution, eventName, eventStartDate, eventEndDate, description, eventColor });
    await event.save();

    const invites = [];
    for (let sub of subOrganizers) {
      if (sub.email) {
        const accessKey = crypto.randomBytes(6).toString("hex").toUpperCase();
        const subOrg = new SubOrganizer({ email: sub.email, role: sub.role || "co-organizer", accessKey, eventId: event._id });
        await subOrg.save();

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: `"Event Organizer" <${process.env.SMTP_USER}>`,
          to: sub.email,
          subject: `Invitation to ${eventName}`,
          html: `<h3>You are invited as ${sub.role} for ${eventName}</h3><p>Your Access Key: <b>${accessKey}</b></p>`,
        });

        invites.push({ email: sub.email, accessKey });
      }
    }

    res.status(201).json({ message: "Event created successfully", event, invites });
  } catch (err) {
    res.status(500).json({ message: 'Event creation failed', error: err.message });
  }
});

// GET all events for institution
router.get('/events', async (req, res) => {
  try {
    const { institution } = req.query;
    const events = await Event.find({ institution });
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
