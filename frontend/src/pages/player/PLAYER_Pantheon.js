import PlayerMainLayout from "../../components/P_MainLayout";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PlayerPantheon = () => {
  const navigate= useNavigate();
  const [events, setEvents] = useState([]);
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

    useEffect(() => {
    document.title = "SPARTA | Pantheon";
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/past-events?institution=${userInstitution}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [userInstitution]);

  const handleClickEvent = (event) => {
    navigate(`/player/pantheon/${encodeURIComponent(event.eventName)}/ranking`);
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