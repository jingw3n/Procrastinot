import './App.css'
import API_URL from './api'
import { useState } from 'react'
import studyImage from './assets/procrastinot_study_illustration_enhanced.png'
import happyIcon from './assets/happy.png'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
          <p className="welcome">Reset your password 🔑</p>

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
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button className="login-btn" onClick={async () => {
            if (!email || !newPassword || !confirmPassword) {
              alert('Please fill in all fields!')
              return
            }
            if (newPassword !== confirmPassword) {
              alert('Passwords do not match!')
              return
            }
            try {
              const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, new_password: newPassword })
              })
              const data = await response.json()
              if (response.ok) {
                alert('Password reset successfully! Please log in.')
                window.location.href = '/'
              } else {
                alert(typeof data.detail === 'string' ? data.detail : 'Reset failed!')
              }
            } catch (error) {
              alert('Cannot connect to server!')
            }
          }}>Reset Password</button>

          <p className="signup-text">
            Remember your password? <a href="/">Log in</a>
          </p>
        </div>
      </div>

    </div>
  )
}

export default ForgotPassword