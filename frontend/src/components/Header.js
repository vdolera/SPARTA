import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pageTitles = {
    '/admin/dashboard': 'DASHBOARD',
    '/admin/approval': 'APPROVAL',
    '/admin/event': "ORGANIZER'S EVENT",
    '/admin/event/create': 'CREATE EVENT',
    '/admin/event/:eventName': 'EVENT DETAILS',
    '/admin/event/team': 'TEAM',
    '/admin/event/game': 'GAME',
    '/admin/liveScores': 'LIVE SCORES',
    '/admin/feedback': 'POST GAME FEEDBACKS',
    '/pantheon': 'PANTHEON',
  };
  const currentTitle = pageTitles[location.pathname] || 'SPARTA';

  const rawUser = JSON.parse(localStorage.getItem("auth")) || {};
  const [user, setUser] = useState(rawUser);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // edit form state
  const [nickname, setNickname] = useState(user?.playerName || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(user?.profilePic || null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    setNickname(user?.playerName || '');
    setPreviewSrc(user?.profilePic || null);
  }, [user]);

  // close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  const openEdit = () => {
    setDropdownOpen(false);
    setShowEditModal(true);
    setNickname(user?.playerName || '');
    setPreviewSrc(user?.profilePic || null);
    setPhotoFile(null);
  };

  const onPhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPreviewSrc(URL.createObjectURL(f));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // TODO: Upload photoFile to server and get URL, then save nickname + profilePic via API.
    // For now update localStorage so UI reflects changes immediately.
    const updated = { ...user, playerName: nickname, profilePic: previewSrc };
    localStorage.setItem('auth', JSON.stringify(updated));
    setUser(updated);
    setShowEditModal(false);
  };

  const avatarSrc = user?.profilePic || '/SPARTA_Logo.png';
  const displayName = user?.playerName || user?.nickname || user?.email?.split('@')[0] || 'User';

  return (
    <div className="header">
      <div className="header-content">
        <h2>{currentTitle}</h2>
      </div>

      <div className="user-box" ref={dropdownRef}>
        
        <div className="user-meta">
          <div className="user-nick"> Hi, {displayName} !</div>
          <div className="user-role">{user.role?.toUpperCase()}</div>
        </div>

        <button
          className="avatar-button"
          onClick={() => setDropdownOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
        >
          <img src={avatarSrc} alt="avatar" className="profile-avatar" />
        </button>

        {dropdownOpen && (
          <div className="profile-dropdown" role="menu">
            <button className="dropdown-item" onClick={openEdit}>Edit user info</button>
            <div className="dropdown-divider" />
            <button className="dropdown-item logout" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="edit-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <form onSubmit={handleSave} className="edit-form">
              <div className="edit-photo-row">
                <div className="photo-preview">
                  <img src={previewSrc || '/SPARTA_Logo.png'} alt="preview" />
                </div>
                <div className="photo-controls" style={{backgroundColor: "white", fontFamily: "Poppins, sans-serif", fontSize: "14px", borderRadius: "8px"}}>
                  <label className="file-label">
                    Choose Photo
                    <input type="file" accept="image/*" onChange={onPhotoChange} />
                  </label>
                </div>
              </div>

              <label className="input-label">
                <input type="text" placeholder='Enter nickname' value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </label>

              <div className="readonly-info">
                <div><strong>Email:</strong> <span>{user?.email || 'N/A'}</span></div>
                <div><strong>Institution:</strong> <span>{user?.institution?.name || user?.institution || 'N/A'}</span></div>
              </div>

              <div className="edit-actions">
                <button type="button" className="btn cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn save">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;