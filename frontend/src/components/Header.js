import React from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { useLocation } from 'react-router-dom'
import '../styles/Header.css';

const Header = () => {
  const location = useLocation();
  //const navigate = useNavigate();

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
    '/admin/pantheon': 'PANTHEON'
  };

  const currentTitle = pageTitles[location.pathname] || 'SPARTA: Sports Planning And Resource Tracking Application';

  return (
    <div className="header">
      <div className="header-content">
        <h2>{currentTitle}</h2>
        <div className="header-icons">
          <FaUserCircle size={24} />
        </div>
      </div>
    </div>
  );
};

export default Header;