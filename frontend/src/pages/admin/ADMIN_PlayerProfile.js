import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PlayerProfile.css";

const PlayerProfile = () => {
  //const user = JSON.parse(localStorage.getItem("auth"));
  const { playerId } = useParams();
  const [player, setPlayer] = useState({});
  const [activeTab, setActiveTab] = useState("player");
  //const [selectedDocument, setSelectedDocument] = useState(null);
  //const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/players/${playerId}`);
        const data = await res.json();
        setPlayer(data);
      } catch (err) {
        console.error("Error fetching player profile:", err);
      }
    };
    fetchProfile();
  }, [playerId]);

  return (
    <MainLayout>
      <div className="player-profile-container">
          <div className="profile-view">

            <div className="player-main-card">

              <div className="profile-pic">
                <img src={player.profilePicture || "/default-pfp.jpg"} alt="Profile" onError={(e) => { e.target.src = "default-pic.png"; }}
                />
                <p> <b>{player.playerName || "N/A"}</b> </p>
                <p> {player.institution}</p>
              </div>

              <div className="profile-details">
                {[
                  { label: "Team", value: player.team || "N/A" },
                  { label: "Sport", value: player.game || "N/A" },
                  { label: "Jersey Number", value: player.jerseyNumber || "N/A" },
                ].map((field, idx) => (
                  <div className="profile-field" key={idx}>
                    <span className="profile-label">
                      {field.label}
                    </span>
                    <div className="profile-value-rect">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

            </div>

            <div className="other-info-card">

              <div className="profile-tabs">
                <button className={activeTab === "player" ? "active" : ""} onClick={() => setActiveTab("player")}> BASIC INFO </button>
                <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}> HISTORY </button>
                <button className={activeTab === "documents" ? "active" : ""} onClick={() => setActiveTab("documents")}> DOCUMENTS </button>
              </div>
              {/* Tab content rendering */}
              {activeTab === "player" && (
                <div className="profile-details">
                  {[
                    { label: "Birth Date", value: player.birthDate ? player.birthDate.substring(0, 10) : "N/A" },
                    { label: "Age", value: player.age || "N/A" },
                    { label: "Sex", value: player.sex || "N/A" },
                    { label: "Contact", value: player.contactNumber || "N/A" },
                    { label: "Address", value: player.permanentAddress || "N/A", className: "address-field" },
                    { label: "Weight", value: player.weight ? `${player.weight} kg` : "N/A" },
                    { label: "Height", value: player.height ? `${player.height} cm` : "N/A" },

                  ].map((field, idx) => (
                    <div className={`profile-field ${field.className || ""}`} key={idx}>
                      <span className="profile-label">{field.label}</span>
                      <div className="profile-value-rect">{field.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "history" && (
                <div>
                  {/* History tab */}
                  <p>History content...</p>
                </div>
              )}
                {activeTab === "documents" && (
                  <div className="documents-section">
                    
                    {player.uploadedRequirements && player.uploadedRequirements.length > 0 ? (
                      <div className="table-container">
                        <table className="documents-table">
                          <thead>
                            <tr>
                              <th className="requirement-column">REQUIREMENTS</th>
                              <th className="file-column">FILE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {player.uploadedRequirements.map((req, idx) => (
                              <tr key={idx} className="document-row">
                                <td className="requirement-name">{req.name}</td>
                                <td className="file-link">
                                  <a
                                    href={`http://localhost:5000${req.filePath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="document-link"
                                  >
                                    View Document
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No requirements submitted yet.</p>
                    )}
                  </div>
                )}
            </div>
          </div>
      </div>
    </MainLayout>
  );
};

export default PlayerProfile;
