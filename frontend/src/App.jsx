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
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please fill in both fields!')
      return
    }
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.detail === 'string' ? data.detail : 'Login failed!')
        return
      }
      localStorage.setItem('token', data.access_token)
      navigate('/dashboard')
    } catch {
      setError('Could not connect to server.')
    }
  }

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

          <form onSubmit={handleLogin} style={{ margin: 0, width: '100%' }}>
            <div className="input-group" style={{ marginBottom: 12 }}>
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

            {error && <p style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</p>}

            <p className="forgot" onClick={() => navigate('/forgot-password')} style={{ cursor: 'pointer', textAlign: 'right', margin: '8px 0' }}>Forgot password?</p>

            <button type="submit" className="login-btn">Log In</button>
          </form>

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