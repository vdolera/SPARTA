const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  institution: { type: String, required: true},
  eventName: { type: String, required: true },
  eventStartDate: { type: Date, required: true },
  eventEndDate: { type: Date, required: true },
  description: { type: String, required: false },
  eventColor: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
