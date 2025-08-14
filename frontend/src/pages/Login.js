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

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const payload =
      role === 'admin'
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, accessKey: formData.accessKey };
  
    try {
      const response = await fetch(`http://localhost:5000/api/auth/login/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();

      if (response.ok) {
        alert(`Login successful as ${role}`);
        localStorage.setItem('auth', JSON.stringify(data.user));
  
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'player') {
        navigate('/dashboard'); 
      }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Something went wrong!');
    }
  };
  

  return (
    <div className="login-container">
      <div className="login-box">

      <div className="login-left">

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

        <form onSubmit={handleSubmit} className="login-form">
          <div className='form-group'style={{position: 'relative'}}>
            <input
              type="email"
              name="email"
              placeholder=" "
              required
              value={formData.email}
              onChange={handleChange}
              style={{width: '100%'}}
            />
            <label className='label-login' htmlFor='email'>Email</label>
          </div>

          <div className='form-group'style={{position: 'relative'}}>
            <input
              type="password"
              name="password"
              placeholder=" "
              required
              value={formData.password}
              onChange={handleChange}
              style={{width: '100%'}}
            />
            <label className='label-login' htmlFor='password'>Password</label>
          </div>

          {role === 'player' && (
            <div className='form-group' style={{position: 'relative'}}>
              <input
                type="text"
                name="accessKey"
                placeholder=" "
                required
                value={formData.accessKey}
                onChange={handleChange}
                style={{width: '100%'}}
              />
              <label className='label-login' htmlFor='accessKey'>Access Key</label>
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
