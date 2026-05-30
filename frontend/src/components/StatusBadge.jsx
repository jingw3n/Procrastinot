import React from 'react';

const STYLES = {
  upcoming: { bg: '#FFF3E0', color: '#E65100', border: '#FFE0B2' },
  overdue:  { bg: '#FFEBEE', color: '#C62828', border: '#FFCDD2' },
  completed:{ bg: '#E8F5E9', color: '#2E7D32', border: '#C8E6C9' },
  inprogress:{ bg: '#E3F2FD', color: '#1565C0', border: '#BBDEFB' },
};

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.upcoming;
  const label = status === 'inprogress' ? 'In Progress'
    : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}
