import React from 'react';
import { FaUserCircle, FaCog } from 'react-icons/fa';
import { useLocation } from 'react-router-dom'
import '../styles/Header.css';

const Header = () => {
  const location = useLocation();

  const pageTitles = {
    '/dashboard': 'DASHBOARD',
    '/event': 'EVENT',
    '/event/create': 'CREATE EVENT',
    '/event/:eventName': 'EVENT DETAILS',
    '/event/team': 'TEAM',
    '/event/game': 'GAME',
    '/liveScores': 'LIVE SCORES',
    '/feedback': 'POST GAME FEEDBACKS',
    '/pantheon': 'PANTHEON'
  };

  const currentTitle = pageTitles[location.pathname] || 'SPARTA: Sports Planning And Resource Tracking Application';

  return (
    <div className="header">
      <div className="header-content">
        <h2>{currentTitle}</h2>
        <div className="header-icons">
          <FaUserCircle size={24} />
          <FaCog size={24} />
        </div>
      </div>
    </div>
  );
};

export default Header;