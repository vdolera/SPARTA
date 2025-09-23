import MainLayout from "../../components/MainLayout";
import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import axios from 'axios';
import "../../styles/Calendar.css";

const Dashboard = () => {

  const user = JSON.parse(localStorage.getItem('auth'));
const userInstitution = user?.institution || "DefaultInstitution";

  const [date, setDate] = useState(new Date());
  const [matchEvents, setMatchEvents] = useState([]);
 

  useEffect(() => {
    document.title = "SPARTA | Dashboard";

    const fetchGames = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}`);
        const matches = [];

        res.data.forEach(game => {
          game.matches.forEach(match => {
            if (match.date) {
              matches.push({
                date: new Date(match.date),
                title: `${game.gameType} (${game.category})`,
                location: match.location,
                time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                teams: match.teams.map(t => t.name).join(" vs ")
              });
            }
          });
        });

        setMatchEvents(matches);
      } catch (err) {
        console.error(err);
      }
    };

    fetchGames();
  }, [userInstitution]);

  const onChange = (newDate) => {
    setDate(newDate);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayMatches = matchEvents.filter(
        event => event.date.toDateString() === date.toDateString()
      );

      return (
        <div>
          {dayMatches.map((event, index) => (
            <div key={index} className="event-marker">
              <strong>{event.title}</strong><br />
              {event.time}, {event.location}<br />
              {event.teams}
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
          <Calendar 
            onChange={onChange} 
            value={date} 
            tileContent={tileContent} 
            className="custom-calendar" 
          />
        </div>

        <div className="upcoming-events">
          <h3>UPCOMING EVENTS</h3>
          <ul>
            {matchEvents
              .filter(event => event.date >= new Date())
              .sort((a, b) => a.date - b.date)
              .slice(0, 5)
              .map((event, index) => (
                <li key={index}>
                  {event.date.toDateString()} {event.time}: {event.title}, {event.teams} @ {event.location}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;

  /* const tileContent = ({ date, view }) => {
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
  }; */
