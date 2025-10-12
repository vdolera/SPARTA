import MainLayout from "../../components/MainLayout";
import { useEffect, useState } from "react";
import { FaSchoolFlag } from "react-icons/fa6";
import '../../styles/ADMIN_PlayerApproval.css';

const Approval = () => {
  const [players, setPlayers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const playersPerPage = 10;

  const user = JSON.parse(localStorage.getItem("auth"));
  const [showToast, setShowToast] = useState({ show: false, message: "", type: "" });
  const [declineConfirm, setDeclineConfirm] = useState({ show: false, playerId: null });

  // Fetch pending players
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/players/pending?institution=${user?.institution}`);
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };
    if (user?.institution) {
      fetchPlayers();
    }
  }, [user]);

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
      const res = await fetch(`http://localhost:5000/api/players/approve/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        showToastMessage("Approved Player", "success");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        showToastMessage("Failed to approve player", "error");
      }
    } catch (err) {
      console.error("Error approving player:", err);
      showToastMessage("Something went wrong", "error");
    }
  };

  // Open decline confirmation modal
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
      const res = await fetch(`http://localhost:5000/api/players/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToastMessage("Declined Player", "error");
        setPlayers(players.filter((p) => p._id !== id));
      } else {
        showToastMessage("Failed to delete player", "error");
      }
    } catch (err) {
      console.error("Error declining player:", err);
      showToastMessage("Something went wrong", "error");
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(players.length / playersPerPage);
  const indexOfLastPlayer = currentPage * playersPerPage;
  const indexOfFirstPlayer = indexOfLastPlayer - playersPerPage;
  const paginatedPlayers = players.slice(indexOfFirstPlayer, indexOfLastPlayer);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <MainLayout>
      <div className="approval-header">
        <h2>PLAYER APPROVALS</h2>
        <p style={{ margin: 0, fontStyle: "italic" }}> Manage player approvals for your institution. </p>
      </div>

      {players.length === 0 ? (
        <div className="no-players-message">
          <FaSchoolFlag size={"50"} />
          <p>No pending user registrations for your institution.</p>
        </div>
      ) : (
        <div className="approval-table">
          <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th>EMAIL</th>
                <th>EVENT</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPlayers.map((player) => (
                <tr key={player._id}>
                  <td>{player.email}</td>
                  <td>{player.eventName}</td>
                  <td>
                    <button className="approve-btn" onClick={() => handleApprove(player._id)}>
                      Approve
                    </button>
                    <button className="decline-btn" onClick={() => openDeclineConfirm(player._id)}>
                      Decline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination-controls">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Prev
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageClick(i + 1)}
                className={`pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/*Decline Confirmation Modal */}
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

export default Approval;
