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
  const [location, setLocation] = useState("");
  const [eventColor, setEventColor] = useState("#3E64AF");
  const [description, setDescription] = useState("");
  const [subOrganizerName, setSubOrganizerName] = useState("");
  const [subOrganizerEmail, setSubOrganizerEmail] = useState("");
  const [subOrganizerRole, setSubOrganizerRole] = useState("co-organizer");
  const [subOrganizers, setSubOrganizers] = useState([
    { email: "", role: "co-organizer" }
  ]);
  const [inviteStatus, setInviteStatus] = useState("");


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
          location,
          eventColor,
          description,
          subOrganizerName,
          subOrganizerEmail,
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

  const handleSubOrganizerChange = (idx, field, value) => {
    const updated = [...subOrganizers];
    updated[idx][field] = value;
    setSubOrganizers(updated);
  };

  const handleAddSubOrganizer = () => {
    setSubOrganizers([...subOrganizers, { email: "", role: "co-organizer" }]);
  };

  const handleSendInvite = async (idx) => {
    const subOrg = subOrganizers[idx];
    if (!subOrg.email) {
      setInviteStatus("Please enter an email.");
      setTimeout(() => setInviteStatus(""), 3000); // Clear after 3 seconds
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/event/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: subOrg.email,
          role: subOrg.role,
          eventName,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setInviteStatus("Invitation sent!");
        setTimeout(() => setInviteStatus(""), 3000); // Clear after 3 seconds
      } else {
        setInviteStatus(data.message || "Failed to send invitation.");
        setTimeout(() => setInviteStatus(""), 3000); // Clear after 3 seconds
      }
    } catch (error) {
      setInviteStatus("Error sending invitation.");
      setTimeout(() => setInviteStatus(""), 3000); // Clear after 3 seconds
    }
  };

  const handleDeleteSubOrganizer = (idx) => {
    setSubOrganizers(subOrganizers.filter((_, i) => i !== idx));
  };

  return (

  <MainLayout>

    <div className="event-container">
      <div className='event-create-maindiv'>

      <div className='event-form-header'>
        <h1>Event Creation Form</h1>
      </div>

        <div className='event-form-container'>

          <div className="event-form-left">

            <div className="event-form-title">
              <h4> EVENT DETAILS </h4>
              <p style={{ color: 'red', fontSize: '10px' }}> *All Fields Are REQUIRED To Be Filled Up* </p>
            </div>

            <form className="event-forms" onSubmit={handleCreate}>

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
                Location:
                <input 
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                required
                placeholder="Location"
              />
              </label>

              <label className="color-picker">
                Event Color:
                  <input
                    type="color"
                    value={eventColor}
                    onChange={e => setEventColor(e.target.value)}
                    required
                  />
              </label>

              <label>
                Description:
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter Event Description"
                  rows="4"
                  cols="57"
                  required
                  style={{ resize: 'vertical', fontFamily: 'Montserrat, sans-serif', marginTop: '5px' }}
                />
              </label>

            </form>

          </div>

          <div className="event-form-right" style={{ minHeight: `${220 + subOrganizers.length * 60}px` }}>
            <div className="event-form-title">
              <h4> ORGANIZER DETAILS </h4>
              <p style={{ color: 'red', fontSize: '10px' }}> *All Fields Are REQUIRED To Be Filled Up* </p>
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

              <hr style={{ border: '1px solid #ccc', margin: '10px 0' }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div className="event-form-title">
                  <h4> CO & SUB-ORGANIZERS </h4>
                  <p style={{ color: '#3E64AF', fontSize: '10px' }}> *Fields are Optional To Be Filled Up* </p>
                </div>
                <button
                  type="button"
                  style={{ fontSize: "14px", background: "#CE892C", color: "white", borderRadius: "6px", padding: "6px 12px", border: "none", cursor: "pointer", marginLeft: "16px" }}
                  onClick={handleAddSubOrganizer}
                >
                  + Add Sub-Organizer
                </button>
              </div>
              
              <div>
                {subOrganizers.map((subOrg, idx) => (
                  <div key={idx} style={{marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>

                    <label>
                      Role:
                      <select
                        className="role-selector"
                        value={subOrg.role}
                        onChange={e => handleSubOrganizerChange(idx, "role", e.target.value)}
                        style={{ marginLeft: "8px", marginBottom: "8px", fontSize: "14px" }}
                      >
                        <option value="co-organizer">Co-Organizer</option>
                        <option value="sub-organizer">Sub-Organizer</option>
                      </select>
                    </label>

                    <label>
                      Email:
                      <input
                        type="email"
                        value={subOrg.email}
                        onChange={e => handleSubOrganizerChange(idx, "email", e.target.value)}
                        placeholder="Enter Email"
                      />
                    </label>
                    <button
                      type="button"
                      style={{ background: "#3E64AF", color: "white", borderRadius: "6px", padding: "6px 12px", border: "none", cursor: "pointer" }}
                      onClick={() => handleSendInvite(idx)}
                    >
                      Send Invitation
                    </button>
                    <button
                      type="button"
                      style={{ background: "#d32f2f", color: "white", borderRadius: "6px", padding: "6px 12px", border: "none", cursor: "pointer" }}
                      onClick={() => handleDeleteSubOrganizer(idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              
              {inviteStatus && (
                <p style={{ color: inviteStatus === "Invitation sent!" ? "green" : "red", fontSize: "12px", marginTop: "4px" }}>
                  {inviteStatus}
                </p>
              )}
            </form>

          </div>
        
        </div>
    </div>

    </div>

    
    <div className="event-container">
      <div className="lower-buttons">
        <button type="button" onClick={handleCancel}>Cancel</button>
        <button type="submit" onClick={handleCreate}>Create Event</button>
      </div>
    </div>
      

  </MainLayout>

  )
};

export default CreateEvent;