import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { FaUserCheck } from "react-icons/fa";
import { GiGreekTemple } from "react-icons/gi";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from "react";
import '../styles/SideMenu.css';

const SideMenu = () => {

      useEffect(() => {
      document.title = "SPARTA | Dashboard";
    }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  const user = JSON.parse(localStorage.getItem("auth"));

   return (
    <div className="sidemenu">

      <div className="sidemenu-logo">
        <img src="/SPARTA-Logo2.png" alt="Logo" className="logo-img" />
      </div>

      <ul className="sidemenu-list">
        <li className={location.pathname === "/admin/dashboard" ? "active" : ""}>
          <Link to="/admin/dashboard"><RxDashboard /> Dashboard</Link>
        </li>
        <li className={location.pathname.startsWith("/admin/event") ? "active" : ""}>
          <Link to="/admin/event"><AiOutlineFire /> Event </Link>
        </li>
        <li className={location.pathname === "/admin/approval" ? "active" : ""}>
          <Link to="/admin/approval"><FaUserCheck /> Approvals </Link>
        </li>
        <li className={location.pathname === "/admin/pantheon" ? "active" : ""}>
          <Link to="/admin/pantheon"><GiGreekTemple /> Pantheon </Link>
        </li>
      </ul>

      {/* Bottom user info */}
      <div className="bottom-info">
        <div>
          <h2>{user.role.toUpperCase()}</h2>
        </div>
      
        <div className="user-info">
          <span>{user?.playerName || "No Username Found"}</span>
          <span>{user?.email || "No Email"} </span>
        </div>

        <button className="s-logout-button" onClick={handleLogout}>Logout</button>

      </div>

    </div>
  );
};

export default SideMenu;