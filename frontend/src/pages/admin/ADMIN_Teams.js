import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../../styles/ADMIN_Teams.css';

const Teams = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem('auth'));
  const userInstitution = user?.institution;

  // Filter teams based on search query
  const filteredTeams = teams.filter(team =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="teams-header-row">
        <input
          type="text"
          className="team-search-bar"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ marginRight: "16px" }}
        />
        <button onClick={handleAddTeam}> + New Team </button>
      </div>

      <div className="teams-event">
        {filteredTeams.length === 0 ? (
          <p>No teams found.</p>
        ) : (
          <ul>
            {filteredTeams.map((team, idx) => (
              <li className="team-btn"
                key={idx}
                onClick={() => handleSelectTeam(team.teamName)}
                style={{ background: team.teamColor ? team.teamColor : '#A96B24' }}
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
