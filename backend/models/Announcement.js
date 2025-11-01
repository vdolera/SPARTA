const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  eventName: { type: String, required: false },
  institution: { type: String, required: true },
  authorName: { type: String, required: true },
  message: { type: String, required: true },
}, { timestamps: true }); 

module.exports = mongoose.model("Announcement", announcementSchema);