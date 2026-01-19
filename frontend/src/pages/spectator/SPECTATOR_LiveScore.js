import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../../styles/LiveScores.css";
import { TbCalendarQuestion } from "react-icons/tb";

const SpectatorScore = () => {
  useEffect(() => { document.title = "SPARTA | Live Scores"; }, []);

  // 1. Get institution from URL, NOT localStorage
  const { institution, eventName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const decodedInstitution = decodeURIComponent(institution);
  
  const [teams, setTeams] = useState([]);

  // Fetch teams with scores
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // 2. Use the decodedInstitution from the URL
        const response = await fetch(
          `https://sparta-deployed.onrender.com/api/teams/scores?institution=${encodeURIComponent(decodedInstitution)}&event=${encodeURIComponent(decodedEvent)}`
        );
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (decodedInstitution && decodedEvent) {
      fetchTeams();
    }
  }, [decodedInstitution, decodedEvent]);

  // Adding ordinals in ranking
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <>
      <div className="live-scores-header">
        <h1>LiveScores for {decodedEvent}</h1>
      </div>

      <div className="live-scores-main-div">
        <div className="live-scores-container">
          {teams.length === 0 ? (
            <div className="no-matches-found">
              <TbCalendarQuestion size={48} />
              <p>
                OOPS! <br /> No teams found for {decodedEvent}{" "}
                <br /> Please come back again soon...
              </p>
            </div>
          ) : (
            <div className="teams-list">
              {teams.map((team, idx) => (
                <div
                  className="team-score"
                  key={team._id || idx}
                  style={{ backgroundColor: team.teamColor || "#A96B24" }}
                >
                  <span className="rank-team">
                    <span>{getOrdinal(idx + 1)}</span>
                    <span>{team.teamName}</span>
                  </span>

                  <span className="medal-tally-display">
                    {team.gold > 0 && <span>🥇 {team.gold}</span>}
                    {team.silver > 0 && <span>🥈 {team.silver}</span>}
                    {team.bronze > 0 && <span>🥉 {team.bronze}</span>}
                    {team.gold === 0 &&
                      team.silver === 0 &&
                      team.bronze === 0 && <span>-</span>}
                  </span>
                  <span>{team.grandTotal ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SpectatorScore;