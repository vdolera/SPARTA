import MainLayout from "../../components/MainLayout";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { LiaGhostSolid } from "react-icons/lia";
import '../../styles/ADMIN_PlayerApproval.css';

const TeamPlayerApproval = () => {
  const [players, setPlayers] = useState([]);
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });
  const [declineConfirm, setDeclineConfirm] = useState({ show: false, playerId: null });

  const { eventName, teamName } = useParams();
  const user = JSON.parse(localStorage.getItem("auth"));

  // Fetch pending players
  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/players/team-pending?institution=${user?.institution}&eventName=${encodeURIComponent(
          eventName
        )}&team=${encodeURIComponent(teamName)}`
      );
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      console.error("Error fetching pending players:", err);
    }
  }, [user?.institution, eventName, teamName]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Toast handler
  const showToastMessage = (message, type) => {
    setShowToast({ show: true, message, type });
    setTimeout(() => {
      setShowToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Approve player
  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/team-approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        showToastMessage("Approved Player", "success");
        fetchPlayers();
      }
    } catch (err) {
      console.error("Error approving player:", err);
    }
  };

  // Decline confirmation modal trigger
  const openDeclineConfirm = (id) => {
    setDeclineConfirm({ show: true, playerId: id });
  };

  const closeDeclineConfirm = () => {
    setDeclineConfirm({ show: false, playerId: null });
  };

  // Confirm decline
  const confirmDecline = async () => {
    const id = declineConfirm.playerId;
    closeDeclineConfirm();
    try {
      const res = await fetch(`http://localhost:5000/api/players/team-decline/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        showToastMessage("Declined Player", "error");
        fetchPlayers();
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
                          <li key={idx} style={{ textTransform: "uppercase" }}>
                            {req.name}:{" "}
                            <a
                              href={req.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#007bff",
                                textDecoration: "underline",
                                textTransform: "capitalize",
                              }}
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
                    <button className="approve-btn" onClick={() => handleApprove(player._id)}>
                      Accept
                    </button>
                    <button className="decline-btn" onClick={() => openDeclineConfirm(player._id)}>
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-players-found">
          <LiaGhostSolid size={48} />
          <p>No pending players registered</p>
        </div>
      )}

      {/* Decline Confirmation Modal */}
        {declineConfirm.show && (
          <div className="decline-modal-overlay">
            <div className="decline-modal">
              <h3>Are you sure you want to decline this player?</h3>
              <div className="decline-modal-actions">
                <button onClick={confirmDecline} className="btn-decline">
                  Decline
                </button>
                <button onClick={closeDeclineConfirm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {showToast.show && (
          <div
            className={`toast-notification ${
              showToast.type === "success" ? "toast-success" : "toast-error"
            }`}
          >
            {showToast.message}
          </div>
        )}
    </MainLayout>
  );
};

export default TeamPlayerApproval;
