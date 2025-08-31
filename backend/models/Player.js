const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  institution: { type: String, required: true },
  eventName: { type: String, required: true },

  //User Registration
  approved: { type: Boolean, default: false },

  //Game Registration
  playerName: { type: String, trim: true },
  team: { type: String, trim: true },
  game: { type: String, trim: true },

  //Extras for Profile
  jerseyNumber: { type: String },
  contactNumber: { type: String },
  permanentAddress: { type: String },
  birthDate: { type: Date },
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  sex: { type: String, enum: ["Male", "Female", "Other"] }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
