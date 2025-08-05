import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../../styles/ADMIN_EventCreate.css';

const CreateEvent = () => {

  const navigate = useNavigate();
  const [eventName, setEventName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [eventColor, setEventColor] = useState("#007bff"); // Default color


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
        alert('Event created!');
        navigate('/event');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event.');
    }
  };
  

  // Handle cancel
  const handleCancel = () => navigate("/event");

  return (

  <MainLayout>
    <div className='event-create-maindiv'>
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
              onChange={e => setUserName(e.target.value)}
              required
              placeholder="Organizer Name"
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email"
            />
          </label>

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
              <div className="event-duration-inputs">
              Event Duration:
                <input
                  type="date"
                  value={eventStartDate}
                  onChange={e => setEventStartDate(e.target.value)}
                  required
                />
                <span> to </span>
                <input
                  type="date"
                  value={eventEndDate}
                  onChange={e => setEventEndDate(e.target.value)}
                  required
                />
              </div>
            </label>

            <label>
              Short Description:
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                placeholder="Brief summary of the event..."
                rows={4}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  Event Color:
  <input
    type="color"
    value={eventColor}
    onChange={e => setEventColor(e.target.value)}
    required
    style={{
      appearance: 'none',            // removes default styles
      WebkitAppearance: 'none',      // for Safari
      MozAppearance: 'none',         // for Firefox
      width: '40px',
      height: '40px',
      borderRadius: '50%',           // perfect circle
      backgroundColor: eventColor,   // ensure the color fills the shape
      padding: 0,
      cursor: 'pointer',
      overflow: 'hidden',
      boxShadow: '0 0 5px rgba(0, 0, 0, 0.3)', // subtle shadow for depth
      transition: 'border-color 0.3s ease', // smooth transition for border color
    }}
    onMouseEnter={e => e.target.style.borderColor = '#000'} // change border color on hover
    onMouseLeave={e => e.target.style.borderColor = eventColor} // revert border color
  />
</label>


          <hr style={{ border: '1px solid #ccc', margin: '20px 0' }} />

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

          </form>

      </div>

    </div>

    <div className="lower-buttons">
      <button type="button" onClick={handleCancel}>Cancel</button>
      <button type="submit" onClick={handleCreate}>Create Event</button>
    </div>

  </MainLayout>

  )
};

export default CreateEvent;