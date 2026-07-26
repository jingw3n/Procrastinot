import { useState, useEffect } from 'react'
import API_URL, { authFetch } from '../api'

const heatColors = {
  none: '#EDEDEC',
  vlow: '#B8DDB8',
  low: '#D4E8A0',
  medium: '#F5D07A',
  high: '#F0956A',
  vhigh: '#E05A3A'
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function buildHeatData(assignments) {
  const hoursMap = {}

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  assignments.forEach(({ created_at, due_date, estimated_hours }) => {
    if (!due_date || !estimated_hours) return

    const created = new Date(created_at)
    // Start from today or created_at, whichever is later
    const start = created > today ? created : today
    const end = new Date(due_date)
    end.setHours(0, 0, 0, 0)

    if (end <= start) return // already overdue or due today, skip

    const msPerDay = 1000 * 60 * 60 * 24
    const numDays = Math.max(1, Math.round((end - start) / msPerDay) + 1)

    // Deadline-weighted: hours_on_day_i = estimated_hours * i / sum(1..n)
    const weightSum = (numDays * (numDays + 1)) / 2

    for (let i = 0; i < numDays; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = d.toISOString().split('T')[0]
      const dayHours = estimated_hours * (i + 1) / weightSum
      hoursMap[key] = (hoursMap[key] || 0) + dayHours
    }
  })

  return hoursMap
}

function getIntensity(hours) {
  if (!hours || hours === 0) return 'none'
  if (hours < 2) return 'vlow'
  if (hours < 4) return 'low'
  if (hours < 6) return 'medium'
  if (hours < 9) return 'high'
  return 'vhigh'
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  let startDow = firstDay.getDay()
  startDow = (startDow + 6) % 7

  const grid = []
  let week = []

  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    week.push({ m: 'prev', d: prevMonthLast - i })
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push({ m: 'cur', d })
    if (week.length === 7) {
      grid.push(week)
      week = []
    }
  }

  if (week.length > 0) {
    let nextDay = 1
    while (week.length < 7) {
      week.push({ m: 'next', d: nextDay++ })
    }
    grid.push(week)
  }

  return grid
}

export default function WorkloadHeatmap({ year, month, navigate, onHoursMapReady }) {
  const now = new Date()
  const displayYear = year ?? now.getFullYear()
  const displayMonth = month ?? now.getMonth()

  const [hoursMap, setHoursMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch(`${API_URL}/api/assignments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const map = buildHeatData(data.filter(a => a.status !== 'completed'))
          setHoursMap(map)
          if (onHoursMapReady) onHoursMapReady(map)
        }
      })
      .catch(err => console.error('Failed to fetch assignments:', err))
      .finally(() => setLoading(false))
  }, [])

  const grid = getCalendarGrid(displayYear, displayMonth)

  if (loading) {
    return <div style={{ color: '#999', fontSize: 14 }}>Loading heatmap...</div>
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>

      {grid.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
          {week.map(({ m, d }, i) => {
            const dateKey = m === 'cur'
              ? `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              : null
            const isPast = dateKey && new Date(dateKey) < new Date(new Date().toISOString().split('T')[0])
            const hours = dateKey ? hoursMap[dateKey] : 0
            const heat = m === 'cur' && !isPast ? getIntensity(hours) : 'none'
            const bg = heatColors[heat]
            const isLight = heat === 'none' || heat === 'vlow' || heat === 'low' || heat === 'medium'

            return (
              <div
                key={i}
                title={dateKey && hours ? `~${hours.toFixed(1)} hrs` : ''}
                style={{
                  aspectRatio: '1',
                  borderRadius: '50%',
                  background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 500,
                  color: isLight ? '#333' : 'white',
                  opacity: m !== 'cur' ? 0.4 : 1,
                  cursor: 'pointer',
                  maxWidth: 44,
                  margin: '0 auto',
                  width: '100%'
                }}
              >
                {d}
              </div>
            )
          })}
        </div>
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#666' }}>Workload intensity</span>
        {[['vlow','#B8DDB8','Very Low'], ['low','#D4E8A0','Low'], ['medium','#F5D07A','Medium'], ['high','#F0956A','High'], ['vhigh','#E05A3A','Very High']].map(([,color,label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#666' }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: color }}></div>
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}