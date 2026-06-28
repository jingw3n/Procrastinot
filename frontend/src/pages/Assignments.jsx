import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, Filter, BarChart2, Calendar, AlertCircle, ClipboardList, Trash2, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import AssignmentIcon from '../components/AssignmentIcon';
import WorkloadHeatmap from '../components/WorkloadHeatmap';
import API_URL from '../api';

const TABS = ['All Assignments', 'Upcoming', 'Overdue', 'Completed', 'Trash'];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysLeft(dueDateStr) {
  if (!dueDateStr) return null;
  const due = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

export default function Assignments({ navigate }) {
  const [activeTab, setActiveTab] = useState('All Assignments');
  const [search, setSearch] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [sourceFilter, setSourceFilter] = useState('All Types');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [trash, setTrash] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${API_URL}/api/assignments?token=${token}`)
      .then(res => res.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API_URL}/api/assignments/trash?token=${token}`)
      .then(res => res.json())
      .then(data => setTrash(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const filtered = assignments.filter(a => {
    const matchTab =
      activeTab === 'All Assignments' ? true :
      activeTab === 'Upcoming' ? a.status === 'upcoming' :
      activeTab === 'Overdue' ? a.status === 'overdue' :
      a.status === 'completed';

    const matchSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.description?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'All Statuses' ? true : a.status === statusFilter.toLowerCase().replace(' ', '_');

    const matchSource =
      sourceFilter === 'All Types' ? true : a.source === sourceFilter.toLowerCase();

    return matchTab && matchSearch && matchStatus && matchSource;
  });

  const upcomingCount = assignments.filter(a => a.status === 'upcoming').length;
  const overdueCount = assignments.filter(a => a.status === 'overdue').length;

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/assignments/${id}?token=${token}`, { method: 'DELETE' });
      if (res.ok) {
        const deleted = assignments.find(a => a.id === id);
        setAssignments(prev => prev.filter(a => a.id !== id));
        if (deleted) setTrash(prev => [{ ...deleted, deleted_at: new Date().toISOString() }, ...prev]);
        setConfirmDeleteId(null);
      } else {
        const err = await res.json();
        alert('Delete failed: ' + (err.detail || res.status));
      }
    } catch (e) {
      alert('Delete error: ' + e.message);
    }
  };

  const handleRestore = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/assignments/${id}/restore?token=${token}`, { method: 'PUT' });
    if (res.ok) {
      const restored = await res.json();
      setTrash(prev => prev.filter(a => a.id !== id));
      setAssignments(prev => [restored, ...prev]);
    }
  };

  const handlePermanentDelete = async (id) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/api/assignments/${id}/permanent?token=${token}`, { method: 'DELETE' });
    if (res.ok) setTrash(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleComplete = async (e, a) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const newStatus = a.status === 'completed' ? 'upcoming' : 'completed';
    const res = await fetch(`${API_URL}/api/assignments/${a.id}?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setAssignments(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
  };

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Assignments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>View and manage all your assignments in one place.</p>
        </div>
        <button
          onClick={() => navigate('create-assignment')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--green-primary)', color: '#fff',
            padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13.5,
          }}
        >
          <Plus size={15} /> New Assignment
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--green-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--green-primary)' : '2px solid transparent',
              fontSize: 13.5,
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Upcoming Deadlines', value: upcomingCount, color: '#F57C00', bg: '#FFF3E0', icon: Calendar },
              { label: 'Overdue Deadlines', value: overdueCount, color: '#D32F2F', bg: '#FFEBEE', icon: AlertCircle },
              { label: 'Total Assignments', value: assignments.length, color: '#2E7D32', bg: '#EBF0E9', icon: ClipboardList },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14, flex: 1,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={20} color={c.color} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          {activeTab !== 'Trash' && <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            {loading ? (
              <p style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14 }}>Loading assignments...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>No assignments found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
                    {['Assignment', 'Source', 'Due Date', 'Status', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '12px 16px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                        letterSpacing: '0.02em',
                      }}>
                        {h && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {h}
                            {['Assignment', 'Due Date'].includes(h) && <ChevronDown size={12} />}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, idx) => {
                    const daysLeft = getDaysLeft(a.due_date);
                    return (
                      <tr
                        key={a.id}
                        onClick={() => navigate('assignment-detail', a)}
                        style={{
                          borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: 'pointer', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AssignmentIcon type="assignment" size={30} />
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</p>
                              <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.description?.slice(0, 50) || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                            background: a.source === 'canvas' ? '#E3F2FD' : a.source === 'pdf' ? '#F3E5F5' : '#F5F5F5',
                            color: a.source === 'canvas' ? '#1565C0' : a.source === 'pdf' ? '#6A1B9A' : '#555',
                            textTransform: 'capitalize'
                          }}>
                            {a.source || 'manual'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{
                            fontWeight: 600, fontSize: 13,
                            color: a.status === 'overdue' ? 'var(--red)' :
                                   a.status === 'completed' ? 'var(--text-secondary)' : 'var(--orange)',
                          }}>
                            {formatDate(a.due_date)}
                          </p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {daysLeft !== null && a.status !== 'completed' ?
                              (daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`) : ''}
                          </p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={a.status} />
                        </td>
                        <td style={{ padding: '14px 16px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              onClick={e => handleToggleComplete(e, a)}
                              title={a.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                              style={{ color: a.status === 'completed' ? 'var(--green-primary)' : '#ccc', padding: 4, borderRadius: 4 }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--green-primary)'}
                              onMouseLeave={e => e.currentTarget.style.color = a.status === 'completed' ? 'var(--green-primary)' : '#ccc'}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                            {confirmDeleteId === a.id ? (
                              <span onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button
                                  onClick={() => handleDelete(a.id)}
                                  style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#D32F2F', padding: '2px 8px', borderRadius: 4 }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  style={{ fontSize: 11, color: 'var(--text-muted)', padding: '2px 4px' }}
                                >
                                  Cancel
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setConfirmDeleteId(a.id); }}
                                title="Delete assignment"
                                style={{ color: '#D32F2F', padding: 4, borderRadius: 4, opacity: 0.5 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>}

          {/* Pagination */}
          {activeTab !== 'Trash' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Showing {filtered.length} of {assignments.length} assignments
              </p>
            </div>
          )}

          {/* Trash tab content */}
          {activeTab === 'Trash' && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              {trash.length === 0 ? (
                <p style={{ padding: 24, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Trash is empty.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
                      {['Assignment', 'Source', 'Due Date', ''].map((h, i) => (
                        <th key={i} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trash.map((a, idx) => (
                      <tr key={a.id} style={{ borderBottom: idx < trash.length - 1 ? '1px solid var(--border)' : 'none', opacity: 0.7 }}>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ fontWeight: 600, fontSize: 13.5, textDecoration: 'line-through', color: 'var(--text-muted)' }}>{a.title}</p>
                          <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.description?.slice(0, 50) || '—'}</p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#F5F5F5', color: '#555', textTransform: 'capitalize' }}>
                            {a.source || 'manual'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                          {a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleRestore(a.id)}
                              style={{ fontSize: 12, fontWeight: 600, color: 'var(--green-primary)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--green-primary)' }}
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(a.id)}
                              style={{ fontSize: 12, fontWeight: 600, color: '#D32F2F', padding: '4px 10px', borderRadius: 6, border: '1px solid #D32F2F' }}
                            >
                              Delete Forever
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Filters sidebar */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Filter size={14} color="var(--text-secondary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Filters</span>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search assignments..."
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  border: '1px solid var(--border)', borderRadius: 7, fontSize: 12.5,
                  outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Status filter */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div
                onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowSourceDropdown(false); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px',
                  cursor: 'pointer', background: '#fff'
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{statusFilter}</span>
                <ChevronDown size={13} color="#bbb" />
              </div>
              {showStatusDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 7, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
                  {['All Statuses', 'Upcoming', 'Overdue', 'Completed'].map(s => (
                    <div
                      key={s}
                      onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Source filter */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div
                onClick={() => { setShowSourceDropdown(!showSourceDropdown); setShowStatusDropdown(false); }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px',
                  cursor: 'pointer', background: '#fff'
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{sourceFilter}</span>
                <ChevronDown size={13} color="#bbb" />
              </div>
              {showSourceDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 7, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>
                  {['All Types', 'Manual', 'Canvas', 'PDF'].map(s => (
                    <div
                      key={s}
                      onClick={() => { setSourceFilter(s); setShowSourceDropdown(false); }}
                      style={{ padding: '8px 12px', fontSize: 12.5, cursor: 'pointer', color: 'var(--text-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Workload Heatmap</span>
              <BarChart2 size={13} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>Darker days indicate higher accumulated workload.</p>
            <WorkloadHeatmap />
          </div>

          {/* Workload insight */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Workload Insights</span>
              <BarChart2 size={13} color="var(--green-primary)" />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {upcomingCount > 0 ? `${upcomingCount} assignments due — one step at a time.` : 'All caught up! 🎉'}
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>You've got this! 💚</p>
          </div>
        </div>
      </div>
    </div>
  );
}