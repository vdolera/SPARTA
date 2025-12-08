const express = require("express");
const Feedback = require("../models/Feedback");
const router = express.Router();

// POST feedback
router.post("/feedback", async (req, res) => {
  try {
    // 1. Accept eventId from the body
    const { eventName, eventId, institution, userId, playerName, message } = req.body;
    
    const newFeedback = new Feedback({ 
      eventName, 
      eventId, // Save the ID
      institution, 
      userId, 
      playerName, 
      message 
    });

    await newFeedback.save();
    res.status(201).json({ message: "Feedback posted", feedback: newFeedback });
  } catch (err) {
    res.status(500).json({ message: "Error posting feedback", error: err.message });
  }
});

// GET feedbacks
router.get("/feedback", async (req, res) => {
  try {
    // 1. Look for eventId in query string
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // 2. Find by ID
    const feedbacks = await Feedback.find({ eventId }).sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching feedbacks", error: err.message });
  }
});

module.exports = router;