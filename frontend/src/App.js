import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Event from "./pages/Event"
import Feedback from "./pages/Feedback";
import LiveScores from "./pages/LiveScores";
import Pantheon from "./pages/Pantheon";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/event" element={<Event />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/liveScores" element={<LiveScores />} />
        <Route path="/pantheon" element={<Pantheon />} />
      </Routes>
    </Router>
  );
}