import PlayerMainLayout from "../../components/P_MainLayout";
import { useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GiBasketballBall, GiSoccerBall, GiTennisRacket, GiChessKnight, GiTennisBall} from "react-icons/gi";
import { MdSportsVolleyball, MdSportsKabaddi } from "react-icons/md";
import { BiSolidBaseball, BiBaseball } from "react-icons/bi";
import { FaCircleQuestion } from "react-icons/fa6";
import "../../styles/ADMIN_Games.css";

const PlayerGame = () => {
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const [gamesByType, setGamesByType] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);

  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState("");
  const [game, setGame] = useState("");

  const filteredGames = Object.entries(gamesByType).filter(
    ([combinedType]) =>
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

  // Fetch grouped games for display
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/games?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(decodedName)}`
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
        setGames(data); // keep flat list for registration form
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };

    fetchGames();
  }, [userInstitution, decodedName]);

  // Fetch teams for registration form
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };

    fetchTeams();
  }, [userInstitution, decodedName]);

  // Handle registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      playerName,
      team,
      game,
    };

    try {
      const res = await fetch(
        `http://localhost:5000/api/players/${user._id}/register-game`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        alert("Successfully registered for the game!");
        setModalOpen(false); // close modal
        // reset form
        setPlayerName("");
        setTeam("");
        setGame("");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error registering player:", err);
      alert("Something went wrong.");
    }
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
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Open modal */}
        <button
          className="game-register-button"
          onClick={() => setModalOpen(true)}
        >
          REGISTER FOR A GAME
        </button>
      </div>

      <div className="game-main-div">
        {filteredGames.length === 0 ? (
          <div className="no-games-found">
            <FaCircleQuestion size={48} />
            <p style={{ textAlign: "center", width: "100%" }}>
              No games found.
            </p>
          </div>
        ) : (
          filteredGames.map(([combinedType, games]) => {
            const gameType = games[0]?.gameType || "Default";
            const icon = gameIcons[gameType] || gameIcons.Default;

            return (
              <div className="game-button-container" key={combinedType}>
                <button
                  className="game-button"
                  onClick={() =>
                    console.log(`Clicked game: ${combinedType}`)
                  }
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

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
               <button className="modal-close" onClick={() => setModalOpen(false)} > ✖ </button>
              <h2>Register for a Game <br /> {decodedName}</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Player Name:</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Team:</label>
                <select
                  value={team}
                  onChange={(e) => setTeam(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Team</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t.teamName}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Game:</label>
                <select
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Game</option>
                  {games.map((g) => (
                    <option key={g._id} value={`${g.category} ${g.gameType}`}>
                      {g.category} {g.gameType}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="game-register-button w-full">
                Register
              </button>
            </form>
          </div>
        </div>
      )}
    </PlayerMainLayout>
  );
};

export default PlayerGame;
