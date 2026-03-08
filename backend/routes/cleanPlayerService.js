const cron = require('node-cron');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const nodemailer = require('nodemailer'); // For sending the cert
const Event = require('../models/Event');
const Player = require('../models/Player');
const History = require('../models/History');

// transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  }
});

// Generate & Send Certificate
const generateAndSendCertificate = async (player, event) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
      });

      // Store PDF in memory
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers);

        // Send Email and Certificate
        try {
          await transporter.sendMail({
            from: '"SPARTA Admin" <no-reply@sparta.com>',
            to: player.email,
            subject: `Certificate of Participation - ${event.eventName}`,
            text: `Hi ${player.playerName || "Player"},\n\nThank you for participating in ${event.eventName}. Please find your certificate attached.\n\nBest,\nSPARTA Team`,
            attachments: [
              {
                filename: `${player.playerName}-Certificate.pdf`,
                content: pdfData,
              },
            ],
          });
          console.log(`Certificate sent to ${player.email}`);
          resolve();
        } catch (emailErr) {
          console.error(`Failed to send email to ${player.email}:`, emailErr);
          resolve();
        }
      });

      // PDF Styling
      // Border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke();

      // Header
      doc.fontSize(30).font('Helvetica-Bold').text('CERTIFICATE OF PARTICIPATION', { align: 'center', valign: 'center' });
      doc.moveDown();

      // Body
      doc.fontSize(20).font('Helvetica').text('This is presented to', { align: 'center' });
      doc.moveDown();

      doc.fontSize(35).fillColor('#b95454').text(player.playerName || "Participant", { align: 'center', underline: true });
      doc.fillColor('black');
      doc.moveDown();

      doc.fontSize(20).text('For successfully participating in the event:', { align: 'center' });
      doc.moveDown();

      doc.fontSize(25).font('Helvetica-Bold').text(event.eventName, { align: 'center' });
      doc.moveDown();

      doc.fontSize(15).font('Helvetica').text(`Held at ${event.location || "SPARTA Venue"}`, { align: 'center' });
      doc.fontSize(15).text(`Date: ${new Date(event.eventEndDate).toLocaleDateString()}`, { align: 'center' });

      // Footer
      doc.moveDown(4);
      doc.fontSize(15).text('_________________________', 100, doc.y);
      doc.text('Organizer Signature', 100, doc.y + 10);

      doc.text('_________________________', 500, doc.y - 25);
      doc.text('SPARTA Administration', 500, doc.y + 10);

      doc.end();

    } catch (err) {
      console.error("Error creating PDF:", err);
      reject(err);
    }
  });
};

// Cleaning Players from archive events
const start = () => {
  // Run every day at 00:00 
  cron.schedule('* * * * *', async () => {
    console.log("Running Daily Event Cleanup...");

    try {
      const now = new Date();

      // Find events that ended 
      const endedEvents = await Event.find({ eventEndDate: { $lt: now } });

      for (const event of endedEvents) {
        // Find players for this specific event
        const players = await Player.find({ eventId: event._id });

        if (players.length > 0) {
          console.log(`Processing ${players.length} players for ended event: ${event.eventName}`);

          // Generate Certificates
          console.log("Generating certificates...");

          for (const player of players) {
            if (player.email) {
              await generateAndSendCertificate(player, event);
            }
          }

          // Copy Player data to History schema
          const historyRecords = players.map(p => ({
            email: p.email,
            institution: p.institution,
            eventName: event.eventName,
            team: p.team || "No Team",
            game: p.game || []
          }));

          await History.insertMany(historyRecords);

          // Delete Players
          await Player.deleteMany({ eventId: event._id });

          console.log(`Cleanup complete for ${event.eventName}`);
        }
      }
    } catch (err) {
      console.error("Error in cron job:", err);
    }
  });
};

module.exports = { start, generateAndSendCertificate };
