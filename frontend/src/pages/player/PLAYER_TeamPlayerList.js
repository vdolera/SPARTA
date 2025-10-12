import PlayerMainLayout from "../../components/P_MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LiaGhostSolid } from "react-icons/lia";
import "../../styles/ADMIN_TeamPlayers.css"

const PlayerTeamPlayers = () => {

  useEffect(() => {document.title = "SPARTA | " + decodedTeam + " Players";},[]);

  const { eventName, teamName } = useParams(); 
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);
  const [teamColor, setTeamColor] =useState("#808080");
  const [teamRank, setTeamRank] = useState(null);

  const user = JSON.parse(localStorage.getItem("auth"));

  const [players, setPlayers] = useState([]);

  // Fetch players
useEffect(() => {
  const fetchPlayers = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/players?institution=${encodeURIComponent(user?.institution)}&eventName=${encodeURIComponent(decodedEvent)}&team=${encodeURIComponent(decodedTeam)}`);
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  };

  if (user?.institution && decodedEvent && decodedTeam) {
    fetchPlayers();
  }
}, [user?.institution, decodedEvent, decodedTeam]);

  // Fetch team details
  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/team?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEvent)}&teamName=${encodeURIComponent(decodedTeam)}`);
        const data = await res.json();
        setTeamColor(data.teamColor || "#808080");
      } catch (err) {
        console.error("Error fetching team details:", err);
      }
    };
    fetchTeamDetails();
  }, [user?.institution, decodedEvent, decodedTeam]);

  // Fetch Score and turn filter it to team ranking
  useEffect(() => {
    const fetchTeamRankings = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEvent)}`);
        const data = await res.json();
  
        // Sort descending by finalScore
        const sortedTeams = data.sort(
          (a, b) => (b.grandTotal || b.totalScore || 0) - (a.grandTotal || a.totalScore || 0)
        );
  
        // Find team’s position
        const rankIndex = sortedTeams.findIndex(
          (t) => t.teamName === decodedTeam
        );
  
        if (rankIndex !== -1) {
          setTeamRank(rankIndex + 1);
        } else {
          setTeamRank(null);
        }
      } catch (error) {
        console.error("Error fetching team rankings:", error);
      }
    };
  
    if (user?.institution && decodedEvent && decodedTeam) {
      fetchTeamRankings();
    }
  }, [user?.institution, decodedEvent, decodedTeam]);

  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  
  return (
    <PlayerMainLayout>
      <div className="team-players-container">
        <div className='team-players-header'>
            <div className='team-players-team' style={{ background: teamColor }}>
              <h2>{decodedTeam}</h2>
            </div>

            <div className='team-players-total'>
              <h3 style={{ textDecoration: "underline" }}> TOTAL PLAYERS </h3>
              <h1> {players.length} </h1>
            </div>

            <div className='team-ranking-event'>
              <h3 style={{ textDecoration: "underline" }}> {decodedEvent} RANK </h3>
              <h1>{teamRank ? getOrdinal(teamRank) : "N/A"}</h1>
            </div>
        </div>

        <div className='team-players-table'>
          {players.length === 0 ? (
            <div className='no-players-found'>
              <LiaGhostSolid size={48} />
              <p>No players registered yet.</p>
            </div>
          ) : (
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>Player</th>
                <th>Course</th>  
                <th>Event</th>
                <th>Sport</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player._id}>
                  <td>{player.playerName}</td>
                  <td>{player.course || "N/A"}</td>
                  <td>{player.eventName}</td>
                  <td>{Array.isArray(player.game) ? player.game.join(", ") : player.game || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}

        </div>
      </div>
    </PlayerMainLayout>
  );
};

export default PlayerTeamPlayers;
