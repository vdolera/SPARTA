import PlayerMainLayout from "../../components/P_MainLayout";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PlayerProfile.css";

const PlayerUserProfile = () => {

  useEffect(() => {document.title = "SPARTA | Player Profile";},[]);

  const {userId} = useParams();
  const [player, setPlayer] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("player");
  const [showToast, setShowToast] = useState(false);
  const [medicalFormat, setMedicalFormat] = useState("paragraph");
  const [history, setHistory] = useState([]);

  const [previewSrc, setPreviewSrc] = useState(null);
  
  // Fetch user details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/players/${userId}`);
        const data = await res.json();
        setPlayer(data);
        // Set initial preview to existing profile pic
        setPreviewSrc(data.profilePic || data.profilePicture || "/default-pfp.jpg"); 
      } catch (err) {
        console.error("Error fetching player profile:", err);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleChange = (e) => {
    setPlayer({ ...player, [e.target.name]: e.target.value });
  };

  // Edit & Save (JSON Version - No Image Upload)
  const handleSave = async () => {
    try {
      // 1. Create a simple object (NOT FormData)
      const updateData = {
        team: player.team,
        jerseyNumber: player.jerseyNumber,
        birthDate: player.birthDate,
        age: player.age,
        sex: player.sex,
        course: player.course,
        contactNumber: player.contactNumber,
        permanentAddress: player.permanentAddress,
        weight: player.weight,
        height: player.height,
        medicalHistory: player.medicalHistory
        // Note: We do NOT send profilePic here
      };

      const res = await fetch(`http://localhost:5000/api/players/${userId}/profile`, {
        method: "PUT",
        // 2. Set Header to JSON
        headers: { "Content-Type": "application/json" },
        // 3. Send stringified object
        body: JSON.stringify(updateData), 
      });

      if (res.ok) {
        const updated = await res.json();
        setPlayer(updated);
        setIsEditing(false);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!player.email) return;
      try {
        const res = await fetch(`http://localhost:5000/api/players/history?email=${encodeURIComponent(player.email)}`);
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    fetchHistory();
  }, [player.email]);

  return (
    <PlayerMainLayout>
      <div className="player-profile-container">

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="btn save-btn" onClick={handleSave}>Save</button>
              <button className="btn cancel-btn" onClick={() => {
                setIsEditing(false);
              }}>Cancel</button>
            </>
          ) : (
            <button className="btn edit-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </div>    

        <div className="profile-view">
          {/* Left card */}
          <div className="player-main-card">
          
            {/* Profile Picture Section */}
            <div className="profile-pic" style={{ position: 'relative' }}>
              <img
                src={previewSrc}
                alt="Profile"
                onError={(e) => { e.target.src = "/default-pfp.jpg"; }}
              />
              
              {/* Overlay Icon or Text for Edit Mode */}
  

              {/* Hidden File Input */}
        
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

            {/* Right card (Other Info) - Kept exactly the same */}
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
                  { label: "Contact", value: player.contactNumber || "N/A", name: "contactNumber", type: "number" },
                  { label: "Address", value: player.permanentAddress || "N/A", name: "permanentAddress", className: "address-field" },
                  { label: "Weight (kg)", value: player.weight || "N/A", name: "weight", type: "number" },
                  { label: "Height (ft.)", value: player.height || "N/A", name: "height", type: "number" },
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

               {/* Medical History Field */}
               <div className="profile-field medical-history-field">
                 <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                   <span className="profile-label">Medical History</span>
                   {!isEditing && player.medicalHistory && (
                     <button
                       className="format-toggle-btn"
                       onClick={() => setMedicalFormat(medicalFormat === "paragraph" ? "bullet" : "paragraph")}
                       title="Toggle format"
                     >
                       {medicalFormat === "paragraph" ? "☐ Bullet" : "¶ Paragraph"}
                     </button>
                   )}
                 </div>
                 {isEditing ? (
                   <textarea
                     name="medicalHistory"
                     value={player.medicalHistory || ""}
                     onChange={handleChange}
                     className="profile-textarea"
                     placeholder="Enter medical history (one item per line for bullet format)"
                     rows={5}
                   />
                 ) : player.medicalHistory ? (
                   medicalFormat === "paragraph" ? (
                     <div className="profile-value-rect medical-paragraph">{player.medicalHistory}</div>
                   ) : (
                     <div className="profile-value-rect medical-bullets">
                       <ul>
                         {player.medicalHistory.split("\n").filter(line => line.trim()).map((item, i) => (
                           <li key={i}>{item.trim()}</li>
                         ))}
                       </ul>
                     </div>
                   )
                 ) : (
                   <div className="profile-value-rect">N/A</div>
                 )}
               </div>
              </div>
            )}

{activeTab === "history" && (
              <div className="documents-section">
                {history.length > 0 ? (
                  <div className="table-container">
                    <table className="documents-table">
                      <thead>
                        <tr>
                          <th>Event Name</th>
                          <th>Team</th>
                          <th>Game(s) Played</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((record, idx) => (
                          <tr key={idx} className="document-row">
                            <td className="requirement-name">{record.eventName}</td>
                            <td>{record.team}</td>
                            <td>{Array.isArray(record.game) ? record.game.join(", ") : record.game}</td>
                            <td className="file-link">
                                {new Date(record.archivedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{padding: '20px', textAlign: 'center', color: '#666'}}>No past event history found for this player.</p>
                )}
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
                             href={req.filePath}
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

      {showToast && (
        <div className="profile-toast" role="status" aria-live="polite">
          Profile Updated
        </div>
      )}
      </div>
    </PlayerMainLayout>
  );
};

export default PlayerUserProfile;