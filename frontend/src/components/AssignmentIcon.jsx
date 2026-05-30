import React from 'react';
import { FileText, ClipboardList, BookOpen, PenTool, FileCheck, HelpCircle, BookMarked } from 'lucide-react';

const TYPE_MAP = {
  lab:        { icon: FileText,     bg: '#EDE7F6', color: '#6A1B9A' },
  project:    { icon: ClipboardList,bg: '#E8F5E9', color: '#2E7D32' },
  assignment: { icon: FileText,     bg: '#E3F2FD', color: '#1565C0' },
  paper:      { icon: PenTool,      bg: '#FFF8E1', color: '#F57F17' },
  report:     { icon: FileCheck,    bg: '#FFEBEE', color: '#C62828' },
  quiz:       { icon: HelpCircle,   bg: '#FFEBEE', color: '#C62828' },
  journal:    { icon: BookMarked,   bg: '#FFEBEE', color: '#C62828' },
  summary:    { icon: FileText,     bg: '#F5F5F5', color: '#616161' },
};

export default function AssignmentIcon({ type, size = 36 }) {
  const t = TYPE_MAP[type] || TYPE_MAP.assignment;
  const Icon = t.icon;
  return (
    <div style={{
      width: size, height: size,
      borderRadius: 8,
      background: t.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={size * 0.44} color={t.color} strokeWidth={1.8} />
    </div>
  );
}
