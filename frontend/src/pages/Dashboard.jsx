import API_URL, { authFetch } from '../api'
import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, ClipboardList, RefreshCw, Upload, Plus } from 'lucide-react';
import WorkloadHeatmap from '../components/WorkloadHeatmap';
import AssignmentIcon from '../components/AssignmentIcon';
import useIsMobile from '../hooks/useIsMobile';

function StatCard({ icon: Icon, iconColor, label, value }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
      flex: 1,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: iconColor + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={iconColor} strokeWidth={1.8} />
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: iconColor, lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function getDaysLeft(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dueDateStr) {
  if (!dueDateStr) return '';
  return new Date(dueDateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Dashboard({ navigate }) {
  const isMobile = useIsMobile();
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({ upcoming: 0, overdue: 0, total: 0 })
  const [assignments, setAssignments] = useState([])

  useEffect(() => {
    authFetch(`${API_URL}/auth/me`)
      .then(r => r.json())
      .then(data => { if (data.full_name) setUserName(data.full_name) })
      .catch(() => {})

    authFetch(`${API_URL}/api/dashboard`)
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})

    authFetch(`${API_URL}/api/assignments`)
      .then(r => r.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  const upcoming = assignments
    .filter(a => a.status === 'upcoming')
    .slice(0, 5)

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' })()}{userName ? `, ${userName}` : ''}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Let's make today productive.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, marginBottom: 28 }}>
        <StatCard icon={Calendar}      iconColor="#F57C00" label="Upcoming Deadlines" value={stats.upcoming} />
        <StatCard icon={AlertCircle}   iconColor="#D32F2F" label="Overdue Deadlines"  value={stats.overdue} />
        <StatCard icon={ClipboardList} iconColor="#3C5E33" label="Total Assignments"  value={stats.total} />
      </div>

      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20 }}>
        {/* Upcoming list */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Upcoming Assignments</h2>
              <button
                onClick={() => navigate('assignments')}
                style={{ color: 'var(--green-primary)', fontWeight: 600, fontSize: 13 }}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {upcoming.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                  No upcoming assignments. Upload a PDF or add one manually!
                </p>
              ) : (
                upcoming.map(a => {
                  const daysLeft = getDaysLeft(a.due_date)
                  return (
                    <div
                      key={a.id}
                      onClick={() => navigate('assignment-detail', a)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 10px', borderRadius: 'var(--radius-md)',
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <AssignmentIcon type="assignment" size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>{a.description || '—'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: 'var(--orange)', fontWeight: 600, fontSize: 13 }}>{formatDate(a.due_date)}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          {daysLeft !== null ? `${daysLeft} days left` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <button
              onClick={() => navigate('assignments')}
              style={{
                width: '100%', marginTop: 14,
                padding: '10px', borderRadius: 'var(--radius-md)',
                color: 'var(--green-primary)', fontWeight: 600, fontSize: 13,
                border: '1px solid var(--border)',
              }}
            >
              View All Assignments
            </button>
          </div>
        </div>

        {/* Right column */}
        <div style={{ width: isMobile ? '100%' : 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <h2 style={{ fontSize: 14, fontWeight: 700 }}>Workload Heatmap</h2>
              <button
                onClick={() => navigate('calendar')}
                style={{ color: 'var(--green-primary)', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                View
              </button>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Darker days indicate higher accumulated workload.</p>
            <WorkloadHeatmap navigate={navigate} />
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Workload Insights</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {stats.upcoming > 0 ? `${stats.upcoming} assignments due — one step at a time.` : 'All caught up! 🎉'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You've got this! 💚</p>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Quick Actions</h2>
            <button
              onClick={() => navigate('upload-pdf')}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13, marginBottom: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-primary)',
              }}>
              <Upload size={14} /> Upload PDF
            </button>
            <button
              onClick={() => navigate('canvas-sync')}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-primary)',
              }}>
              <RefreshCw size={14} /> Sync Canvas
            </button>
            {(() => {
              const last = localStorage.getItem('lastCanvasSync')
              if (!last) return <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Never synced</p>
              const date = new Date(last)
              const diffMins = Math.round((Date.now() - date) / 60000)
              const label = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins} min ago` : diffMins < 1440 ? `${Math.round(diffMins / 60)} hours ago` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              return <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Last Canvas sync: <strong>{label}</strong></p>
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}