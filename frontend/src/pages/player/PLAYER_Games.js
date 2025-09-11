import PlayerMainLayout from "../../components/P_MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GiBasketballBall, GiSoccerBall, GiTennisRacket, GiChessKnight, GiTennisBall} from "react-icons/gi";
import { MdSportsVolleyball, MdSportsKabaddi } from "react-icons/md";
import { BiSolidBaseball, BiBaseball } from "react-icons/bi";
import { FaCircleQuestion } from "react-icons/fa6";
import '../../styles/ADMIN_Games.css';

const PlayerGame = () => {
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
  

  const handleRegistration = () => {
    navigate(`/event/${encodeURIComponent(decodedName)}/registration`); 
  };

  return (
    <PlayerMainLayout>
      <div className="game-header"> 
        <h1>All Games for {eventName}</h1>
      </div>

      <div className="game-header-row">
        <input
          type="text"
          className="game-search-bar"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button
          className="game-register-button"
          onClick={handleRegistration}> 
          REGISTER FOR A GAME 
        </button>
      </div>  

      <div className="game-main-div">
        {filteredGames.length === 0 ? (
          <div className="no-games-found">
            <FaCircleQuestion size={48} />
            <p style={{ textAlign: "center", width: "100%" }}>No games found.</p>
          </div>
        ) : (
          filteredGames.map(([combinedType, games]) => {
            const gameType = games[0]?.gameType || "Default";
            const icon = gameIcons[gameType] || gameIcons.Default;

            return (
              <div className="game-button-container">
                <button
                  className="game-button"
                  key={combinedType}
                  onClick={() => navigate(`/event/game/${encodeURIComponent(combinedType)}`)}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {icon && React.createElement(icon, { size: 50 })}
                  {combinedType}
                </button>
              </div>
            );
          })
        )}
      </div>

    </PlayerMainLayout>
  );
};

export default PlayerGame;
