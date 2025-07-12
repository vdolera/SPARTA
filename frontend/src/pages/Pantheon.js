import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideMenu from '../components/SideMenu';
import Header from "../components/Header";

const Pantheon = () => {
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

export default Pantheon;