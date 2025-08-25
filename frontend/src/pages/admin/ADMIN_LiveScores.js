import MainLayout from "../../components/MainLayout";
import {useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import "../../styles/LiveScores.css"
import { TbCalendarQuestion } from "react-icons/tb";

const LiveScores = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const [teams, setTeams] = useState([]);

  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(userInstitution)}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (userInstitution && decodedName) {
      fetchTeams();
    }
  }, [userInstitution, decodedName]);

  return (
    <MainLayout>
      <h1>Live Scores for {decodedName}</h1>

      <div className="live-scores-container">
        {teams.length === 0 ? (
          <div className="no-matches-found">
            <TbCalendarQuestion size={48} />
            <p> OOPS! <br /> There are no ongoing matches found under {decodedName} <br /> Please come back again soon :)</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {teams.map((team, idx) => (
              <li
                key={idx}
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  background: team.teamColor 
                  ? `linear-gradient(to right, white, ${team.teamColor})`
                  : 'linear-gradient(to right, white, #A96B24)',
                  color: 'black',
                  marginBottom: "6px",
                  borderRadius: "6px"
                }}
              >
                {team.teamName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </MainLayout>

  )
};

export default LiveScores;