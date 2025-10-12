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

  const user = JSON.parse(localStorage.getItem('auth'));

 // Fetch teams with scores
 useEffect(() => {
  const fetchTeams = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEvent)}` );
      const data = await response.json();
      // Sort by grandTotal
      setTeams(data.sort((a, b) => b.grandTotal - a.grandTotal));
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  if (user?.institution && decodedEvent) {
    fetchTeams();
  }
}, [user?.institution, decodedEvent]);

  // Teams are already sorted by backend, but just in case
  const rankedTeams = [...teams].sort(
    (a, b) => (b.totalScore || 0) - (a.totalScore || 0)
  );

  // Ordinal Ranking
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <PlayerMainLayout>
      
      <div className="live-scores-header">
        <h1>Live Scores for {decodedEvent}</h1>
      </div>

      <div className="live-scores-maindiv">
        <div className="live-scores-container">
          {teams.length === 0 ? (
            <div className="no-matches-found">
              <TbCalendarQuestion size={48} />
              <p>Come back again soon for updates</p>
            </div>
          ) : (
              <div className="teams-list">
                {rankedTeams.map((team, idx) => (
                  <div
                    className="team-score"
                    key={team._id || idx}
                    style={{ backgroundColor: team.teamColor || "#A96B24" }}
                  >
                    <span className="rank-team">
                      <span>{getOrdinal(idx + 1)}</span>
                      <span>{team.teamName}</span>
                    </span>
                    <span>{team.grandTotal ?? 0}</span>
                  </div>
                ))}
              </div>
              )}
        </div>
      </div>
    </PlayerMainLayout>

  )
};

export default PlayerLiveScores;