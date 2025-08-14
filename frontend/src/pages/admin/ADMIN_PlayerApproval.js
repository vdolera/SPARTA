import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";

const Approval = () => {
  const [players, setPlayers] = useState([]);

  // Fetch all unapproved players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/players/pending");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    fetchPlayers();
  }, []);

  // Approve player
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Player approved!");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        alert("Failed to approve player");
      }
    } catch (err) {
      console.error(err);
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
        alert("Player declined and removed.");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        alert("Failed to delete player");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MainLayout>
      <h1>Player Approvals</h1>
      {players.length === 0 ? (
        <p>No pending player registrations.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Event</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player._id}>
                <td>{player.email}</td>
                <td>{player.eventName}</td>
                <td>
                  <button onClick={() => handleApprove(player._id)}>Approve</button>
                  <button
                    onClick={() => handleDecline(player._id)}
                    style={{ marginLeft: "10px", backgroundColor: "red", color: "white" }}
                  >
                    Decline
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </MainLayout>
  );
};

export default Approval;
