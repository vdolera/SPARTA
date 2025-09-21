import MainLayout from "../../components/MainLayout";
import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
import "../../styles/Calendar.css"


const Dashboard = () => {

  useEffect(() => {
    document.title = "SPARTA | Dashboard";
  }, []);
  
  const [date, setDate] = useState(new Date());
  const [events] = useState([
    { date: new Date(2023, 10, 15), title: "Team Meeting" },
    { date: new Date(2023, 10, 20), title: "Project Deadline" }
  ]);

  const onChange = (newDate) => {
    setDate(newDate);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayEvents = events.filter(
        event => event.date.toDateString() === date.toDateString()
      );
      
      return (
        <div>
          {dayEvents.map((event, index) => (
            <div key={index} className="event-marker">
              {event.title}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <MainLayout>

      <div className="dashboard-container">
        <div className="calendar-container">

          <Calendar onChange={onChange} value={date} tileContent={tileContent} className="custom-calendar" />
          
        </div>

         <div className="upcoming-events">
          <h3>UPCOMING EVENTS</h3>
            <ul>
              {events
                .filter(event => event.date >= new Date())
                .sort((a, b) => a.date - b.date)
                .slice(0, 3)
                .map((event, index) => (
                  <li key={index}>
                    {event.date.toDateString()}: {event.title}
                  </li>
                ))}
          </ul>
        </div>

      </div>
    </MainLayout>
  );
};

export default Dashboard;