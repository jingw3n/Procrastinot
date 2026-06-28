import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Pencil, ChevronDown, Calendar, Clock, Tag, BookOpen,
  FileText, File, Folder, Plus, Upload, MoreVertical, CheckCircle
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
  const progress = fetchedMilestones.length > 0
    ? Math.round((fetchedMilestones.filter(m => m.is_completed).length / fetchedMilestones.length) * 100)
    : 0;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !assignment?.id) return;
    fetch(`${API_URL}/api/assignments/${assignment.id}/milestones?token=${token}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFetchedMilestones(data); })
      .catch(() => {});
  }, [assignment?.id]);

  if (!assignment) {
    navigate('assignments');
    return null;
  }

  const a = assignment;
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
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          }}>
            <Pencil size={13} /> Edit Assignment
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          }}>
            More <ChevronDown size={13} />
          </button>
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
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{course} – {courseName}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green-primary)' }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: '#F5F5F5', color: '#555' }}>
                      {weightage} Weightage
                    </span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Estimated Workload</h3>
              <button style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Pencil size={12} /> Edit Estimate
              </button>
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

          {/* Suggested Breakdown */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Suggested Breakdown</h3>
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
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: m.is_completed ? '#2E7D32' : 'var(--green-primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, textDecoration: m.is_completed ? 'line-through' : 'none', color: m.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{m.title}</p>
                    {m.due_date && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                  </div>
                  <StatusBadge status={m.is_completed ? 'completed' : 'upcoming'} />
                </div>
              ))}
              {fetchedMilestones.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No milestones yet.</p>
              )}
            </div>
          </div>

          {/* Files — only show if a file was uploaded */}
          {a.source_filename && (
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
    </div>
  );
}