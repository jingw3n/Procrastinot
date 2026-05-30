import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import heroImage from './assets/hero.png'
import SignUp from './SignUp'

function Login() {
  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="brand">
          <span className="brand-icon">🧠</span>
          <span className="brand-name">Procrastinot</span>
        </div>
        <img src={heroImage} alt="hero" className="hero-image" />
        <div className="tagline">
          <h2>Stay <span className="green">focused.</span><br />Get things done.</h2>
          <p>Procrastinot helps you beat procrastination and build better habits, one day at a time.</p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN CARD */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-logo">🧠</div>
          <h1>Procrastinot</h1>
          <p className="welcome">Welcome back! 👋</p>

          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input type="email" placeholder="Email" />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="Password" />
            <span className="input-icon-right">👁️</span>
          </div>

          <p className="forgot">Forgot password?</p>

          <button className="login-btn">Log In</button>

          <p className="signup-text">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>
        </div>
      </div>

    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App