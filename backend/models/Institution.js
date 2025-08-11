const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true},
});

module.exports = mongoose.model('Institution', institutionSchema);
