import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "../../styles/ADMIN_Teams.css";
import { VscSearchStop } from "react-icons/vsc";
import { MoreVertical } from "lucide-react";
import { FaFileImport } from "react-icons/fa";

const Teams = () => {

  useEffect(() => {document.title = "SPARTA | " + decodedName + " Teams";},[]);

  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); 
  const [editTeam, setEditTeam] = useState(null); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTeam, setInfoTeam] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("auth"));

  const [coordinators, setCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [gamesExist, setGamesExist] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);

  // --- IMPORT STATE ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedImportEvent, setSelectedImportEvent] = useState("");
  const [pastTeams, setPastTeams] = useState([]);
  const [selectedTeamsToCopy, setSelectedTeamsToCopy] = useState([]);
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);

  // Fetch Events (Current Event Details AND Past Events for Import)
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        // 1. Fetch Active Events (To find the current event details)
        const activeRes = await fetch(`http://localhost:5000/api/events?institution=${user?.institution}`);
        const activeData = await activeRes.json();

        if (Array.isArray(activeData)) {
          const found = activeData.find(e => e.eventName === decodedName);
          if (found) setEventDetails(found);
        }

        // 2. Fetch PAST Events (Specifically for the Import Dropdown)
        // We use your existing /past-events route here
        const pastRes = await fetch(`http://localhost:5000/api/past-events?institution=${user?.institution}`);
        const pastData = await pastRes.json();

        if (Array.isArray(pastData)) {
          // Sort them by newest first so it's easier to find recent events
          const sortedPast = pastData.sort((a, b) => new Date(b.eventEndDate) - new Date(a.eventEndDate));
          setAllEvents(sortedPast);
        }

      } catch (err) {
        console.error("Error fetching event data:", err);
      }
    };

    if (user?.institution && decodedName) {
      fetchEventData();
    }
  }, [user?.institution, decodedName]);

  // Fetch Coords
  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/coordinators?institution=${user?.institution}&event=${decodedName}`);
        const data = await res.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };
    fetchCoordinators();
  }, [user?.institution, decodedName]);


  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoordinators = coordinators.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const alreadySelected = !!editTeam?.coordinators?.some((sel) =>
      typeof sel === "string" ? sel === c._id : sel?._id === c._id
    );
    return matchesSearch && !alreadySelected;
  });

 // Fetch teams
 const fetchTeams = async () => {
    if (!eventDetails?._id) return; 
    try {
      const response = await fetch(`http://localhost:5000/api/teams?institution=${encodeURIComponent(user?.institution)}&event=${eventDetails._id}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setTeams(data);
      } else {
        setTeams([]); 
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]); 
    }
  };

 useEffect(() => {
  fetchTeams();
}, [user?.institution, eventDetails]);

