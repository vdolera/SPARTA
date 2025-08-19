import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const TeamPlayers = () => {
  const { eventName, teamName } = useParams(); // assuming your route has /event/:eventName/team/:teamName
  const decodedEvent = decodeURIComponent(eventName);
  const decodedTeam = decodeURIComponent(teamName);

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [players, setPlayers] = useState([]);

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

  return (
    <MainLayout>
      <h2>
        Players in {decodedTeam} - {decodedEvent}
      </h2>

      {players.length === 0 ? (
        <p>No players registered yet.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Player Name</th>
              <th>Email</th>
              <th>Team</th>
              <th>Event</th>
              <th>Game</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player._id}>
                <td>{player.playerName}</td>
                <td>{player.email}</td>
                <td>{player.team}</td>
                <td>{player.eventName}</td>
                <td>{player.game}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </MainLayout>
  );
};

export default TeamPlayers;
