const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  institution: { type: String, required: true },
  ok: { type: Boolean, default: false },
  role: { type: String, default: "admin" },
});

module.exports = mongoose.model('Admin', adminSchema);
