import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import '../../styles/ADMIN_Event.css'; 

const Event = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/active-events?institution=${userInstitution}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [userInstitution]);

    useEffect(() => {
    document.title = "SPARTA | Event";
  }, []);
  
  const handleAddEvent = () => {
    navigate("./create");
  };

  const handleEventClick = (event) => {
    navigate(`/admin/event/${encodeURIComponent(event.eventName)}`);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="event-main-header">  {/* Search Bar and Add Event Button */}
        <input
          type="text"
          className="event-search-bar"
          placeholder="Search events..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginRight: "16px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "16px" }}
        />
        <button className="new-event-btn" onClick={handleAddEvent}> + New Event </button>
      </div>

      <div className="event-list">
          {filteredEvents.map((event) => (
            <div key={event._id} className="event-item">
              <div className="event-color" style={{ background: event.eventColor ? event.eventColor : '#A96B24' }} onClick={() => handleEventClick(event)}>
              
              </div>

              <div className="event-name" onClick={() => handleEventClick(event)}>
                {event.eventName}
                <p>{event?.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString() : "Loading..."} - {event?.eventEndDate ? new Date(event.eventEndDate).toLocaleDateString() : "Loading..."}</p>
                
              </div>  
            </div>
          ))}
      </div>
    </MainLayout>
  )
};

export default Event;