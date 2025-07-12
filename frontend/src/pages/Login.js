import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accessKey: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload =
      role === 'admin'
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, accessKey: formData.accessKey };

    console.log(`Submitting ${role} login:`, payload);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">

          <div className="role-buttons">
            <button
              onClick={() => setRole('admin')}
              className={`role-button admin ${role === 'admin' ? 'active' : 'inactive'}`}
            >
              Admin
            </button>
            <button
              onClick={() => setRole('player')}
              className={`role-button player ${role === 'player' ? 'active' : 'inactive'}`}
            >
              Player
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
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

            {role === 'player' && (
              <div>
                <label>Access Key</label>
                <input
                  type="text"
                  name="accessKey"
                  required
                  value={formData.accessKey}
                  onChange={handleChange}
                />
              </div>
            )}

            <button type="submit" className="login-button">
              Login as {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>

            <button
              type="button"
              className="switch-button"
              onClick={() => navigate('/register')}>
              Don't have an account? Register
            </button>

          </form>

        </div>

        <div className="login-right">
            <img src="./LoginIMG.png" alt="Login Illustration" className="login-image" />
        </div>

      </div>
    </div>
  );
}
