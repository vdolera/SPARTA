import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import Calendar from 'react-calendar';

const Dashboard = () => {
  return (

      <MainLayout> 
        <h1>Dashboard</h1>
        <div><Calendar onChange={1} value={1} /></div>
      </MainLayout>

  )
};

export default Dashboard;