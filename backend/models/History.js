const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  email: { type: String, required: true, index: true }, // Linked by email
  institution: { type: String, required: true },
  eventName: { type: String, required: true },
  team: { type: String, default: "N/A" },
  game: { type: [String], default: [] }, // Stores "Basketball Men", etc.
  archivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);