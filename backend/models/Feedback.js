const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, // link feedback to event
  institution: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  playerName: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
