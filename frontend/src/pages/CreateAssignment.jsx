import { useState } from 'react'
import { ArrowLeft, Check, Loader } from 'lucide-react'
import API_URL from '../api'

export default function CreateAssignment({ navigate }) {
  const [form, setForm] = useState({
    title: '',
    course: '',
    due_date: '',
    estimated_hours: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }

    setSaving(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API_URL}/api/assignments?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || null,
          due_date: form.due_date ? `${form.due_date}T00:00:00` : null,
          estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
          course: form.course.trim() || null,
          source: 'manual',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Failed to create assignment.'); return }
      navigate('assignment-detail', data)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setSaving(false)
    }
  }

  const fieldStyle = {
    width: '100%', padding: '9px 12px',
    border: '1px solid var(--border)', borderRadius: 8,
    fontSize: 13.5, color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box',
    background: '#FAFAFA',
  }

  const labelStyle = {
    fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
    letterSpacing: '0.05em', display: 'block', marginBottom: 5,
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: 600 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => navigate('assignments')}
          style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
        >
          <ArrowLeft size={15} /> Back
        </button>
      </div>

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>New Assignment</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Add an assignment manually. You can decompose it into milestones after saving.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>

          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>TITLE *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. CS2103T Final Project"
              style={fieldStyle}
              autoFocus
            />
          </div>

          {/* Course */}
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>COURSE</label>
            <input
              type="text"
              value={form.course}
              onChange={e => set('course', e.target.value)}
              placeholder="e.g. CS2103T"
              style={fieldStyle}
            />
          </div>

          {/* Due Date + Hours — side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>DUE DATE</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => set('due_date', e.target.value)}
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>ESTIMATED HOURS</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimated_hours}
                onChange={e => set('estimated_hours', e.target.value)}
                placeholder="e.g. 8"
                style={fieldStyle}
              />
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the assignment..."
              rows={4}
              style={{ ...fieldStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {error && <p style={{ color: '#D32F2F', fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'var(--green-primary)', color: '#fff',
              padding: '11px 28px', borderRadius: 8, fontWeight: 600, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><Check size={14} /> Create Assignment</>}
          </button>
          <button
            type="button"
            onClick={() => navigate('assignments')}
            style={{
              border: '1px solid var(--border)', padding: '11px 20px',
              borderRadius: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
        </div>
      </form>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
