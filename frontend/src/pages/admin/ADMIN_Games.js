import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GiBasketballBall, GiSoccerBall, GiTennisRacket, GiChessKnight, GiTennisBall} from "react-icons/gi";
import { MdSportsVolleyball, MdSportsKabaddi } from "react-icons/md";
import { BiSolidBaseball, BiBaseball } from "react-icons/bi";
import { FaCircleQuestion } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import '../../styles/ADMIN_Games.css';

const Game = () => {

  useEffect(() => {document.title = "SPARTA | " + decodedName + " Games";},[]);

  const navigate = useNavigate();
  const [gamesByType, setGamesByType] = useState({});
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const filteredGames = Object.entries(gamesByType).filter(([combinedType]) =>
    combinedType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gameIcons = {
    Basketball: GiBasketballBall,
    Volleyball: MdSportsVolleyball,
    Soccer: GiSoccerBall,
    Futsal: GiSoccerBall,
    Badminton: GiTennisRacket,
    Baseball: BiSolidBaseball,
    Softball: BiBaseball,
    "Table Tennis": MdSportsKabaddi,
    Tennis: GiTennisBall,
    Chess: GiChessKnight,
  };

  // Fetch Games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}&eventName=${encodeURIComponent(decodedName)}`
        );
        const data = await response.json();

        const grouped = {};
        data.forEach((game) => {
          const key = `${game.category} ${game.gameType}`;
          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(game);
        });

        setGamesByType(grouped);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };

    fetchGames();
  }, [userInstitution, decodedName]);

  // Add Game button 
  const handleAddGame = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addgame`);
  };

  // show confirmation modal
  const handleDeleteGame = (gameId) => {
    // find a friendly name for the game
    const game = Object.values(gamesByType).flat().find(g => g._id === gameId);
    const name = game ? `${game.category} ${game.gameType}` : "this game";
    setGameToDelete({ id: gameId, name });
    setShowDeleteModal(true);
  };

  // perform delete after confirmation
  const confirmDeleteGame = async () => {
    if (!gameToDelete) return;
    try {
      const res = await fetch(`http://localhost:5000/api/games/${gameToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove from local state
        const updatedGames = { ...gamesByType };
        for (const key in updatedGames) {
          updatedGames[key] = updatedGames[key].filter(game => game._id !== gameToDelete.id);
          if (updatedGames[key].length === 0) {
            delete updatedGames[key];
          }
        }
        setGamesByType(updatedGames);

        setShowDeleteModal(false);
        setToastMessage("Game has been deleted");
        setShowToast(true);
        // hide toast after 7s
        setTimeout(() => setShowToast(false), 7000);
      } else {
        setShowDeleteModal(false);
        setToastMessage("Failed to delete game");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      setShowDeleteModal(false);
      setToastMessage("Error deleting game");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    } finally {
      setGameToDelete(null);
    }
  };

  const cancelDelete = () => {
    setGameToDelete(null);
    setShowDeleteModal(false);
  };

  return (
    <MainLayout>
    <>
      <div className="game-header">
        <h2>All Games for {eventName}</h2>
      </div>

      <div className="game-header-row">
        <input
          type="text"
          className="game-search-bar"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {(user.role === "admin" || user.role === "co-organizer") && (
        <button className="new-game-btn" onClick={handleAddGame}> + Add Game </button>
        )}
      </div>

      <div className="game-main-div">
        {filteredGames.length === 0 ? (
          <div className="no-games-found">
            <FaCircleQuestion size={40} />
            <p style={{ textAlign: "center", width: "100%" }}>No games found.<br />Please click the " + Add Game " button to create a new game.</p>
          </div>
        ) : (
          filteredGames.map(([combinedType, games]) => {
            const gameType = games[0]?.gameType || "Default";
            const icon = gameIcons[gameType] || gameIcons.Default;
          
            return (
            <div style={{margin: "1rem"}} key={combinedType}>
              <div style={{width: "100%", display: "flex", justifyContent: "flex-end"}}>
                  {(user.role === "admin" || user.role === "co-organizer") && (
                  <button className="delete-game-btn" onClick={() => handleDeleteGame(games[0]._id)}>
                    <IoMdClose />
                  </button>
                  )}
              </div>

              <div className="game-button-container">
              
                <button
                  className="game-button"
                  onClick={() =>
                    navigate(
                      `/admin/event/${encodeURIComponent(decodedName)}/game/${games[0]._id}`
                    )
                  }
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {icon && React.createElement(icon, { size: 50 })}
                  {combinedType}
                </button>

              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && gameToDelete && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete <b>{gameToDelete.name}</b>?</p>
            <div className="confirm-modal-actions">
              <button className="btn cancel" onClick={cancelDelete}>Cancel</button>
              <button className="btn confirm" onClick={confirmDeleteGame}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="toast-bottom-right" role="status" aria-live="polite">
          {toastMessage}
        </div>
      )}
    </>
    </MainLayout>
  );
};

export default Game;
