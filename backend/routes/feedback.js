const express = require("express");
const Feedback = require("../models/Feedback");

const router = express.Router();

// POST feedback
router.post("/feedback", async (req, res) => {
  const { eventName, institution, userId, playerName, message } = req.body;
  const newFeedback = new Feedback({ eventName, institution, userId, playerName, message });
  await newFeedback.save();
  res.status(201).json({ message: "Feedback posted", feedback: newFeedback });
});

// GET feedbacks
router.get("/feedback/:eventName", async (req, res) => {
  const { eventName } = req.params;
  const feedbacks = await Feedback.find({ eventName }).sort({ createdAt: -1 });
  res.json(feedbacks);
});

module.exports = router;
