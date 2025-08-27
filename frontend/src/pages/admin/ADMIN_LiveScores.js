import MainLayout from "../../components/MainLayout";
import {useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import "../../styles/LiveScores.css"
import { TbCalendarQuestion } from "react-icons/tb";

const LiveScores = () => {
  const { eventName, teamName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);
  
  const [teams, setTeams] = useState([]);
  const [teamColor, setTeamColor] = useState("#A96B24");

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

  // Fetch team details
    useEffect(() => {
      const fetchTeamDetails = async () => {
        try {
          const res = await fetch(
            `http://localhost:5000/api/team?institution=${encodeURIComponent(
              userInstitution
            )}&event=${encodeURIComponent(decodedEvent)}&teamName=${encodeURIComponent(decodedTeam)}`
          );
          const data = await res.json();
          setTeamColor(data.teamColor || "#808080");
        } catch (err) {
          console.error("Error fetching team details:", err);
        }
      };
  
      fetchTeamDetails();
    }, [userInstitution, decodedEvent, decodedTeam]);

  // Sort teams by score descending
  const rankedTeams = [...teams].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Ordinal Ranking
  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <MainLayout>
      <h1>Live Scores for {decodedName}</h1>
      <div className="live-scores-main-div">
        <div className="live-scores-container">
          {rankedTeams.length === 0 ? (
            <div className="no-matches-found">
              <TbCalendarQuestion size={48} />
              <p> OOPS! <br /> There are no ongoing matches found under {decodedName} <br /> Please come back again soon :)</p>
            </div>
          ) : (
            <div className="teams-list">
              {rankedTeams.map((team, idx) => (
                <div className="team-score" key={team._id || idx} style={{backgroundColor: team.teamColor || "#A96B24"}}>
                  <span className="rank-team">
                    <span>{getOrdinal(idx + 1)}</span>
                    <span>{team.teamName}</span>
                  </span>
                  <span>{team.score ?? 0}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>  
    </MainLayout>

  )
};

export default LiveScores;