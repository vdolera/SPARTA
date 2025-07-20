import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// NEEDS TO BE UPDATED PA

const CreateEvent = () => {
  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [description, setDescription] = useState("");

  // Handle form submission
  const handleCreate = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('auth'));
    
    try {
      const response = await fetch('http://localhost:5000/api/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          email,
          institution: user.institution,
          eventName,
          eventStartDate,
          eventEndDate,
          description,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert('✅ Event created!');
        navigate('/event');
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('❌ Failed to create event.');
    }
  };

  // Handle cancel
  const handleCancel = () => navigate("/event");

  return (
    <MainLayout>
      <div className='event-form-header'>
        <h1>Event Creation Form</h1>
      </div>

      <div className='event-form-container'>
        <div className="event-form-title">
          <h4> ORGANIZER AND EVENT </h4>
          <p> *All Fields Are REQUIRED To Be Filled Up* </p>
        </div>

        <form className="event-forms" onSubmit={handleCreate}>
          <label>
            Organizer Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Event Name:
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
          </label>
          <label>
            <div className="event-duration-inputs">
              Event Duration:
              <input
                type="date"
                value={eventStartDate}
                onChange={(e) => setEventStartDate(e.target.value)}
                required
              />
              <span> to </span>
              <input
                type="date"
                value={eventEndDate}
                onChange={(e) => setEventEndDate(e.target.value)}
                required
              />
            </div>
          </label>

          <label>
            Short Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Brief summary of the event..."
              rows={4}
            />
          </label>
        </form>

        <div className="lower-buttons">
          <button type="button" onClick={handleCancel}>Cancel</button>
          <button type="submit">Create Event</button>
        </div>

      </div>

    </MainLayout>

  )
};

export default CreateEvent;