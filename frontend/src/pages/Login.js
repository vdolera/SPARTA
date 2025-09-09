import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [showAdminRoles, setShowAdminRoles] = useState(false); 
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    accessKey: ''
  });

  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showLoginFailed, setShowLoginFailed] = useState(false);

  const navigate = useNavigate();

    useEffect(() => {
      document.title = "SPARTA | Login";
    }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // base payload
    const payload = {
      email: formData.email,
    };

    // Password check for admin and player
    if (role === 'admin' || role === 'player') {
      payload.password = formData.password;
    }

    // AccessKey for co-organizer or sub-organizer
    if (role === 'co-organizer' || role === 'sub-organizer') {
      payload.accessKey = formData.accessKey;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/login/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // alert(`Login successful as ${role}`);
        setShowLoginSuccess(true);
        localStorage.setItem('auth', JSON.stringify(data.user));
        
        setTimeout(() => {
        if (['admin', 'co-organizer', 'sub-organizer'].includes(role)) {
          navigate('/admin/dashboard');
        } else if (role === 'player') {
          navigate('/dashboard');
          }
          }, 3000);
      } else {
        setShowLoginFailed(true);
        // alert(data.message || 'Login failed');
      }
    } catch (error) {
      
      console.error('Login error:', error);
      alert('Something went wrong!');
    }
  };

  return (

    <>
    {/* Success Modal */}
    {showLoginSuccess && (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Login Successful</h2>
          <p>Welcome back!</p>
          <button onClick={() => setShowLoginSuccess(false)}>Continue</button>
        </div>
      </div>
    )}

    {/* Failure Modal */}
    {showLoginFailed && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Login Failed</h3>
          <p>Invalid email, password, or access key. Please try again.</p>
          <button onClick={() => setShowLoginFailed(false)}>Close</button>
        </div>
      </div>
    )}

    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <div className="role-buttons">
            {/* Admin button with dropdown */}
            <button
              onClick={() => setShowAdminRoles(!showAdminRoles)}
              type="button"
              className={`role-button admin ${
                ['admin', 'co-organizer', 'sub-organizer'].includes(role) ? 'active' : 'inactive'
              }`}
            >
              Admin <span className={`arrow ${showAdminRoles ? 'open' : ''}`}>▼</span>
              
            </button>

           <div className={`admin-role-options ${showAdminRoles ? "open" : "closed"}`}>
              <button type="button" 
                onClick={() => {
                  setRole('admin');
                  setShowAdminRoles(false);
                }}
              > Main Admin </button>

              <button type="button" 
                onClick={() => {
                  setRole('co-organizer');
                  setShowAdminRoles(false);
                }}
              > Co-Organizer </button>

              <button type="button" 
                onClick={() => {
                  setRole('sub-organizer');
                  setShowAdminRoles(false);
                }}
              > Sub-Organizer </button>
            </div>

            {/* Player button */}
            <button
              onClick={() => setRole('player')}
              type="button"
              className={`role-button player ${role === 'player' ? 'active' : 'inactive'}`}
            >
              Player
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group" style={{ position: 'relative' }}>
              <input
                type="email"
                name="email"
                placeholder=" "
                required
                value={formData.email}
                onChange={handleChange}
              />
              <label className="label-login" htmlFor="email">Email</label>
            </div>

            {/* Password only for Admin and Player */}
            {(role === 'admin' || role === 'player') && (
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type="password"
                  name="password"
                  placeholder=" "
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <label className="label-login" htmlFor="password">Password</label>
              </div>
            )}

            {/* AccessKey only for Co/Sub Organizer */}
            {(role === 'co-organizer' || role === 'sub-organizer') && (
              <div className="form-group" style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="accessKey"
                  placeholder=" "
                  required
                  value={formData.accessKey}
                  onChange={handleChange}
                />
                <label className="label-login" htmlFor="accessKey">Access Key</label>
              </div>
            )}

            <button type="submit" className="login-button">
              Login as {role.charAt(0).toUpperCase() + role.slice(1)}
            </button>

            <button
              type="button"
              className="switch-button"
              onClick={() => navigate('/register')}
            >
              Don't have an account? Register
            </button>
          </form>
        </div>

        <div className="login-right">
          <img src="./LoginIMG.png" alt="Login Illustration" className="login-image" />
        </div>
      </div>
    </div>
  </>
  );
}
