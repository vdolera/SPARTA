import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const Game = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
  const handleAddGame = () => {
      navigate("./create");
    };

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
         <h1>Games for {decodedName}</h1>
         <button onClick={handleAddGame}> + Add Game </button>
    </MainLayout>

  )
};

export default Game;