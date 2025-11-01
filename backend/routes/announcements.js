const express = require("express");
const Announcement = require("../models/Announcement"); // Renamed from Feedback

const router = express.Router();

// POST announcement
router.post("/announcements", async (req, res) => {
  try {
    
    const { institution, eventName, authorName, message } = req.body;
    
    const newAnnouncement = new Announcement({ 
      institution, 
      eventName, 
      authorName, 
      message 
    }); 
    await newAnnouncement.save();
    
    res.status(201).json(newAnnouncement); 
  } catch (err) {
    console.error("Error posting announcement:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET announcements
router.get("/announcements", async (req, res) => {
  try {
    const { institution, eventName } = req.query;

    let query = {};

    if (institution) {
      query.institution = decodeURIComponent(institution);
    } else {
      return res.status(400).json({ message: "Institution is required" });
    }

    if (eventName) {
      query.eventName = decodeURIComponent(eventName);
    } else {
      query.eventName = { $in: [null, undefined] };
    }

    const announcements = await Announcement.find(query).sort({ createdAt: -1 });
    res.json(announcements);

  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;