import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const Game = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
  const handleAddGame = () => {
    navigate(`/event/${encodeURIComponent(eventName)}/addgame`);
  };

  return (

    <MainLayout>
         <h1>Games for {decodedName}</h1>
         <button onClick={handleAddGame}> + Add Game </button>
    </MainLayout>

  )
};

export default Game;