const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  round: { type: Number, required: true },         // Round number
  matchIndex: { type: Number, required: true },    // Position in round
  teams: [{ 
    name: { type: String, default: "TBD" },
    score: { type: Number, default: null }
  }],
  winner: { type: String, default: null },         // Winner name
}, { _id: true }); // keep default _id for subdocs

const gameSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  gameType: { type: String, required: true },
  category: { type: String, enum: ['Men', 'Women', 'Mixed'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  teams: { type: [String], required: true },       // List of team names
  requirements: { type: [String], required: true },// Multiple requirements
  rules: { type: [String], required: true },       // Multiple rules (fixed)
  eventName: { type: String, required: true },
  bracketType: {
    type: String,
    enum: [
      'Single Elimination',
      'Double Elimination',
      'Round Robin',
      'Swiss',
      'Free for All'
    ],
    required: true,
  },
  matches: [matchSchema] // Bracket matches
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
