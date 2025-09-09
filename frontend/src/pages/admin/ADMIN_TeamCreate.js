import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
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
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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
      formData.append("coordinators", JSON.stringify(selectedCoordinators));
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

  useEffect(() => {
    const fetchCoordinators = async () => {
      const user = JSON.parse(localStorage.getItem("auth"));
      const institution = user?.institution;

      try {
        const res = await fetch(
          `http://localhost:5000/api/coordinators?institution=${institution}&event=${decodedEventName}`
        );
        const data = await res.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };

    fetchCoordinators();
  }, [decodedEventName]);

  const handleSelectCoordinator = (coord) => {
    if (!selectedCoordinators.some((c) => c._id === coord._id)) {
      setSelectedCoordinators((prev) => [...prev, coord]);
    }
    setSearch("");
  };

  const handleRemoveCoordinator = (id) => {
    setSelectedCoordinators((prev) => prev.filter((c) => c._id !== id));
  };

  const filteredCoordinators = coordinators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedCoordinators.some((sel) => sel._id === c._id)
  );

  const handleCancel = () => navigate (-1);

  return (
    <MainLayout>
      <div className="team-create-maindiv">
        <div className="team-form-header">
          <h2>Team Creation Form</h2>
        </div>

        <div className="team-form-container">
          <form className="team-form" onSubmit={handleCreate}>

          <div style={{display:"flex", flexDirection:"row", gap:"5px"}}>
              <div style={{display:"flex", flexDirection:"column", width:"250px", margin:"5px", padding:"5px", border:"2px solid green"}}>
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
              </div>

              <div style={{display:"flex", flexDirection:"column", width:"250px", margin:"5px", padding:"5px", border:"2px solid green"}}>
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
                      style={{width:"250px"}}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTeamIcon(e.target.files[0])}
                    />
                  </label>
                </div>
              </div>
            </div>
            {/* Coordinators */}
            <div style={{width:"500px", margin:"5px", padding:"5px", border:"2px solid green"}}>
              <label>Assign Sub-Organizer/s</label>
              <div className="multi-select">
                <input
                  style={{width:"250px"}}
                  type="text"
                  placeholder="Enter Name or Select"
                  value={search}
                  onFocus={() => setShowDropdown(true)}   // show on click/focus
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {showDropdown &&
                  (filteredCoordinators.length > 0 || (!search && coordinators.length > 0)) && (
                    <ul className="dropdown" style={{listStyle: "none", paddingLeft: "0"}}>
                      {(search ? filteredCoordinators : coordinators.filter(
                        (c) => !selectedCoordinators.some((sel) => sel._id === c._id)
                      )).map((c) => (
                        <li
                          key={c._id}
                          onClick={() => handleSelectCoordinator(c)}
                        >
                          {c.name} ({c.role})
                        </li>
                      ))}
                    </ul>
                  )}
              </div>

              <div className="selected-tags">
                {selectedCoordinators.map((c) => (
                  <span key={c._id} className="tag">
                    {c.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCoordinator(c._id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

          <div className="lower-buttons">
            <button type="submit">Create Team</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
          </div>
            
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateTeam;
