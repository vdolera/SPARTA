import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";
import { FaSchoolFlag } from "react-icons/fa6";
import '../../styles/ADMIN_PlayerApproval.css';

const Approval = () => {
  const [players, setPlayers] = useState([]);
  const auth = JSON.parse(localStorage.getItem("auth")); // logged-in user

    useEffect(() => {
    document.title = "SPARTA | Approvals";
  }, []);

  // Fetch all unapproved players for the same institution
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/players/pending?institution=${auth.institution}`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    if (auth?.institution) {
      fetchPlayers();
    }
  }, [auth]);

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
      <div className="approval-header">
        <h2>PLAYER APPROVALS</h2>
      </div>
      {players.length === 0 ? (
        <div className="no-players-message">
          <FaSchoolFlag size={"50"}/>
          <p>No pending user registrations for your institution.</p>
        </div>
      ) : (
        <div className='approval-table'>
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{borderRadius: "10px"}}>
                <th>EMAIL</th>
                <th>EVENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player._id}>
                  <td>{player.email}</td>
                  <td>{player.eventName}</td>
                  <td>
                    <button className='approve-btn' onClick={() => handleApprove(player._id)}>
                      Approve
                    </button>
                    <button className='decline-btn' onClick={() => handleDecline(player._id)}>
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
};

export default Approval;
