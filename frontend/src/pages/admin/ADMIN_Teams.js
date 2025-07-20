import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";

const Teams = () => {
  const navigate = useNavigate();
    const handleAddTeam = () => {
        navigate("./create");
      };
  return (

    <MainLayout>
      <h1>Teams</h1>
      <button onClick={handleAddTeam}> + New Team </button>
    </MainLayout>

  )
};

export default Teams;