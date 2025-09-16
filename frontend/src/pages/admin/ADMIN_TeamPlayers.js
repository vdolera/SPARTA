import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import '../../styles/ADMIN_TeamPlayers.css';
import { LiaGhostSolid } from "react-icons/lia";

const TeamPlayers = () => {
  const { eventName, teamName } = useParams();
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [players, setPlayers] = useState([]);
  const [teamColor, setTeamColor] = useState("#808080");

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
        const res = await fetch(
          `http://localhost:5000/api/players?institution=${encodeURIComponent(
            userInstitution
          )}&eventName=${encodeURIComponent(
            decodedEvent
          )}&team=${encodeURIComponent(decodedTeam)}`
        );
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    fetchPlayers();
  }, [userInstitution, decodedEvent, decodedTeam]);

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
            <h3 style={{ textDecoration: "underline" }}> {decodedEvent} RANK </h3>
          </div>
        </div>

        <div className='team-pending-players'>
          <button onClick={handlePending}>Pending Players</button>
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
                    <th>COURSE</th>
                    <th>GAME</th>
                    <th>STATUS</th>
                    <th>PROFILE</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, idx) => (
                    <tr key={player._id}>
                      <td>{player.playerName}</td>
                      <td>{player.course || "N/A"}</td>
                      <td>{player.game}</td>
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
