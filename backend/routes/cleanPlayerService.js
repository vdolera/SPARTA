const cron = require('node-cron');
const Event = require('../models/Event');   // Adjust path (.. or .) based on folder structure
const Player = require('../models/Player'); // Adjust path
const History = require('../models/History'); // Adjust path

const start = () => {
  // Run every day at 00:00 (Midnight)
  // For testing, change '0 0 * * *' to '* * * * *' (every minute)
  cron.schedule('* * * * *', async () => {
    console.log("Running Daily Event Cleanup...");
    
    try {
      const now = new Date();
      
      // 1. Find events that ended BEFORE now
      const endedEvents = await Event.find({ eventEndDate: { $lt: now } });

      for (const event of endedEvents) {
        // 2. Find players for this specific event
        const players = await Player.find({ eventId: event._id });

        if (players.length > 0) {
          console.log(`Archiving ${players.length} players for ended event: ${event.eventName}`);

          // 3. Copy to History
          const historyRecords = players.map(p => ({
            email: p.email,
            institution: p.institution,
            eventName: event.eventName,
            team: p.team || "No Team",
            game: p.game || []
          }));

          await History.insertMany(historyRecords);

          // 4. Delete from Players
          await Player.deleteMany({ eventId: event._id });
          
          console.log(`Cleanup complete for ${event.eventName}`);
        }
      }
    } catch (err) {
      console.error("Error in cron job:", err);
    }
  });
};

// EXPORT THE FUNCTION
module.exports = { start };