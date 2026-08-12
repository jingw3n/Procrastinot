import { useState } from 'react'
import { Eye, EyeOff, RefreshCw, Shield, Trash2, Clock } from 'lucide-react'
import API_URL, { authFetch } from '../api'
import canvasImage from '../assets/canvas_image1.png'
import useIsMobile from '../hooks/useIsMobile'

export default function Canvas({ navigate }) {
  const isMobile = useIsMobile()
  const [canvasToken, setCanvasToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [error, setError] = useState('')
  const [revoking, setRevoking] = useState(false)

  const handleSaveToken = async () => {
    setError('')
    setSyncMessage('')

    try {
      const res = await authFetch(`${API_URL}/api/canvas/token?canvas_token=${encodeURIComponent(canvasToken)}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to save token')
        return
      }
      setSyncMessage('Canvas token saved! You can now sync your assignments.')
    } catch {
      setError('Could not connect to server.')
    }
  }

  const handleRevokeToken = async () => {
    if (!window.confirm('Revoke your Canvas token? You will need to paste it again to sync assignments.')) {
      return
    }
    setRevoking(true)
    setError('')
    setSyncMessage('')

    try {
      const res = await authFetch(`${API_URL}/api/canvas/token`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to revoke token')
        return
      }
      setCanvasToken('')
      setSyncMessage('Canvas token revoked. Auto-sync is paused until you add a new token.')
    } catch {
      setError('Could not connect to server.')
    } finally {
      setRevoking(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setSyncMessage('')

    try {
      const res = await authFetch(`${API_URL}/api/canvas/sync`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Sync failed')
        return
      }
      setSyncMessage(data.message)
      localStorage.setItem('lastCanvasSync', new Date().toISOString())
    } catch {
      setError('Could not connect to server.')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div style={{
      padding: isMobile ? '20px 16px' : '36px 0px 0px 40px',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 0 : 40,
      alignItems: 'flex-start',
      minHeight: '100vh',
      marginRight: isMobile ? 0 : '-40px',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, maxWidth: isMobile ? '100%' : 640, width: '100%' }}>
        <h1 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: 'var(--green-primary)', marginBottom: 8 }}>Canvas Integration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>
          Connect your NUS Canvas account to automatically import your assignments.
        </p>

        {/* Step 1 */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? 18 : 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>1</div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Get your Canvas API Token</h2>
            </div>
          </div>
          <ol style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 2.2, paddingLeft: 20, margin: 0 }}>
            <li>Go to <a href="https://canvas.nus.edu.sg/profile/settings" target="_blank" rel="noreferrer" style={{ color: 'var(--green-primary)', fontWeight: 500 }}>Canvas NUS Settings ↗</a></li>
            <li>Scroll down to <strong>Approved Integrations</strong></li>
            <li>Click <strong>New Access Token</strong></li>
            <li>Enter a purpose (e.g. "Procrastinot") and set expiry</li>
            <li>Click <strong>Generate Token</strong> and copy it</li>
          </ol>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 8, padding: '10px 14px' }}>
            <Clock size={15} color="#F9A825" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: '#8D6E00', margin: 0, lineHeight: 1.5 }}>
              We recommend setting the token expiry to <strong>1 year or less</strong>. You can always generate a new one and revoke the old one below if it expires.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? 18 : 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>2</div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Paste your token here</h2>
            </div>
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="Paste your Canvas API token"
              value={canvasToken}
              onChange={e => setCanvasToken(e.target.value)}
              style={{
                width: '100%', padding: '11px 44px 11px 14px',
                border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 14, boxSizing: 'border-box',
                outline: 'none'
              }}
            />
            <button
              onClick={() => setShowToken(!showToken)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}
            >
              {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={handleSaveToken}
              disabled={!canvasToken}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: canvasToken ? 'var(--green-primary)' : '#ccc',
                color: '#fff', fontWeight: 600, fontSize: 14,
                cursor: canvasToken ? 'pointer' : 'not-allowed',
                border: 'none',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              Save Token
            </button>
            <button
              onClick={handleRevokeToken}
              disabled={revoking}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: '#fff',
                color: '#D32F2F', fontWeight: 600, fontSize: 14,
                cursor: revoking ? 'not-allowed' : 'pointer',
                border: '1px solid #EF9A9A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: isMobile ? '100%' : 'auto',
                opacity: revoking ? 0.7 : 1,
              }}
            >
              <Trash2 size={14} />
              {revoking ? 'Revoking...' : 'Revoke Token'}
            </button>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 14, padding: isMobile ? 18 : 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>3</div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sync your assignments</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Click the button below to import all your Canvas assignments into Procrastinot.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-muted)', fontSize: 12.5 }}>
            <RefreshCw size={13} />
            <span>Assignments also auto-sync every 3 hours in the background — no need to click Sync Now each time.</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{
              padding: '10px 24px', borderRadius: 8,
              background: syncing ? '#ccc' : 'var(--green-primary)',
              color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: syncing ? 'not-allowed' : 'pointer',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <RefreshCw size={15} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Security note */}
        <div style={{ background: '#F8FAF8', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} color="var(--green-primary)" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Your token is <strong>encrypted and stored securely.</strong> We never access your Canvas account directly.
          </p>
        </div>

        {/* Messages */}
        {syncMessage && (
          <div style={{ marginTop: 16, background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#2E7D32' }}>
            ✅ {syncMessage}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 16, background: '#FFEBEE', border: '1px solid #EF9A9A', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#C62828' }}>
            ❌ {error}
          </div>
        )}
      </div>

      {/* Right illustration — hidden on mobile, no room for it */}
      {!isMobile && (
        <div style={{ width: 500, flexShrink: 0, alignSelf: 'stretch', display: 'flex' }}>
          <img src={canvasImage} alt="Canvas integration illustration" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
        </div>
      )}
    </div>
  )
}