import React from 'react';
import './SideMenu.css';

const SideMenu = () => {
  return (
    <div className="sidemenu">
      <h2 className="sidemenu-title">My App</h2>
      <ul className="sidemenu-list">
        <li><a href="/dashboard">🏠 Dashboard</a></li>
        <li><a href="/event">📊 Event</a></li>
        <li><a href="/liveScores">👤 Live Scores</a></li>
        <li><a href="/feedback">⚙️ Feedback</a></li>
        <li><a href="/pantheon">🚪 Pantheon</a></li>
      </ul>
    </div>
  );
};

export default SideMenu;