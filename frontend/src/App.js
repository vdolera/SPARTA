import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import SideMenu from './components/SideMenu'



export default function App() {
  return (

    <div style={{ display: 'flex' }}>
      <SideMenu />
      <div style={{ marginLeft: '220px', padding: '20px' }}>
        <h1>Welcome to My MERN App</h1>
        {/* Add Routes or content here */}
      </div>
    </div>

    //<Router>
      //<Routes>
       // <Route path="/" element={<Login />} />
      //</Routes>
    //</Router>
  );
}