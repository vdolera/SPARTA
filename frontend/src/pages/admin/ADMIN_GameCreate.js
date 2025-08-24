import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const CreateGame = () => {
  const [gameType, setGameType] = useState("Basketball");
  const [category, setCategory] = useState("Men");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bracketType, setBracketType] = useState("Single Elimination");
  const [requirements, setRequirements] = useState([""]);
  const [rules, setRules] = useState("");
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);

  const navigate = useNavigate();
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("auth"));
    if (!user?.institution) return;

    fetch(
      `http://localhost:5000/api/teams?institution=${encodeURIComponent(
        user.institution
      )}&event=${encodeURIComponent(decodedName)}`
    )
      .then((res) => res.json())
      .then((data) => setAvailableTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));
  }, [decodedName]);

  const toggleTeamSelection = (teamName) => {
    setSelectedTeams((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName]
    );
  };

  const handleAddRequirement = () => setRequirements([...requirements, ""]);
  const handleRequirementChange = (idx, value) => {
    const updated = [...requirements];
    updated[idx] = value;
    setRequirements(updated);
  };
  const handleRemoveRequirement = (idx) => {
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("auth"));

    try {
      const response = await fetch("http://localhost:5000/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: user.institution,
          gameType,
          category,
          startDate,
          endDate,
          bracketType,
          teams: selectedTeams,
          requirements,
          rules,
          eventName: decodedName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Game created!");
        navigate(-1);
      } else {
        alert("Failed! " + data.message);
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to create game.");
    }
  };

  return (
    <MainLayout>
      <div className="event-form-header">
        <h1>Game Details</h1>
      </div>

      <div className="event-form-container">
        <div className="event-form-title">
          <h4>All Fields Are REQUIRED To Be Filled Up</h4>
        </div>

        <form className="event-forms" onSubmit={handleSubmit}>
          {/* Game Type */}
          <label>
            Game Type:
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              required
            >
              <option value="Basketball">Basketball</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Soccer">Soccer</option>
              <option value="Badminton">Badminton</option>
              <option value="Table Tennis">Table Tennis</option>
              <option value="Chess">Chess</option>
              <option value="Track and Field">Track and Field</option>
            </select>
          </label>

          {/* Game Category */}
          <label>
            Category:
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Mixed">Mixed</option>
            </select>
          </label>

          {/* Game Duration */}
          <label>
            Game Start Date:
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            Game End Date:
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>

          {/* Participating Teams */}
          <label>Participating Teams:</label>
          <div className="team-selection">
            {availableTeams.length === 0 ? (
              <p>No teams available for this event.</p>
            ) : (
              availableTeams.map((team) => (
                <button
                  key={team._id}
                  type="button"
                  onClick={() => toggleTeamSelection(team.teamName)}
                  style={{
                    margin: "5px",
                    padding: "8px 12px",
                    backgroundColor: selectedTeams.includes(team.teamName)
                      ? "#4caf50"
                      : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                  }}
                >
                  {team.teamName}
                </button>
              ))
            )}
          </div>

          {/* Requirements */}
          <label>Requirements:</label>
          <button type="button" onClick={handleAddRequirement}>
            + Add Requirement
          </button>
          {requirements.map((req, idx) => (
            <div key={idx}>
              <input
                type="text"
                value={req}
                onChange={(e) => handleRequirementChange(idx, e.target.value)}
                required
                placeholder={`Requirement ${idx + 1}`}
              />
              {requirements.length > 1 && (
                <button type="button" onClick={() => handleRemoveRequirement(idx)}>
                  Remove
                </button>
              )}
            </div>
          ))}
        

          {/* Rules */}
          <label>
            Rules and Guidelines:
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              required
              placeholder="Enter game rules and guidelines..."
              rows={5}
            />
          </label>

          {/* Bracket Type */}
          <label>Bracket Type:</label>
          <div className="bracket-selection">
            {[
              "Single Elimination",
              "Double Elimination",
              "Round Robin",
              "Swiss",
              "Free for All"
            ].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBracketType(type)}
                style={{
                  margin: "5px",
                  padding: "8px 12px",
                  backgroundColor: bracketType === type ? "#4caf50" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div className="lower-buttons">
            <button type="button" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit">Create Game</button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateGame;
