import MainLayout from "../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/ADMIN_EventCreate.css';

const CreateEvent = () => {

  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [eventDuration, setEventDuration] = useState("");
  const [teams, setTeams] = useState([""]);
  
  // Add a new team input
  const handleAddTeam = () => setTeams([...teams, ""]);
  
  // Update team name
  const handleTeamChange = (idx, value) => {
    const updated = [...teams];
    updated[idx] = value;
    setTeams(updated);
  };

  // Remove a team input
  const handleRemoveTeam = (idx) => {
    setTeams(teams.filter((_, i) => i !== idx));
  };

  // Handle form submission
  const handleCreate = (e) => {
    e.preventDefault();
    // TODO: Save event (API or context)
    // Example: send eventName, userName, teams to backend or parent
    navigate("/admin/event"); // Redirect to event page
  };

  // Handle cancel
  const handleCancel = () => navigate("/admin/event");

  return (

  <MainLayout>
    <div className='event-form-header'>
      <h1>Event Creation Form</h1>
    </div>

    <div className='event-form-container'>

      <h4> ORGANIZER AND EVENT </h4>
      <p> *All Fields Are REQUIRED To Be Filled Up* </p>

      <form onSubmit={handleCreate}>
        <label>
          Event Name:
          <input 
            type="text"
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            required
            placeholder="Event Name"
          />
        </label>
        <label>
          Organizer Name:
          <input
            type="text"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
            placeholder="Organizer Name"
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            required
            placeholder="Email"
          />
        </label>
        <label>
          Event Duration:
          <input
            type="text"
            value={eventDuration}
            onChange={e => setEventDuration(e.target.value)}
            required
            placeholder="Event Duration"
          />
        </label>
        <label>Participating Teams:</label>
        {teams.map((team, idx) => (
          <div key={idx}>
            <input
              type="text"
              value={team}
              onChange={e => handleTeamChange(idx, e.target.value)}
              required
              placeholder={`Team ${idx + 1}`}
            />
            <button type="button" onClick={() => handleRemoveTeam(idx)}>
              Remove
            </button>

            <button type="button" onClick={handleAddTeam}>
              Add Team
            </button>

          </div>
        ))}


      </form>

      <div className="lower-buttons">
        <button type="button" onClick={handleCancel}>Cancel</button>
        <button type="submit" >Create Event</button>
      </div>


    </div>

  </MainLayout>

  )
};

export default CreateEvent;