import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

const Game = () => {
  const navigate = useNavigate();
  const [gamesByType, setGamesByType] = useState({});
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}`
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
  }, [userInstitution]);
  

  const handleAddGame = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addgame`); 
  };

  return (
    <MainLayout>
      <h1>All Games for {userInstitution}</h1>
      <button onClick={handleAddGame}> + Add Game </button>

      <div style={{ marginTop: "20px" }}>
  <h2>Select a Game</h2>
  {Object.entries(gamesByType).map(([combinedType, games]) => (
    <button
      key={combinedType}
      onClick={() => navigate(`/event/game/${encodeURIComponent(combinedType)}`)}
      style={{ display: "block", margin: "10px 0", padding: "10px" }}
    >
      {combinedType}
    </button>
  ))}
</div>

    </MainLayout>
  );
};

export default Game;
