function SignUp() {
  return (
    <div className="login-page">

      {/* LEFT SIDE */}
      <div className="login-left">
        <div className="brand">
          <span className="brand-icon">🧠</span>
          <span className="brand-name">Procrastinot</span>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="login-right">
        <div className="login-card">
          <div className="card-logo">🧠</div>
          <h1>Procrastinot</h1>
          <p className="welcome">Create your account! 🎉</p>

          <div className="input-group">
            <span className="input-icon">👤</span>
            <input type="text" placeholder="Full Name" />
          </div>

          <div className="input-group">
            <span className="input-icon">✉️</span>
            <input type="email" placeholder="Email" />
          </div>

          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input type="password" placeholder="Password" />
          </div>

          <button className="login-btn">Sign Up</button>

          <p className="signup-text">
            Already have an account? <a href="/">Log in</a>
          </p>
        </div>
      </div>

    </div>
  )
}

export default SignUp