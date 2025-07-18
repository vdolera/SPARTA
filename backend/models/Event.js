const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  institution: String,
  eventName: { type: String, required: true },
  eventStartDate: { type: Date, required: true },
  eventEndDate: { type: Date, required: true },
  description: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
