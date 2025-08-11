import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";

const Teams = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
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

  const handleAddTeam = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addteam`);
  };

  const handleSelectTeam = (teamName) => {
    alert(`Selected team: ${teamName}`);
  };

  return (
    <MainLayout>
      <h1>Teams for {decodedName}</h1>
      <button onClick={handleAddTeam}> + New Team </button>

      <div style={{ marginTop: "20px" }}>
        {teams.length === 0 ? (
          <p>No teams found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {teams.map((team, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectTeam(team.teamName)}
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
  );
};

export default Teams;
