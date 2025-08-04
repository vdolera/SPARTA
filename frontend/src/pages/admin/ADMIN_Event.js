import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import '../../styles/ADMIN_Event.css'; 

const Event = () => {

  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/events?institution=${userInstitution}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, []);
  
  const handleAddEvent = () => {
    navigate("./create");
  };

  const handleEventClick = (event) => {
    navigate(`/event/${encodeURIComponent(event.eventName)}/game`);
  };
  return (

  <MainLayout>
    
      <div className="event-header">
        <h1>Event</h1>
          <button onClick={handleAddEvent}> + New Event </button>
      </div>

        { <div style={{ marginTop: "20px" }}>
        {events.map((event) => (
          <button key={event._id} className="event-item" onClick={() => handleEventClick(event)} >
            {event.eventName}
          </button>
          ))}
        </div> }


  </MainLayout>
  )
};

export default Event;