import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BlockRoute from "../src/BlockRoute";

//ADMIN
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/admin/ADMIN_Dashboard";
import Event from "./pages/admin/ADMIN_Event"
import CreateEvent from "./pages/admin/ADMIN_EventCreate";
import SpecificEvent from "./pages/admin/ADMIN_SpecificEvent";
import Team from "./pages/admin/ADMIN_Teams";
import CreateTeam from "./pages/admin/ADMIN_TeamCreate";
import TeamPlayers from "./pages/admin/ADMIN_TeamPlayers";
import PlayerProfile from "./pages/admin/ADMIN_PlayerProfile";
import Game from "./pages/admin/ADMIN_Games";
import CreateGame from "./pages/admin/ADMIN_GameCreate";
import GameBracket from "./pages/admin/ADMIN_GameBracket";
import Feedback from "./pages/admin/ADMIN_Feedback";
import LiveScores from "./pages/admin/ADMIN_LiveScores";
import Pantheon from "./pages/admin/ADMIN_Pantheon";
import PantheonRanks from "./pages/admin/ADMIN_PantheonRanks";
import PantheonTeam from "./pages/admin/ADMIN_PantheonTeam";
import Approval from "./pages/admin/ADMIN_PlayerApproval";
import TeamPlayerApproval from "./pages/admin/ADMIN_TeamPendingPlayers";

//PLAYER
import PlayerDashboard from "./pages/player/PLAYER_Dashboard";
import PlayerUserProfile from "./pages/player/PLAYER_PlayerUserProfile";
import PlayerEvent from "./pages/player/PLAYER_Event";
import PlayerSpecificEvent from "./pages/player/PLAYER_SpecificEvent";
import PlayerGame from "./pages/player/PLAYER_Games";
import PlayerFeedback from "./pages/player/PLAYER_Feedback";
import PlayerTeamPlayers from "./pages/player/PLAYER_TeamPlayerList";
import PlayerLiveScores from "./pages/player/PLAYER_LiveScores"; 
import PlayerPantheon from "./pages/player/PLAYER_Pantheon";
import PlayerPantheonRanks from "./pages/player/PLAYER_PantheonRanks";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/*Admin*/}
        <Route path="/admin/dashboard" element={<BlockRoute> <Dashboard /> </BlockRoute>} />
        <Route path="/admin/approval" element={<BlockRoute> <Approval /> </BlockRoute>} />
        <Route path="/admin/event" element={<BlockRoute> <Event /> </BlockRoute>} />
        <Route path="/admin/event/create" element={<BlockRoute> <CreateEvent /> </BlockRoute>} />
        <Route path="/admin/event/:eventName" element={<SpecificEvent />} />
        <Route path="/admin/event/:eventName/team" element={<BlockRoute> <Team /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/team/:teamName/players" element={<BlockRoute> <TeamPlayers /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/team/:teamName/pending" element={<BlockRoute> <TeamPlayerApproval /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/team/:teamName/player/:playerId/profile" element={<BlockRoute> <PlayerProfile /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/addteam" element={<BlockRoute> <CreateTeam /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/game" element={<BlockRoute> <Game /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/addgame" element={<BlockRoute> <CreateGame /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/game/:game" element={<BlockRoute> <GameBracket /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/liveScores" element={<BlockRoute> <LiveScores /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/feedback" element={<BlockRoute> <Feedback /> </BlockRoute>} />
        <Route path="/admin/event/:eventName/liveScores" element={<BlockRoute> <LiveScores /> </BlockRoute>} />
        <Route path="/admin/pantheon" element={<BlockRoute> <Pantheon /> </BlockRoute>} />
        <Route path="/admin/pantheon/:eventName/ranking" element={<BlockRoute> <PantheonRanks /> </BlockRoute>} />
        <Route path="/admin/pantheon/:eventName/:teamName/players" element={<BlockRoute> <PantheonTeam /> </BlockRoute>} />
        {/*Player*/}
        <Route path="/dashboard" element={<BlockRoute> <PlayerDashboard /> </BlockRoute>} />
        <Route path=":userId/profile" element={<BlockRoute> <PlayerUserProfile /> </BlockRoute>} />
        <Route path="/event" element={<BlockRoute> <PlayerEvent /> </BlockRoute>} />
        <Route path="/event/:eventName" element={<PlayerSpecificEvent />} />
        <Route path="/event/:eventName/team/:teamName/players" element={<BlockRoute> <PlayerTeamPlayers /> </BlockRoute>} />
        <Route path="/event/:eventName/game" element={<BlockRoute> <PlayerGame /> </BlockRoute>} />
        <Route path="/event/:eventName/feedback" element={<BlockRoute> <PlayerFeedback /> </BlockRoute>} />
        <Route path="/event/:eventName/liveScores" element={<BlockRoute> <PlayerLiveScores /> </BlockRoute>} />
        <Route path="/pantheon" element={<BlockRoute> <PlayerPantheon /> </BlockRoute>} />
        <Route path="/player/pantheon/:eventName/:teamName/players" element={<BlockRoute> <PlayerPantheonRanks /> </BlockRoute>} />
      </Routes>
    </Router>
  );
}