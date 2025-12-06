const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  institution: { type: String, required: true },
  eventName: { type: String, required: true },
  role: {type:String, default: "player"},

  //User Registration 
  approved: { type: Boolean, default: false },

  //Game Registration
  playerName: { type: String, trim: true },
  team: { type: String, trim: true },
  sex: { type: String, enum: ["Male", "Female", "Other"] },
  game: { type: [String], default: [] },
  teamApproval: { type: Boolean, default:false },
  uploadedRequirements: [
    {
      name: { type: String, required: true },
      filePath: { type: String, required: true }, 
    },
  ],

  //Extras for Profile
  jerseyNumber: { type: String },
  contactNumber: { type: String },
  permanentAddress: { type: String },
  course: {type: String},
  birthDate: { type: Date },
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  medicalHistory: { type: String },
  profilePic: { type: String, default: null }
  }, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
