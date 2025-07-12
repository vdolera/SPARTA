import React from 'react';
import SideMenu from './SideMenu';
import Header from './Header';
import '../styles/MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <>
      <SideMenu />
      <Header />
      <div className="main-content">
        {children}
      </div>
    </>
  );
};

export default MainLayout;