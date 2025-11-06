import MainLayout from "../../components/MainLayout";
import { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import axios from 'axios';
import { MdEditSquare} from "react-icons/md";
import "../../styles/Calendar.css";

  const Dashboard = () => {

  useEffect(() => {document.title = "SPARTA | Dashboard";},[]);

  const user = JSON.parse(localStorage.getItem('auth'));

  // Calendar & Events State
  const [date, setDate] = useState(new Date());
  const [matchEvents, setMatchEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [multiDayEvents, setMultiDayEvents] = useState([]);

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState("");

  // Toast State
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });

  // Toast helper
  const showToastMessage = (message, type) => {
    setShowToast({ show: true, message, type });
    setTimeout(() => setShowToast({ show: false, message: "", type: "" }), 6000);
  };

  // Fetch Game schedules
  useEffect(() => {
    const fetchGames = async () => {
      if (!user?.institution) {
        setLoading(false);
        return;
      }
      try {
        let url = `http://localhost:5000/api/games?institution=${encodeURIComponent(user.institution)}`;

        if (user?.role === "co-organizer" || user?.role === "sub-organizer") {
          url += `&eventName=${encodeURIComponent(user.eventName)}`;
        }
  
        const res = await axios.get(url);
        
        const matches = [];
        const multiDay = [];

        res.data.forEach(game => {
          const gameDates = game.matches
            .filter(match => match.date)
            .map(match => new Date(match.date).toDateString());
          
          const uniqueDates = [...new Set(gameDates)];
          
          if (uniqueDates.length > 1) {
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
  }, [user?.institution, user?.eventName, user?.role]);

  // Fetch Announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!user?.institution) {
        setLoadingAnnouncements(false);
        return;
      }
      try {
        setLoadingAnnouncements(true);
        let url = `http://localhost:5000/api/announcements?institution=${encodeURIComponent(user.institution)}`;
        
        if (user?.role === "co-organizer" || user?.role === "sub-organizer") {
          url += `&eventName=${encodeURIComponent(user.eventName)}`;
        }

        const res = await axios.get(url);
        setAnnouncements(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error("Error fetching announcements:", err);
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, [user?.institution, user?.eventName, user?.role]);

  // Post Announcement
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) {
      showToastMessage("Announcement cannot be empty", "error");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/api/announcements", {
        institution: user.institution,
        eventName: (user?.role === "co-organizer" || user?.role === "sub-organizer") ? user.eventName : null,
        authorName: user.username || "Admin", 
        message: newAnnouncement,
      });

      if (res.data) {
        setAnnouncements([res.data, ...announcements]);
        setNewAnnouncement("");
        setShowPostModal(false);
        showToastMessage("Announcement posted successfully!", "success");
      } else {
        showToastMessage("Failed to post announcement", "error");
      }
    } catch (err) {
      console.error("Error posting announcement:", err);
      showToastMessage("Something went wrong!", "error");
    }
  };


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
      
      const hasEvents = matchEvents.some(
        event => event.date.toDateString() === date.toDateString()
      );
      
      if (hasEvents) {
        classes.push('react-calendar__tile--has-event');
      }

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

      return classes.length > 0 ? classes : null;
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
    .filter(event => event.date >= new Date(new Date().setHours(0, 0, 0, 0))) // Filter from start of today
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const canPost = user?.role === 'organizer' || user?.role === 'co-organizer' || user?.role === 'admin';

  return (
    <MainLayout>
      <div className="dashboard-page-container">

        {/* Main Dashboard Content */}
        <div className="dashboard-main-content">
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

          <div style={{ flexGrow: 1, display: "flex", flexDirection: "row", gap: "15px" }}>
            <div className="upcoming-events">
              <h3>ONGOING EVENTS</h3>
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
                <p>Wohoo! You have no on-going event for today.</p>
              )}
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
          </div>
        </div>

        {/* Event Modal */}
        {isModalOpen && (
          <div className="dashboard-event-modal-overlay" onClick={closeModal}>
            <div className="dashboard-event-modal" onClick={(e) => e.stopPropagation()}>

              <div className="dashboard-event-modal-header">
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
                    <div style={{display: "flex", flexDirection: "column", margin: "2px"}} key={index} className="upcoming-event">
                      <strong>{event.title}</strong>
                      <div>{event.teams}</div>
                      
                      <div className="location">📍 {event.location} <time>{event.time}</time> </div>
                    </div>
                  ))
                ) : (
                  <div className="no-events">No events scheduled for this date</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements Container */}
        <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
          <div className="announcements-container">
            <div className="announcement-header" style={{display: "flex", flexDirection: "column"}}>
                <h3>ANNOUNCEMENTS</h3>
            </div>
                
                <div className="announcements-list">
                  {loadingAnnouncements ? (
                    <p>Loading announcements...</p>
                  ) : announcements.length === 0 ? (
                    <div className="no-feedback-message">
                      <p>No announcements posted yet.</p>
                    </div>
                  ) : (
                    announcements.map((ann) => (
                      <div className="announcement-block" key={ann._id}>
                        <div className="announcement-block-contents">
                          <h5
                            style={{
                              fontStyle: "italic",
                              textAlign: "left",
                              margin: "0",
                            }}
                          >
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </h5>
                          <p style={{margin: "5px", textAlign: "center"}}>{ann.message}</p>
                          <h5 style={{margin: "5px", textAlign: "end"}}>
                            - {ann.authorName}
                          </h5>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="announcement-footer">
                  {canPost && (
                    <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }} onClick={() => setShowPostModal(true)}> <MdEditSquare /> Create a Post</button>
                  )}
                </div>
          </div>

          <div className="user-manual">
            <h3 style={{ textAlign: "center", margin: "5px" }}> User Manual </h3>
          </div>

        </div>

        {/* Post Announcement Modal */}
        {showPostModal && (
          <div className="feedback-overlay">
            <div className="feedback-modal">
              <h2>Post an Announcement</h2>
              <p style={{marginBottom: "5px", fontFamily: "Poppins, Sans-Serif"}}>Please enter the details of your announcement below. Your announcement post can be seen by all users with the organizer role in your institution</p>

              <textarea
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                placeholder="Write your announcement..."
                rows="5"
                style={{
                  width: "100%"
                }}
              />

              <div className="feedback-actions">
                <button className="cancel" onClick={() => setShowPostModal(false)}>
                  Cancel
                </button>
                <button className="submit" onClick={handlePostAnnouncement}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast.show && (
          <div
            className={`toast-notification ${
              showToast.type === "success" ? "toast-success" : "toast-error"
            }`}
          >
            {showToast.message}
          </div>
        )}

      </div>
    </MainLayout>
  );
};

export default Dashboard;