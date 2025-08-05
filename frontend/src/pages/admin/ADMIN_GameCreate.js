import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateGame = () => {
  const navigate = useNavigate();

  const [gameType, setGameType] = useState("Basketball");
  const [category, setCategory] = useState("Men");
  const [schedule, setSchedule] = useState("");
  const [requirements, setRequirements] = useState([""]);
  const [rules, setRules] = useState("");
  const [teams, setTeams] = useState([""]);

  const handleAddTeam = () => setTeams([...teams, ""]);
  const handleTeamChange = (idx, value) => {
    const updated = [...teams];
    updated[idx] = value;
    setTeams(updated);
  };
  const handleRemoveTeam = (idx) => {
    setTeams(teams.filter((_, i) => i !== idx));
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

    try {
      const user = JSON.parse(localStorage.getItem("auth"));

      const response = await fetch("http://localhost:5000/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institution: user.institution,
          gameType,
          category,
          schedule,
          teams,
          requirements,
          rules,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Game created!");
        navigate(-1);
      } else {
        alert("Failed!" + data.message);
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

        <form className="event-forms">
          <label>
            Game Type:
            <select value={gameType} onChange={(e) => setGameType(e.target.value)} required>
              <option value="Basketball">Basketball</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Soccer">Soccer</option>
              <option value="Badminton">Badminton</option>
              <option value="Table Tennis">Table Tennis</option>
              <option value="Chess">Chess</option>
              <option value="Track and Field">Track and Field</option>
            </select>
          </label>

          <label>
            Category:
            <div>
              <label><input type="radio" value="Men" checked={category === "Men"} onChange={(e) => setCategory(e.target.value)} /> Men</label>
              <label><input type="radio" value="Women" checked={category === "Women"} onChange={(e) => setCategory(e.target.value)} /> Women</label>
              <label><input type="radio" value="Mixed" checked={category === "Mixed"} onChange={(e) => setCategory(e.target.value)} /> Mixed</label>
            </div>
          </label>

          <label>
            Game Schedule:
            <input
              type="datetime-local"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              required
            />
          </label>

          <label>Participating Teams:</label>
          {teams.map((team, idx) => (
            <div key={idx}>
              <input
                type="text"
                value={team}
                onChange={(e) => handleTeamChange(idx, e.target.value)}
                required
                placeholder={`Team ${idx + 1}`}
              />
              {teams.length > 1 && (
                <button type="button" onClick={() => handleRemoveTeam(idx)}>
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddTeam}>
            + Add Team
          </button>

          <label>Requirements:</label>
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
          <button type="button" onClick={handleAddRequirement}>
            + Add Requirement
          </button>

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

          <div className="lower-buttons">
            <button type="button" onClick={() => navigate(-1)}>Cancel</button>
            <button type="submit" onClick={handleSubmit}>Create Game</button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateGame;
