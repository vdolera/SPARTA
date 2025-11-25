import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import Calendar from 'react-calendar';
import axios from 'axios';
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

  // Event summary state
  const [eventsSummary, setEventsSummary] = useState([]);

  // List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [listModalTitle, setListModalTitle] = useState("");
  const [listModalItems, setListModalItems] = useState([]);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.institution) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Active Events
        const eventsUrl = `http://localhost:5000/api/active-events?institution=${encodeURIComponent(user.institution)}&email=${encodeURIComponent(user.email)}&role=${encodeURIComponent(user.role)}`;
        
        // Games data (schedule) based on user role
        let gamesUrl = `http://localhost:5000/api/games?institution=${encodeURIComponent(user.institution)}`;
        if (user?.role === "co-organizer" || user?.role === "sub-organizer") {
            gamesUrl += `&eventName=${encodeURIComponent(user.eventName)}`;
        }

        // Player Counts
        const countsUrl = `http://localhost:5000/api/teams/player-counts?institution=${encodeURIComponent(user.institution)}&approved=true`;

        // Teams per event
        const teamsUrl = `http://localhost:5000/api/teams?institution=${encodeURIComponent(user.institution)}`;

        // Fetch all
        const [eventsRes, gamesRes, countsRes, teamsRes] = await Promise.all([
            axios.get(eventsUrl),
            axios.get(gamesUrl),
            fetch(countsUrl).then(res => res.json()),
            axios.get(teamsUrl) // Fetching the full teams list
        ]);

        const activeEvents = eventsRes.data;
        const gamesData = gamesRes.data;
        const playerCountsData = countsRes;
        const allTeamsData = teamsRes.data;

        // Games schedule
        const matches = [];
        const multiDay = [];
        const gameStatsMap = {}; 

        gamesData.forEach(game => {
             const evtName = game.eventName;
             
             // Count Games (Original logic)
             if (!gameStatsMap[evtName]) gameStatsMap[evtName] = 0;
             gameStatsMap[evtName] += 1;

             // Process Matches for Calendar
             if (game.matches && Array.isArray(game.matches)) {
                
                // Multi-day logic
                const gameDates = game.matches.filter(match => match.date).map(match => new Date(match.date).toDateString());
                const uniqueDates = [...new Set(gameDates)];
                if (uniqueDates.length > 1) {
                    multiDay.push({
                        gameId: game._id || game.gameType,
                        startDate: new Date(Math.min(...game.matches.filter(m => m.date).map(m => new Date(m.date)))),
                        endDate: new Date(Math.max(...game.matches.filter(m => m.date).map(m => new Date(m.date)))),
                        title: `${game.gameType} (${game.category})`
                    });
                }

                // Single match logic
                game.matches.forEach(match => {
                    if (match.date) {
                        matches.push({
                            date: new Date(match.date),
                            title: `${game.gameType} (${game.category})`,
                            location: match.location,
                            time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            teams: match.teams.map(t => t.name).join(" vs "),
                            gameId: game._id || game.gameType,
                            eventName: evtName
                        });
                    }
                });
             }
        });

        // Player counting
        const playerCountsMap = {};
        if (Array.isArray(playerCountsData)) {
            playerCountsData.forEach((c) => (playerCountsMap[c.eventName] = c));
        } else if (playerCountsData && playerCountsData.eventName) {
            playerCountsMap[playerCountsData.eventName] = playerCountsData;
        }

        // For da per event datas
        const summaryData = activeEvents.map(event => {
            const eventName = event.eventName;
            
            // Get Games Count 
            const totalGames = gameStatsMap[eventName] || 0;
            
            // Get Players Count
            const pStats = playerCountsMap[eventName] || { totalPlayers: 0 };

            // Number of teams per event 
            const eventTeams = allTeamsData.filter(t => t.eventName === eventName);
            const totalTeams = eventTeams.length;

            // Find ongoing events
            const today = new Date();
            const start = new Date(event.eventStartDate);
            const end = new Date(event.eventEndDate);
            today.setHours(0,0,0,0); start.setHours(0,0,0,0); end.setHours(23,59,59,999);
            const isOngoing = today >= start && today <= end;

            return {
                title: eventName,
                gamesCount: totalGames, 
                registeredPlayersCount: pStats.totalPlayers,
                teamsCount: totalTeams,
                isOngoing: isOngoing
            };
        });

        setEventsSummary(summaryData);
        setMatchEvents(matches);
        setMultiDayEvents(multiDay);

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.institution, user?.eventName, user?.role, user?.email]);

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
      if (hasEvents) classes.push('react-calendar__tile--has-event');

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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const ongoingEvents = matchEvents
    .filter(event => event.date >= startOfToday && event.date <= endOfToday)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const upcomingEvents = matchEvents
    .filter(event => event.date > endOfToday)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const openListModal = (type) => {
    const today = new Date();
    const sToday = new Date(today); sToday.setHours(0,0,0,0);
    const eToday = new Date(today); eToday.setHours(23,59,59,999);

    if (type === "ongoing") {
      const items = matchEvents.filter(e => e.date >= sToday && e.date <= eToday).sort((a,b) => a.date - b.date);
      setListModalTitle("Ongoing Matches");
      setListModalItems(items);
    } else {
      const items = matchEvents.filter(e => e.date > eToday).sort((a,b) => a.date - b.date);
      setListModalTitle("Upcoming Matches");
      setListModalItems(items);
    }
    setShowListModal(true);
  };

  const closeListModal = () => {
    setShowListModal(false);
    setListModalItems([]);
    setListModalTitle("");
  };

  return (
    <MainLayout>
      <div className="dashboard-page-container">

        {/* Main Dashboard Content */}
        <div style={{display:"flex", gap:"30px", flexDirection:"row", width: "100%"}}>
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
          </div>

          {/* Side Content */}
          <div className="dashboard-side-content" >
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column"}}>
              {/* Ongoing Matches List */}
              <div className="upcoming-events">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <h3>ONGOING MATCHES</h3>
                  <button className="view-all-btn" onClick={() => openListModal("ongoing")}>View All</button>
                </div>
                {loading ? (
                  <p>Loading...</p>
                ) : ongoingEvents.length > 0 ? (
                  <ul>
                    {ongoingEvents.map((event, index) => (
                      <li key={index} className="upcoming-event">
                        <strong>{formatEventDate(event.date)} • {event.time}</strong>
                        {event.title} - {event.teams}
                        <br />
                        <span className="location">📍 {event.location}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{padding: "10px"}}>No matches scheduled for today.</p>
                )}
              </div>

              {/* Upcoming Matches List */}
              <div className="upcoming-events">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <h3>UPCOMING MATCHES</h3>
                  <button className="view-all-btn" onClick={() => openListModal("upcoming")}>View All</button>
                </div>
                {loading ? (
                  <p>Loading...</p>
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
                  <p>No upcoming matches</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-stats">
          <h4>{user.institution}</h4>
          {/* Events Summary*/}
          <div className="events-summary" style={{ marginTop: 12 }}>
            {loading ? <p>Loading Data...</p> : eventsSummary.length === 0 ? (
              <p style={{ margin: 0, color: "#6b7280" }}>No active events found</p>
            ) : (
              <div className="events-summary-grid">
                {eventsSummary.map(s => (
                  <div key={s.title} className="event-card" >
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"start"}}>
                        <div className="event-card-title">{s.title}</div>
                    </div>
                    
                    <div className="event-card-chips">
                      <div className="metric-chip">
                        <div className="metric-value">{s.gamesCount}</div>
                        <div className="metric-label">Games</div>
                      </div>
                      <div className="metric-chip">
                        <div className="metric-value">{s.registeredPlayersCount}</div>
                        <div className="metric-label">Registered Players</div>
                      </div>
                      <div className="metric-chip">
                        <div className="metric-value">{s.teamsCount}</div>
                        <div className="metric-label">Teams</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>  
        </div>

        {/* Event Modal */}
        {isModalOpen && (
          <div className="dashboard-event-modal-overlay" onClick={closeModal}>
            <div className="dashboard-event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard-event-modal-header">
                <h3>Scheduled on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
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

        {/* List Modal for Ongoing/Upcoming */}
        {showListModal && (
          <div className="dashboard-event-modal-overlay" onClick={closeListModal}>
            <div className="dashboard-event-modal" onClick={(e) => e.stopPropagation()}>
              <div className="dashboard-event-modal-header">
                <h3>{listModalTitle}</h3>
                <button className="close-modal" onClick={closeListModal}>×</button>
              </div>

              <div className="calendar-events-list">
                {listModalItems.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {listModalItems.map((event, index) => (
                      <li style={{borderLeft: "5px solid #ce892c", borderRadius: "10px", backgroundColor: "#f0f4f7d1", padding: " 10px 5px"}} key={index}>
                        <strong>{formatEventDate(event.date)} • {event.time}</strong>
                        <div>{event.title} — {event.teams}</div>
                        <div className="location" style={{ marginTop: 8 }}>📍 {event.location}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-events">No events</div>
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