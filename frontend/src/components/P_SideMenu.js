import { RxDashboard } from "react-icons/rx";
import { AiOutlineFire } from "react-icons/ai";
import { GiGreekTemple } from "react-icons/gi";
import { FaUserCircle } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom"; 
import { useEffect } from "react";
import "../styles/SideMenu.css";


const PlayerSideMenu = () => {

    useEffect(() => {
    document.title = "SPARTA | Dashboard";
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("auth"));

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/");
  };

  return (
    <div className="sidemenu">
      
      <div className="sidemenu-logo">
        <img src="/SPARTA-Logo2.png" alt="Logo" className="logo-img"/>
      </div>

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
      </ul>


        <div className="bottom-info">
          <div>
            <h2 style={{backgroundColor:"#CE892C"}}>PLAYER</h2>
          </div>

          <div className="user-info">
          <span> {user?.playerName || "User Name"} </span>
          <span> {user?.email || "No Email"} </span> 
          </div>

          <button className="s-logout-button" onClick={handleLogout}>Logout</button>
        
        </div>
         
    </div>
  );
};

export default PlayerSideMenu;
