import MainLayout from "../../components/MainLayout";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { LiaGhostSolid } from "react-icons/lia";
import '../../styles/ADMIN_PlayerApproval.css';

const TeamPlayerApproval = () => {
  const [players, setPlayers] = useState([]);
  const { eventName, teamName } = useParams();
  const user = JSON.parse(localStorage.getItem("auth"));
  const institution = user?.institution;

  // Fetch pending players (memoized)
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/players/team-pending?institution=${institution}&eventName=${encodeURIComponent(eventName)}&team=${encodeURIComponent(teamName)}`
      );
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Error fetching pending players:", err);
    }
  }, [institution, eventName, teamName]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Approve player
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/team-approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Player approved by team!");
        fetchPlayers(); // refresh list
      }
    } catch (err) {
      console.error("Error approving player:", err);
    }
  };

  // Decline player
  const handleDecline = async (id) => {
    if (!window.confirm("Are you sure you want to decline this player?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/players/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Player declined!");
        fetchPlayers(); // refresh list
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

      {players.length > 0 ? (
        <div className="approval-table">
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Email</th>
                <th>Team</th>
                <th>Game</th>
                <th>Uploaded Requirements</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player._id}>
                  <td>{player.playerName}</td>
                  <td>{player.email}</td>
                  <td>{player.team}</td>
                  <td>{player.game}</td>
                  <td>
                    {player.uploadedRequirements && player.uploadedRequirements.length > 0 ? (
                      <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                        {player.uploadedRequirements.map((req, idx) => (
                          <li key={idx} style={{textTransform: "uppercase"}}>
                            {req.name}:{" "}
                            <a
                              href={`http://localhost:5000${req.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: "#007bff", textDecoration: "underline", textTransform: "capitalize" }}
                            >
                              View File
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No requirements uploaded."
                    )}
                  </td>
                  <td>
                    <button className='approve-btn' onClick={() => handleApprove(player._id)}>Accept</button>
                    <button className='decline-btn'onClick={() => handleDecline(player._id)}>Decline</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className='no-players-found'>
          <LiaGhostSolid size={48} />
          <p>No pending players registered</p>
        </div>
      )}
    </MainLayout>
  );
};

export default TeamPlayerApproval;
