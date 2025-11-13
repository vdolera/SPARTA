import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "../../styles/ADMIN_Teams.css";
import { VscSearchStop } from "react-icons/vsc";
import { MoreVertical } from "lucide-react";

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
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("auth"));

  const [coordinators, setCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

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
      // sel can be either an id string or a coordinator object
      typeof sel === "string" ? sel === c._id : sel?._id === c._id
    );
    return matchesSearch && !alreadySelected;
  });

  // Fetch teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/teams?institution=${encodeURIComponent(user?.institution)}&event=${encodeURIComponent(decodedName)}`);
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (user?.institution && decodedName) {
      fetchTeams();
    }
  }, [user?.institution, decodedName]);

  // Create team button nav
  const handleAddTeam = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addteam`);
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
            <button className="new-team-btn" onClick={handleAddTeam}>
              + New Team
            </button>
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
      
      {/* Edit Modal */}
      {editTeam && (
        <div className="modal-overlay">
          <div className="team-edit-modal">
            <h2 style={{paddingBottom: "10px", textAlign: "center"}}>EDIT TEAM</h2>
            <form
              className="team-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              {/* Team Name */}
              <div className="teamedit-form-group">
                <label>
                  Team Name:
                  <input
                    type="text"
                    value={editTeam.teamName}
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, teamName: e.target.value })
                    }
                    required
                  />
                </label>
              </div>

              {/* Team Manager */}
              <div className="teamedit-form-group">
                <label>
                  Team Manager:
                  <input
                    type="text"
                    value={editTeam.teamManager || ""}
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, teamManager: e.target.value })
                    }
                  />
                </label>
              </div>

              {/* Manager Email */}
              <div className="teamedit-form-group">
                <label>
                  Manager Email:
                  <input
                    type="email"
                    value={editTeam.managerEmail || ""}
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, managerEmail: e.target.value })
                    }
                  />
                </label>
              </div>

              {/* Team Color */}
              <div className="teamedit-form-group">
                <label style={{fontFamily: "Montserrat, sans-serif", fontSize: "14px", color: "black"}} className="color-picker">
                  Team Color:
                  <input
                    type="color"
                    value={editTeam.teamColor || "#A96B24"}
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, teamColor: e.target.value })
                    }
                  />
                </label>
              </div>

              
              {/* Team Icon */}

              <label style={{fontWeight: "600"}}> Team Icon: </label>
                <div className="file-upload" style={{width: "80%", margin: "5px auto"}}>

                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept="image/*"
                    style={{display: "none"}}
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, newIcon: e.target.files[0] })
                    }
                    />
                  <label htmlFor="file-upload" className="upload-btn">
                    Upload Attachment
                  </label>
                </div>

              {/* Sub-organizers */}
              <div className="teamedit-form-group" style={{ marginTop: "20px" }}>
                <div>
                  <label>Assign Sub-Organizer/s</label>
                  <div className="multi-select">
                    <input
                      type="text"
                      placeholder="Enter Name or Select"
                      value={search}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      onChange={(e) => setSearch(e.target.value)}
                    />

                    {showDropdown &&
                      (filteredCoordinators.length > 0 ||
                        (!search && coordinators.length > 0)) && (
                        <ul className="dropdown">
                          {(search
                            ? filteredCoordinators
                            : coordinators.filter(
                              (c) =>
                                !editTeam.coordinators?.some(
                                  (sel) => sel._id === c._id
                                )
                            )
                          ).map((c) => (
                            <li
                              key={c._id}
                              onClick={() =>
                                setEditTeam({
                                  ...editTeam,
                                  coordinators: [...(editTeam.coordinators || []), c],
                                })
                              }
                            >
                              {c.name} ({c.role})
                            </li>
                          ))}
                        </ul>
                      )}
                  </div>

                <div className="selected-tags">
                  {editTeam.coordinators?.map((c) => {
                    // support both object and id-string shapes
                    const id = typeof c === "string" ? c : c?._id;
                    const label = (typeof c === "string" ? (coordinators.find(x => x._id === c)?.name || c) : c?.name) || id;
                    return (
                      <span key={id} className="tag">
                        {label}
                        <button
                          type="button"
                          onClick={() =>
                            setEditTeam({
                              ...editTeam,
                              coordinators: editTeam.coordinators.filter((co) =>
                                typeof co === "string" ? co !== id : co?._id !== id
                              ),
                            })
                          }
                        >
                            ×
                        </button>
                      </span>
                    );
                  })}
                </div>

                </div>
              </div>

              {/* Modal actions */}
              <div className="teamedit-modal-actions">
                
                <button type="button" onClick={() => setEditTeam(null)}>
                  Cancel
                </button>
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

        {/* Toast (matches Register.js classes) */}
        {showToast && (
          <div className={`toast ${toastType === "success" ? "toast-success" : "toast-error"}`}>
            {toastMessage}
          </div>
        )}
    </MainLayout>
  );
};

export default Teams;
