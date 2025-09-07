import React from 'react';
import PlayerSideMenu from './P_SideMenu';
import Header from './Header';
import '../styles/MainLayout.css';

const PlayerMainLayout = ({ children }) => {
  return (
    <>
      <PlayerSideMenu />
      <Header />
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

export default PlayerMainLayout;