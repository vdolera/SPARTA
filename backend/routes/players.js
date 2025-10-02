const express = require("express");
const nodemailer = require("nodemailer")
const Player = require("../models/Player");
const Game = require("../models/Game");
const mongoose = require("mongoose");


const router = express.Router();

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/requirements/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });


// GET pending players to enter the insitution
router.get("/players/pending", async (req, res) => {
  const { institution } = req.query; 
  try {
    const players = await Player.find({ approved: false, institution });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// GET pending players that are regesting for a team
router.get("/players/team-pending", async (req, res) => {
  const { institution, eventName, team } = req.query; 
  try {
    const players = await Player.find({ approved: true, institution, eventName, team, teamApproval: false });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Error fetching players", error: err.message });
  }
});

// Verify and APPROVE players if in correct place
router.put("/players/approve/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });

        //Email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    
        await transporter.sendMail({
          from: `"${updatedPlayer.eventName}" <${process.env.SMTP_USER}>`,
          to: updatedPlayer.email,
          subject: `Approval to join the ${updatedPlayer.eventName} at ${updatedPlayer.institution}`,
          html: 
          `
          <div style="font-family: Arial, sans-serif; color: #222;">
          <p>Dear ${updatedPlayer.name},</p>

          <p>
          We are excited to inform you that your request to register in the ${updatedPlayer.eventName} at ${updatedPlayer.institution}have been <b>APPROVED</b>.
          </p>

          <p>Congratulations! And we are looking forward for your active participation in the event.</p>

          <p style="margin-top: 24px;">
          
          Best regards,<br/>

          ${updatedPlayer.eventName} Organizing Team
          
          </p>

          </div>`,
        });

    res.json({ message: "Player approved", player: updatedPlayer });
  } catch (err) {
    res.status(500).json({ message: "Error approving player", error: err.message });
  }
});

// DELETE player from joining the event
router.delete("/players/:id", async (req, res) => {
  try {
    const deleted = await Player.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Player not found" });

    // Email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    
        await transporter.sendMail({
          from: `"SPARTA TEAM" <${process.env.SMTP_USER}>`,
          to: updatedPlayer.email,
          subject: `Request to join event at ${updatedPlayer.institution}`,
          html: `
          <div style="font-family: Arial, sans-serif; color: #222;">

          <p>Greetings!<br/>We hope this email finds you well.</p>

          <p>Your request to register for the ${updatedPlayer.eventName} at ${updatedPlayer.institution} has been <b>DECLINED</b>. <br />
          There might have been an issue with your institution or event requirements.</p>

          <p>If this has been a mistake, please approach or contact your event organizer for assistance.</p>

          </div>`,
        });

    res.json({ message: "Player deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting player", error: err.message });
  }
})

// APPROVE player (team part)
router.put("/players/team-approve/:id", async (req, res) => {
  try {
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { teamApproval: true },
      { new: true }
    );
    if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
        //Email invite
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
    
        await transporter.sendMail({
          from: `"${updatedPlayer.team}" <${process.env.SMTP_USER}>`,
          to: updatedPlayer.email,
          subject: `Approval to join the Sport Event under ${updatedPlayer.team}`,
          html: `
          
          <div style="font-family: Arial, sans-serif; color: #222;">
          <p>Dear ${updatedPlayer.name},</p>

          <p>
          We are excited to inform you that your request to register in the ${updatedPlayer.game} under ${updatedPlayer.team} has been <b>APPROVED</b>.
          </p>

          <p>Congratulations! And we are looking forward for your active participation in the sport event. Please wait for further instructions.</p>

          <p style="margin-top: 24px;">
          
          Best regards,<br/>

          ${updatedPlayer.team} Organizers
          
          </p>

          </div>`,
        });

    res.json({ message: "Player approved by team", player: updatedPlayer });
  } catch (err) {
    res.status(500).json({ message: "Error approving player by team", error: err.message });
  }
});

// DECLINE player (team part)
router.put("/players/team-decline/:id", async (req, res) => {
  try {
    const declinedPlayer = await Player.findByIdAndUpdate(
      req.params.id,
      { 
        team: "",
        game: "",
        teamApproval: false,
        uploadedRequirements: [],
       },
      { new: true }
    );
    if (!declinedPlayer) return res.status(404).json({ message: "Player not found" });

      // Email invite
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
  
      await transporter.sendMail({
        from: `"SPARTA ADMIN" <${process.env.SMTP_USER}>`,
        to: declinedPlayer.email,
        subject: `UPDATE on your request made on SPARTA`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #222;">
          <p>Dear ${declinedPlayer.name},</p>

          <p>
          We hope this message finds you well. We regret to inform you that your request to register in your chosen sport game has been <b>DECLINED</b>.
          </p>

          <p>We understand that this news may be disappointing, and however we encourage you to explore other sport games to represent our team.</p>

          <p style="margin-top: 24px;">
          
          Best regards,<br/>

          Team Organizers
          
          </p>

          </div>`,
      });

    res.json({ message: "Player declined by team", player: declinedPlayer });
  } catch (err) {
    res.status(500).json({ message: "Error declining player by team", error: err.message });
  }
});

/*
// REGISTER game for player
router.put("/players/:id/register-game", async (req, res) => {
  const { playerName, team, game } = req.body;
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, { playerName, team, game }, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json({ message: "Game registered", player: updatedPlayer });
});
*/

// REGISTER game for player
router.put("/players/:id/register-game", upload.any(), async (req, res) => {
    try {
      const { playerName, team, sex } = req.body;
      let games = req.body.game;

      // Make sure that games is always an array
      if (!games) {
        return res.status(400).json({ message: "No game selected" });
      }
      if (!Array.isArray(games)) games = [games];

      // Check if the gameid is in the mongodb 
      const validGameIds = games.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (!validGameIds.length) {
        return res.status(400).json({ message: "Invalid game ID(s)" });
      }

      // Get the OG game documents
      const gameDocs = await Game.find({ _id: { $in: validGameIds } });
      if (!gameDocs.length) {
        return res.status(404).json({ message: "Games not found" });
      }

      // Collect uploaded requirement files
      const uploadedRequirements = (req.files || []).map((file) => {
        const match = file.fieldname.match(/requirements\[(.+)\]/);
        const reqName = match ? match[1] : file.fieldname;
        return {
          name: reqName,
          filePath: `/uploads/requirements/${file.filename}`,
        };
      });

      // Update the player
      const updatedPlayer = await Player.findByIdAndUpdate(
        req.params.id,
        {
          $set: { playerName, team, sex },
          $push: {
            game: {
              $each: gameDocs.map((g) => `${g.category} ${g.gameType}`),
            },
            uploadedRequirements: { $each: uploadedRequirements },
          },
        },
        { new: true }
      );

      if (!updatedPlayer) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({ message: "Game(s) registered", player: updatedPlayer });
    } catch (err) {
      console.error("Error registering player:", err);
      res.status(500).json({ message: "Failed to register player" });
    }
  }
);



// GET players by team
router.get("/players", async (req, res) => {
  const { institution, eventName, team, teamApproval } = req.query;
  const players = await Player.find({ institution, team, eventName, teamApproval: true });
  res.json(players);
});

// UPDATE profile
router.put("/players/:id/profile", async (req, res) => {
  const updatedPlayer = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updatedPlayer) return res.status(404).json({ message: "Player not found" });
  res.json(updatedPlayer);
});

// GET single player
router.get("/players/:id", async (req, res) => {
  const player = await Player.findById(req.params.id);
  if (!player) return res.status(404).json({ message: "Player not found" });
  res.json(player);
});

module.exports = router;
