const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  institution: { type: String, required: true },
  ok: { type: Boolean, default: false },
  role: { type: String, default: "admin" },

  //For UserName (I didnt change the fieldName, need to change the logic in header if diff)
  playerName: { type: String, trim: true },
  profilePic: { type: String, default: null },
});

module.exports = mongoose.model('Admin', adminSchema);
