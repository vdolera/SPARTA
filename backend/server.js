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

//For games
const gameRoutes = require('./routes/auth');
app.use('/api', gameRoutes);

//For all routes?
/*
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);*/

// Server Start
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
