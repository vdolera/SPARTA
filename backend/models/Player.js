const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  accessKey: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
