import MainLayout from "../../components/MainLayout";
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../../styles/LiveScores.css";
import { TbCalendarQuestion } from "react-icons/tb";

const LiveScores = () => {

  useEffect(() => {document.title = "SPARTA | Live Scores";},[]);

  const { eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const [teams, setTeams] = useState([]);
  const user = JSON.parse(localStorage.getItem("auth"));

  // Fetch teams with scores
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEvent)}`);
        const data = await response.json();
        // Data is already sorted by the backend
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
  
    if (user?.institution && decodedEvent) {
      fetchTeams();
    }
  }, [user?.institution, decodedEvent]); 
  
  const rankedTeams = teams;

  // Adding ordinals in ranking 
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <MainLayout>
      
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

                  {/* ADDED MEDAL DISPLAY */}
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
    </MainLayout>
  );
};

export default LiveScores;