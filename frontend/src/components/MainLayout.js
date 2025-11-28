import React from 'react';
import SideMenu from './SideMenu';
import Header from './Header';
import Breadcrumbs from './Breadcrumbs';
import '../styles/MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <>
      <SideMenu />
      <Header />
      <div className="main-content">
        <Breadcrumbs />
        {children}
      </div>
    </>
  );
};

export default MainLayout;