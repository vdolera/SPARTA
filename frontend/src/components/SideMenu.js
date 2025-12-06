import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { FaUserCheck } from "react-icons/fa";
import { GiGreekTemple } from "react-icons/gi";
import { Link, useLocation } from 'react-router-dom';
import '../styles/SideMenu.css';

const SideMenu = () => {

  const location = useLocation();

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

    </div>
  );
};

export default SideMenu;