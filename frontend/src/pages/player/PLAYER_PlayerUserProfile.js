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
          { label: "Sport", value: Array.isArray(player.game) ? player.game.join(", ") : player.game || "N/A", name: "sport" },
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
              { label: "Course", value: player.course || "N/A", name: "course", editable: true },
              { label: "Contact", value: player.contactNumber || "N/A", name: "contactNumber" },
              { label: "Address", value: player.permanentAddress || "N/A", name: "permanentAddress", className: "address-field" },
              { label: "Weight", value: player.weight ? `${player.weight} kg` : "N/A", name: "weight", type: "number" },
              { label: "Height", value: player.height ? `${player.height} cm` : "N/A", name: "height", type: "number" },
            ].map((field, idx) => (
              <div className={`profile-field ${field.className || ""}`} key={idx}>
                <span className="profile-label">{field.label}</span>
                {isEditing && field.name !== "sex" ? (
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
