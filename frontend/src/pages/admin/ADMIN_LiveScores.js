import MainLayout from "../../components/MainLayout";
import { useParams } from "react-router-dom";
import React, { useState, useEffect } from "react";
import "../../styles/LiveScores.css";
import { TbCalendarQuestion } from "react-icons/tb";

const LiveScores = () => {
  const { eventName, teamName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);

  const [teams, setTeams] = useState([]);
  const [, setTeamColor] = useState("#A96B24");

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  // Fetch teams with scores
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(decodedEvent)}`
        );
        const data = await response.json();
        // Sort by grandTotal
        setTeams(data.sort((a, b) => b.grandTotal - a.grandTotal));
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };
  
    if (userInstitution && decodedEvent) {
      fetchTeams();
    }
  }, [userInstitution, decodedEvent]);
  

  // Fetch single team details
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/team?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(
            decodedEvent
          )}&teamName=${encodeURIComponent(decodedTeam)}`
        );
        const data = await res.json();
        setTeamColor(data.teamColor || "#808080");
      } catch (err) {
        console.error("Error fetching team details:", err);
      }
    };

    if (decodedTeam) {
      fetchTeamDetails();
    }
  }, [userInstitution, decodedEvent, decodedTeam]);

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
    <MainLayout>
      
      <div className="live-scores-header">
        <h1>Live Scores for {decodedEvent}</h1>
      </div>
      
      <div className="live-scores-main-div">

        <div className="live-scores-container">
          {rankedTeams.length === 0 ? (
            <div className="no-matches-found">
              <TbCalendarQuestion size={48} />
              <p>
                OOPS! <br /> There are no ongoing matches found under {decodedEvent}{" "}
                <br /> Please come back again soon :)
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
