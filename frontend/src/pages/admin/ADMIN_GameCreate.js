import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../../styles/ADMIN_GameCreate.css'

const CreateGame = () => {

  useEffect(() => { document.title = "SPARTA | Create Game"; }, []);

  const [gameType, setGameType] = useState("Basketball");
  const [category, setCategory] = useState("Men");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bracketType, setBracketType] = useState("Single Elimination");
  const [rulesText, setRulesText] = useState("");
  const [rulesFile, setRulesFile] = useState(null);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [referees, setReferees] = useState([]);
  const [refereeInput, setRefereeInput] = useState("");
  const [selectedCoordinators, setSelectedCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [eventDetails, setEventDetails] = useState(null);

  const navigate = useNavigate();
  const { eventName } = useParams();
  const decodedEventName = decodeURIComponent(eventName);

  const user = JSON.parse(localStorage.getItem("auth"));

  // Date format reader thingy
  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return ""; 
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      return localDate.toISOString().slice(0, 16); 
    } catch (e) {
      return "";
    }
  };

  const eventStartFormatted = formatDateTimeLocal(eventDetails?.eventStartDate);
  const eventEndFormatted = formatDateTimeLocal(eventDetails?.eventEndDate);


  // Fetch Event Details (for date validation) 
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!user?.institution || !decodedEventName) return;
      try {
        const response = await fetch(`http://localhost:5000/api/events?institution=${encodeURIComponent(user.institution)}&name=${encodeURIComponent(decodedEventName)}`);
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || "Event not found");
        }
        
        const data = await response.json();
        setEventDetails(data);

      } catch (error) {
        console.error("Error fetching event details:", error);
        setModalMessage(`Error fetching event details: ${error.message}. Cannot validate game dates.`);
        setShowModal(true);
      }
    };

    fetchEventDetails();
  }, [user?.institution, decodedEventName]);

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/teams?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedEventName)}`);
        const data = await response.json();
        setAvailableTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (user?.institution && decodedEventName) {
      fetchTeams();
    }
  }, [user?.institution, decodedEventName]);

  // Team select
  const toggleTeamSelection = (teamName) => {
    setSelectedTeams((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName]
    );
  };

  // Game Creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("auth"));

    if (selectedTeams.length < 2) {
      setModalMessage("You must select at least 2 teams to create a bracket.");
      setShowModal(true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("institution", user.institution);
      formData.append("gameType", gameType);
      formData.append("category", category);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("bracketType", bracketType);
      formData.append("eventName", decodedEventName);
      formData.append("teams", JSON.stringify(selectedTeams));
      formData.append("coordinators", JSON.stringify(selectedCoordinators));
      formData.append("referees", JSON.stringify(referees));

      if (rulesFile) {
        formData.append("rulesFile", rulesFile);
      }
      formData.append("rulesText", rulesText);

      const response = await fetch("http://localhost:5000/api/games", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setModalMessage("Game created successfully!");
        setShowModal(true);
        setTimeout(() => {
          setShowModal(false);
          navigate(-1);
        }, 4000);
      } else {
        setModalMessage("Failed! " + data.message);
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage("Failed to create game.");
      setShowModal(true);
    }
  };

  // Fetch Coords
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/coordinators?institution=${user?.institution}&event=${decodedEventName}`);
        const data = await res.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };
    fetchCoordinators();
  }, [user?.institution, decodedEventName]);

  // Add coords
  const handleSelectCoordinator = (coord) => {
    if (!selectedCoordinators.some((c) => c._id === coord._id)) {
      setSelectedCoordinators((prev) => [...prev, coord]);
    }
    setSearch("");
  };

  // Remove coord
  const handleRemoveCoordinator = (id) => {
    setSelectedCoordinators((prev) => prev.filter((c) => c._id !== id));
  };

  const filteredCoordinators = coordinators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedCoordinators.some((sel) => sel._id === c._id)
  );

  // Add Referee
  const handleAddReferee = () => {
    if (refereeInput.trim() && !referees.includes(refereeInput.trim())) {
      setReferees((prev) => [...prev, refereeInput.trim()]);
      setRefereeInput("");
    }
  };

  // Remove referee
  const handleRemoveReferee = (name) => {
    setReferees((prev) => prev.filter((r) => r !== name));
  };

  return (
    <MainLayout>
      <>
        <div className="game-container">
          <div className="game-create-maindiv">

            <div className="game-form-header">
              <h1>Game Details</h1>
            </div>

            <div className="game-form-container">

              <form className="game-forms" onSubmit={handleSubmit}>

                {/* Game Type */}

                <div className="game-details">

                  <div>
                    <h4>GAME DETAILS</h4>

                    <label className="game-label">
                      Game Type:
                      <select value={gameType} onChange={(e) => setGameType(e.target.value)} required >

                        <option value="Basketball">Basketball</option>
                        <option value="Volleyball">Volleyball</option>
                        <option value="Soccer">Soccer</option>
                        <option value="Futsal">Futsal</option>
                        <option value="Badminton">Badminton</option>
                        <option value="Badminton">Baseball</option>
                        <option value="Baseball">Softball</option>
                        <option value="Table Tennis">Table Tennis</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Chess">Chess</option>

                      </select>
                    </label>

                    {/* Game Category */}
                    <label className="game-label">
                      Category:
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </label>

                    {/* Game Duration */}
                    <label className="game-label">
                      Game Start Date:
                      <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                        min={eventStartFormatted}
                        max={eventEndFormatted}
                        disabled={!eventDetails} 
                      />
                    </label>

                    <label className="game-label">
                      Game End Date:
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        min={startDate || eventStartFormatted} 
                        max={eventEndFormatted}
                        disabled={!eventDetails} 
                      />
                    </label>
                    {!eventDetails && <p style={{color: 'red', fontSize: '0.8em'}}>Loading event dates...</p>}
                  </div>

                  {/* Participating Teams */}
                  <div>
                    <h4>PARTICIPATING TEAMS</h4>
                    <div className="team-selection">
                      {availableTeams.length === 0 ? (
                        <p>No teams available for this event.</p>
                      ) : (
                        <>
                          {/* Toggle Select All */}
                          <button type="button" 
                            onClick={() => {
                              const allSelected = selectedTeams.length === availableTeams.length;
                              setSelectedTeams(
                                allSelected ? [] : availableTeams.map((t) => t.teamName)
                              );
                            }}
                            style={{
                              margin: "5px 0 5px",
                              padding: "5px 10px",
                              backgroundColor:
                                selectedTeams.length === availableTeams.length
                                  ? "#b95454ff" 
                                  : "#18593cff", 
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              
                              transition: "background-color 0.2s ease",
                            }}
                          >
                            {selectedTeams.length === availableTeams.length
                              ? "Unselect All"
                              : "Select All"}
                          </button>

                          {/* Individual team select list */}
                          <div className="team-buttons" style={{ marginTop: "10px" }}>
                            {availableTeams.map((team) => (
                              <button
                                key={team._id}
                                type="button"
                                onClick={() => toggleTeamSelection(team.teamName)}
                                style={{
                                  margin: "5px",
                                  padding: "8px 12px",
                                  backgroundColor: selectedTeams.includes(team.teamName)
                                    ? "#181b59"
                                    : "#ccc",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "5px",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s ease",
                                }}
                              >
                                {team.teamName}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bracket Type */}
                  <div>
                    <h4>BRACKETING TYPE</h4>
                    <label>Please choose one type of bracketing</label>
                    <div className="bracket-selection">
                      {[
                        "Single Elimination",
                        "Double Elimination",
                        "Round Robin"
                      ].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBracketType(type)}
                          style={{
                            margin: "5px",
                            padding: "8px 12px",
                            backgroundColor: bracketType === type ? "#181b59" : "#ccc",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              
              <div>
                {/* Add Coordinator */}
                <div className="game-organizers">
                  <h4>SUB-ORGANIZERS</h4>
                  <div className="game-org-field">
                    <label>Assign Sub-Organizer/s for this game</label>
                    <input
                      type="text"
                      placeholder="Enter Name or Select"
                      value={search}
                      onFocus={() => setShowDropdown(true)}   // show on click/focus
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

                  {/* Referee */}
                  <h4>Referee Name</h4>
                  <div className="game-ref-field">
                    <input
                      type="text"
                      placeholder="Type referee name and press Add"
                      style={{ margin: "5px", width: "60%" }}
                      value={refereeInput}
                      onChange={(e) => setRefereeInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" ? (e.preventDefault(), handleAddReferee()) : null}
                    />
                    <button type="button" onClick={handleAddReferee}>+ Add</button>
                  </div>

                  <div className="selected-tags">
                    {referees.map((name, idx) => (
                      <span key={idx} className="tag">
                        {name}
                        <button type="button" onClick={() => handleRemoveReferee(name)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="game-reqs-rules">
                  <h4>RULES</h4>
                  <div className="game-rules">
                    <textarea
                      value={rulesText}
                      onChange={(e) => setRulesText(e.target.value)}
                      placeholder="Enter rules (if not uploading file)"
                      rows={5}
                    />

                    <div className="file-upload">
                      <input
                        id="rulesFile"
                        name="rulesFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setRulesFile(e.target.files[0])}
                        style={{ display: "none" }}
                      />

                      <span className="file-name">
                        {rulesFile ? rulesFile.name : "No file chosen"}
                      </span>

                      <label htmlFor="rulesFile" className="upload-btn">
                        Choose File
                      </label>
                    </div>
                  </div>
                </div>
              </div>      
            </form>
            
          </div>

            <div className="lower-buttons">
              <button type="button" onClick={() => navigate(-1)}>Cancel</button>
              <button type="submit" onClick={handleSubmit}>Create Game</button>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-backdrop">
            <div className="game-modal">
              <p style={{ color: '#333', fontSize: '14px', textTransform: 'capitalize' }}>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </>
    </MainLayout>
  );
};

export default CreateGame;
