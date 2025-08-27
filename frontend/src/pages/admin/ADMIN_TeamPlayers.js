import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import '../../styles/ADMIN_TeamPlayers.css'; 

const TeamPlayers = () => {
  const { eventName, teamName } = useParams(); 
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [players, setPlayers] = useState([]);
  const [eventColor, setEventColor] = useState(["#A96B24"]);

  const handleViewButton = (playerId) => {
    navigate(`/admin/event/${encodeURIComponent(decodedEvent)}/team/${encodeURIComponent(teamName)}/player/${playerId}/profile`);
  };

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

  useEffect(() => {
    const fetchEventDetails = async () => {
      const res = await fetch(
        `http://localhost:5000/api/event/${encodeURIComponent(decodedEvent)}`
      );
      const data = await res.json();
      setEventColor(data.eventColor || "#ccc");
    };
    fetchEventDetails();
  }, [decodedEvent]);

  return (
    <MainLayout>

      <div className="team-players-container">

        <div className='team-players-header'>

          <div className='team-players-team' style={{ background: "eventColor"}}>
            <h2>{decodedTeam}</h2>
          </div>

          <div className='team-players-total'>
            <h3 style={{ textDecoration: "underline" }}> TOTAL PLAYERS </h3>
            <h1> {players.length} </h1>
          </div>

          <div className='team-ranking-event'>
            <h3 style={{ textDecoration: "underline" }}> {decodedEvent} RANKING </h3>
          </div>

        </div>

        <div className='team-players-table'>

          {players.length === 0 ? (

          <p>No players registered yet.</p>

          ) : (
          
          <div>

            <table border="1" cellPadding="10" >
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
                {players.map((player) => (
                  <tr key={player._id}>
                    <td>{player.playerName}</td>
                    <td>{player.course}</td>
                    <td>{player.game}</td>
                    <td>{player.eventName}</td>
                    <td><button onClick={() => handleViewButton(player._id)}>View</button></td>
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
