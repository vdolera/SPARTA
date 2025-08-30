import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../../styles/ADMIN_Teams.css';
import { VscSearchStop } from "react-icons/vsc";
//import { FaAlignCenter } from "react-icons/fa";

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
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/team/${encodeURIComponent(teamName)}/players`);
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
        <button className="new-team-btn" onClick={handleAddTeam}> + New Team </button>
      </div>

      <div className="teams-event">
        {filteredTeams.length === 0 ? (

          <div className="no-teams-found">
            <VscSearchStop size={48}/>
            <p>No teams found.</p>
          </div>

        ) : (
          <ul className="team-list">
            {filteredTeams.map((team, idx) => (
              <li key={idx}>
               <button
  className="team-btn"
  onClick={() => handleSelectTeam(team.teamName)}
  style={{
    backgroundColor: team.teamColor || "#A96B24", // always show selected color
    backgroundImage: team.teamIcon
      ? `url(http://localhost:5000${team.teamIcon})`
      : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
  }}
>
  <span className="team-name-overlay">{team.teamName}</span>
</button>


              </li>
            ))}
          </ul>
        )}
      </div>

    </MainLayout>
  );
};

export default Teams;
