import { useState } from 'react'
import WorkloadHeatmap from '../components/WorkloadHeatmap'

function computeBusyPeriod(hoursMap) {
  if (!hoursMap || Object.keys(hoursMap).length === 0) return null

  // Find all dates with high or very high workload
  const busyDates = Object.entries(hoursMap)
    .filter(([, hours]) => hours >= 4)
    .map(([date]) => date)
    .sort()

  if (busyDates.length === 0) return null

  // Find the longest consecutive stretch
  let bestStart = busyDates[0]
  let bestEnd = busyDates[0]
  let curStart = busyDates[0]
  let curEnd = busyDates[0]

  for (let i = 1; i < busyDates.length; i++) {
    const prev = new Date(busyDates[i - 1])
    const curr = new Date(busyDates[i])
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24)

    if (diffDays <= 2) {
      // Allow 1-day gaps so weekends don't break the streak
      curEnd = busyDates[i]
    } else {
      if (new Date(curEnd) - new Date(curStart) > new Date(bestEnd) - new Date(bestStart)) {
        bestStart = curStart
        bestEnd = curEnd
      }
      curStart = busyDates[i]
      curEnd = busyDates[i]
    }
  }

  if (new Date(curEnd) - new Date(curStart) > new Date(bestEnd) - new Date(bestStart)) {
    bestStart = curStart
    bestEnd = curEnd
  }

  return { start: new Date(bestStart), end: new Date(bestEnd) }
}

function formatBusyDate(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export default function Calendar({ navigate }) {
  const [view, setView] = useState('month')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [busyPeriod, setBusyPeriod] = useState(null)

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  const handleHoursMapReady = (hoursMap) => {
    const period = computeBusyPeriod(hoursMap)
    setBusyPeriod(period)
  }

  return (
    <div style={{ padding: '32px 40px 32px 60px', maxWidth: 1100 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'white', border: '1px solid var(--border)',
            borderRadius: 8, padding: '7px 14px', fontSize: 14, fontWeight: 500
          }}>
            📅 {monthName}
          </div>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 16 }}>
            ‹
          </button>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontSize: 16 }}>
            ›
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {['month', 'week', 'list'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '7px 18px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            background: view === v ? 'var(--green-primary)' : 'transparent',
            color: view === v ? 'white' : 'var(--text-secondary)',
            border: 'none'
          }}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* HEATMAP CARD */}
      <div style={{ background: 'white', borderRadius: 14, padding: 28, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Workload Heatmap</span>
          <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #999', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#999', cursor: 'pointer' }}>i</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          See your workload intensity each day. Darker red means more workload.
        </p>
        <WorkloadHeatmap
          year={currentMonth.getFullYear()}
          month={currentMonth.getMonth()}
          onHoursMapReady={handleHoursMapReady}
        />
      </div>

      {/* BUSY PERIOD */}
      <div style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, background: '#E8F5E9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📅</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Predicted Busy Period</p>
            {busyPeriod ? (
              <>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--green-primary)', marginBottom: 4 }}>
                  {formatBusyDate(busyPeriod.start)} – <span style={{ color: '#F57C00' }}>{formatBusyDate(busyPeriod.end)}</span>
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>High workload due to overlapping deadlines.</p>
              </>
            ) : (
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>No busy periods detected. You're on track! 🎉</p>
            )}
          </div>
          <span style={{ fontSize: 24 }}>📈</span>
        </div>
      </div>

    </div>
  )
}