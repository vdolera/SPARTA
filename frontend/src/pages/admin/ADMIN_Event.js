import MainLayout from "../../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import "../../styles/ADMIN_Event.css";

const Event = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [newSubOrganizer, setNewSubOrganizer] = useState(""); // for adding
  const user = JSON.parse(localStorage.getItem("auth"));
  const userInstitution = user?.institution;

  useEffect(() => {
    fetchEvents();
  }, [userInstitution]);

  const fetchEvents = async () => {
    const response = await fetch(
      `http://localhost:5000/api/active-events?institution=${userInstitution}`
    );
    const data = await response.json();
    setEvents(data);
  };

  const handleAddEvent = () => {
    navigate("./create");
  };

  const handleEventClick = (event) => {
    navigate(`/admin/event/${encodeURIComponent(event.eventName)}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await fetch(`http://localhost:5000/api/event/${id}`, { method: "DELETE" });
      setEvents(events.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/event/${editEvent._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editEvent),
        }
      );
      const updated = await res.json();
      setEvents(events.map((e) => (e._id === updated._id ? updated : e)));
      setEditEvent(null);
      setNewSubOrganizer("");
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleAddSubOrganizer = () => {
    if (!newSubOrganizer.trim()) return;
    setEditEvent({
      ...editEvent,
      subOrganizers: [...(editEvent.subOrganizers || []), newSubOrganizer],
    });
    setNewSubOrganizer("");
  };

  const handleRemoveSubOrganizer = (index) => {
    const updatedSubs = [...(editEvent.subOrganizers || [])];
    updatedSubs.splice(index, 1);
    setEditEvent({ ...editEvent, subOrganizers: updatedSubs });
  };

  // Filter events
  const filteredEvents = events.filter((event) =>
    event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="event-main-header">
        <input
          type="text"
          className="event-search-bar"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="new-event-btn" onClick={handleAddEvent}>
          + New Event
        </button>
      </div>

      <div className="event-list">
        {filteredEvents.map((event) => (
          <div key={event._id} className="event-item">
            <div
              className="event-color"
              style={{ background: event.eventColor || "#A96B24" }}         
            >
               {/* Menu button */}
              <MoreVertical
                className="menu-icon"
                onClick={() =>
                  setMenuOpen(menuOpen === event._id ? null : event._id)
                }
              />
              {menuOpen === event._id && (
                <div className="menu-dropdown">
                  <button onClick={() => setEditEvent(event)}>Edit</button>
                  <button onClick={() => handleDelete(event._id)}>Delete</button>
                </div>
              )}
            </div>

            <div className="event-name" onClick={() => handleEventClick(event)}>
              {event.eventName}
              <p>
                {event?.eventStartDate
                  ? new Date(event.eventStartDate).toLocaleDateString()
                  : "Loading..."}{" "}
                -{" "}
                {event?.eventEndDate
                  ? new Date(event.eventEndDate).toLocaleDateString()
                  : "Loading..."}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Edit Modal */}
      {editEvent && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Event</h2>
            <form
              className="event-forms"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              <label>
                Event Name:
                <input
                  type="text"
                  value={editEvent.eventName}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, eventName: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Event Duration:
                <div className="event-duration-inputs">
                  <input
                    type="date"
                    value={editEvent.eventStartDate?.substring(0, 10)}
                    onChange={(e) =>
                      setEditEvent({
                        ...editEvent,
                        eventStartDate: e.target.value,
                      })
                    }
                    required
                  />
                  <span> to </span>
                  <input
                    type="date"
                    value={editEvent.eventEndDate?.substring(0, 10)}
                    onChange={(e) =>
                      setEditEvent({
                        ...editEvent,
                        eventEndDate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </label>

              <label>
                Location:
                <input
                  type="text"
                  value={editEvent.location || ""}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, location: e.target.value })
                  }
                  required
                />
              </label>

              <label className="color-picker">
                Event Color:
                <input
                  type="color"
                  value={editEvent.eventColor}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, eventColor: e.target.value })
                  }
                  required
                />
              </label>

              <label>
                Description:
                <textarea
                  value={editEvent.description || ""}
                  onChange={(e) =>
                    setEditEvent({ ...editEvent, description: e.target.value })
                  }
                  rows="4"
                  required
                />
              </label>

              {/* Co & Sub-organizers just like CreateEvent */}
              <hr />
              <h4>CO & SUB-ORGANIZERS</h4>
              <p style={{ color: "#3E64AF", fontSize: "10px" }}>
                *Optional – you may add multiple*
              </p>
              <button
                type="button"
                onClick={() =>
                  setEditEvent({
                    ...editEvent,
                    coordinators: [
                      ...(editEvent.coordinators || []),
                      { name: "", email: "", role: "co-organizer" },
                    ],
                  })
                }
              >
                + Add Coordinator
              </button>

              <div>
                {(editEvent.coordinators || []).map((coord, idx) => (
                  <div
                    key={idx}
                    style={{
                      marginBottom: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <label>
                      Role:
                      <select
                        value={coord.role}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].role = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      >
                        <option value="co-organizer">Co-Organizer</option>
                        <option value="sub-organizer">Sub-Organizer</option>
                      </select>
                    </label>

                    <label>
                      Email:
                      <input
                        type="email"
                        value={coord.email}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].email = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      />
                    </label>

                    <label>
                      Full Name:
                      <input
                        type="text"
                        value={coord.name}
                        onChange={(e) => {
                          const updated = [...editEvent.coordinators];
                          updated[idx].name = e.target.value;
                          setEditEvent({ ...editEvent, coordinators: updated });
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      style={{
                        background: "#d32f2f",
                        color: "white",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        const updated = editEvent.coordinators.filter(
                          (_, i) => i !== idx
                        );
                        setEditEvent({ ...editEvent, coordinators: updated });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditEvent(null)}>
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

export default Event;
