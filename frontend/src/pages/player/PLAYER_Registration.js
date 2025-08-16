import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PlayerRegistration = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [playerName, setPlayerName] = useState("");
  const [team, setTeam] = useState("");
  const [game, setGame] = useState("");

  const [teams, setTeams] = useState([]);
  const [games, setGames] = useState([]);

  // Fetch Teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(userInstitution)}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };

    fetchTeams();
  }, [userInstitution, decodedName]);

  // Fetch Games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/games?institution=${encodeURIComponent(userInstitution)}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await res.json();
        setGames(data);
      } catch (err) {
        console.error("Error fetching games:", err);
      }
    };

    fetchGames();
  }, [userInstitution, decodedName]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      playerName,
      team,
      game,
    };

    try {
      const res = await fetch(`http://localhost:5000/api/players/${user._id}/register-game`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Successfully registered for the game!");
        navigate(`/event/${encodeURIComponent(decodedName)}/games`);
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Error registering player:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <MainLayout>
      <div className="registration-container">
        <h2>Register for a Game - {decodedName}</h2>
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label>Player Name:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Team:</label>
            <select value={team} onChange={(e) => setTeam(e.target.value)} required>
              <option value="">Select Team</option>
              {teams.map((t) => (
                <option key={t._id} value={t.teamName}>
                  {t.teamName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Game:</label>
            <select value={game} onChange={(e) => setGame(e.target.value)} required>
              <option value="">Select Game</option>
              {games.map((g) => (
                <option key={g._id} value={`${g.category} ${g.gameType}`}>
                  {g.category} {g.gameType}
                </option>
              ))}
            </select>
          </div>

          <button type="submit">Register</button>
        </form>
      </div>
    </MainLayout>
  );
};

export default PlayerRegistration;
