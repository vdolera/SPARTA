import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GiBasketballBall, GiSoccerBall, GiTennisRacket, GiChessKnight, GiTennisBall} from "react-icons/gi";
import { MdSportsVolleyball, MdSportsKabaddi } from "react-icons/md";
import { BiSolidBaseball, BiBaseball } from "react-icons/bi";
import { FaCircleQuestion } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";
import { FaFileImport } from "react-icons/fa"; // Import Icon
import '../../styles/ADMIN_Games.css';

const Game = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  useEffect(() => {document.title = "SPARTA | " + decodedName + " Games";},[decodedName]);

  const navigate = useNavigate();
  const [gamesByType, setGamesByType] = useState({});
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [eventDetails, setEventDetails] = useState(null);

  // --- IMPORT STATE ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedImportEvent, setSelectedImportEvent] = useState("");
  const [pastGames, setPastGames] = useState([]);
  const [selectedGamesToCopy, setSelectedGamesToCopy] = useState([]);

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

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // 1. Fetch Active Events (To find current event details)
        const activeRes = await fetch(`http://localhost:5000/api/events?institution=${user?.institution}`);
        const activeData = await activeRes.json();

        if (Array.isArray(activeData)) {
          const found = activeData.find(e => e.eventName === decodedName);
          if (found) setEventDetails(found);
        }

        // 2. Fetch PAST Events (For Import Dropdown)
        const pastRes = await fetch(`http://localhost:5000/api/past-events?institution=${user?.institution}`);
        const pastData = await pastRes.json();

        if (Array.isArray(pastData)) {
           const sortedPast = pastData.sort((a, b) => new Date(b.eventEndDate) - new Date(a.eventEndDate));
           setAllEvents(sortedPast);
        }

      } catch (err) {
        console.error("Error fetching event data:", err);
      }
    };

    if (user?.institution && decodedName) {
      fetchEventData();
    }
  }, [user?.institution, decodedName]);

  // Fetch Games
  const fetchGames = async () => {
    if(!eventDetails?._id) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}&eventId=${eventDetails._id}`
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

  useEffect(() => {
    fetchGames();
  }, [userInstitution, eventDetails]);

  // --- IMPORT LOGIC ---
  const handleSelectImportEvent = async (e) => {
    const eventId = e.target.value;
    setSelectedImportEvent(eventId);
    setSelectedGamesToCopy([]);
    
    if(!eventId) {
        setPastGames([]);
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}&eventId=${eventId}`);
        const data = await res.json();
        if(Array.isArray(data)) setPastGames(data);
    } catch(err) {
        console.error(err);
    }
  };

  const toggleImportSelection = (game) => {
    if (selectedGamesToCopy.find(g => g._id === game._id)) {
        setSelectedGamesToCopy(prev => prev.filter(g => g._id !== game._id));
    } else {
        setSelectedGamesToCopy(prev => [...prev, game]);
    }
  };

  const submitImportGames = async () => {
    if(selectedGamesToCopy.length === 0) return;

    let successCount = 0;
    
    for (const game of selectedGamesToCopy) {
       const formData = new FormData();
       formData.append("institution", user.institution);
       formData.append("eventId", eventDetails._id);
       formData.append("eventName", eventDetails.eventName);
       
       formData.append("gameType", game.gameType);
       formData.append("category", game.category);
       formData.append("bracketType", game.bracketType);
       
       // CRITICAL: We use current event dates to avoid validation errors
       formData.append("startDate", eventDetails.eventStartDate);
       formData.append("endDate", eventDetails.eventEndDate);
       
       // Teams and Rules
       formData.append("teams", JSON.stringify(game.teams || [])); // Copy Participating teams
       if(game.rules) formData.append("rulesText", game.rules); // Send as text (works if it is a string URL or plain text)

       try {
           const res = await fetch("http://localhost:5000/api/games", {
               method: "POST",
               body: formData
           });
           if(res.ok) successCount++;
       } catch(err) {
           console.error("Failed to copy game", game.gameType);
       }
    }

    setToastMessage(`Successfully copied ${successCount} games.`);
    setShowToast(true);
    setShowImportModal(false);
    fetchGames(); // Refresh list
    setTimeout(() => setShowToast(false), 5000);
 };

  // Add Game button 
  const handleAddGame = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addgame`, { 
      state: { id: eventDetails._id } 
    });
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
        setTimeout(() => setShowToast(false), 5000);
      } else {
        setShowDeleteModal(false);
        setToastMessage("Failed to delete game");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      setShowDeleteModal(false);
      setToastMessage("Error deleting game");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
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
          <div style={{display:'flex', gap: '10px'}}>
             <button 
                className="new-game-btn" 
                style={{backgroundColor: "#b95454", width: "auto", padding: "0 15px"}}
                onClick={() => setShowImportModal(true)}
            > 
                <FaFileImport style={{marginRight: "5px"}}/> Import Game 
            </button>
             <button className="new-game-btn" onClick={handleAddGame}> + Add Game </button>
          </div>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
            <div className="modal" style={{maxWidth: "500px", width: "90%"}}>
                <h2>Copy Games from Past Event</h2>
                <hr />
                <div style={{margin: "15px 0"}}>
                    <label>Select Event:</label>
                    <select 
                        style={{width: "100%", padding: "8px", marginTop: "5px"}}
                        value={selectedImportEvent}
                        onChange={handleSelectImportEvent}
                    >
                        <option value="">-- Select an Event --</option>
                        {allEvents.map(evt => (
                            <option key={evt._id} value={evt._id}>{evt.eventName}</option>
                        ))}
                    </select>
                </div>

                {selectedImportEvent && (
                    <div style={{maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", padding: "10px", borderRadius: "4px"}}>
                        {pastGames.length === 0 ? (
                            <p>No games found in selected event.</p>
                        ) : (
                            <>
                                <div style={{marginBottom:"10px", fontWeight:"bold"}}>Select Games to Copy:</div>
                                {pastGames.map(game => (
                                    <div key={game._id} style={{display:"flex", alignItems:"center", marginBottom:"5px", padding: "5px", borderBottom: "1px solid #eee"}}>
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedGamesToCopy.find(g => g._id === game._id)}
                                            onChange={() => toggleImportSelection(game)}
                                            style={{marginRight: "10px"}}
                                        />
                                        <div>
                                           <div style={{fontWeight: "bold"}}>{game.category} {game.gameType}</div>
                                           <div style={{fontSize: "0.8em", color: "#666"}}>{game.teams.length} Teams | {game.bracketType}</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={() => setShowImportModal(false)}>Cancel</button>
                    <button onClick={submitImportGames} disabled={selectedGamesToCopy.length === 0}>Copy Selected</button>
                </div>
            </div>
        </div>
      )}

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