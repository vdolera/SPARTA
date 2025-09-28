import PlayerMainLayout from "../../components/P_MainLayout";
import { useParams, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { GiBasketballBall, GiSoccerBall, GiTennisRacket, GiChessKnight, GiTennisBall } from "react-icons/gi";
import { MdSportsVolleyball, MdSportsKabaddi } from "react-icons/md";
import { BiSolidBaseball, BiBaseball } from "react-icons/bi";
import { FaCircleQuestion } from "react-icons/fa6";
import "../../styles/ADMIN_Games.css";


const PlayerGame = () => {
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const navigate = useNavigate();

  const [gamesByType, setGamesByType] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);
  const [requirementFiles, setRequirementFiles] = useState({});


  //Game Register
  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState("");
  const [gender, setGender] = useState("");
  const [gamesSelected, setGamesSelected] = useState([]);
  const [eventRequirements, setEventRequirements] = useState([]);


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

  // Fetch grouped games
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
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(game);
        });

        setGamesByType(grouped);
        setGames(data);
      } catch (error) {
        console.error("Error fetching games:", error);
      }
    };
    fetchGames();
  }, [userInstitution, decodedName]);

  // Fetch teams
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

  useEffect(() => {
    const fetchEventRequirements = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/event?eventName=${encodeURIComponent(decodedName)}&institution=${encodeURIComponent(userInstitution)}`
        );
        const data = await res.json();
        setEventRequirements(data.requirements || []); // Ensure it's always an array
      } catch (err) {
        console.error("Error fetching event requirements:", err);
      }
    };

    fetchEventRequirements();
  }, [decodedName, userInstitution]);


  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("playerName", playerName);
    formData.append("team", team);
    formData.append("sex", gender);
    gamesSelected.forEach((g) => {
      formData.append("game", g);
    });


    // Append each requirement’s file
    Object.entries(requirementFiles).forEach(([req, file]) => {
      formData.append(`requirements[${req}]`, file);
    });

    try {
      const res = await fetch(
        `http://localhost:5000/api/players/${user._id}/register-game`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await res.json();
      if (res.ok) {
        alert("Successfully registered for the game!");
        setModalOpen(false);
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
        <h2>All Games for {eventName}</h2>
      </div>

      <div className="game-header-row">
        <input
          type="text"
          className="game-search-bar"
          placeholder="Search for a game..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
            <p style={{ textAlign: "center", width: "100%" }}>No games found.</p>
          </div>
        ) : (
          filteredGames.map(([combinedType, games]) => {
            const gameType = games[0]?.gameType || "Default";
            const icon = gameIcons[gameType] || gameIcons.Default;
            return (
              <div className="game-button-container" key={combinedType}>
                <button
                  className="game-button"
                  onClick={() => navigate(`/event/${encodeURIComponent(decodedName)}/game/${games[0]._id}`)}
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

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                REGISTER FOR A GAME UNDER <br /> {decodedName}
              </h2>
              <button
                className="modal-close"
                onClick={() => setModalOpen(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Player Name:</label>
                <input
                  type="text"
                  value={playerName || user?.playerName || ""}
                  onChange={(e) => setPlayerName(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team:</label>
                <select
                  value={team || user?.team || ""}
                  onChange={(e) => setTeam(e.target.value)}
                  required
                  className="form-input"
                >
                  <option value="">Select Team</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t.teamName}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Gender:</label>
                <select
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value);
                    setGamesSelected([]); // Reset game list when gender changes
                  }}
                  required
                  className="form-input"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Games:</label>
                {games
                  .filter((g) => {
                    if (!gender) return false;
                    const gType = g.category?.toLowerCase();
                    if (gender === "Male") {
                      return gType === "men" || gType === "mixed";
                    }
                    if (gender === "Female") {
                      return gType === "women" || gType === "mixed";
                    }
                    return false;
                  })
                  .map((g) => (
                    <label key={g._id} className="checkbox-label">
                      <input
                        type="checkbox"
                        value={g._id}
                        checked={gamesSelected.includes(g._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGamesSelected((prev) => [...prev, g._id]); // add
                          } else {
                            setGamesSelected((prev) => prev.filter((id) => id !== g._id)); // remove
                          }
                        }}
                        className="checkbox-input"
                      />
                      <span className="checkbox-custom"></span> {/* bullet style */}
                      {g.category} {g.gameType}
                    </label>
                  ))}
              </div>

              <h3 className="requirements-title" style={{ textAlign: "left" }}>
                Requirements:
              </h3>

              {eventRequirements.length === 0 ? (
                <p style={{ fontStyle: "italic" }}>No requirements for this game.</p>
              ) : (
                eventRequirements.map((req, index) => (
                  <div key={index}>
                    {/* Requirement label (outside the uploader box) */}
                    <label htmlFor={`rulesFile_${index}`} className="req-label">
                      {req}
                    </label>

                    {/* Uploader box */}
                    <div className="req-group">
                      <div className="req-filename">
                        {requirementFiles[req] ? requirementFiles[req].name : "No file chosen"}
                      </div>

                      <input
                        id={`rulesFile_${index}`}
                        type="file"
                        className="req-input"
                        onChange={(e) =>
                          setRequirementFiles((prev) => ({
                            ...prev,
                            [req]: e.target.files[0],
                          }))
                        }
                        required
                      />
                      <label htmlFor={`rulesFile_${index}`} className="req-button">
                        Upload File
                      </label>
                    </div>
                  </div>
                ))
              )}

              <button type="submit" className="form-submit">
                Register for Game
              </button>
            </form>
          </div>
        </div>
      )}
    </PlayerMainLayout>
  );
};

export default PlayerGame;
