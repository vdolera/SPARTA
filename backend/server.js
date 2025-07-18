const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// Default Route
app.get("/", (req, res) => {
    res.send("Server is running...");
});

//Login & Register Safety
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

//Institution route
const institutionRoutes = require('./routes/auth');
app.use('/api', institutionRoutes);

//For events
const eventRoutes = require('./routes/auth');
app.use('/api', eventRoutes);

// Server Start
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));




// Will reuse laterz
/*
// Create inventory item
app.post("/inventory", async (req, res) => {
    try {
      const newItem = new Inventory(req.body);
      const savedItem = await newItem.save();
      res.json(savedItem);
    } catch (err) {
      res.status(400).json({ message: "Error creating item", error: err });
    }
  });
  
  // Read all inventory items
  app.get("/inventory", async (req, res) => {
    try {
      const items = await Inventory.find();
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: "Error fetching items", error: err });
    }
  });
  
  // Update item
  app.put("/inventory/:id", async (req, res) => {
    try {
      const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: "Error updating item", error: err });
    }
  });
  
  // Delete item
  app.delete("/inventory/:id", async (req, res) => {
    try {
      await Inventory.findByIdAndDelete(req.params.id);
      res.json({ message: "Item deleted" });
    } catch (err) {
      res.status(400).json({ message: "Error deleting item", error: err });
    }
  });
  */