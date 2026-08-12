import React, { useEffect, useState } from 'react'
import API_URL, { authFetch } from '../api'
import useIsMobile from '../hooks/useIsMobile'

export default function Admin() {
  const isMobile = useIsMobile()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, usersRes] = await Promise.all([
          authFetch(`${API_URL}/api/admin/stats`),
          authFetch(`${API_URL}/api/admin/users`),
        ])

        if (statsRes.status === 403 || usersRes.status === 403) {
          setError('Access denied. Admin only.')
          setLoading(false)
          return
        }

        const statsData = await statsRes.json()
        const usersData = await usersRes.json()
        setStats(statsData)
        setUsers(usersData)
      } catch {
        setError('Failed to load admin data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>

  return (
    <div style={{ padding: isMobile ? '24px 16px' : '40px 0', maxWidth: 900 }}>
      <h2 style={{ marginBottom: 24, fontSize: isMobile ? 20 : 24 }}>Admin Dashboard</h2>

      {/* Stats Cards */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: isMobile ? 10 : 16,
        marginBottom: isMobile ? 28 : 36,
      }}>
        <StatCard label="Total Users" value={stats.total_users} isMobile={isMobile} />
        <StatCard label="Total Assignments" value={stats.total_assignments} isMobile={isMobile} />
        <StatCard label="PDF Uploads" value={stats.by_source.pdf} isMobile={isMobile} />
        <StatCard label="Canvas Synced" value={stats.by_source.canvas} isMobile={isMobile} />
        <StatCard label="Manual" value={stats.by_source.manual} isMobile={isMobile} />
      </div>

      {/* Users Table */}
      <h3 style={{ marginBottom: 12, fontSize: isMobile ? 16 : 18 }}>All Users</h3>
      <div style={{
        overflowX: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: 'touch',
        border: isMobile ? '1px solid #f3f4f6' : 'none',
        borderRadius: isMobile ? 10 : 0,
      }}>
        <table style={{ width: '100%', minWidth: isMobile ? 560 : 'auto', borderCollapse: 'collapse', fontSize: isMobile ? 13 : 14 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Joined</th>
              <th style={th}>Assignments</th>
              <th style={th}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={td}>{u.id}</td>
                <td style={td}>{u.full_name}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.created_at ? u.created_at.slice(0, 10) : '—'}</td>
                <td style={td}>{u.assignment_count}</td>
                <td style={td}>{u.is_admin ? '✓' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isMobile && users.length > 0 && (
        <p style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 8 }}>
          Scroll sideways to see all columns →
        </p>
      )}
    </div>
  )
}

function StatCard({ label, value, isMobile }) {
  return (
    <div style={{
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      padding: isMobile ? '12px 14px' : '16px 24px',
      minWidth: isMobile ? 'calc(50% - 5px)' : 120,
      boxSizing: 'border-box',
      textAlign: 'center',
      flex: isMobile ? '1 1 calc(50% - 5px)' : 'none',
    }}>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{label}</div>
    </div>
  )
}

const th = { padding: '8px 12px', color: '#374151', fontWeight: 600 }
const td = { padding: '10px 12px', color: '#374151' }