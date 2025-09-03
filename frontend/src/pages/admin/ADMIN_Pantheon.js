import MainLayout from "../../components/MainLayout";
import { useState, useEffect } from "react";

const Pantheon = () => {
  const [events, setEvents] = useState([]);
  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;
  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch(`http://localhost:5000/api/past-events?institution=${userInstitution}`);
      const data = await response.json();
      setEvents(data);
    };
    fetchEvents();
  }, [userInstitution]);
  return (

    <MainLayout>
      <h1>Pantheon</h1>

      <div className="event-list">
        {events.length > 0 ? (
          events.map((event) => (
            <div key={event._id} className="event-item">
              <div
                className="event-color"
                style={{
                  background: event.eventColor ? event.eventColor : "#A96B24",
                }}
              ></div>

              <div className="event-name">
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
          ))
        ) : (
          <p>No past events available.</p>
        )}
      </div>
      
    </MainLayout>

  )
};

export default Pantheon;