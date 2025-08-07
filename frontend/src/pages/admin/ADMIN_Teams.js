import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const Teams = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
    const handleAddTeam = () => {navigate(`/admin/event/${encodeURIComponent(decodedName)}/addteam`);
  };
  return (

    <MainLayout>
      <h1>Teams</h1>
      <button onClick={handleAddTeam}> + New Team </button>
    </MainLayout>

  )
};

export default Teams;