import './App.css'
import { useState } from 'react'
import studyImage from './assets/procrastinot_study_illustration_enhanced.png'
import happyIcon from './assets/happy.png'
import API_URL from './api'

function SignUp() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div className="login-page">
      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="brand">
          <span className="brand-icon"><img src={happyIcon} alt="logo" className="logo-icon" /></span>
          <span className="brand-name">Procrastinot</span>
        </div>
        <img src={studyImage} alt="study" className="study-image" />
        <div className="tagline">
          <h2>Stay <span className="green">focused.</span><br />Get things done.</h2>
          <p>Procrastinot helps you beat procrastination and build better habits, one day at a time.</p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-logo"><img src={happyIcon} alt="logo" className="logo-icon" /></div>
          <h1>Procrastinot</h1>
          <p className="welcome">Create your account! 🎉</p>

          <div className="input-group">
            <span className="input-icon">👤</span>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="login-btn" onClick={async () => {
            if (!fullName || !email || !password) {
              alert('Please fill in all fields!')
              return
            }
            try {
              const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email, password })
              })
              const data = await response.json()
              if (response.ok) {
                alert('Account created! Please log in.')
                window.location.href = '/'
              } else {
                alert(data.detail || 'Registration failed!')
              }
            } catch (error) {
              alert('Cannot connect to server!')
            }
          }}>Sign Up</button>

          <p className="signup-text">
            Already have an account? <a href="/">Log in</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp