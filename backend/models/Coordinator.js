const mongoose = require("mongoose");

const CoordinatorSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String, required: true },
  institution: { type: String, required: true },
  role: { type: String, enum: ["co-organizer", "sub-organizer"], required: true },
  accessKey: { type: String, required: true },
  eventName: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Coordinator", CoordinatorSchema);
