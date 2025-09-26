const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

const nodemailer = require("nodemailer"); // make sure you import this




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

  app.post("/api/test-email", async (req, res) => {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { 
          user: process.env.SMTP_USER, 
          pass: process.env.SMTP_PASS 
        },
      });
  
      const testResult = await transporter.sendMail({
        from: `"SPARTA Test" <${process.env.SMTP_USER}>`,
        to: "vincentdolera25@gmail.com", // Your test email
        subject: "Test Email from SPARTA",
        html: "<h1>This is a test email</h1>",
      });
  
      console.log("Test email result:", testResult);
      res.json({ success: true, messageId: testResult.messageId });
    } catch (error) {
      console.error("Test email failed:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

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
