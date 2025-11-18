const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Game = require("../models/Game");
const Player = require("../models/Player");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const checkAndSendMatchNotifications = async () => {
  console.log("Running scheduled job: Checking for upcoming matches...");

  const now = new Date();
  const todayPHTString = now.toLocaleDateString("en-US", { 
    timeZone: "Asia/Manila",
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric' 
  });

  const todayPHT = new Date(todayPHTString);

  // Calculate "tomorrow" and "day after tomorrow" 
  const tomorrowStart = new Date(todayPHT.getTime() + (24 * 60 * 60 * 1000)); 
  const tomorrowEnd = new Date(todayPHT.getTime() + (2 * 24 * 60 * 60 * 1000)); 

  // for chech debbug
  console.log(`Querying for matches between: ${tomorrowStart.toISOString()} AND ${tomorrowEnd.toISOString()}`);

  try {
    // Find all games that have matches scheduled for tomorrow
    const gamesWithUpcomingMatches = await Game.find({
      "matches.date": {
        $gte: tomorrowStart,
        $lt: tomorrowEnd,
      },
      "matches.notificationSent": false, // Only check match that have false notif
    });

    if (gamesWithUpcomingMatches.length === 0) {
      console.log("No upcoming matches found for tomorrow.");
      return;
    }

    // Process each game and its matches
    for (const game of gamesWithUpcomingMatches) {
      const { institution, eventName } = game;

      const upcomingMatches = game.matches.filter(
        (m) =>
          m.date >= tomorrowStart &&
          m.date < tomorrowEnd &&
          !m.notificationSent &&
          m.teams.length === 2 && 
          m.teams[0].name !== "TBD" &&
          m.teams[1].name !== "TBD"
      );

      for (const match of upcomingMatches) {
        const teamNames = [match.teams[0].name, match.teams[1].name];
        
        // Find all players on a team
        const playersToNotify = await Player.find({
          institution: institution,
          eventName: eventName,
          team: { $in: teamNames },
          approved: true,       
          teamApproval: true, 
        });

        if (playersToNotify.length === 0) {
          console.log(`No approved players found for match ${match._id}`);
          continue; 
        }
        
        const emailList = playersToNotify.map(p => p.email);

        // Send the email
        const mailOptions = {
          from: `"${eventName} Alerts" <${process.env.SMTP_USER}>`,
          to: emailList.join(", "), // Send to all players 
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

        match.notificationSent = true;
      }
      
      // Save notification to true
      await game.save();
    }
  } catch (err) {
    console.error("Error in scheduled notification job:", err);
  }
};

const start = () => {
  // Change for different time, (0 * * * *) is every hr and all * is every min
  cron.schedule('0 6 * * *', checkAndSendMatchNotifications, {
    scheduled: true,
    timezone: "Asia/Manila", 
  });
  
  console.log("Notification Service Started. Will run at 6:00 AM daily.");
};

module.exports = { start };