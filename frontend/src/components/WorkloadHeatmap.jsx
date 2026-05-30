import React from 'react';
import { HEATMAP_DATA } from '../data/assignments';

const COLOR_MAP = {
  light:    { bg: '#C8E6C9', label: 'Light' },
  moderate: { bg: '#FFF176', label: 'Moderate' },
  high:     { bg: '#FFB74D', label: 'High' },
  veryhigh: { bg: '#E53935', label: 'Very High' },
};

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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
          </div>
        ))}
      </div>
    </div>
  );
}