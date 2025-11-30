const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    teamName: { type: String, required: true },
    teamManager: { type: String, required: false },
    managerEmail: { type: String, required: false },
    institution: { type: String, required: true },
    teamColor: { type: String, required: true },
    eventName: { type: String, required: true },
    teamIcon: { type: String, default: null },
    coordinators: { type: [String], default: [] },

    //Scores during every matches
    totalScore: { type: Number, default: 0 }, 
    roundScores: [
      {
        round: { type: Number, required: true },
        score: { type: Number, default: 0 },
      },
    ],

    //Medals per game
    medals: [
      {
        gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
        gameName: { type: String },
        medal: { type: String, enum: ['gold', 'silver', 'bronze'] }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Team", teamSchema);
