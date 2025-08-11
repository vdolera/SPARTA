import MainLayout from "../../components/MainLayout";
import {useParams} from "react-router-dom";
import React, {useState, useEffect} from "react";
import "../../styles/LiveScores.css"

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
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(userInstitution)}`
        );
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (userInstitution) {
      fetchTeams();
    }
  }, [userInstitution]);

  return (
    <MainLayout>
      <h1>Live Scores for {decodedName}</h1>

      <div style={{ marginTop: "20px" }}>
        {teams.length === 0 ? (
          <p>No teams found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {teams.map((team, idx) => (
              <li
                key={idx}
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  backgroundColor: team.teamColor || "#1A2A49",
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