import PlayerMainLayout from "../../components/P_MainLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PlayerPantheon = () => {
  const navigate= useNavigate();
  const [events, setEvents] = useState([]);
  const user = JSON.parse(localStorage.getItem('auth'));

  // Fetch Events
  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/past-events?institution=${user?.institution}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [user?.institution]);

  // Selected Event button nav
  const handleClickEvent = (event) => {
    navigate(`/pantheon/${encodeURIComponent(event.eventName)}/ranking`);
  };

  return (
    <PlayerMainLayout>
      <div className="event-list">
          {events.map((event) => (
            <div key={event._id} className="event-item">
              <div
                className="event-color"
                style={{
                  background: event.eventColor ? event.eventColor : "#A96B24",
                }}
              ></div>

              <div className="event-name" onClick={() => handleClickEvent(event)}>
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
    </PlayerMainLayout>

  )
};

export default PlayerPantheon;