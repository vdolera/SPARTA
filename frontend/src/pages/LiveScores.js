import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SideMenu from '../components/SideMenu';
import Header from "../components/Header";
import "../styles/LiveScores.css";

const LiveScores = () => {
  return (

    <div style={{ display: 'flex' }}>

      <SideMenu />
      <Header />
      <div className="live-scores-content">
      {
        <h1>Live Scores</h1>       
      }
      </div>


    </div>

  )
};

export default LiveScores;