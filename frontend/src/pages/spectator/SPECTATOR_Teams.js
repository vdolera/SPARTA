import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { VscSearchStop } from "react-icons/vsc";
import "../../styles/ADMIN_Teams.css";


const SpectatorTeams = () => {

    const { institution, eventName } = useParams();
    const decodedName = decodeURIComponent(eventName);
    const decodedInstitution = decodeURIComponent(institution);
    const navigate = useNavigate();

    useEffect(() => { document.title = "SPARTA | " + decodedName + " Teams"; }, [decodedName]);

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");


    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {

                const response = await fetch(`https://sparta-deployed.onrender.com/api/teams?institution=${encodeURIComponent(decodedInstitution)}&event=${encodeURIComponent(decodedName)}`);
                const data = await response.json();

                if (Array.isArray(data)) {
                    setTeams(data);
                } else {
                    setTeams([]);
                }
            } catch (error) {
                console.error("Error fetching teams:", error);
                setTeams([]);
            } finally {
                setLoading(false);
            }
        };

        if (decodedInstitution && decodedName) {
            fetchTeams();
        }
    }, [decodedInstitution, decodedName]);



    const handleSelectTeam = (teamName) => {
        navigate(`/spectator/${encodeURIComponent(decodedInstitution)}/${encodeURIComponent(decodedName)}/team/${encodeURIComponent(teamName)}`);
    };


    const filteredTeams = teams.filter((team) =>
        team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="teams-main-container">
            <div className="teams-header-row">
                <div>
                    <h3> TEAMS FOR {decodedName}</h3>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                    <input
                        type="text"
                        className="team-search-bar"
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="teams-event">
                {loading ? (

                    <ul className="team-list teams-skeleton-list" aria-live="polite" aria-busy="true">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <li key={`teams-skel-${idx}`} className="team-item teams-skeleton-item">
                                <div className="team-card">
                                    <button
                                        className="team-btn teams-skeleton-btn"
                                        aria-hidden="true"
                                    >
                                        <span className="teams-skeleton-overlay" />
                                    </button>
                                    <div className="team-menu-container" style={{ opacity: 0, pointerEvents: 'none' }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : filteredTeams.length === 0 ? (
                    <div className="no-teams-found">
                        <VscSearchStop size={48} />
                        <p>No teams found.</p>
                    </div>
                ) : (
                    <ul className="team-list">
                        {filteredTeams.map((team) => (
                            <li key={team._id} className="team-item">
                                <div className="team-card">
                                    <button
                                        className="team-btn"
                                        onClick={() => handleSelectTeam(team.teamName)}
                                        style={{
                                            backgroundColor: team.teamColor || "#A96B24",
                                            backgroundImage: team.teamIcon ? `url(${team.teamIcon})` : "none",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            color: "#fff",
                                        }}
                                    >
                                        <span className="team-name-overlay">{team.teamName}</span>
                                    </button>
                                    {/* Spectators do not see the Edit/Delete Menu */}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SpectatorTeams;