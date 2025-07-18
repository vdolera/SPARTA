import MainLayout from "../../components/MainLayout";

const Games = () => {
   /*
  const [teams, setTeams] = useState([""]);
  // Add a new team input
  const handleAddTeam = () => setTeams([...teams, ""]);
  
  // Update team name
  const handleTeamChange = (idx, value) => {
    const updated = [...teams];
    updated[idx] = value;
    setTeams(updated);
  };

  // Remove a team input
  const handleRemoveTeam = (idx) => {
    setTeams(teams.filter((_, i) => i !== idx));
  };

<label>Participating Teams:</label>
        {teams.map((team, idx) => (
          <div key={idx}>
            <input
              type="text"
              value={team}
              onChange={e => handleTeamChange(idx, e.target.value)}
              required
              placeholder={`Team ${idx + 1}`}
            />
            <button type="button" onClick={() => handleRemoveTeam(idx)}>
              Remove
            </button>

            <button type="button" onClick={handleAddTeam}>
              Add Team
            </button>

          </div>
        ))}

  */
  return (

    <MainLayout>
      <h1>Games</h1>
    </MainLayout>

  )
};

export default Games;