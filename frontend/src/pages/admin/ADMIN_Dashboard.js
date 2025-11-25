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

  // Event summary state (games / teams / players per event)
  const [eventsSummary, setEventsSummary] = useState([]);
  const [playerCountsByEvent, setPlayerCountsByEvent] = useState({});

  // List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [listModalTitle, setListModalTitle] = useState("");
  const [listModalItems, setListModalItems] = useState([]);


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

        // build per-event summary while iterating games
        const eventsMap = new Map(); // key = eventName

        res.data.forEach(game => {
          const evtName = game.eventName || (game.eventTitle || 'Untitled Event');
          if (!eventsMap.has(evtName)) {
            eventsMap.set(evtName, {
              title: evtName,
              gamesCount: 0,
              matchesCount: 0,
              teamsSet: new Set(),
              playersSet: new Set(),
              teamsMap: new Map() // teamKey -> { id, name, playersSet }
            });
          }
          const evt = eventsMap.get(evtName);
          evt.gamesCount += 1;
          evt.matchesCount += (game.matches || []).length;
 
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
              // collect teams & players per event
              (match.teams || []).forEach(team => {
                const teamKey = team._id ?? team.id ?? team.name;
                const teamName = team.name ?? team.teamName ?? teamKey;
                if (!teamKey) return;
                evt.teamsSet.add(teamKey);

                // ensure team entry exists
                if (!evt.teamsMap.has(teamKey)) {
                  evt.teamsMap.set(teamKey, {
                    id: teamKey,
                    name: teamName,
                    playersSet: new Set()
                  });
                }
                const teamEntry = evt.teamsMap.get(teamKey);

                // collect team players (use 'players' or 'members' fallback)
                const teamPlayers = team.players ?? team.members ?? [];
                teamPlayers.forEach(p => {
                  const pKey = p._id ?? p.id ?? p.email ?? p;
                  if (pKey) {
                    teamEntry.playersSet.add(pKey);
                    evt.playersSet.add(pKey); // also count towards event total
                  }
                });
              }); // end teams loop
 
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
 
       // build summary array with per-team counts
       const summaryArray = Array.from(eventsMap.values()).map(e => ({
         title: e.title,
         gamesCount: e.gamesCount,
         matchesCount: e.matchesCount,
         teamsCount: e.teamsSet.size,
         // flatten teamsMap -> array { id, name, playerCount }
         teamsBreakdown: Array.from(e.teamsMap.values()).map(t => ({
           id: t.id,
           name: t.name,
           playerCount: t.playersSet.size
         })).sort((a,b) => b.playerCount - a.playerCount)
       }));

       // Registered players count fetch
       try {
        const countsRes = await fetch(`http://localhost:5000/api/teams/player-counts?institution=${encodeURIComponent(user.institution)}&approved=true`);
        const countsData = await countsRes.json();
        const countsMap = {};
        if (Array.isArray(countsData)) {
          countsData.forEach((c) => (countsMap[c.eventName] = c));
        } else if (countsData && countsData.eventName) {
          countsMap[countsData.eventName] = countsData;
        }

        const finalSummary = summaryArray.map((s) => ({
          ...s,
          registeredPlayersCount: countsMap[s.title]?.totalPlayers ?? 0,
          registeredTeamsBreakdown: countsMap[s.title]?.teams ?? [],
        }));

        setPlayerCountsByEvent(countsMap); // optional store
        setEventsSummary(finalSummary);
      } catch (err) {
        console.error("Failed to fetch registered player counts:", err);
        setEventsSummary([]); // reset to empty instead of undefined variable
      }
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

  // compute start/end of today once
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // ongoingEvents = events happening today
  const ongoingEvents = matchEvents
    .filter(event => event.date >= startOfToday && event.date <= endOfToday)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  // upcomingEvents = events after today
  const upcomingEvents = matchEvents
    .filter(event => event.date > endOfToday)
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const openListModal = (type) => {
    const today = new Date();
    const startOfToday = new Date(today); startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date(today); endOfToday.setHours(23,59,59,999);

    if (type === "ongoing") {
      const items = matchEvents.filter(e => e.date >= startOfToday && e.date <= endOfToday)
                               .sort((a,b) => a.date - b.date);
      setListModalTitle("Ongoing Events");
      setListModalItems(items);
    } else {
      const items = matchEvents.filter(e => e.date > endOfToday)
                               .sort((a,b) => a.date - b.date);
      setListModalTitle("Upcoming Events");
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
              <div className="upcoming-events">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <h3>ONGOING EVENTS</h3>
                  <button className="view-all-btn" onClick={() => openListModal("ongoing")}>View All</button>
                </div>
                {loading ? (
                  <p>Loading events...</p>
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
                  <p style={{padding: "10px"}}>Wohoo! You have no on-going event for today.</p>
                )}
              </div>

              <div className="upcoming-events">
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                  <h3>UPCOMING EVENTS</h3>
                  <button className="view-all-btn" onClick={() => openListModal("upcoming")}>View All</button>
                </div>
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
        </div>

        <div className="dashboard-stats">
          <h4>{user.institution}</h4>

        {/* Events Summary (flashcards) */}
        <div className="events-summary" style={{ marginTop: 12 }}>
          {eventsSummary.length === 0 ? (
            <p style={{ margin: 0, color: "#6b7280" }}>No event summary available</p>
          ) : (
            <div className="events-summary-grid">
              {eventsSummary.map(s => (
                <div key={s.title} className="event-card" role="group" aria-label={`${s.title} summary`}>
                  <div className="event-card-title">{s.title}</div>
                  <div className="event-card-chips">
                    <div className="metric-chip">
                      <div className="metric-value">{s.gamesCount}</div>
                      <div className="metric-label">Games</div>
                    </div>
                    <div className="metric-chip">
                      <div className="metric-value">{s.registeredPlayersCount ?? 0}</div>
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