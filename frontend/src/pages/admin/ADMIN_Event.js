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
      navigate(`/admin/event/${encodeURIComponent(event.eventName)}`);
    };
  
  return (

  <MainLayout>
    
      <div className="event-header">
        {/* insert search bar */}
        <button onClick={handleAddEvent}> + New Event </button>
      </div>

        { <div style={{ marginTop: "20px" }}>
        {events.map((event) => (
           <button
            key={event._id}
            className="event-item"
            style={{ backgroundColor: event.eventColor || "#1A2A49" }} // fallback if no color
            onClick={() => handleEventClick(event)}
           >
        {event.eventName}
          </button>
        ))}
        </div> }


  </MainLayout>
  )
};

export default Event;