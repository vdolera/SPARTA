import MainLayout from "../../components/MainLayout";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import "../../styles/ADMIN_Teams.css";
import { VscSearchStop } from "react-icons/vsc";
import { MoreVertical } from "lucide-react";

const Teams = () => {
  const { eventName } = useParams();
  const decodedName = decodeURIComponent(eventName);

  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(null); // track which menu is open
  const [editTeam, setEditTeam] = useState(null); // for modal

  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  const [coordinators, setCoordinators] = useState([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchCoordinators = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/coordinators?institution=${userInstitution}&event=${decodedName}`
        );
        const data = await res.json();
        setCoordinators(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching coordinators:", err);
      }
    };
    fetchCoordinators();
  }, [userInstitution, decodedName]);


  const filteredTeams = teams.filter((team) =>
    team.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCoordinators = coordinators.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) &&
      !editTeam?.coordinators?.some((sel) => sel._id === c._id)
  );

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/teams?institution=${encodeURIComponent(
            userInstitution
          )}&event=${encodeURIComponent(decodedName)}`
        );
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    if (userInstitution && decodedName) {
      fetchTeams();
    }
  }, [userInstitution, decodedName]);

  const handleAddTeam = () => {
    navigate(`/admin/event/${encodeURIComponent(decodedName)}/addteam`);
  };

  const handleSelectTeam = (teamName) => {
    navigate(
      `/admin/event/${encodeURIComponent(
        decodedName
      )}/team/${encodeURIComponent(teamName)}/players`
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this team?")) return;
    try {
      await fetch(`http://localhost:5000/api/team/${id}`, { method: "DELETE" });
      setTeams(teams.filter((t) => t._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

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
  
      const { team: updatedTeam } = await res.json(); // ✅ FIX
      setTeams(teams.map((t) => (t._id === updatedTeam._id ? updatedTeam : t)));
      setEditTeam(null);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };
  


  return (
    <MainLayout>
      <div className="teams-header-row">
        <h3>TEAMS FOR {decodedName}</h3>

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
                        ? `url(http://localhost:5000${team.teamIcon})`
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
                    className="menu-container"
                    onClick={(e) => e.stopPropagation()} // prevent opening players page
                  >
                    <MoreVertical
                      className="menu-icon"
                      onClick={() =>
                        setMenuOpen(menuOpen === team._id ? null : team._id)
                      }
                    />
                    {menuOpen === team._id && (
                      <div className="menu-dropdown">
                        <button onClick={() => setEditTeam(team)}>Edit</button>
                        <button onClick={() => handleDelete(team._id)}>
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

      {/* Edit Modal */}
      {editTeam && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Team</h2>
            <form
              className="team-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              {/* Team Name */}
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
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
              <div className="form-group">
                <label className="color-picker">
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
              <div className="form-group">

                <label>
                  Team Icon:
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setEditTeam({ ...editTeam, newIcon: e.target.files[0] })
                    }
                  />
                </label>
              </div>

              {/* Sub-organizers */}
              <div className="form-group">
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
                    {editTeam.coordinators?.map((c) => (
                      <span key={c._id} className="tag">
                        {c.name}
                        <button
                          type="button"
                          onClick={() =>
                            setEditTeam({
                              ...editTeam,
                              coordinators: editTeam.coordinators.filter(
                                (co) => co._id !== c._id
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal actions */}
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditTeam(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Teams;
