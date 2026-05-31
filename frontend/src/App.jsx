import './App.css'
import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import studyImage from './assets/procrastinot_study_illustration_enhanced.png'
import happyIcon from './assets/happy.png'
import API_URL from './api'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Assignments from './pages/Assignments'
import AssignmentDetail from './pages/AssignmentDetail'
import Calendar from './pages/Calendar'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

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

          <p className="forgot" onClick={() => navigate('/forgot-password')} style={{ cursor: 'pointer' }}>Forgot password?</p>

          <button className="login-btn" onClick={async () => {
            if (!email || !password) {
              alert('Please fill in both fields!')
              return
            }
            try {
              const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
              })
              const data = await response.json()
              if (response.ok) {
                localStorage.setItem('token', data.access_token)
                navigate('/dashboard')
              } else {
                alert(data.detail || 'Login failed!')
              }
            } catch (error) {
              alert('Cannot connect to server!')
            }
          }}>Log In</button>

          <p className="signup-text">
            Don't have an account? <a onClick={() => navigate('/signup')} style={{ cursor: 'pointer' }}>Sign up</a>
          </p>
        </div>
      </div>

    </div>
  )
}

function MainApp() {
  const [page, setPage] = useState('dashboard')
  const [selectedAssignment, setSelectedAssignment] = useState(null)

  const navigatePage = (p, data = null) => {
    setPage(p)
    if (data) setSelectedAssignment(data)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} navigate={navigatePage} />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', overflow: 'auto', padding: '0 40px' }}>
        {page === 'dashboard' && <Dashboard navigate={navigatePage} />}
        {page === 'assignments' && <Assignments navigate={navigatePage} />}
        {page === 'assignment-detail' && <AssignmentDetail assignment={selectedAssignment} navigate={navigatePage} />}
        {page === 'calendar' && <Calendar navigate={navigatePage} />}
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  )
}