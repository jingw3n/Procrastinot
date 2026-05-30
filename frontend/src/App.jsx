import './App.css'
import React, { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import studyImage from './assets/procrastinot_study_illustration_enhanced.png'
import happyIcon from './assets/happy.png'
import SignUp from './SignUp'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import Calendar from './pages/Calendar'

function Login() {
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

      {/* RIGHT SIDE - LOGIN CARD */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-logo"><img src={happyIcon} alt="logo" className="logo-icon" /></div>
          <h1>Procrastinot</h1>
          <p className="welcome">Welcome back! 👋</p>

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
            <span className="input-icon-right">👁️</span>
          </div>

          <p className="forgot">Forgot password?</p>

          <button className="login-btn" onClick={() => {
            if (email && password) {
              window.location.href = '/dashboard'
            } else {
              alert('Please fill in both fields!')
            }
          }}>Log In</button>

          <p className="signup-text">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>

    </div>
  )
}

function MainApp() {
  const [page, setPage] = useState('dashboard')
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  const navigate = (p, data = null) => {
    setPage(p)
    if (data) setSelectedAssignment(data)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} navigate={navigate} />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', overflow: 'auto', padding: '0 40px' }}>
        {page === 'dashboard' && <Dashboard navigate={navigate} />}
        {page === 'assignments' && <Assignments navigate={navigate} />}
        {page === 'assignment-detail' && <AssignmentDetail assignment={selectedAssignment} navigate={navigate} />}
        {page === 'calendar' && <Calendar navigate={navigate} />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  )
}