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
  }, [userInstitution]);
  
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

      <div style={{ marginTop: "20px" }}>
  {events.map((event) => (
    <button
      key={event._id}
      className="event-item"
      style={{ 
        background: event.eventColor 
          ? `linear-gradient(to right, white, ${event.eventColor})`
          : 'linear-gradient(to right, white, #A96B24)',
        color: 'black'
      }}
      onClick={() => handleEventClick(event)}
    >
      {event.eventName}
    </button>
  ))}
</div>


  </MainLayout>
  )
};

export default Event;