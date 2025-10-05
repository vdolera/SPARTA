import MainLayout from "../../components/MainLayout";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import '../../styles/ADMIN_GameCreate.css'

const CreateGame = () => {
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

  const navigate = useNavigate();
  const { eventName } = useParams();
  const decodedEventName = decodeURIComponent(eventName);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("auth"));
    if (!user?.institution) return;

    fetch(
      `http://localhost:5000/api/teams?institution=${encodeURIComponent(
        user.institution
      )}&event=${encodeURIComponent(decodedEventName)}`
    )
      .then((res) => res.json())
      .then((data) => setAvailableTeams(data))
      .catch((err) => console.error("Error fetching teams:", err));
  }, [decodedEventName]);

  const toggleTeamSelection = (teamName) => {
    setSelectedTeams((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName]
    );
  };

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
        formData.append("rulesFile", rulesFile);  // file key
      }
      formData.append("rulesText", rulesText);    // text key
      


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
        }, 4000); // Auto-close after 1.5s and go back
      } else {
        setModalMessage("Failed! " + data.message);
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage("Failed to create game.");
      setShowModal(true);
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

  //Referee
  const handleAddReferee = () => {
    if (refereeInput.trim() && !referees.includes(refereeInput.trim())) {
      setReferees((prev) => [...prev, refereeInput.trim()]);
      setRefereeInput("");
    }
  };

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
                      />
                    </label>

                    <label className="game-label">
                      Game End Date:
                      <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </label>
                  </div>

                  {/* Participating Teams */}
                  <div>
                    <h4>PARTICIPATING TEAMS</h4>
                    <div className="team-selection">
                      {availableTeams.length === 0 ? (
                        <p>No teams available for this event.</p>
                      ) : (
                        availableTeams.map((team) => (
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
                            }}
                          >
                            {team.teamName}
                          </button>
                        ))
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
                      style={{ margin: "5px" }}
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
              <p>{modalMessage}</p>
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        )}
      </>
    </MainLayout>
  );
};

export default CreateGame;
