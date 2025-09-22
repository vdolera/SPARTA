const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: "Game.matches", required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
});

module.exports = mongoose.model("Schedule", ScheduleSchema);
