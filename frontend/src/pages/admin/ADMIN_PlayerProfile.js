import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PlayerProfile.css";

const PlayerProfile = () => {
  //const user = JSON.parse(localStorage.getItem("auth"));
  const { playerId } = useParams();
  const [player, setPlayer] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    document.title = "SPARTA | Player Profile";
  }, []);

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

  const handleChange = (e) => {
    setPlayer({ ...player, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/${playerId}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(player),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlayer(updated);
        setIsEditing(false);
        alert("Profile updated!");
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <MainLayout>
      <div className="player-profile-container">
        {isEditing ? (
          <div className="profile-form">
            <input name="fullName" value={player.playerName || ""} onChange={handleChange} placeholder="Full Name" />
            <input name="team" value={player.team || ""} onChange={handleChange} placeholder="Team" />
            <input name="sport" value={player.game || ""} onChange={handleChange} placeholder="Sport" />
            <input name="jerseyNumber" value={player.jerseyNumber || ""} onChange={handleChange} placeholder="Jersey #" />
            <input name="contactNumber" value={player.contactNumber || ""} onChange={handleChange} placeholder="Contact Number" />
            <input name="permanentAddress" value={player.permanentAddress || ""} onChange={handleChange} placeholder="Permanent Address" />
            <input type="date" name="birthDate" value={player.birthDate ? player.birthDate.substring(0, 10) : ""} onChange={handleChange} />
            <input type="number" name="age" value={player.age || ""} onChange={handleChange} placeholder="Age" />
            <input type="number" name="weight" value={player.weight || ""} onChange={handleChange} placeholder="Weight (kg)" />
            <input type="number" name="height" value={player.height || ""} onChange={handleChange} placeholder="Height (cm)" />
            <select name="sex" value={player.sex || ""} onChange={handleChange}>
              <option value="">Select Sex</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        ) : (
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
                  {/* History tab content goes here */}
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

            {/* <button onClick={() => setIsEditing(true)}>Edit Profile</button> */}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default PlayerProfile;
