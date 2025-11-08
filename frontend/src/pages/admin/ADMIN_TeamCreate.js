import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../../styles/ADMIN_TeamCreate.css";

const CreateTeam = () => {

  useEffect(() => {document.title = "SPARTA | Create Team";},[]);

  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [teamColor, setTeamColor] = useState("#000000");
  const [teamIcon, setTeamIcon] = useState(null);
  const { eventName } = useParams();
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const decodedEventName = decodeURIComponent(eventName);

  // Team Creation
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
        formData.append("teamIcon", teamIcon);
      }

      const response = await fetch("http://localhost:5000/api/team", {
        method: "POST",
        body: formData, 
      });

      const data = await response.json();

      if (response.ok) {
        alert("Team created!");
        setModalMessage("Team created successfully!");
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          navigate(-1);
        }, 3000);
      } else {
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error("Error creating team:", error);
      setModalMessage("Failed to create team.");
      setShowModal(true);
    }
  };

  // Fetch Coordinators
  useEffect(() => {
    const fetchCoordinators = async () => {
      const user = JSON.parse(localStorage.getItem("auth"));
      const institution = user?.institution;

      try {
        const res = await fetch(`http://localhost:5000/api/coordinators?institution=${institution}&event=${decodedEventName}`);
        const data = await res.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };
    fetchCoordinators();
  }, [decodedEventName]);

  // Selecting Coords
  const handleSelectCoordinator = (coord) => {
    if (!selectedCoordinators.some((c) => c._id === coord._id)) {
      setSelectedCoordinators((prev) => [...prev, coord]);
    }
    setSearch("");
  };

  // UnSelecting Coords
  const handleRemoveCoordinator = (id) => {
    setSelectedCoordinators((prev) => prev.filter((c) => c._id !== id));
  };

  const filteredCoordinators = coordinators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedCoordinators.some((sel) => sel._id === c._id)
  );

  const handleCancel = () => navigate(-1);

  return (
    <MainLayout>
      <>
        <div className="team-create-maindiv">
          <div className="team-form-header">
            <h2>Team Creation Form</h2>
          </div>

          <div style={{width: "inherit", padding: "10px 10px", borderLeft: "1px solid rgb(176, 176, 176)", borderRight: "1px solid rgb(176, 176, 176)", textAlign: "center", fontFamily: "Poppins, Sans-Serif"}}>
              <h4>Create a New Team for {decodedEventName}</h4>
              <p style={{margin: "5px 0", fontStyle: "italic", color: "#777"}}>Please fill out the form below to create a new team. Ensure all details are accurate before submission.</p>
          </div>

          <div className="team-form-container">
            
            <form className="team-form" onSubmit={handleCreate}>

              <div style={{ display: "flex", flexDirection: "row", gap: "50px", justifyContent: "space-evenly" }}>
                <div style={{ display: "flex", flexDirection: "column", width: "250px", margin: "5px", padding: "5px" }}>
                  <div className="input-group">
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Team Name</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="text"
                      value={teamManager}
                      onChange={(e) => setTeamManager(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Team Manager</label>
                  </div>

                  <div className="input-group">
                    <input
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      required
                      placeholder=" "
                    />
                    <label>Manager Email</label>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", width: "250px", margin: "5px", padding: "5px", textAlign: "center" }}>
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
                  <p style={{margin: "5px"}}> or you may upload the team logo</p>
                  <div className="file-upload">

                    <span className="file-name">
                      {teamIcon ? teamIcon.name : "No File Chosen"}
                    </span>
                    <label htmlFor="teamIconInput" className="upload-btn">Choose File</label>
                    <input
                      id="teamIconInput"
                      style={{ width: "250px", display: "none" }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setTeamIcon(e.target.files[0])}
                    />
                  </div>
                </div>
              </div>
              {/* Coordinators */}
              <div style={{ width: "90%", margin: "10px auto", paddingTop: "20px", borderTop: "1px solid #ccc" }}>
                <label>Assign Sub-Organizer/s</label>
                <div className="multi-select">
                  <input
                    style={{ width: "250px" }}
                    type="text"
                    placeholder="Enter Name or Select"
                    value={search}
                    onFocus={() => setShowDropdown(true)} 
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  {showDropdown &&
                    (filteredCoordinators.length > 0 || (!search && coordinators.length > 0)) && (
                      <ul className="dropdown">
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
                <button type="button" onClick={handleCancel}>Cancel</button>
                <button type="submit">Create Team</button>
            </div>

            </form>
          </div>
        </div>

        {showModal && (
          <div className="modal-backdrop">
            <div className="team-modal">
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </>
    </MainLayout>
  );
};

export default CreateTeam;
