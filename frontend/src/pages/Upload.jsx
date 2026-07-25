import React, { useState, useRef } from 'react'
import { Upload, FileText, Check, X, ChevronDown, ChevronUp, Loader } from 'lucide-react'
import API_URL from '../api'

function EditableField({ label, value, onChange, type = 'text' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
        {label}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '7px 10px',
          border: '1px solid var(--border)', borderRadius: 7,
          fontSize: 13, color: 'var(--text-primary)',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

function localDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function spreadDates(milestones, dueDateStr) {
  if (!dueDateStr || milestones.length === 0) return milestones
  const parts = dueDateStr.split('-').map(Number)
  if (parts.length !== 3) return milestones
  const due = new Date(parts[0], parts[1] - 1, parts[2])
  if (isNaN(due.getTime())) return milestones
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const totalMs = due.getTime() - today.getTime()
  const n = milestones.length
  return milestones.map((m, i) => {
    const fraction = (i + 1) / (n + 1)
    const d = new Date(today.getTime() + fraction * totalMs)
    return { ...m, due_date: localDateStr(d) }
  })
}

function AssignmentCard({ assignment, index, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(true)

  const update = (field, value) => {
    let updated = { ...assignment, [field]: value }
    if (field === 'due_date' && value && updated.milestones?.length > 0) {
      updated.milestones = spreadDates(updated.milestones, value)
    }
    onChange(index, updated)
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', marginBottom: 12,
      boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', cursor: 'pointer',
        borderBottom: expanded ? '1px solid var(--border)' : 'none',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={16} color="var(--green-primary)" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{assignment.title || 'Untitled Assignment'}</span>
          {assignment.course && (
            <span style={{
              fontSize: 11, background: 'var(--green-bg)', color: 'var(--green-primary)',
              padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            }}>{assignment.course}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onRemove(index) }}
            style={{ color: '#D32F2F', padding: 4, borderRadius: 4, lineHeight: 1 }}
          >
            <X size={15} />
          </button>
          {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px 18px' }}>
          <EditableField label="TITLE" value={assignment.title} onChange={v => update('title', v)} />
          <EditableField label="COURSE" value={assignment.course} onChange={v => update('course', v)} />
          <EditableField label="DUE DATE" value={assignment.due_date} onChange={v => update('due_date', v)} type="date" />
          <EditableField label="ESTIMATED HOURS" value={assignment.estimated_hours} onChange={v => update('estimated_hours', v)} type="number" />
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 3 }}>
              DESCRIPTION
            </label>
            <textarea
              value={assignment.description ?? ''}
              onChange={e => update('description', e.target.value)}
              rows={3}
              style={{
                width: '100%', padding: '7px 10px',
                border: '1px solid var(--border)', borderRadius: 7,
                fontSize: 13, color: 'var(--text-primary)',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {assignment.milestones && assignment.milestones.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>MILESTONES</p>
              {assignment.milestones.map((m, mi) => (
                <div key={mi} style={{
                  background: '#F7F8FA', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
                }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.title}</p>
                    {m.due_date && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due: {m.due_date}</p>}
                    {m.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.description}</p>}
                  </div>
                  <button
                    onClick={() => {
                      const remaining = assignment.milestones.filter((_, i) => i !== mi)
                      onChange(index, { ...assignment, milestones: spreadDates(remaining, assignment.due_date) })
                    }}
                    style={{ color: '#D32F2F', opacity: 0.5, padding: 2, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.5}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function UploadPDF({ navigate }) {
  const [file, setFile] = useState(null)
  const [pastedText, setPastedText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef()

  const handleFile = f => {
    if (!f || (!f.name.endsWith('.pdf') && !f.name.endsWith('.txt'))) {
      setError('Please upload a PDF or TXT file.')
      return
    }
    setFile(f)
    setError('')
    setExtracted(null)
    setSaved(false)
  }

  const handleDrop = e => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleExtract = async () => {
    if (!file && !pastedText.trim()) return
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      let res

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        res = await fetch(`${API_URL}/api/upload-pdf?token=${token}`, {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch(`${API_URL}/api/upload-text?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: pastedText }),
        })
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Extraction failed.')
        return
      }
      setExtracted(data.extracted.map(a => {
        if (a.due_date && a.milestones?.length > 0) {
          return {
            ...a,
            milestones: spreadDates(
              a.milestones.map(m => m.due_date ? m : { ...m, due_date: null }),
              a.due_date
            )
          }
        }
        return a
      }))
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (index, updated) => {
    setExtracted(prev => prev.map((a, i) => i === index ? updated : a))
  }

  const handleRemove = index => {
    setExtracted(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirm = async () => {
    if (!extracted || extracted.length === 0) return
    setSaving(true)
    setError('')
    const token = localStorage.getItem('token')

    try {
      const res = await fetch(`${API_URL}/api/confirm-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, assignments: extracted, filename: file ? file.name : 'Pasted text' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.detail || 'Failed to save.')
        return
      }
      setSaved(true)
      setTimeout(() => navigate('assignments'), 1500)
    } catch {
      setError('Could not connect to server.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '36px 40px', maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Upload PDF</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload a course outline or assignment sheet to extract deadlines automatically.</p>
      </div>

      {!extracted && (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
            style={{
              border: `2px dashed ${dragging ? 'var(--green-primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '48px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--green-bg)' : '#FAFAFA',
              transition: 'all 0.15s',
              marginBottom: 20,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
            <Upload size={32} color="var(--green-primary)" style={{ marginBottom: 12 }} />
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {file ? file.name : 'Drag & drop a PDF here'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {file ? 'Click to change file' : 'or click to browse — PDF or TXT, max 10MB'}
            </p>
          </div>

          {/* Paste text */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Or paste your text</p>
            <textarea
              value={pastedText}
              onChange={e => { setPastedText(e.target.value); setFile(null) }}
              placeholder="Paste assignment details, course outline, or any text here..."
              rows={6}
              style={{
                width: '100%', padding: '12px 14px',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                fontSize: 13, color: 'var(--text-primary)',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                background: '#FAFAFA',
              }}
            />
          </div>
        </>
      )}

      {error && (
        <p style={{ color: '#D32F2F', fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}

      {(file || pastedText.trim()) && !extracted && (
        <button
          onClick={handleExtract}
          disabled={loading}
          style={{
            background: 'var(--green-primary)', color: '#fff',
            padding: '11px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Extracting...</>
            : <><Upload size={15} /> Extract Assignments</>}
        </button>
      )}

      {extracted && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Review Extracted Assignments</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Edit any details before saving.</p>
            </div>
            <button
              onClick={() => { setExtracted(null); setFile(null); setPastedText(''); setSaved(false) }}
              style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={13} /> Start over
            </button>
          </div>

          {extracted.map((a, i) => (
            <AssignmentCard
              key={i}
              assignment={a}
              index={i}
              onChange={handleChange}
              onRemove={handleRemove}
            />
          ))}

          {extracted.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              All assignments removed.{' '}
              <button
                onClick={() => { setExtracted(null); setFile(null); setPastedText('') }}
                style={{ color: 'var(--green-primary)', fontWeight: 600 }}
              >
                Start over
              </button>
            </p>
          )}

          {extracted.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={handleConfirm}
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
                  : saving
                  ? 'Saving...'
                  : <><Check size={15} /> Save {extracted.length} Assignment{extracted.length > 1 ? 's' : ''}</>}
              </button>
              <button
                onClick={() => navigate('assignments')}
                style={{
                  border: '1px solid var(--border)', padding: '11px 20px',
                  borderRadius: 8, fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
