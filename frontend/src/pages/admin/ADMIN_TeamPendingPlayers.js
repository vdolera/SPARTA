import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import '../../styles/ADMIN_PlayerApproval.css';

const TeamPlayerApproval = () => {
  const [players, setPlayers] = useState([]);
  const { eventName, teamName } = useParams(); // assuming you pass these via route
  const user = JSON.parse(localStorage.getItem("auth"));
  const institution = user?.institution;

 // Fetch pending players
const fetchPlayers = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/players/team-pending?institution=${institution}&eventName=${encodeURIComponent(eventName)}&team=${encodeURIComponent(teamName)}`
      );
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Error fetching pending players:", err);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, // eslint-disable-next-line 
  [institution, eventName, teamName]);

  // Approve player
const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/team-approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Player approved by team!");
        fetchPlayers(); // refreshes the list
      }
    } catch (err) {
      console.error("Error approving player:", err);
    }
  };
  

  // Decline (delete) player
  const handleDecline = async (id) => {
    if (!window.confirm("Are you sure you want to decline this player?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/players/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Player declined!");
        fetchPlayers(); // refreshes the list
      }
    } catch (err) {
      console.error("Error declining player:", err);
    }
  };

  return (
    <MainLayout>
      <div className="approval-header">
        <h3>PENDING LIST</h3>
      </div>

      <div className="no-players-found">
        {players.length > 0 ? (
          players.map((player) => (
            <div key={player._id} className="player-card">
              <p><b>{player.playerName}</b> ({player.email})</p>
              <p>Team: {player.team}</p>
              <p>Game: {player.game}</p>
              <div className="actions">
                <button className="approve-btn" onClick={() => handleApprove(player._id)}>Accept</button>
                <button className="decline-btn" onClick={() => handleDecline(player._id)}>Decline</button>
              </div>
            </div>
          ))
        ) : (
          <p>No pending players found.</p>
        )}
      </div>
    </MainLayout>
  );
};

export default TeamPlayerApproval;
