import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideMenu from '../components/SideMenu';
import Header from "../components/Header";

const Dashboard = () => {
  return (

    <div style={{ display: 'flex' }}>
      <SideMenu />
      <Header />
      <div style={{ marginLeft: '220px', padding: '20px' }}>
        {/* Add Routes or content here */}
      </div>
    </div>

  )
};

export default Dashboard;