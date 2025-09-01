import React from 'react';
import P_SideMenu from './P_SideMenu';
import Header from './Header';
import '../styles/MainLayout.css';

const P_MainLayout = ({ children }) => {
  return (
    <>
      <P_SideMenu />
      <Header />
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

export default P_MainLayout;