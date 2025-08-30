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

// API Routes
app.use("/api", require("./routes/auth"));
app.use("/api", require("./routes/events"));
app.use("/api", require("./routes/games"));
app.use("/api", require("./routes/teams"));
app.use("/api", require("./routes/players"));
app.use("/api", require("./routes/feedback"));
app.use("/uploads", express.static("./uploads"));


// Default Route
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// Start Server
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
