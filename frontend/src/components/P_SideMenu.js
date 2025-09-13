import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { GiGreekTemple } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import "../styles/SideMenu.css";

const PlayerSideMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("auth"));

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/");
  };

  return (
    <div className="sidemenu">
      <img src="/SPARTA_HeadBar.png" alt="SPARTA_HeadBar" className="SideMenu-Header-Pic"/>
      <img src="/SPARTA_player.png" alt="SPARTA_PlayerLabel" className="SideMenu-Player-Pic" style={{ width: "100px", paddingLeft: "40px", borderRadius: "15px" }} />

      <ul className="sidemenu-list">
        <li className={location.pathname === "/dashboard" ? "active" : ""}>
          <Link to="/dashboard"> <RxDashboard /> Dashboard </Link>
        </li>

        <li className={location.pathname.includes("/profile") ? "active" : ""}>
          <Link to={`/${user._id}/profile`}> <FaUserCircle /> User Profile </Link>
        </li>

        <li className={location.pathname === "/event" ? "active" : ""}>
          <Link to="/event"> <AiOutlineFire /> Event </Link>
        </li>

        <li className={location.pathname === "/pantheon" ? "active" : ""}>
          <Link to="/pantheon"> <GiGreekTemple /> Pantheon </Link>
        </li>

        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </div>
  );
};

export default PlayerSideMenu;
