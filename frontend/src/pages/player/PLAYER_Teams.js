import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../../styles/ADMIN_Teams.css';
import { VscSearchStop } from "react-icons/vsc";
import P_MainLayout from "../../components/P_MainLayout";

const PlayerTeams = () => {
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

  const handleSelectTeam = (teamName) => {
    navigate(`/event/${encodeURIComponent(decodedName)}/team/${encodeURIComponent(teamName)}/players`);
  };

  return (
    <P_MainLayout>
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
      </div>

      <div className="teams-event">
        {filteredTeams.length === 0 ? (
          <div className="no-teams-found">
            <VscSearchStop size={48}/>
            <p>No teams found.</p>
          </div>
        ) : (
          <ul>
            {filteredTeams.map((team, idx) => (
              <button
                className="team-btn"
                key={idx}
                onClick={() => handleSelectTeam(team.teamName)}
                style={{ background: team.teamColor ? team.teamColor : '#A96B24'}}
              >
                {team.teamName}
              </button>
            ))}
          </ul>
        )}
      </div>
    </P_MainLayout>
  );
};

export default PlayerTeams;
