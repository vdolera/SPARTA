import PlayerMainLayout from "../../components/P_MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MdEventNote } from "react-icons/md";
import '../../styles/ADMIN_Event.css'; 

const PlayerEvent = () => {

  useEffect(() => {document.title = "SPARTA | Events";},[]);

  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const user = JSON.parse(localStorage.getItem('auth'));

  //Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/active-events?institution=${user?.institution}&email=${user.email}&role=${user.role}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [user?.institution, user.email, user.role]);
  
  // Selected Event button nav
  const handleEventClick = (event) => {
    navigate(`/event/${encodeURIComponent(event.eventName)}`);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event =>
    event.eventName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PlayerMainLayout>
    <div className="event-list-container">
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

      {events.length === 0 ? (
        <div className="no-events">
          <MdEventNote size={"50"}/>
          <p>There are no on-going events found in your institution.  <br />Please wait for further announcements.</p>
        </div>
      ) : (

      <div className="event-list">
        {filteredEvents.map((event) => (
          <div className='event-item' key={event._id}>
            <div className="event-color" style={{ background: event.eventColor ? event.eventColor : '#A96B24'}} onClick={() => handleEventClick(event)}>
              
            </div>

            <div className="event-name" onClick={() => handleEventClick(event)}>
              {event.eventName}
              <p>
                  {event?.eventStartDate
                    ? new Date(event.eventStartDate).toLocaleDateString()
                    : "Loading..."}{" "}
                  -{" "}
                  {event?.eventEndDate
                    ? new Date(event.eventEndDate).toLocaleDateString()
                    : "Loading..."}
                </p>
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
    </PlayerMainLayout>
  )
};

export default PlayerEvent;