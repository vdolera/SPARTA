const mongoose = require("mongoose");

const subOrganizerSchema = new mongoose.Schema({
  email: { type: String, required: true },
  role: { type: String, enum: ["co-organizer", "sub-organizer"], required: true },
  accessKey: { type: String, required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }
}, { timestamps: true });

module.exports = mongoose.model("SubOrganizer", subOrganizerSchema);
