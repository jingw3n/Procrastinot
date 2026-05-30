import React from 'react';
import { HEATMAP_DATA } from '../data/assignments';

const COLOR_MAP = {
  light:    { bg: '#C8E6C9', label: 'Light' },
  moderate: { bg: '#FFF176', label: 'Moderate' },
  high:     { bg: '#FFB74D', label: 'High' },
  veryhigh: { bg: '#E53935', label: 'Very High' },
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const heatData = {
  1:'vlow', 2:'vlow', 3:'vlow', 4:'vlow',
  5:'vlow', 6:'vlow', 7:'low', 8:'low', 9:'low', 10:'low', 11:'low',
  12:'vlow', 13:'vlow', 14:'low', 15:'medium', 16:'high', 17:'vhigh', 18:'medium',
  19:'vlow', 20:'vlow', 21:'medium', 22:'high', 23:'high', 24:'high', 25:'low',
  26:'vlow', 27:'vhigh', 28:'medium', 29:'high', 30:'vhigh', 31:'vhigh'
}

const heatColors = {
  none: '#EDEDEC',
  vlow: '#B8DDB8',
  low: '#D4E8A0',
  medium: '#F5D07A',
  high: '#F0956A',
  vhigh: '#E05A3A'
}

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const grid = [
  [{m:'prev',d:28},{m:'prev',d:29},{m:'prev',d:30},{m:'cur',d:1},{m:'cur',d:2},{m:'cur',d:3},{m:'cur',d:4}],
  [{m:'cur',d:5},{m:'cur',d:6},{m:'cur',d:7},{m:'cur',d:8},{m:'cur',d:9},{m:'cur',d:10},{m:'cur',d:11}],
  [{m:'cur',d:12},{m:'cur',d:13},{m:'cur',d:14},{m:'cur',d:15},{m:'cur',d:16},{m:'cur',d:17},{m:'cur',d:18}],
  [{m:'cur',d:19},{m:'cur',d:20},{m:'cur',d:21},{m:'cur',d:22},{m:'cur',d:23},{m:'cur',d:24},{m:'cur',d:25}],
  [{m:'cur',d:26},{m:'cur',d:27},{m:'cur',d:28},{m:'cur',d:29},{m:'cur',d:30},{m:'cur',d:31},{m:'next',d:1}],
]

export default function WorkloadHeatmap() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        <div />
        {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => (
          <div key={d} style={{ fontSize: 10, color: '#888', textAlign: 'center', fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {HEATMAP_DATA.map((row) => (
        <div key={row.week} style={{ display: 'grid', gridTemplateColumns: '70px repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          <div style={{ fontSize: 10, color: '#888', display: 'flex', alignItems: 'center' }}>{row.week}</div>
          {DAY_KEYS.map(day => (
            <div
              key={day}
              title={COLOR_MAP[row[day]]?.label}
              style={{ height: 20, borderRadius: 4, background: COLOR_MAP[row[day]]?.bg || '#E8F5E9' }}
            />
          ))}
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', marginTop: 8 }}>
        {Object.entries(COLOR_MAP).map(([key, { bg, label }]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: bg }} />
            <span style={{ fontSize: 11, color: '#666' }}>{label}</span>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
        {days.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#999', letterSpacing: '0.05em' }}>{d}</div>
        ))}
      </div>

      {/* Calendar rows */}
      {grid.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
          {week.map(({ m, d }, i) => {
            const heat = m === 'cur' && heatData[d] ? heatData[d] : 'none'
            const bg = heatColors[heat]
            const isLight = heat === 'none' || heat === 'vlow' || heat === 'low' || heat === 'medium'
            return (
              <div key={i} style={{
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
              }}>
                {d}
              </div>
            )
          })}
        </div>
      ))}

      {/* Legend */}
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
  );
  )
}