const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  institution: String,
});

module.exports = mongoose.model('Admin', adminSchema);
