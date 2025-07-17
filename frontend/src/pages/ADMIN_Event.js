import MainLayout from "../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/Event.css'; // Assuming you have a CSS file for styling

const Event = () => {

  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
 
  const handleAddEvent = () => {
    navigate("./create");
  };

  const handleEventClick = (eventId) => {
    navigate(`./pages/ADMIN_Event/${eventId}/Games`);
  };
  return (

  <MainLayout>
    
      <div className="event-header">
        <h1>Event</h1>

        <button onClick={handleAddEvent}> + New Event </button>

        <div style={{ marginTop: "20px" }}>
          {events.map((event) => (
            <button
              key={event.id}
              style={{ display: "block", margin: "10px 0" }}
              onClick={() => handleEventClick(event.id)}
            >
              {event.name}
            </button>
          ))}
        </div>
      
      </div>
  </MainLayout>

  )
};

export default Event;