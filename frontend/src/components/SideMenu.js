import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
//import { MdOutlineScoreboard } from "react-icons/md";
import { FaUserCheck } from "react-icons/fa";
import { GiGreekTemple } from "react-icons/gi";
//import { Link } from 'react-router-dom';
import '../styles/SideMenu.css';
import { useNavigate, useLocation } from 'react-router-dom';


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
      <img src="/SPARTA_admin.png" alt="SPARTA_AdminLabel" className="SideMenu-Admin-Pic"/>
      <ul className="sidemenu-list">
        <li className={location.pathname === "/admin/dashboard" ? "active" : ""}>
          <a href="/admin/dashboard"><RxDashboard /> Dashboard</a>
        </li>
        <li className={location.pathname === "/admin/event" ? "active" : ""}>
          <a href="/admin/event"><AiOutlineFire /> Event </a>
        </li>
        <li className={location.pathname === "/admin/approval" ? "active" : ""}>
          <a href="/admin/approval"><FaUserCheck /> Approvals </a>
        </li>
        <li className={location.pathname === "/pantheon" ? "active" : ""}>
          <a href="/pantheon"><GiGreekTemple /> Pantheon </a>
        </li>
        <li>
          <button onClick={handleLogout}> Logout </button>
        </li>
      </ul>
    </div>
  );
};

export default SideMenu;