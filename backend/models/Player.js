const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  institution: { type: String, required: true },
  eventName: { type: String, required: true },

  //User Registration
  accessKey: { type: String, required: null },

  //Game Registration
  playerName: { type: String, trim: true },
  team: { type: String, trim: true },
  game: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
