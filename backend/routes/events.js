const express = require('express');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Event = require('../models/Event');
const Coordinator = require("../models/Coordinator");
const Player = require("../models/Player");

const router = express.Router();

// CREATE Event
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
    location, 
    coordinators = []
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
      eventColor,
      location,
      //For editing
      coordinators: coordinators.map(c => ({
        name: c.name,
        email: c.email,
        role: c.role || "co-organizer"
      }))
    });
    await event.save();

    const coordinatorInvites = [];
    for (let coord of coordinators) {
      if (coord.email) {
        const accessKey = crypto.randomBytes(6).toString("hex").toUpperCase();

        // Save to Coordinator table
        const coordinator = new Coordinator({
          email: coord.email,
          name: coord.name,
          role: coord.role || "co-organizer",
          accessKey,
          institution,
          eventName
        });
        await coordinator.save();

        // Send email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });

        await transporter.sendMail({
          from: `"SPARTA Admin" <${process.env.SMTP_USER}>`,
          to: coord.email,
          subject: `Invitation to ${eventName}`,
          html: `<h3>You are invited as ${coord.role || "co-organizer"} for ${eventName} in ${institution}</h3>
                 <p>Your Access Key: <b>${accessKey}</b></p>`,
        });

        coordinatorInvites.push({ email: coord.email, accessKey });
      }
    }

    res.status(201).json({ 
      message: "Event created successfully", 
      event, 
      coordinators: coordinatorInvites 
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
/*router.get('/active-events', async (req, res) => {
  try {
    const { institution } = req.query;
    const today = new Date();
    const events = await Event.find({ institution, eventEndDate: {$gte:today} });
    
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch events', error: err.message });
  }
});*/

// GET all active events by Institution 
// GET all active events by Institution 
router.get("/active-events", async (req, res) => {
  try {
    const { institution, email, role } = req.query;
    const today = new Date();

    let events = [];

    if (role === "admin") {
      // Admins can see all events(same insitution events)
      events = await Event.find({
        institution,
        eventEndDate: { $gte: today },
      });
    } else if (role === "co-organizer" || role === "sub-organizer") {
      // Coordinators only see event they are assigned to
      const coords = await Coordinator.find({ email, institution});
      const eventName = coords.map(c => c.eventName);

      events = await Event.find({
        institution,
        eventEndDate: { $gte: today },
        eventName: { $in: eventName }
      });
    } else if (role === "player") {
      // Players only see the event they registered to
      const player = await Player.findOne({ email, institution });
    
      events = await Event.find({
        institution,
        eventEndDate: { $gte: today },
        eventName: player.eventName
      });
    }
    
    console.log("Events fetched:", events);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch events", error: err.message });
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

/*
// UPDATE event
router.put('/event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err.message });
  }
});
*/

// UPDATE event
router.put('/event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinators, ...eventData } = req.body;

    // Update Event 
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { 
        ...eventData, 
        coordinators: coordinators.map(c => ({
          name: c.name,
          email: c.email,
          role: c.role || "co-organizer"
        })) 
      }, 
      { new: true }
    );

    if (!updatedEvent) return res.status(404).json({ message: "Event not found" });

    if (Array.isArray(coordinators)) {
      const existingCoords = await Coordinator.find({ eventName: updatedEvent.eventName });

      const coordinatorInvites = [];

      for (let coord of coordinators) {
        if (!coord.email) continue;

        // check if coordinator already exists
        const alreadyExists = existingCoords.some(c => c.email === coord.email);

        if (!alreadyExists) {
          // new coordinator receives access key in email
          const accessKey = crypto.randomBytes(6).toString("hex").toUpperCase();

          // Save to Coordinator table
          const newCoord = new Coordinator({
            email: coord.email,
            name: coord.name,
            role: coord.role || "co-organizer",
            accessKey,
            institution: updatedEvent.institution,
            eventName: updatedEvent.eventName,
          });
          await newCoord.save();

          // Send email
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });

          await transporter.sendMail({
            from: `"SPARTA Admin" <${process.env.SMTP_USER}>`,
            to: coord.email,
            subject: `Invitation to ${updatedEvent.eventName}`,
            html: `<h3>You are invited as ${coord.role || "co-organizer"} for ${updatedEvent.eventName} in ${updatedEvent.institution}</h3>
                   <p>Your Access Key: <b>${accessKey}</b></p>`,
          });

          coordinatorInvites.push({ email: coord.email, accessKey });
        }
      }

      return res.json({ updatedEvent, newInvites: coordinatorInvites });
    }

    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ message: "Failed to update event", error: err.message });
  }
});


// DELETE event
router.delete('/event/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) return res.status(404).json({ message: "Event not found" });
    res.json({ message: "Event deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete event", error: err.message });
  }
});


module.exports = router;
