import MainLayout from "../../components/MainLayout";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateTeam = () => {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [teamManager, setTeamManager] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('auth'));
    const institution = user?.institution;

    if (!institution) {
      alert("Institution missing from user data.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName,
          teamManager,
          managerEmail,
          institution,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Team created!');
        navigate(-1);
      } else {
        alert(`${data.message}`);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team.');
    }
  };

  return (
    <MainLayout>
      <div className='team-create-maindiv'>
        <h2>Create Team</h2>
        <form onSubmit={handleCreate}>
          <div>
            <label>Team Name:</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Team Manager:</label>
            <input
              type="text"
              value={teamManager}
              onChange={(e) => setTeamManager(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Manager Email:</label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Create Team</button>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateTeam;
