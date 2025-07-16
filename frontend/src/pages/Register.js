import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Register.css';

export default function RegisterPage() {
  const [role, setRole] = useState('admin');
  const [institutions, setInstitutions] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    institution: '',
    event: '',
  });

  const navigate = useNavigate(); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/institutions');
        const data = await response.json();
        setInstitutions(data);
      } catch (err) {
        console.error('Failed to load institutions:', err);
      }
    };
  
    fetchInstitutions();
  }, []);
  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload =
      role === 'admin'
        ? {
            email: formData.email,
            password: formData.password,
            institution: formData.institution,
          }
        : {
            email: formData.email,
            password: formData.password,
            institution: formData.institution,
            event: formData.event,
          };
  
    console.log(`Sending payload:`, payload);
  
    try {
      const response = await fetch(`http://localhost:5000/api/auth/register/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      console.log("Raw response:", response);
  
      const data = await response.json();
  
      if (response.ok) {
        alert(`Successfully registered as ${role}`);
        navigate('/dashboard');
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Something went wrong!');
    }
  };
  
  return (
    <div className="register-container">
      <div className="register-box">
        <div className="role-buttons">
          <button
            onClick={() => setRole('admin')}
            className={`role-button admin ${role === 'admin' ? 'active' : 'inactive'}`}>
            Admin
          </button>
          <button
            onClick={() => setRole('player')}
            className={`role-button player ${role === 'player' ? 'active' : 'inactive'}`}>
            Player
          </button>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div>
            <label>Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label>Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
             <label>Institution</label>
                <select
                 name="institution"
                 value={formData.institution}
                 onChange={handleChange}
                 required
                >
                <option value="">Select Institution</option>
                 {institutions.map((inst) => (
                 <option key={inst._id} value={inst.name}>
                 {inst.name}
                 </option>))}
                </select>
          </div>

          {role === 'player' && (
            <div>
              <label>Event</label>
              <input
                type="text"
                name="event"
                required
                value={formData.event}
                onChange={handleChange}
              />
            </div>
          )}

          <button type="submit" className="register-button">
            Register as {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>

          <button
            type="button"
            className="switch-button"
            onClick={() => navigate('/')}>
            Already have an account? Login
          </button>
        </form>
      </div>
    </div>
  );
}
