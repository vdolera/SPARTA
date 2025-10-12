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
  const [coordinators, setCoordinator] = useState([
    { name: "", email: "", role: "co-organizer" }
  ]);
  const [requirements, setRequirements] = useState([""]);

  const [inviteStatus] = useState("");

  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const user = JSON.parse(localStorage.getItem("auth"));

  // Handle form submission
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName,
          email,
          institution: user?.institution,
          eventName,
          eventStartDate,
          eventEndDate,
          location,
          eventColor,
          description,
          requirements,
          coordinators,
        }),
      });

      if (response.ok) {
        setModalMessage("Event Create and Event Invitaions have been sent!");
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          navigate(-1);
        }, 4000)
      } else {
        setModalMessage("There are still fields that needs to be filled-up.   ")
        setShowModal(true);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      setModalMessage("Failed to create event.")
    }
  };

  // Handle cancel
  const handleCancel = () => navigate(-1);

  // Change Coord
  const handleCoordinatorChange = (idx, field, value) => {
    const updated = [...coordinators];
    updated[idx][field] = value;
    setCoordinator(updated);
  };

  // Add coord
  const handleAddCoordinator = () => {
    setCoordinator([...coordinators, { name: "", email: "", role: "co-organizer" }]);
  };

  // Remove coord
  const handleDeleteCoordinator = (idx) => {
    setCoordinator(coordinators.filter((_, i) => i !== idx));
  };

  // REQUIREMENT HANDLING
  const handleAddRequirement = () => setRequirements([...requirements, ""]);

  // Change Requirements
  const handleRequirementChange = (idx, value) => {
    const updated = [...requirements];
    updated[idx] = value;
    setRequirements(updated);
  };

  // Remove Requirements
  const handleRemoveRequirement = (idx) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  return (
    <MainLayout>
    <>
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
                  <span className="color-label">Event Color:</span>
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

                <div className="event-reqs">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <h4>EVENT REQUIREMENTS</h4>
                    <button className="add-coordinator-button" type="button" onClick={handleAddRequirement}>
                      + Add Requirement
                    </button>
                  </div>

                  {requirements.map((req, idx) => (
                    <div key={idx} style={{ marginTop: "5px" }}>
                      <input
                        type="text"
                        value={req}
                        onChange={(e) => handleRequirementChange(idx, e.target.value)}
                        required
                        placeholder={`Requirement ${idx + 1}`}
                        style={{ marginRight: "10px" }}
                      />
                      {requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRequirement(idx)}
                          style={{
                            background: "#d9534f",
                            color: "white",
                            border: "none",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            cursor: "pointer"
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </form>
            </div>

            <div className="event-form-right" style={{ minHeight: `${220 + coordinators.length * 60}px` }}>
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
                    className="add-coordinator-button"
                    type="button"
                    onClick={handleAddCoordinator}
                  >
                    + Add Coordinator
                  </button>
                </div>

                <div>
                  {coordinators.map((coord, idx) => (
                    <div key={idx} style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>

                      <label>
                        Role:
                        <select
                          className="role-selector"
                          value={coord.role}
                          onChange={e => handleCoordinatorChange(idx, "role", e.target.value)}   
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
                          value={coord.email}
                          onChange={e => handleCoordinatorChange(idx, "email", e.target.value)}  
                          placeholder="Enter Email"
                        />
                      </label>

                      <label>
                        Full Name:
                        <input
                          type="text"
                          value={coord.name}
                          onChange={e => handleCoordinatorChange(idx, "name", e.target.value)}
                          placeholder="Enter Name"
                        />
                      </label>

                      <button
                        type="button"
                        style={{ background: "#d32f2f", color: "white", borderRadius: "6px", padding: "6px 12px", border: "none", cursor: "pointer" }}
                        onClick={() => handleDeleteCoordinator(idx)}  
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

          <div className="event-container">
              <div className="lower-buttons">
                <button type="button" onClick={handleCancel}>Cancel</button>
                <button type="submit" onClick={handleCreate}>Create Event</button>
              </div>
          </div>
          
        </div>
      </div>
    
    {showModal && (
      <div className="event-modal-backdrop">
        <div className="event-create-modal">
          <p>{modalMessage}</p>
          <button onClick={() => setShowModal(false)}>Close</button>
        </div>
      </div>
    )}
    </>
    </MainLayout>
  )
};

export default CreateEvent;