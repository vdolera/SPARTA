import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import '../../styles/ADMIN_TeamPlayers.css';
import { LiaGhostSolid } from "react-icons/lia";

const TeamPlayers = () => {

  useEffect(() => {document.title = "SPARTA | " + decodedTeam + " Players";},[]);

  const { eventName, teamName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth")); 

  const [players, setPlayers] = useState([]);
  const [teamColor, setTeamColor] = useState("#808080");
  const [teamRank, setTeamRank] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);


  const handleViewButton = (playerId) => {
    navigate(`/admin/event/${encodeURIComponent(decodedEvent)}/team/${encodeURIComponent(teamName)}/player/${playerId}/profile`);
  };

  const handlePending = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedEvent)}/team/${encodeURIComponent(teamName)}/pending`);
  }

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

    fetchPlayers();
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


  // Fetch team scores then turn it in to rank
  useEffect(() => {
    const fetchTeamRankings = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/teams/scores?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEvent)}`);
        const data = await res.json();

        // Sort descending by final score
        const sortedTeams = data.sort(
          (a, b) => (b.grandTotal || b.totalScore || 0) - (a.grandTotal || a.totalScore || 0)
        );

        // Find team position
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

  // fetch pending players count for this team (polls every 30s)
  useEffect(() => {
    let mounted = true;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/players/team-pending?institution=${encodeURIComponent(
            user?.institution
          )}&eventName=${encodeURIComponent(eventName)}&team=${encodeURIComponent(
            teamName
          )}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPendingCount(Array.isArray(data) ? data.length : 0);
      } catch (err) {
        console.error("Error fetching pending count:", err);
      }
    };

    fetchPendingCount();
    const id = setInterval(fetchPendingCount, 30000); // every 30s
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?.institution, eventName, teamName]);

  function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  return (
    <MainLayout>
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
            <h3 style={{ textDecoration: "underline" }}>{decodedEvent} RANK</h3>
            <h1>{teamRank ? getOrdinal(teamRank) : "N/A"}</h1>
          </div>

        </div>

        <div className='team-pending-players'>
          <button className="team-pending-btn" onClick={handlePending}>
            Pending Players
            {pendingCount > 0 && (
              <span className="team-pending-badge" aria-label={`${pendingCount} pending`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        <div className='team-players-table'>
          {players.length === 0 ? (
            <div className='no-players-found'>
              <LiaGhostSolid size={48} />
              <p>No players registered yet.</p>
            </div>
          ) : (
            <div>
              <table border="1" cellPadding="10">
                <thead>
                  <tr>
                    <th>PLAYERS</th>
                    <th>EMAIL</th>
                    <th>COURSE</th>
                    <th>GAME</th>
                    <th> </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => (
                    <tr key={player._id}>
                      <td>{player.playerName}</td>
                      <td>{player.course || "N/A"}</td>
                      <td>{Array.isArray(player.game) ? player.game.join(", ") : player.game || "N/A"}</td>
                      <td>{player.eventName}</td>
                      <td>
                        <button onClick={() => handleViewButton(player._id)}> View Profile </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TeamPlayers;