// Fetch Games
useEffect(() => {
  const fetchGames = async () => {
    if (!eventDetails?._id) return;
    try {
      const response = await fetch(
        `http://localhost:5000/api/games?institution=${encodeURIComponent(user?.institution)}&eventId=${eventDetails._id}`
      );
      const games = await response.json();
      if (Array.isArray(games) && games.length > 0) {
        setGamesExist(true);
      } else {
        setGamesExist(false); 
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      setGamesExist(false); 
    }
  };
  fetchGames();
}, [user?.institution, eventDetails]);

  // --- IMPORT LOGIC ---
  const handleSelectImportEvent = async (e) => {
    const eventId = e.target.value;
    setSelectedImportEvent(eventId);
    setSelectedTeamsToCopy([]);
    setIsEventDropdownOpen(false);
    
    if(!eventId) {
        setPastTeams([]);
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/teams?institution=${encodeURIComponent(user?.institution)}&event=${eventId}`);
        const data = await res.json();
        if(Array.isArray(data)) setPastTeams(data);
    } catch(err) {
        console.error(err);
    }
  };

  const handleEventSelection = (eventId, eventName) => {
    setSelectedImportEvent(eventId);
    setSelectedTeamsToCopy([]);
    setIsEventDropdownOpen(false);
    
    if(!eventId) {
        setPastTeams([]);
        return;
    }

    try {
        const res = fetch(`http://localhost:5000/api/teams?institution=${encodeURIComponent(user?.institution)}&event=${eventId}`);
        res.then(response => response.json()).then(data => {
            if(Array.isArray(data)) setPastTeams(data);
        });
    } catch(err) {
        console.error(err);
    }
  };

  const toggleImportSelection = (team) => {
    if (selectedTeamsToCopy.find(t => t._id === team._id)) {
        setSelectedTeamsToCopy(prev => prev.filter(t => t._id !== team._id));
    } else {
        setSelectedTeamsToCopy(prev => [...prev, team]);
    }
  };

  const submitImportTeams = async () => {
     if(selectedTeamsToCopy.length === 0) return;

     let successCount = 0;
     
     for (const team of selectedTeamsToCopy) {
        const formData = new FormData();
        formData.append("institution", user.institution);
        formData.append("eventId", eventDetails._id); // Assign to CURRENT event
        formData.append("teamName", team.teamName);
        formData.append("teamManager", team.teamManager || "");
        formData.append("managerEmail", team.managerEmail || "");
        formData.append("teamColor", team.teamColor || "#A96B24");
        // We do not copy coordinators/players to avoid ID conflicts, just the team shell
        // If team icon exists (URL), we might need logic to handle it, skipping for now or passing URL if backend supports
        
        try {
            const res = await fetch("http://localhost:5000/api/team", {
                method: "POST",
                body: formData
            });
            if(res.ok) successCount++;
        } catch(err) {
            console.error("Failed to copy team", team.teamName);
        }
     }

     setToastMessage(`Successfully imported ${successCount} teams.`);
     setToastType("success");
     setShowToast(true);
     setShowImportModal(false);
     fetchTeams(); // Refresh list
     setTimeout(() => setShowToast(false), 3000);
  };


  // Create team button nav
  const handleAddTeam = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addteam`, { 
      state: { id: eventDetails._id } 
    });
  };

  // Selected Team button nav
  const handleSelectTeam = (teamName) => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/team/${encodeURIComponent(teamName)}/players`);
  };

  // Delete team (open confirmation)
  const handleDelete = (team) => {
    setTeamToDelete(team);
    setShowDeleteModal(true);
  };

  const handleShowInfo = (team) => {
    setInfoTeam(team);
    setShowInfoModal(true);
  };
  
  // Confirm delete
  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      const res = await fetch(`http://localhost:5000/api/team/${teamToDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setTeams((prev) => prev.filter((t) => t._id !== teamToDelete._id));
      setToastType("success");
      setToastMessage("Team has been deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      setToastType("error");
      setToastMessage("Failed to delete team");
    } finally {
      setShowDeleteModal(false);
      setTeamToDelete(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 7000);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTeamToDelete(null);
  };

  // Edit team deatails
  const handleEditSave = async () => {
    try {
      const formData = new FormData();
      formData.append("teamName", editTeam.teamName);
      formData.append("teamManager", editTeam.teamManager || "");
      formData.append("managerEmail", editTeam.managerEmail || "");
      formData.append("teamColor", editTeam.teamColor || "");
      formData.append("coordinators", JSON.stringify(editTeam.coordinators || []));
  
      if (editTeam.newIcon) {
        formData.append("teamIcon", editTeam.newIcon);
      }
  
      const res = await fetch(`http://localhost:5000/api/team/${editTeam._id}`, {
        method: "PUT",
        body: formData,
      });
  
      if (!res.ok) {
        throw new Error("Failed to update team");
      }
      const { team: updatedTeam } = await res.json(); 
      setTeams(teams.map((t) => (t._id === updatedTeam._id ? updatedTeam : t)));
      setEditTeam(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
  
  return (
    <MainLayout>
      <div className="teams-main-container">
        <div className="teams-header-row">

          <div>
            <h3> TEAMS FOR {decodedName}</h3>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
            <input
              type="text"
              className="team-search-bar"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginRight: "16px" }}
            />
            {(user.role === "admin" || user.role === "co-organizer") && (
             <div style={{display:'flex', gap:'10px'}}>
                <button 
                    className="new-team-btn" 
                    style={{backgroundColor: "#b95454", width: "auto", padding: "0 15px"}}
                    onClick={() => setShowImportModal(true)} 
                    disabled={gamesExist}
                >
                    <FaFileImport style={{marginRight: "5px"}}/> Import Teams
                </button>
                <button className="new-team-btn" onClick={handleAddTeam} disabled={gamesExist} title={gamesExist ? "Games are in progress. New teams cannot be added." : "Add a new team"}>
                + New Team
                </button>
             </div>
            )}
          </div>

        </div>

        <div className="teams-event">
          {filteredTeams.length === 0 ? (
            <div className="no-teams-found">
              <VscSearchStop size={48} />
              <p>No teams found.</p>
            </div>
          ) : (
            <ul className="team-list">
              {filteredTeams.map((team) => (
                <li key={team._id} className="team-item">
                  <div className="team-card">
                    <button
                      className="team-btn"
                      onClick={() => handleSelectTeam(team.teamName)}
                      style={{
                        backgroundColor: team.teamColor || "#A96B24",
                        backgroundImage: team.teamIcon
                          ? `url(${team.teamIcon})`
                          : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        color: "#fff",
                      }}
                    >
                      <span className="team-name-overlay">{team.teamName}</span>
                    </button>

                    {/* Menu button */}
                    <div
                      className="team-menu-container"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical
                        className="team-menu-icon"
                        onClick={() =>
                          setMenuOpen(menuOpen === team._id ? null : team._id)
                        }
                      />
                      {menuOpen === team._id && (
                        <div className="menu-dropdown">
                          <button className="dropdown-item" onClick={() => handleShowInfo(team)}>
                            Info
                          </button>
                          
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              const normalizedCoordinators = (team.coordinators || []).map((coord) =>
                                typeof coord === "string"
                                  ? coordinators.find((c) => c._id === coord) || { _id: coord, name: coord }
                                  : coord
                              );
                              setEditTeam({ ...team, coordinators: normalizedCoordinators });
                            }}
                          >
                            Edit
                          </button>
                          
                          <button className="dropdown-item delete" onClick={() => handleDelete(team)}>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
            <div className="modal" style={{maxWidth: "500px", width: "90%"}}>
                <h2>Import Teams from Past Event</h2>
                <hr />
                <div className="import-modal-content">
                    <label>Select Event:</label>
                    <div className="custom-dropdown">
                        <div 
                            className="dropdown-trigger"
                            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                        >
                            <span className="selected-text">
                                {selectedImportEvent 
                                    ? allEvents.find(evt => evt._id === selectedImportEvent)?.eventName || "-- Select an Event --"
                                    : "-- Select an Event --"
                                }
                            </span>
                            <span className={`dropdown-arrow ${isEventDropdownOpen ? 'open' : ''}`}>
                                ▼
                            </span>
                        </div>
                        {isEventDropdownOpen && (
                            <div className="dropdown-list">
                                <div 
                                    className="dropdown-item"
                                    onClick={() => handleEventSelection("", "")}
                                >
                                    -- Select an Event --
                                </div>
                                {allEvents.map(evt => (
                                    <div 
                                        key={evt._id} 
                                        className="dropdown-item"
                                        onClick={() => handleEventSelection(evt._id, evt.eventName)}
                                    >
                                        {evt.eventName}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedImportEvent && (
                    <div className="import-teams-list">
                        {pastTeams.length === 0 ? (
                            <p>No teams found in selected event.</p>
                        ) : (
                            <>
                                <div className="select-teams-header">Select Teams to Copy:</div>
                                {pastTeams.map(team => (
                                    <div key={team._id} className="team-selection-item">
                                        <input 
                                            type="checkbox" 
                                            checked={!!selectedTeamsToCopy.find(t => t._id === team._id)}
                                            onChange={() => toggleImportSelection(team)}
                                        />
                                        <div 
                                            className="team-color-indicator"
                                            style={{ backgroundColor: team.teamColor || "#ccc" }}
                                        ></div>
                                        <span className="team-name-text">{team.teamName}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                <div className="modal-actions">
                    <button onClick={() => setShowImportModal(false)}>Cancel</button>
                    <button onClick={submitImportTeams} disabled={selectedTeamsToCopy.length === 0}>Import Selected</button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeam && (
        <div className="modal-overlay">
          <div className="team-edit-modal">
            {/* ... [Rest of Edit Modal Code remains same] ... */}
             <h2 style={{paddingBottom: "10px", textAlign: "center"}}>EDIT TEAM</h2>
            <form
              className="team-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              <div className="teamedit-form-group">
                <label>Team Name: <input type="text" value={editTeam.teamName} onChange={(e) => setEditTeam({ ...editTeam, teamName: e.target.value })} required /></label>
              </div>
              <div className="teamedit-form-group">
                <label>Team Manager: <input type="text" value={editTeam.teamManager || ""} onChange={(e) => setEditTeam({ ...editTeam, teamManager: e.target.value })} /></label>
              </div>
              <div className="teamedit-form-group">
                <label>Manager Email: <input type="email" value={editTeam.managerEmail || ""} onChange={(e) => setEditTeam({ ...editTeam, managerEmail: e.target.value })} /></label>
              </div>
              <div className="teamedit-form-group">
                <label style={{fontFamily: "Montserrat, sans-serif", fontSize: "14px", color: "black"}} className="color-picker">
                  Team Color: <input type="color" value={editTeam.teamColor || "#A96B24"} onChange={(e) => setEditTeam({ ...editTeam, teamColor: e.target.value })} />
                </label>
              </div>
              <label style={{fontWeight: "600"}}> Team Icon: </label>
                <div className="file-upload" style={{width: "80%", margin: "5px auto"}}>
                  <input id="file-upload" name="file-upload" type="file" accept="image/*" style={{display: "none"}} onChange={(e) => setEditTeam({ ...editTeam, newIcon: e.target.files[0] })} />
                  <label htmlFor="file-upload" className="upload-btn">Upload Attachment</label>
                </div>
              {/* Sub-organizers (kept same) */}
              <div className="teamedit-form-group" style={{ marginTop: "20px" }}>
                 {/* ... Existing logic for coords ... */}
                 <div>
                  <label>Assign Sub-Organizer/s</label>
                  <div className="multi-select">
                    <input type="text" placeholder="Enter Name or Select" value={search} onFocus={() => setShowDropdown(true)} onBlur={() => setTimeout(() => setShowDropdown(false), 150)} onChange={(e) => setSearch(e.target.value)} />
                    {showDropdown && (filteredCoordinators.length > 0 || (!search && coordinators.length > 0)) && (
                        <ul className="dropdown">
                          {(search ? filteredCoordinators : coordinators.filter((c) => !editTeam.coordinators?.some((sel) => sel._id === c._id))).map((c) => (
                            <li key={c._id} onClick={() => setEditTeam({...editTeam, coordinators: [...(editTeam.coordinators || []), c],})}>{c.name} ({c.role})</li>
                          ))}
                        </ul>
                      )}
                  </div>
                <div className="selected-tags">
                  {editTeam.coordinators?.map((c) => {
                    const id = typeof c === "string" ? c : c?._id;
                    const label = (typeof c === "string" ? (coordinators.find(x => x._id === c)?.name || c) : c?.name) || id;
                    return ( <span key={id} className="tag"> {label} <button type="button" onClick={() => setEditTeam({ ...editTeam, coordinators: editTeam.coordinators.filter((co) => typeof co === "string" ? co !== id : co?._id !== id ), }) } > × </button> </span> );
                  })}
                </div>
                </div>
              </div>
              <div className="teamedit-modal-actions">
                <button type="button" onClick={() => setEditTeam(null)}>Cancel</button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && teamToDelete && (
          <div className="confirm-modal-overlay" role="dialog" aria-modal="true">
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>CONFIRM DELETE</h3>
              <p>Are you sure you want to delete <strong>{teamToDelete.teamName}</strong>?</p>
              <div className="confirm-modal-actions">
                <button className="btn cancel" onClick={cancelDelete}>Cancel</button>
                <button className="btn confirm" onClick={confirmDeleteTeam}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Info Modal */}
        {showInfoModal && infoTeam && (
          <div className="modal-overlay" role="dialog" aria-modal="true">
            <div className="team-info-modal" onClick={(e) => e.stopPropagation()}>
              <h2>TEAM INFO</h2>
              <div className="info-content">
                <p><strong>Name:</strong> {infoTeam.teamName}</p>
                <p><strong>Manager:</strong> {infoTeam.teamManager || "--"}</p>
                <p><strong>Manager Email:</strong> {infoTeam.managerEmail || "--"}</p>
                <p><strong>Sub-Organizers:</strong></p>
                {infoTeam.coordinators && infoTeam.coordinators.length > 0 ? (
                  <ul className="info-list">
                    {infoTeam.coordinators.map((c, idx) => {
                      const name = typeof c === "string" ?
                        (coordinators.find(x => x._id === c)?.name || c) :
                        c?.name || c;
                      return <li key={idx}>{name}</li>;
                    })}
                  </ul>
                ) : (
                  <p>No assigned sub-organizers</p>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowInfoModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {showToast && (
          <div className={`toast ${toastType === "success" ? "toast-success" : "toast-error"}`}>
            {toastMessage}
          </div>
        )}
    </MainLayout>
  );
};

export default Teams;