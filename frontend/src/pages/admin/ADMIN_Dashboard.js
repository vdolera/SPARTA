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
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [multiDayEvents, setMultiDayEvents] = useState([]);

  useEffect(() => {
    document.title = "SPARTA | Dashboard";

    const fetchGames = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}`);
        const matches = [];
        const multiDay = [];

        res.data.forEach(game => {
          // Check if this game spans multiple days
          const gameDates = game.matches
            .filter(match => match.date)
            .map(match => new Date(match.date).toDateString());
          
          const uniqueDates = [...new Set(gameDates)];
          
          if (uniqueDates.length > 1) {
            // This is a multi-day event
            const dateRange = {
              gameId: game._id || game.gameType,
              startDate: new Date(Math.min(...game.matches.filter(m => m.date).map(m => new Date(m.date)))),
              endDate: new Date(Math.max(...game.matches.filter(m => m.date).map(m => new Date(m.date)))),
              title: `${game.gameType} (${game.category})`
            };
            multiDay.push(dateRange);
          }

          game.matches.forEach(match => {
            if (match.date) {
              matches.push({
                date: new Date(match.date),
                title: `${game.gameType} (${game.category})`,
                location: match.location,
                time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                teams: match.teams.map(t => t.name).join(" vs "),
                gameId: game._id || game.gameType
              });
            }
          });
        });

        setMatchEvents(matches);
        setMultiDayEvents(multiDay);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [userInstitution]);

  const onChange = (newDate) => {
    setDate(newDate);
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayEvents = matchEvents.filter(
      event => event.date.toDateString() === date.toDateString()
    );
    
    if (dayEvents.length > 0) {
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dayMatches = matchEvents.filter(
        event => event.date.toDateString() === date.toDateString()
      );

      if (dayMatches.length > 0) {
        return (
          <div className="event-indicator">
            {[...Array(Math.min(dayMatches.length, 3))].map((_, i) => (
              <div key={i} className="event-dot" />
            ))}
          </div>
        );
      }
    }
  };

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const classes = [];
      
      // Check for events on this day
      const hasEvents = matchEvents.some(
        event => event.date.toDateString() === date.toDateString()
      );
      
      if (hasEvents) {
        classes.push('react-calendar__tile--has-event');
      }

      // Check if this date is within any multi-day event range
      multiDayEvents.forEach(eventRange => {
        if (date >= eventRange.startDate && date <= eventRange.endDate) {
          classes.push('react-calendar__tile--event-range');
          
          if (date.toDateString() === eventRange.startDate.toDateString()) {
            classes.push('react-calendar__tile--event-range-start');
          }
          
          if (date.toDateString() === eventRange.endDate.toDateString()) {
            classes.push('react-calendar__tile--event-range-end');
          }
        }
      });

      return classes;
    }
  };

  const formatEventDate = (eventDate) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (eventDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getSelectedDateEvents = () => {
    if (!selectedDate) return [];
    return matchEvents.filter(
      event => event.date.toDateString() === selectedDate.toDateString()
    );
  };

  const upcomingEvents = matchEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  return (
    <MainLayout>
      <div className="dashboard-container">
        <div className="calendar-container">
          <Calendar 
            onChange={onChange} 
            value={date} 
            tileContent={tileContent}
            tileClassName={tileClassName}
            className="custom-calendar"
            showNeighboringMonth={false}
            onClickDay={handleDateClick}
          />
        </div>

        <div className="upcoming-events">
          <h3>UPCOMING EVENTS</h3>
          {loading ? (
            <p>Loading events...</p>
          ) : upcomingEvents.length > 0 ? (
            <ul>
              {upcomingEvents.map((event, index) => (
                <li key={index} className="upcoming-event">
                  <strong>{formatEventDate(event.date)} • {event.time}</strong>
                  {event.title} - {event.teams}
                  <br />
                  <span className="location">📍 {event.location}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No upcoming events</p>
          )}
        </div>

        {/* Event Modal */}
        {isModalOpen && (
          <div className="event-modal-overlay" onClick={closeModal}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="event-modal-header">
                <h3>Events on {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</h3>
                <button className="close-modal" onClick={closeModal}>×</button>
              </div>
              
              <div className="calendar-events-list">
                {getSelectedDateEvents().length > 0 ? (
                  getSelectedDateEvents().map((event, index) => (
                    <div key={index} className="upcoming-event">
                      <strong>{event.title}</strong>
                      <time>{event.time}</time>
                      <div className="location">📍 {event.location}</div>
                      <div>{event.teams}</div>
                    </div>
                  ))
                ) : (
                  <div className="no-events">No events scheduled for this date</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;