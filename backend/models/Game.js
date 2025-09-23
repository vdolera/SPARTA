const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  bracket: { type: String, enum: ["WB", "LB", "GF", "RR", "Swiss"], default: "WB" },
  round: { type: Number, required: true },
  matchIndex: { type: Number, required: true },
  teams: [{ 
    name: { type: String, default: "TBD" },
    score: { type: Number, default: null }
  }],
  winner: { type: String, default: null },
  finalizeWinner: { type: Boolean, default: false }, 
  date: { type: Date, default: null },  
  location: { type: String, default: "" },
}, { _id: true });

const gameSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  gameType: { type: String, required: true },
  category: { type: String, enum: ['Men', 'Women', 'Mixed'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  teams: { type: [String], required: true },       
  requirements: { type: [String], required: true },
  rules: { type: String, required: true },       
  eventName: { type: String, required: true },
  coordinators: { type: [String], default: [] },
  referees: { type: [String], default: [] },
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
