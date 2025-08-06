import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { TiGroupOutline } from "react-icons/ti";
import { LuSwords } from "react-icons/lu";
import { MdOutlineScoreboard } from "react-icons/md";
import { MdOutlineFeedback } from "react-icons/md";
import { GiGreekTemple } from "react-icons/gi";
import { Link } from 'react-router-dom';
import '../styles/SideMenu.css';
import { useNavigate } from 'react-router-dom';


const SideMenu = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth');
    navigate('/');
  };

  return (
    <div className="sidemenu">
      <img src="/SPARTA_HeadBar.png" alt="SPARTA_HeadBar" className="SideMenu-Header-Pic"/>
      <img src="/SPARTA_admin.png" alt="SPARTA_AdminLabel" className="SideMenu-Admin-Pic"/>
      <ul className="sidemenu-list">
        <li><a href="/dashboard"><RxDashboard /> Dashboard</a></li>

        <li className="dropdown">
          <a href="/event"><AiOutlineFire /> Event </a>
          <ul className="event-submenu">
            <li><Link to="/event/team"><TiGroupOutline /> Team </Link></li>
            <li><Link to="/event/game"><LuSwords /> Game </Link></li>
          </ul>
        </li>

        <li><a href="/liveScores"><MdOutlineScoreboard /> Live Scores </a></li>
        <li><a href="/feedback"><MdOutlineFeedback /> Feedback</a></li>
        <li><a href="/pantheon"><GiGreekTemple /> Pantheon </a></li>
        <li><button onClick={handleLogout}>Logout </button></li>
      </ul>
    </div>
  );
};

export default SideMenu;