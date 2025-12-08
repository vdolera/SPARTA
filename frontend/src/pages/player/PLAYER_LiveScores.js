import PlayerMainLayout from "../../components/P_MainLayout";
import {useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import "../../styles/LiveScores.css";
import {TbCalendarQuestion} from "react-icons/tb";

const PlayerLiveScores = () => {

  useEffect(() => {document.title = "SPARTA | Live Scores";},[]);

  const { eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const [teams, setTeams] = useState([]);
  const [eventDetails, setEventDetails] = useState(null); // Store ID here
  const user = JSON.parse(localStorage.getItem("auth"));

  // 1. Fetch Event ID (The bridge from Name -> ID)
  useEffect(() => {
    const fetchEventId = async () => {
      try {
        // Fetch all events for institution
        const res = await fetch(`http://localhost:5000/api/events?institution=${encodeURIComponent(user?.institution)}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          // Find the specific event
          const found = data.find(e => e.eventName === decodedEvent);
          if (found) {
            setEventDetails(found);
          }
        }
      } catch (err) {
        console.error("Error fetching event details:", err);
      }
    };

    if (user?.institution && decodedEvent) {
      fetchEventId();
    }
  }, [user?.institution, decodedEvent]);


  // 2. Fetch teams with scores (Using Event ID)
 // Fetch teams with scores
 useEffect(() => {
  const fetchTeams = async () => {
    if (!eventDetails?._id) return; // Wait for ID

    try {
      const response = await fetch(`http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(user?.institution)}&eventId=${eventDetails._id}`);
      const data = await response.json();
      
      // --- FIX: Ensure data is an array before setting state ---
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        console.warn("API returned non-array:", data);
        setTeams([]); // Fallback to empty array prevents crash
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]);
    }
  };

  if (user?.institution && eventDetails) {
    fetchTeams();
  }
}, [user?.institution, eventDetails]);
  
  const rankedTeams = teams;

  // Adding ordinals in ranking 
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <PlayerMainLayout>
      
      <div className="live-scores-header">
        <h1>LiveScores for {decodedEvent}</h1>
      </div>
      
      <div className="live-scores-main-div">
        <div className="live-scores-container">
          {rankedTeams.length === 0 ? (
            <div className="no-matches-found">
              <TbCalendarQuestion size={48} />
              <p>
                OOPS! <br /> No teams found for {decodedEvent}{" "}
                <br /> Please come back again soon...
              </p>
            </div>
          ) : (
            <div className="teams-list">
              
              {Array.isArray(rankedTeams) && rankedTeams.map((team, idx) => (
                <div
                  className="team-score"
                  key={team._id || idx}
                  style={{ backgroundColor: team.teamColor || "#A96B24" }}
                >
                  <span className="rank-team">
                    <span>{getOrdinal(idx + 1)}</span>
                    <span>{team.teamName}</span>
                  </span>

                  {/* MEDAL DISPLAY */}
                  <span className="medal-tally-display">
                    {team.gold > 0 && <span>🥇 {team.gold}</span>}
                    {team.silver > 0 && <span>🥈 {team.silver}</span>}
                    {team.bronze > 0 && <span>🥉 {team.bronze}</span>}
                    {(team.gold === 0 && team.silver === 0 && team.bronze === 0) && (
                      <span>-</span>
                    )}
                  </span>        
                  <span>{team.grandTotal ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PlayerMainLayout>
  );
};

export default PlayerLiveScores;