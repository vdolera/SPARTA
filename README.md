<h1 align="center">SPARTA</h1>
<h3 align="center">Sports Planning And Resource Tracking App</h3>

<div align="center">
  <p>SPARTA is a comprehensive web-based system designed to streamline the management of sports events. It centralizes key data such as participant profiles, team rosters, schedules, and scores, allowing organizers to efficiently plan, monitor, and update events in real-time.</p>
</div>

<hr />

## Features
- **Event Management**: Create, schedule, and organize tournaments and matches.
- **Participant Profiles & Rosters**: Keep track of players and team assignments.
- **Real-Time Scoring & Brackets Updates**: Update and monitor scores and tournament standings dynamically.
- **Automated Certificates**: Automatically generate and distribute certificates to participating players.
- **Role-Based Access**: Specialized dashboards for Admins, Co-organizers, Sub-organizers, and Players.

## Tech Stack
- **Frontend:** React.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)

---

## Getting Started

### Prerequisites
Node.js and npm must be installed on your device.

### Installation & Setup

**Overall Setup:**
```bash
# Initialize project / install required dependencies
npm init -y 

# Install all dependencies
npm install

# Install specific packages as needed
npm install [package_name]
```

### Environment Variables Setup

You will need to create two separate `.env` files (one in the backend and one in the frontend) to store your credentials.

**1. Create `backend/.env`**
Create a new file called `.env` in the `backend/` folder and add the following keys with your actual database and email credentials:

```env
# MongoDB Connection
MONGO_URI=your_mongodb_url
PORT=your_backend_port

# Authentication
JWT_SECRET=your_jwt_secret_key

# Event Emails & Certificates (Nodemailer)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Google OAuth Login
GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com

# Supabase Storage 
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**2. Create `frontend/.env`**
Create a new file called `.env` in the `frontend/` folder so the React Login component can communicate with Google OAuth:

```env
REACT_APP_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
```

### Running the Application

**Running the Backend:**
Navigate to the `backend/` directory and run the server.
```bash
cd backend
npm run dev
# Starts the backendserver
```

**Running the Frontend:**
On another terminal, navigate to the `frontend/` directory and start the React website.
```bash
cd frontend
npm start
# Starts the localhost server
```
*Note: You can also use `npm run build` in the frontend to compile the final build and check if there are any errors.*

---
