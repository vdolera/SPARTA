import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { FaUserCheck } from "react-icons/fa";
import { GiGreekTemple } from "react-icons/gi";
import '../styles/SideMenu.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { BsThreeDotsVertical } from "react-icons/bs";


const SideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

   return (
    <div className="sidemenu">

      <div className="sidemenu-logo">
        <img src="/SPARTA-Logo2.png" alt="Logo" className="logo-img" />
      </div>

      <ul className="sidemenu-list">
        <li className={location.pathname === "/admin/dashboard" ? "active" : ""}>
          <a href="/admin/dashboard"><RxDashboard /> Dashboard</a>
        </li>
        <li className={location.pathname.startsWith("/admin/event") ? "active" : ""}>
          <a href="/admin/event"><AiOutlineFire /> Event </a>
        </li>
        <li className={location.pathname === "/admin/approval" ? "active" : ""}>
          <a href="/admin/approval"><FaUserCheck /> Approvals </a>
        </li>
        <li className={location.pathname === "/admin/pantheon" ? "active" : ""}>
          <a href="/admin/pantheon"><GiGreekTemple /> Pantheon </a>
        </li>
      </ul>

      {/* Bottom user info */}
      <div className="bottom-info">
        <div>
          <h2>ADMIN</h2>
        </div>
      
        <div className="user-info">
          {/* <span className="user-name">{currentUser.name}</span> */}
          <span className="user-name"> USERNAME / EMAIL HERE </span>

        </div>

        <button className="s-logout-button" onClick={handleLogout}>Logout</button>

      </div>

    </div>
  );
};

export default SideMenu;