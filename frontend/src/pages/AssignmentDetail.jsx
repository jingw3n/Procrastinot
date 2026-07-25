import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Pencil, ChevronDown, Calendar, Clock, Tag, BookOpen,
  FileText, File, Folder, Plus, Upload, MoreVertical, CheckCircle, Trash2
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import API_URL from '../api';

const WORKLOAD_COLORS = {
  research:       { bar: '#4CAF50', label: 'Research' },
  design:         { bar: '#FF9800', label: 'Design' },
  implementation: { bar: '#FF5722', label: 'Implementation' },
  testing:        { bar: '#FF9800', label: 'Testing' },
  documentation:  { bar: '#F44336', label: 'Documentation' },
};

function WorkloadBar({ label, hours, color, maxHours }) {
  const pct = Math.round((hours / maxHours) * 100);
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6 }}>{hours}h</p>
      <div style={{ height: 8, borderRadius: 4, background: '#F0F0F0', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

function FileIcon({ type }) {
  const map = {
    pdf:    { icon: FileText, color: '#D32F2F', bg: '#FFEBEE' },
    doc:    { icon: File,     color: '#1565C0', bg: '#E3F2FD' },
    folder: { icon: Folder,   color: '#F57C00', bg: '#FFF3E0' },
  };
  const t = map[type] || map.doc;
  const Icon = t.icon;
  return (
    <div style={{ width: 32, height: 32, borderRadius: 6, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={15} color={t.color} />
    </div>
  );
}

export default function AssignmentDetail({ assignment, navigate }) {
  const [fetchedMilestones, setFetchedMilestones] = useState([]);
  const [localAssignment, setLocalAssignment] = useState(assignment);
  const [showMore, setShowMore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: assignment?.title || '',
    course: assignment?.course || '',
    due_date: assignment?.due_date ? assignment.due_date.slice(0, 10) : '',
    estimated_hours: assignment?.estimated_hours || '',
    description: assignment?.description || '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const handleEditSave = async () => {
    setEditSaving(true);
    const token = localStorage.getItem('token');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${API_URL}/api/assignments/${localAssignment.id}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          due_date: editForm.due_date || null,
          estimated_hours: editForm.estimated_hours ? parseFloat(editForm.estimated_hours) : null,
          course: editForm.course || null,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const updated = await res.json();
        setLocalAssignment(prev => ({ ...prev, ...updated, course: editForm.course }));
        setEditing(false);

        // Re-spread incomplete milestone dates when due_date changes
        const dueDateChanged = editForm.due_date && editForm.due_date !== localAssignment.due_date?.slice(0, 10);
        if (dueDateChanged && fetchedMilestones.length > 0) {
          const incomplete = fetchedMilestones.filter(m => !m.is_completed);
          if (incomplete.length > 0) {
            const parts = editForm.due_date.split('-').map(Number);
            const due = new Date(parts[0], parts[1] - 1, parts[2]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const totalMs = due.getTime() - today.getTime();
            const n = incomplete.length;
            await Promise.all(incomplete.map((m, i) => {
              const fraction = (i + 1) / (n + 1);
              const d = new Date(today.getTime() + fraction * totalMs);
              const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
              return fetch(`${API_URL}/api/assignments/${localAssignment.id}/milestones/${m.id}?token=${token}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ due_date: dateStr }),
              });
            }));
            // Refresh milestones
            const mRes = await fetch(`${API_URL}/api/assignments/${localAssignment.id}/milestones?token=${token}`);
            if (mRes.ok) setFetchedMilestones(await mRes.json());
          }
        }
      } else {
        alert('Save failed. Please try again.');
      }
    } catch (e) {
      alert(e.name === 'AbortError' ? 'Request timed out. Railway may be sleeping — try again.' : 'Save error: ' + e.message);
    }
    setEditSaving(false);
  };
  const progress = fetchedMilestones.length > 0
    ? Math.round((fetchedMilestones.filter(m => m.is_completed).length / fetchedMilestones.length) * 100)
    : 0;

  useEffect(() => {
    if (fetchedMilestones.length === 0) return;
    const token = localStorage.getItem('token');
    const newStatus = progress === 100 ? 'completed' : 'upcoming';
    if (localAssignment.status === newStatus) return;
    fetch(`${API_URL}/api/assignments/${localAssignment.id}?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(res => {
      if (res.ok) setLocalAssignment(prev => ({ ...prev, status: newStatus }));
    });
  }, [progress]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !assignment?.id) return;
    fetch(`${API_URL}/api/assignments/${assignment.id}/milestones?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setFetchedMilestones([...data].sort((a, b) => {
          if (!a.due_date && !b.due_date) return a.id - b.id;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        }));
      })
      .catch(() => {});
  }, [assignment?.id]);

  if (!assignment) {
    navigate('assignments');
    return null;
  }

  const a = localAssignment;
  const workload = a.workload || {};
  const totalHours = Object.values(workload).reduce((s, v) => s + v, 0) || a.estimated_hours || 0;
  const maxHours = Object.values(workload).length > 0 ? Math.max(...Object.values(workload)) : 1;
  const milestones = a.milestones || [];
  const files = a.files || [];
  const type = a.type || 'assignment';
  const weightage = a.weightage || 'N/A';
  const dueDate = a.dueDate || (a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A');
  const daysLeft = a.daysLeft ?? (a.due_date ? Math.ceil((new Date(a.due_date) - new Date()) / (1000 * 60 * 60 * 24)) : null);
  const overview = a.overview || a.description || 'No description.';
  const assigned = a.assigned || (a.created_at ? new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A');
  const course = a.course || 'N/A';
  const courseName = a.courseName || '';

  return (
    <div style={{ padding: '28px 40px' }}>
      {/* Top nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button
          onClick={() => navigate('assignments')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}
        >
          <ArrowLeft size={15} /> Back to Assignments
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            }}>
            <Pencil size={13} /> Edit Assignment
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMore(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
              }}>
              More <ChevronDown size={13} />
            </button>
            {showMore && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowMore(false)}
                />
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: '#fff', border: '1px solid var(--border)',
                  borderRadius: 8, boxShadow: 'var(--shadow-sm)', zIndex: 100, minWidth: 160,
                }}>
                <button
                  onClick={async () => {
                    if (!window.confirm('Delete this assignment?')) return;
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_URL}/api/assignments/${localAssignment.id}?token=${token}`, { method: 'DELETE' });
                    if (res.ok) navigate('assignments');
                  }}
                  style={{
                    width: '100%', padding: '10px 16px', textAlign: 'left',
                    fontSize: 13, fontWeight: 500, color: '#D32F2F',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FFF5F5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash2 size={13} /> Delete Assignment
                </button>
              </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Left: main content */}
        <div style={{ flex: 1 }}>
          {/* Header card */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 12,
                  background: 'var(--green-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={24} color="var(--green-primary)" />
                </div>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{a.title}</h1>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{courseName ? `${course} – ${courseName}` : course}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green-primary)' }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    {a.weightage && (
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: '#F5F5F5', color: '#555' }}>
                        {weightage} Weightage
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due Date</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#F57C00' }}>{dueDate}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{daysLeft !== null && daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</p>
              </div>
            </div>

            {/* Overview */}
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Overview</h3>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{overview}</p>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 40, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {[
                { icon: Calendar, label: 'Assigned On', value: assigned },
                { icon: Calendar, label: 'Due Date',    value: dueDate, color: '#F57C00' },
                { icon: Tag,      label: 'Type',        value: type.charAt(0).toUpperCase() + type.slice(1) },
                { icon: BookOpen, label: 'Course',      value: course },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} color="#888" />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#aaa' }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Workload */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Estimated Workload</h3>
            </div>

            <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'var(--green-bg)', flexShrink: 0 }}>
                <Clock size={18} color="var(--green-primary)" />
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-primary)', lineHeight: 1 }}>{totalHours}h</p>
                  <p style={{ fontSize: 10.5, color: 'var(--green-primary)', opacity: 0.8 }}>Total Estimated Effort</p>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                {Object.entries(workload).map(([key, hours]) => (
                  hours > 0 && (
                    <WorkloadBar key={key} label={WORKLOAD_COLORS[key].label} hours={hours} color={WORKLOAD_COLORS[key].bar} maxHours={maxHours} />
                  )
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Adjust these estimates as you make progress.</p>
          </div>

          {/* Milestone Breakdown */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{fetchedMilestones.length > 0 ? 'Milestone Breakdown' : 'Suggested Breakdown'}</h3>
            {fetchedMilestones.length > 0 ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20 }}>
                {fetchedMilestones.map((m, i, arr) => (
                  <React.Fragment key={m.id}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#3C5E3318', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-primary)' }}>{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 4 }}>{m.title}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>{m.description || '—'}</p>
                      {m.estimated_hours && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--green-primary)', background: '#3C5E3318', padding: '2px 10px', borderRadius: 20 }}>
                          {m.estimated_hours}h
                        </span>
                      )}
                    </div>
                    {i < arr.length - 1 && (
                      <div style={{ paddingTop: 20, color: '#ccc', fontSize: 18 }}>→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                No milestones yet. Use "Create Milestones" to generate a breakdown with AI.
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--green-primary)' }}>✦</span>
                Break this down further into milestones and tasks to stay on track!
              </p>
              <button
                onClick={() => navigate('decompose', a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                  fontSize: 12.5, fontWeight: 600,
                }}>
                <Plus size={13} /> Create Milestones
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status + Progress */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Status</span>
              <StatusBadge status={a.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Progress</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>{progress}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#F0F0F0', marginBottom: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--green-primary)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {fetchedMilestones.length === 0 ? 'No milestones yet' : progress === 0 ? 'Not started yet' : progress === 100 ? 'Completed!' : 'In progress…'}
            </p>
          </div>

          {/* Milestones */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Milestones</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fetchedMilestones.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem('token');
                      const res = await fetch(`${API_URL}/api/assignments/${a.id}/milestones/${m.id}?token=${token}`, { method: 'PUT' });
                      if (res.ok) setFetchedMilestones(prev => prev.map(x => x.id === m.id ? { ...x, is_completed: !x.is_completed } : x));
                    }}
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: m.is_completed ? '#2E7D32' : 'var(--green-primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                      cursor: 'pointer', border: 'none',
                    }}
                  >
                    {m.is_completed ? '✓' : i + 1}
                  </button>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, textDecoration: m.is_completed ? 'line-through' : 'none', color: m.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{m.title}</p>
                    {m.due_date
                      ? <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      : m.estimated_hours
                        ? <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.estimated_hours}h estimated</p>
                        : null
                    }
                  </div>
                  <StatusBadge status={m.is_completed ? 'completed' : 'upcoming'} />
                </div>
              ))}
              {fetchedMilestones.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No milestones yet.</p>
              )}
            </div>
          </div>

          {/* Files — only show for pdf/txt uploads, not canvas assignments */}
          {a.source_filename && a.source !== 'canvas' && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: 14 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>Files</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileIcon type={a.source_filename.endsWith('.pdf') ? 'pdf' : 'doc'} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, fontWeight: 600 }}>{a.source_filename}</p>
                  <p style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Uploaded on {assigned}</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setEditing(false)}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: 32, width: 480,
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Edit Assignment</h2>

            {[
              { label: 'TITLE', key: 'title', type: 'text' },
              { label: 'COURSE', key: 'course', type: 'text', placeholder: 'e.g. CS2103T' },
              { label: 'DUE DATE', key: 'due_date', type: 'date' },
              { label: 'ESTIMATED HOURS', key: 'estimated_hours', type: 'number' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  type={type}
                  value={editForm[key]}
                  placeholder={placeholder || ''}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
              <textarea
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                style={{ background: 'var(--green-primary)', color: '#fff', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 13, opacity: editSaving ? 0.7 : 1 }}
              >
                {editSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{ border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}