import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/admin/ADMIN_Dashboard";
import Event from "./pages/admin/ADMIN_Event"
import CreateEvent from "./pages/admin/ADMIN_EventCreate";
import Team from "./pages/admin/ADMIN_Teams";
import Game from "./pages/admin/ADMIN_Games";
import Feedback from "./pages/admin/ADMIN_Feedback";
import LiveScores from "./pages/admin/ADMIN_LiveScores";
import Pantheon from "./pages/admin/ADMIN_Pantheon";
import BlockRoute from "../src/BlockRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<BlockRoute> <Dashboard /> </BlockRoute>} />
        <Route path="/event" element={<BlockRoute> <Event /> </BlockRoute>} />
        <Route path="/event/create" element={<BlockRoute> <CreateEvent /> </BlockRoute>} />
        <Route path="/event/team" element={<BlockRoute> <Team /> </BlockRoute>} />
        <Route path="/event/game" element={<BlockRoute> <Game /> </BlockRoute>} />
        <Route path="/feedback" element={<BlockRoute> <Feedback /> </BlockRoute>} />
        <Route path="/liveScores" element={<BlockRoute> <LiveScores /> </BlockRoute>} />
        <Route path="/pantheon" element={<BlockRoute> <Pantheon /> </BlockRoute>} />
      </Routes>
    </Router>
  );
}