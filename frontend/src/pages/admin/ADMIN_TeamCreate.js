import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/ADMIN_TeamCreate.css";

const CreateTeam = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [teamColor, setTeamColor] = useState("");
  const [teamIcon, setTeamIcon] = useState(null);
  const { eventName } = useParams();
  const decodedEventName = decodeURIComponent(eventName);

  const handleCreate = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("auth"));
    const institution = user?.institution;

    if (!institution) {
      alert("Institution missing from user data.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("teamName", teamName);
      formData.append("teamManager", teamManager);
      formData.append("managerEmail", managerEmail);
      formData.append("institution", institution);
      formData.append("teamColor", teamColor);
      formData.append("eventName", decodedEventName);
      if (teamIcon) {
        formData.append("teamIcon", teamIcon); // ✅ add file
      }

      const response = await fetch("http://localhost:5000/api/team", {
        method: "POST",
        body: formData, // ✅ send formData instead of JSON
      });

      const data = await response.json();

      if (response.ok) {
        alert("Team created!");
        navigate(-1);
      } else {
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      alert("Failed to create team.");
    }
  };

  return (
    <MainLayout>
      <div className="team-create-maindiv">
        <div className="team-form-header">
          <h2>Team Creation Form</h2>
        </div>

        <div className="team-form-container">
          <form className="team-form" onSubmit={handleCreate}>
            <div>
              <label>Team Name:
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  required
                />
              </label>
            </div>

            <div>
              <label>Team Manager:
                <input
                  type="text"
                  value={teamManager}
                  onChange={(e) => setTeamManager(e.target.value)}
                  required
                />
              </label>
            </div>

            <div>
              <label>Manager Email:
                <input
                  type="email"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  required
                />
              </label>
            </div>

            <div>
              <label className="color-picker">
                Team Color:
                <input
                  type="color"
                  value={teamColor}
                  onChange={(e) => setTeamColor(e.target.value)}
                  required
                />
              </label>
            </div>

            <div>
              <label>Team Icon:
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTeamIcon(e.target.files[0])}
                />
              </label>
            </div>

            <button type="submit">Create Team</button>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateTeam;
