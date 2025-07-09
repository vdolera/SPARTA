import React from 'react';
import { FaUserCircle, FaCog } from 'react-icons/fa';
import '../styles/Header.css';

const Header = () => {
  return (
    <div className="header">
      <div className="header-content">
        <h2>DASHBOARD</h2>
        <div className="header-icons">
          <FaUserCircle size={24} />
          <FaCog size={24} />
        </div>
      </div>
    </div>
  );
};

export default Header;