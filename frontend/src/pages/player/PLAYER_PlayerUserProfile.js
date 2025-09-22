import PlayerMainLayout from "../../components/P_MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PlayerProfile.css";

const PlayerUserProfile = () => {
  //const user = JSON.parse(localStorage.getItem("auth"));
  const {userId} = useParams();
  const [player, setPlayer] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("player");

    useEffect(() => {
      document.title = "SPARTA | User Profile";
    }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/players/${userId}`);
        const data = await res.json();
        setPlayer(data);
      } catch (err) {
        console.error("Error fetching player profile:", err);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    setPlayer({ ...player, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/players/${userId}/profile`, {
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
    <PlayerMainLayout>
 <div className="player-profile-container">

    <div className="profile-view">
      {/* Left card */}
      <div className="player-main-card">
      
        <div className="profile-pic">
          <img
            src={player.profilePicture || "/default-pfp.jpg"}
            alt="Profile"
            onError={(e) => { e.target.src = "default-pic.png"; }}
          />
          <p><b>{player.playerName || "N/A"}</b></p>
          <p>{player.institution}</p>
        </div>

      <div className="profile-details">
        {[
          { label: "Team", value: player.team || "N/A", name: "team", editable: false },
          { label: "Sport", value: player.game || "N/A", name: "sport" },
          { label: "Jersey Number", value: player.jerseyNumber || "N/A", name: "jerseyNumber", editable: true },
        ].map((field, idx) => (
          <div className="profile-field" key={idx}>
            <span className="profile-label">{field.label}</span>
            {isEditing && field.editable ? (
              <input
                name={field.name}
                value={player[field.name] || ""}
                onChange={handleChange}
                className="profile-input"
                placeholder={`Enter ${field.label}`}
              />
            ) : (
              <div className="profile-value-rect">{field.value}</div> )}
             </div>
              ))}
            </div>
          </div>

        {/* Right card */}
        <div className="other-info-card">
          <div className="profile-tabs">
            <button className={activeTab === "player" ? "active" : ""} onClick={() => setActiveTab("player")}>
              BASIC INFO
            </button>
            <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
              HISTORY
            </button>
            <button className={activeTab === "documents" ? "active" : ""} onClick={() => setActiveTab("documents")}>
              DOCUMENTS
            </button>
          </div>

        {activeTab === "player" && (
          <div className="profile-details">
            {[
              { label: "Birth Date", value: player.birthDate ? player.birthDate.substring(0,10) : "N/A", name: "birthDate", type: "date" },
              { label: "Age", value: player.age || "N/A", name: "age", type: "number" },
              { label: "Sex", value: player.sex || "N/A", name: "sex", type: "select" },
              { label: "Contact", value: player.contactNumber || "N/A", name: "contactNumber" },
              { label: "Address", value: player.permanentAddress || "N/A", name: "permanentAddress", className: "address-field" },
              { label: "Weight", value: player.weight ? `${player.weight} kg` : "N/A", name: "weight", type: "number" },
              { label: "Height", value: player.height ? `${player.height} cm` : "N/A", name: "height", type: "number" },
            ].map((field, idx) => (
              <div className={`profile-field ${field.className || ""}`} key={idx}>
                <span className="profile-label">{field.label}</span>
                {isEditing ? (
                  field.type === "select" ? (
                  <select name={field.name} value={player[field.name] || ""} onChange={handleChange} className="profile-input">
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={player[field.name] || ""}
                    onChange={handleChange}
                    className="profile-input"
                  />
                )
              ) : (
                <div className="profile-value-rect">{field.value}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

        {activeTab === "documents" && (
            <div className="documents-section">
              <h3>Submitted Documents and Requirements</h3>
              {player.requirements ? (
                <ul className="requirements-list">
                  <li>
                    ID Card:{" "}
                    <span>{player.requirements.idCard ? "✅ Submitted" : "❌ Missing"}</span>
                  </li>
                  <li>
                    Waiver:{" "}
                    <span>{player.requirements.waiver ? "✅ Submitted" : "❌ Missing"}</span>
                  </li>
                  <li>
                    Medical Certificate:{" "}
                    <span>
                      {player.requirements.medicalCertificate
                        ? "✅ Submitted"
                        : "❌ Missing"}
                    </span>
                  </li>
                </ul>
              ) : (
                <p>No requirements submitted yet.</p>
              )}
            </div>
          )}
              </div>
        </div>

        

     <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="btn save-btn" onClick={handleSave}>Save</button>
              <button className="btn cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>

      </div>

    </PlayerMainLayout>
  );
};

export default PlayerUserProfile;
