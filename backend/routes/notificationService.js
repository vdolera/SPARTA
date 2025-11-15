const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Game = require("../models/Game");
const Player = require("../models/Player");

// 1. Set up your Email Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Finds all matches scheduled for tomorrow and sends email notifications
 * to the players of the participating teams.
 */
const checkAndSendMatchNotifications = async () => {
  console.log("Running scheduled job: Checking for upcoming matches...");

  // 2. Define "tomorrow's" date range
  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0);

  try {
    // 3. Find all games that have matches scheduled for tomorrow
    const gamesWithUpcomingMatches = await Game.find({
      "matches.date": {
        $gte: tomorrowStart,
        $lt: tomorrowEnd,
      },
      "matches.notificationSent": false, // Only find matches we haven't emailed about
    });

    if (gamesWithUpcomingMatches.length === 0) {
      console.log("No upcoming matches found for tomorrow.");
      return;
    }

    // 4. Process each game and its matches
    for (const game of gamesWithUpcomingMatches) {
      const { institution, eventName } = game;

      const upcomingMatches = game.matches.filter(
        (m) =>
          m.date >= tomorrowStart &&
          m.date < tomorrowEnd &&
          !m.notificationSent &&
          m.teams.length === 2 && // Ensure teams are set
          m.teams[0].name !== "TBD" &&
          m.teams[1].name !== "TBD"
      );

      for (const match of upcomingMatches) {
        const teamNames = [match.teams[0].name, match.teams[1].name];
        
        // 5. Find all *approved* players on those teams for that event
        const playersToNotify = await Player.find({
          institution: institution,
          eventName: eventName,
          team: { $in: teamNames },
          approved: true,       // Make sure they are part of the institution
          teamApproval: true, // Make sure they are part of the team
        });

        if (playersToNotify.length === 0) {
          console.log(`No approved players found for match ${match._id}`);
          continue; // Move to the next match
        }
        
        const emailList = playersToNotify.map(p => p.email);

        // 6. Send the email
        const mailOptions = {
          from: `"${eventName} Alerts" <${process.env.SMTP_USER}>`,
          to: emailList.join(", "), // Send to all players at once
          subject: `Upcoming Match Reminder: ${teamNames[0]} vs ${teamNames[1]}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #222;">
              <p>Greetings Players,</p>
              
              <p>This is a reminder that your match is scheduled for <b>tomorrow</b>:</p>
              
              <hr/>
              <p><b>Event:</b> ${eventName}</p>
              <p><b>Game:</b> ${game.category} ${game.gameType}</p>
              <p><b>Match:</b> ${teamNames[0]} vs ${teamNames[1]}</p>
              <p><b>Time:</b> ${new Date(match.date).toLocaleString('en-US', { timeStyle: 'short', dateStyle: 'medium' })}</p>
              <p><b>Location:</b> ${match.location || 'TBD'}</p>
              <hr/>
              
              <p>Please be at the venue on time. Good luck!</p>
              
              <p style="margin-top: 24px;">
                Best regards,<br/>
                ${eventName} Organizing Team
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Notification sent for match ${match._id}`);

        // 7. IMPORTANT: Mark the match as notified
        match.notificationSent = true;
      }
      
      // Save the changes (notificationSent: true) back to the database
      await game.save();
    }
  } catch (err) {
    console.error("Error in scheduled notification job:", err);
  }
};

/**
 * Starts the notification scheduler.
 * Runs at 9:00 AM every day.
 */
const start = () => {
  // '0 9 * * *' = "at 9:00 AM every day"
  cron.schedule('0 9 * * *', checkAndSendMatchNotifications, {
    scheduled: true,
    timezone: "Asia/Manila", // Set to your server's/event's timezone
  });
  
  console.log("Notification Service Started. Will run at 9:00 AM daily.");
};

module.exports = { start };