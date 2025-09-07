import PlayerMainLayout from "../../components/P_MainLayout";
import {useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import "../../styles/LiveScores.css";
import {TbCalendarQuestion} from "react-icons/tb";

const PlayerLiveScores = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const [teams, setTeams] = useState([]);

  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(userInstitution)}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (userInstitution && decodedName) {
      fetchTeams();
    }
  }, [userInstitution, decodedName]);

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
        <h1>Live Scores for {decodedName}</h1>
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