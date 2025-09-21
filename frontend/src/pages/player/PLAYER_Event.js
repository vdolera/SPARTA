import PlayerMainLayout from "../../components/P_MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import '../../styles/ADMIN_Event.css'; 

const PlayerEvent = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/active-events?institution=${userInstitution}&email=${user.email}&role=${user.role}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [userInstitution, user.email, user.role]);
  
  const handleEventClick = (event) => {
    navigate(`/event/${encodeURIComponent(event.eventName)}`);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PlayerMainLayout>
      <div className="event-main-header">
        <input
          type="text"
          className="event-search-bar"
          placeholder="Search events..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginRight: "16px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
        />
      </div>

      <div className="event-list">
        {filteredEvents.map((event) => (
          <div className='event-item' key={event._id}>
            <div className="event-color" style={{ background: event.eventColor ? event.eventColor : '#A96B24'}} onClick={() => handleEventClick(event)}>
              
            </div>

            <div className="event-name" onClick={() => handleEventClick(event)}>
              {event.eventName}
            </div>
          </div>
        ))}
      </div>
    </PlayerMainLayout>
  )
};

export default PlayerEvent;