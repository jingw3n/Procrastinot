import React, { useState, useEffect } from 'react';
import { FileText, Copy, LogOut, Plus, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import API_URL from '../api';

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

function TeamAssignmentCard({ assignment }) {
  const daysLeft = getDaysLeft(assignment.due_date);
  const milestones = assignment.milestones || [];
  const totalMilestones = milestones.length;
  const completedCount = milestones.filter(m => m.is_completed).length;
  const progressPct = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : null;
  const nextMilestone = milestones
    .filter(m => !m.is_completed)
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    })[0];

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: 18, marginBottom: 10, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={18} color="var(--green-primary)" />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{assignment.title}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{assignment.course || 'No course'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#F57C00' }}>{formatDate(assignment.due_date)}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {daysLeft !== null && assignment.status !== 'completed' ? (daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`) : ''}
            </p>
          </div>
          <StatusBadge status={assignment.status} />
        </div>
      </div>

      {totalMilestones > 0 && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Milestones: {completedCount}/{totalMilestones}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green-primary)' }}>{progressPct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#F0F0F0', overflow: 'hidden', marginBottom: nextMilestone ? 8 : 0 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--green-primary)', borderRadius: 3 }} />
          </div>
          {nextMilestone && (
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              Next: <strong style={{ color: 'var(--text-secondary)' }}>{nextMilestone.title}</strong>
              {nextMilestone.due_date && ` — due ${formatDate(nextMilestone.due_date)}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const token = localStorage.getItem('token');
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadTeams = (selectId = null) => {
    if (!token) return;
    setLoadingTeams(true);
    fetch(`${API_URL}/api/teams?token=${token}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setTeams(list);
        if (selectId) {
          setSelectedTeamId(selectId);
        } else if (list.length > 0 && !list.some(t => t.id === selectedTeamId)) {
          setSelectedTeamId(list[0].id);
        } else if (list.length === 0) {
          setSelectedTeamId(null);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTeams(false));
  };

  useEffect(() => { loadTeams(); }, []);

  useEffect(() => {
    if (!selectedTeamId || !token) { setOverview(null); return; }
    setLoadingOverview(true);
    fetch(`${API_URL}/api/team/${selectedTeamId}?token=${token}`)
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(() => {})
      .finally(() => setLoadingOverview(false));
  }, [selectedTeamId]);

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/team/create?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: teamName }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Failed to create team.'); return; }
      setTeamName('');
      setShowAddPanel(false);
      loadTeams(data.id);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/team/join?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: joinCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Failed to join team.'); return; }
      setJoinCode('');
      setShowAddPanel(false);
      loadTeams(data.id);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async (teamId) => {
    if (!window.confirm('Leave this team?')) return;
    setBusy(true);
    try {
      await fetch(`${API_URL}/api/team/${teamId}/leave?token=${token}`, { method: 'POST' });
      setSelectedTeamId(null);
      loadTeams();
    } catch {
      setError('Could not connect to server.');
    } finally {
      setBusy(false);
    }
  };

  if (loadingTeams) {
    return (
      <div style={{ padding: '36px 40px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading teams...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Team</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>See what everyone on your team is working on.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
        {teams.map(t => (
          <button
            key={t.id}
            onClick={() => setSelectedTeamId(t.id)}
            style={{
              padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: selectedTeamId === t.id ? 'none' : '1px solid var(--border)',
              background: selectedTeamId === t.id ? 'var(--green-primary)' : '#fff',
              color: selectedTeamId === t.id ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {t.name}
          </button>
        ))}
        <button
          onClick={() => setShowAddPanel(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-secondary)',
          }}
        >
          {showAddPanel ? <X size={13} /> : <Plus size={13} />} {showAddPanel ? 'Close' : 'Add Team'}
        </button>
      </div>

      {showAddPanel && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Create a new team</h3>
            <input
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Team name, e.g. CS2030 Group 5"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleCreate}
              disabled={busy || !teamName.trim()}
              style={{ background: 'var(--green-primary)', color: '#fff', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: busy ? 0.7 : 1 }}
            >
              Create Team
            </button>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)', flex: 1, minWidth: 260 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Join an existing team</h3>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Enter join code"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box', textTransform: 'uppercase' }}
            />
            <button
              onClick={handleJoin}
              disabled={busy || !joinCode.trim()}
              style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: busy ? 0.7 : 1 }}
            >
              Join Team
            </button>
          </div>
        </div>
      )}

      {error && <p style={{ color: '#D32F2F', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {teams.length === 0 && !showAddPanel && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>You're not in any teams yet — click "Add Team" above to create or join one.</p>
      )}

      {selectedTeamId && overview && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Join code: <strong style={{ color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{overview.team.join_code}</strong>
            </span>
            <button
              onClick={() => navigator.clipboard.writeText(overview.team.join_code)}
              style={{ padding: 4, color: 'var(--text-muted)' }}
              title="Copy join code"
            >
              <Copy size={13} />
            </button>
            <button
              onClick={() => handleLeave(selectedTeamId)}
              disabled={busy}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#D32F2F' }}
            >
              <LogOut size={12} /> Leave Team
            </button>
          </div>

          {loadingOverview ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading members...</p>
          ) : overview.members.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No team members found.</p>
          ) : (
            overview.members.map(member => (
              <div key={member.user_id} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {member.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>{member.full_name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{member.assignments.length} assignment{member.assignments.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {member.assignments.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 42 }}>No assignments yet.</p>
                ) : (
                  member.assignments.map(a => <TeamAssignmentCard key={a.id} assignment={a} />)
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}