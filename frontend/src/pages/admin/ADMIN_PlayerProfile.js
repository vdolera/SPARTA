import MainLayout from "../../components/MainLayout";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../styles/PlayerProfile.css";

const PlayerProfile = () => {
  //const user = JSON.parse(localStorage.getItem("auth"));
  const {playerId} = useParams();
  const [player, setPlayer] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("player");

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
            <input type="date" name="birthDate" value={player.birthDate ? player.birthDate.substring(0,10) : ""} onChange={handleChange} />
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
                  <img src={player.profilePicture || "default-pic.png"} alt="Profile" />
                  <p> <b>{player.playerName || "N/A"}</b> </p>
                </div>

              <div className="profile-details">
                {[
                  { label: "Team", value: player.team || "N/A" },
                  { label: "Sport", value: player.game || "N/A" },
                  { label: "Jersey Number", value: player.jerseyNumber || "N/A" },
                ].map((field, idx) => (
                  <div  className="profile-field" key={idx}>
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
                <button className={activeTab === "player" ? "active" : ""} onClick={() => setActiveTab("player")}> Player </button>
                <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}> History </button>
                <button className={activeTab === "documents" ? "active" : ""} onClick={() => setActiveTab("documents")}> Documents </button>
              </div>
              {/* Tab content rendering */}
              {activeTab === "player" && (
                <div>
                  <p><b>Contact:</b> {player.contactNumber || "N/A"}</p>
                  <p><b>Address:</b> {player.permanentAddress || "N/A"}</p>
                  <p><b>Birth Date:</b> {player.birthDate ? player.birthDate.substring(0,10) : "N/A"}</p>
                  <p><b>Age:</b> {player.age || "N/A"}</p>
                  <p><b>Weight:</b> {player.weight ? `${player.weight} kg` : "N/A"}</p>
                  <p><b>Height:</b> {player.height ? `${player.height} cm` : "N/A"}</p>
                  <p><b>Sex:</b> {player.sex || "N/A"}</p>
                </div>
              )}
              {activeTab === "history" && (
                <div>
                  {/* History tab content goes here */}
                  <p>History content...</p>
                </div>
              )}
              {activeTab === "documents" && (
                <div>
                  {/* Documents tab content goes here */}
                  <p>Documents content...</p>
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
