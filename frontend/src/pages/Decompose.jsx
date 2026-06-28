import React, { useState, useEffect } from 'react'
import { ArrowLeft, Loader, Check, X, Plus, Trash2 } from 'lucide-react'
import API_URL from '../api'

function MilestoneCard({ milestone, index, onChange, onRemove }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '16px 18px',
      marginBottom: 10, boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--green-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>{index + 1}</div>
        <input
          value={milestone.title}
          onChange={e => onChange(index, { ...milestone, title: e.target.value })}
          style={{
            flex: 1, padding: '6px 10px', border: '1px solid var(--border)',
            borderRadius: 7, fontSize: 13, fontWeight: 600, outline: 'none',
          }}
        />
        <button onClick={() => onRemove(index)} style={{ color: '#D32F2F', padding: 4 }}>
          <Trash2 size={14} />
        </button>
      </div>
      <textarea
        value={milestone.description || ''}
        onChange={e => onChange(index, { ...milestone, description: e.target.value })}
        rows={2}
        placeholder="Description..."
        style={{
          width: '100%', padding: '7px 10px', border: '1px solid var(--border)',
          borderRadius: 7, fontSize: 12.5, outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', color: 'var(--text-secondary)',
        }}
      />
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>DUE DATE</label>
          <input
            type="date"
            value={milestone.due_date || ''}
            onChange={e => onChange(index, { ...milestone, due_date: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box', marginTop: 2 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>EST. HOURS</label>
          <input
            type="number"
            value={milestone.estimated_hours || ''}
            onChange={e => onChange(index, { ...milestone, estimated_hours: e.target.value })}
            style={{ display: 'block', width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12.5, outline: 'none', boxSizing: 'border-box', marginTop: 2 }}
          />
        </div>
      </div>
    </div>
  )
}

function MilestoneChecklist({ milestones, assignmentId, onUpdate }) {
  const token = localStorage.getItem('token')
  const completed = milestones.filter(m => m.is_completed).length
  const pct = milestones.length ? Math.round((completed / milestones.length) * 100) : 0

  const toggle = async (m) => {
    const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/milestones/${m.id}?token=${token}`, {
      method: 'PUT',
    })
    if (res.ok) onUpdate()
  }

  const remove = async (m) => {
    const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/milestones/${m.id}?token=${token}`, {
      method: 'DELETE',
    })
    if (res.ok) onUpdate()
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-primary)' }}>{pct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: '#F0F0F0', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green-primary)', borderRadius: 5, transition: 'width 0.3s' }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{completed} of {milestones.length} milestones completed</p>
      </div>

      {milestones.map((m) => (
        <div key={m.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 16px', background: '#fff',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          marginBottom: 8, boxShadow: 'var(--shadow-sm)',
          opacity: m.is_completed ? 0.7 : 1,
        }}>
          <button
            onClick={() => toggle(m)}
            style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${m.is_completed ? 'var(--green-primary)' : 'var(--border)'}`,
              background: m.is_completed ? 'var(--green-primary)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 1,
            }}
          >
            {m.is_completed && <Check size={12} color="#fff" strokeWidth={3} />}
          </button>
          <div style={{ flex: 1 }}>
            <p style={{
              fontWeight: 600, fontSize: 13.5,
              textDecoration: m.is_completed ? 'line-through' : 'none',
              color: m.is_completed ? 'var(--text-muted)' : 'var(--text-primary)',
            }}>{m.title}</p>
            {m.description && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</p>}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {m.due_date && <span style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>Due: {new Date(m.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
              {m.estimated_hours && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.estimated_hours}h</span>}
            </div>
          </div>
          <button onClick={() => remove(m)} style={{ color: '#ccc', padding: 2 }}>
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function Decompose({ assignment, navigate }) {
  const [numMilestones, setNumMilestones] = useState(4)
  const [suggested, setSuggested] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingMilestones, setExistingMilestones] = useState([])
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  useEffect(() => {
    if (assignment?.id) fetchMilestones()
  }, [assignment])

  const fetchMilestones = async () => {
    const res = await fetch(`${API_URL}/api/assignments/${assignment.id}/milestones?token=${token}`)
    if (res.ok) {
      const data = await res.json()
      setExistingMilestones([...data].sort((a, b) => {
        if (!a.due_date && !b.due_date) return a.id - b.id;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }))
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/assignments/${assignment.id}/decompose?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ num_milestones: numMilestones }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Failed to generate.'); return }
      setSuggested(data.milestones)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (index, updated) => {
    setSuggested(prev => prev.map((m, i) => i === index ? updated : m))
  }

  const handleRemove = (index) => {
    setSuggested(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddBlank = () => {
    setSuggested(prev => [...prev, { title: '', description: '', due_date: null, estimated_hours: null }])
  }

  const handleSave = async () => {
    if (!suggested || suggested.length === 0) return
    setSaving(true)
    setError('')
    try {
      for (const m of suggested) {
        await fetch(`${API_URL}/api/assignments/${assignment.id}/milestones?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: m.title,
            description: m.description || null,
            due_date: m.due_date ? `${m.due_date}T00:00:00` : null,
            estimated_hours: m.estimated_hours ? parseFloat(m.estimated_hours) : null,
            is_completed: false,
          }),
        })
      }
      setSaved(true)
      setSuggested(null)
      await fetchMilestones()
    } catch {
      setError('Could not connect to server.')
    } finally {
      setSaving(false)
    }
  }

  if (!assignment) {
    navigate('assignments')
    return null
  }

  return (
    <div style={{ padding: '28px 40px', maxWidth: 700 }}>
      <button
        onClick={() => navigate('assignments')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, marginBottom: 24 }}
      >
        <ArrowLeft size={15} /> Back to Assignments
      </button>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{assignment.title}</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Break this assignment into milestones and track your progress.</p>
      </div>

      {existingMilestones.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Your Milestones</h2>
          <MilestoneChecklist
            milestones={existingMilestones}
            assignmentId={assignment.id}
            onUpdate={fetchMilestones}
          />
        </div>
      )}

      {!suggested && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            {existingMilestones.length > 0 ? 'Generate More Milestones' : 'Generate Milestones with AI'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Claude will suggest a breakdown based on your assignment details.
          </p>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              NUMBER OF MILESTONES
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <input
                type="range"
                min={2} max={10}
                value={numMilestones}
                onChange={e => setNumMilestones(+e.target.value)}
                style={{ flex: 1, accentColor: 'var(--green-primary)' }}
              />
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-primary)', minWidth: 28, textAlign: 'center' }}>
                {numMilestones}
              </span>
            </div>
          </div>

          {error && <p style={{ color: '#D32F2F', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              background: 'var(--green-primary)', color: '#fff',
              padding: '11px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              : '✦ Generate with AI'}
          </button>
        </div>
      )}

      {suggested && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Review Suggested Milestones</h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Edit, remove, or add milestones before saving.</p>
            </div>
            <button
              onClick={() => setSuggested(null)}
              style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={13} /> Regenerate
            </button>
          </div>

          {suggested.map((m, i) => (
            <MilestoneCard key={i} milestone={m} index={i} onChange={handleChange} onRemove={handleRemove} />
          ))}

          <button
            onClick={handleAddBlank}
            style={{
              width: '100%', padding: '9px', borderRadius: 8,
              border: '1px dashed var(--border)', fontSize: 13, fontWeight: 600,
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, marginBottom: 16,
            }}
          >
            <Plus size={13} /> Add Milestone
          </button>

          {error && <p style={{ color: '#D32F2F', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                background: saved ? '#2E7D32' : 'var(--green-primary)',
                color: '#fff', padding: '11px 28px', borderRadius: 8,
                fontWeight: 600, fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saved
                ? <><Check size={15} /> Saved!</>
                : saving ? 'Saving...'
                : <><Check size={15} /> Save {suggested.length} Milestone{suggested.length !== 1 ? 's' : ''}</>}
            </button>
            <button
              onClick={() => setSuggested(null)}
              style={{
                border: '1px solid var(--border)', padding: '11px 20px',
                borderRadius: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
