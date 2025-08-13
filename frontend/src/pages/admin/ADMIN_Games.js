import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../../styles/ADMIN_Games.css';

const Game = () => {
  const navigate = useNavigate();
  const [gamesByType, setGamesByType] = useState({});
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const [searchQuery, setSearchQuery] = useState("");
  const filteredGames = Object.entries(gamesByType).filter(([combinedType]) =>
    combinedType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}&event=${encodeURIComponent(decodedName)}`
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
  

  const handleAddGame = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addgame`); 
  };

  return (
    <MainLayout>
      <div className="game-header"> 
        <h1>All Games for {userInstitution}</h1>
      </div>

      <div className="game-header-row">
        <input
          type="text"
          className="game-search-bar"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginRight: "16px" }}
        />
        <button onClick={handleAddGame}> + Add Game </button>
      </div>  

      <div className="game-main-div">
        {filteredGames.length === 0 ? (
          <p style={{ textAlign: "center", width: "100%" }}>No games found.</p>
        ) : (
          filteredGames.map(([combinedType, games]) => (
            <button
              className="game-button"
              key={combinedType}
              onClick={() => navigate(`/event/game/${encodeURIComponent(combinedType)}`)}
            >
              {combinedType}
            </button>
          ))
        )}
      </div>

    </MainLayout>
  );
};

export default Game;
