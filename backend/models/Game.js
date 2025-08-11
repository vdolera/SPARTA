const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  gameType: { type: String, required: true },
  category: { type: String, enum: ['Men', 'Women', 'Mixed'], required: true },
  schedule: { type: Date, required: true },
  teams: { type: [String], required: true },
  requirements: { type: [String], required: true },
  rules: { type: String, required: true},
  eventName: { type:String, required: true},
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
