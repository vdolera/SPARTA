import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { GiGreekTemple } from "react-icons/gi";
import { FaUserCircle } from 'react-icons/fa';
import '../styles/SideMenu.css';
import { useNavigate,useLocation } from 'react-router-dom';


const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  return (
    <div className="sidemenu">
      <img src="/SPARTA_HeadBar.png" alt="SPARTA_HeadBar" className="SideMenu-Header-Pic"/>
      <img src="/SPARTA_player.png" alt="SPARTA_PlayerLabel" className="SideMenu-Player-Pic" style={{ width: "100px", paddingLeft: "40px", borderRadius: "15px" }}/>
      <ul className="sidemenu-list">
        <li className={location.pathname === "/dashboard" ? "active" : ""}><a href="/dashboard"><RxDashboard /> Dashboard</a></li>
        <li className={location.pathname === "/userprofile" ? "active" : ""}><a href="/userprofile"><FaUserCircle/> User Profile </a></li>
        <li className={location.pathname === "/event" ? "active" : ""}><a href="/event"><AiOutlineFire /> Event </a></li>
        <li className={location.pathname === "/pantheon" ? "active" : ""}><a href="/pantheon"><GiGreekTemple /> Pantheon </a></li>
        <li><button onClick={handleLogout}>Logout </button></li>
      </ul>
    </div>
  );
};

export default SideMenu;