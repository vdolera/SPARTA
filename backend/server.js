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

// ✅ Use auth.js for ALL routes
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// Server Start
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
