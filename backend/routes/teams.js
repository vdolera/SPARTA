const express = require("express");
const Team = require("../models/Team");
const Game = require("../models/Game");
const Coordinator = require("../models/Coordinator");
const Player = require("../models/Player"); // add this near other requires

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const path = require("path");
const supabase = require("./supabaseClient");

const router = express.Router();

// Team Creation
router.post("/team", upload.single("teamIcon"), async (req, res) => {
  try {
    const { teamName, teamManager, managerEmail, institution, teamColor, eventName, coordinators } = req.body;

    if (!teamName || !teamManager || !managerEmail || !institution) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await Team.findOne({ teamName, institution });
    if (existing) {
      return res.status(409).json({ message: "Team already exists in this institution." });
    }

    let teamIconUrl = null;

    if (req.file) {
     
      const fileExt = path.extname(req.file.originalname);
      const fileName = `teamIcon-${Date.now()}${fileExt}`;

      const { error } = await supabase.storage
        .from("teams")
        .upload(fileName, req.file.buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: req.file.mimetype,
        });

      if (error) {
        console.error("Supabase upload failed:", error);
        return res.status(500).json({ message: "Failed to upload team icon" });
      }

      // Save url
      const { data: publicData } = supabase.storage
      .from("teams")
      .getPublicUrl(fileName);
    
    teamIconUrl = publicData.publicUrl;
    
    }

    const team = new Team({
      teamName,
      teamManager,
      managerEmail,
      institution,
      teamColor,
      eventName,
      teamIcon: teamIconUrl, // store Supabase URL
      coordinators: coordinators ? JSON.parse(coordinators) : []
    });

    await team.save();
    res.status(201).json({ message: "Team created successfully.", team });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: "Server error." });
  }
});


// GET teams
router.get('/teams', async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution) {
      return res.status(400).json({ message: 'Institution is required' });
    }

    const query = { institution };

    if (event) {
      query.eventName = event;
    }

    const teams = await Team.find(query);
    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET single team
router.get('/team', async (req, res) => {
  const { institution, event, teamName } = req.query;
  try {
    const team = await Team.findOne({ institution, eventName: event, teamName });
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Error fetching team", error: err.message });
  }
});

// GET detailed team scores
router.get("/teams/scores", async (req, res) => {
  try {
    const { institution, event } = req.query;
    if (!institution || !event) {
      return res.status(400).json({ message: "Institution and event are required" });
    }

    const teams = await Team.find({ institution, eventName: event });

    // Calculate grandTotal (medal score) and medal counts for each team
    const teamsWithTally = teams.map(team => {
      let grandTotal = 0;
      let gold = 0;
      let silver = 0;
      let bronze = 0;

      team.medals.forEach(medal => {
        if (medal.medal === 'gold') {
          grandTotal += 3; // 3 points for gold
          gold++;
        } else if (medal.medal === 'silver') {
          grandTotal += 2; // 2 points for silver
          silver++;
        } else if (medal.medal === 'bronze') {
          grandTotal += 1; // 1 point for bronze
          bronze++;
        }
      });
      
      const teamObject = team.toObject(); // Get a plain JS object
      teamObject.grandTotal = grandTotal;
      teamObject.gold = gold;
      teamObject.silver = silver;
      teamObject.bronze = bronze;
      
      return teamObject;
    });

    // Sort by grandTotal (highest first), then by gold, then silver, etc.
    teamsWithTally.sort((a, b) => {
      if (b.grandTotal !== a.grandTotal) return b.grandTotal - a.grandTotal;
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      return b.bronze - a.bronze;
    });

    res.json(teamsWithTally);
  } catch (error) {
    console.error("Error fetching team scores:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Coordinators to put assign in teams
router.get("/coordinators", async (req, res) => {
  try {
    const { institution, event } = req.query;

    if (!institution || !event) {
      return res.status(400).json({ message: "Institution and event are required" });
    }

    const coordinators = await Coordinator.find({ institution, eventName: event });

    res.json(coordinators);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE team
router.put("/team/:id", upload.single("teamIcon"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // Fetch the existing team 
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    if (req.file) {
      
      // Delete the OLD image from db if exist
      if (team.teamIcon) {
        const oldFileName = team.teamIcon.split('/').pop(); 

        const { error: removeError } = await supabase.storage
          .from("teams")
          .remove([oldFileName]);

        if (removeError) {
          console.warn("Failed to remove old image from Supabase:", removeError);
        }
      }

      // Upload the NEW image
      const fileExt = path.extname(req.file.originalname);
      const newFileName = `teamIcon-${Date.now()}${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("teams")
        .upload(newFileName, req.file.buffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error("Supabase upload failed:", uploadError);
        return res.status(500).json({ message: "Failed to upload new team icon" });
      }

      // Get new Public URL
      const { data: publicData } = supabase.storage
        .from("teams")
        .getPublicUrl(newFileName);
      
      updates.teamIcon = publicData.publicUrl;
    }

    if (updates.coordinators) {
        try {
            updates.coordinators = JSON.parse(updates.coordinators);
        } catch (e) {
        }
    }

    Object.assign(team, updates);
    await team.save();

    res.json({ message: "Team updated successfully", team });
  } catch (err) {
    console.error("Error updating team:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE team
router.delete("/team/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Find the team first
    const team = await Team.findById(id);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Delete the image in the db
    if (team.teamIcon) {
      // Extract the filename from the URL
      const fileName = team.teamIcon.split('/').pop();

      const { error } = await supabase.storage
        .from("teams")
        .remove([fileName]);

      if (error) {
        console.error("Error deleting file from Supabase:", error);
      }
    }

    await Team.findByIdAndDelete(id);

    res.json({ message: "Team and associated icon deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// New endpoint: aggregated player counts per event/team
router.get("/teams/player-counts", async (req, res) => {
  try {
    const { institution, event, approved } = req.query;
    if (!institution) return res.status(400).json({ message: "Institution is required" });

    const match = { institution };

    if (event) match.eventName = event;
    // Only count players that have a team assigned, non-empty
    match.team = { $exists: true, $ne: "" };
    if (approved !== undefined) {
      match.teamApproval = approved === "true";
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: { eventName: "$eventName", teamName: "$team" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.eventName",
          teams: { $push: { teamName: "$_id.teamName", count: "$count" } },
          totalPlayers: { $sum: "$count" },
        },
      },
      {
        $project: { _id: 0, eventName: "$_id", teams: 1, totalPlayers: 1 },
      },
    ];

    const results = await Player.aggregate(pipeline);

    if (event) {
      const single = results.find((r) => r.eventName === event) || { eventName: event, teams: [], totalPlayers: 0 };
      return res.json(single);
    }

    res.json(results);
  } catch (err) {
    console.error("Error fetching player counts:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;