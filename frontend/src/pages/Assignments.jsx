import React, { useState } from 'react';
import { Plus, Search, ChevronDown, Filter, BarChart2, Calendar, AlertCircle, ClipboardList } from 'lucide-react';
import { ASSIGNMENTS } from '../data/assignments';
import StatusBadge from '../components/StatusBadge';
import AssignmentIcon from '../components/AssignmentIcon';
import WorkloadHeatmap from '../components/WorkloadHeatmap';

const TABS = ['All Assignments', 'Upcoming', 'Overdue', 'Completed'];

export default function Assignments({ navigate }) {
  const [activeTab, setActiveTab] = useState('All Assignments');
  const [search, setSearch] = useState('');

  const filtered = ASSIGNMENTS.filter(a => {
    const matchTab =
      activeTab === 'All Assignments' ? true :
      activeTab === 'Upcoming'  ? a.status === 'upcoming' :
      activeTab === 'Overdue'   ? a.status === 'overdue' :
      a.status === 'completed';
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.course.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const upcomingCount = ASSIGNMENTS.filter(a => a.status === 'upcoming').length;
  const overdueCount  = ASSIGNMENTS.filter(a => a.status === 'overdue').length;

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Assignments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>View and manage all your assignments in one place.</p>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--green-primary)', color: '#fff',
          padding: '10px 18px', borderRadius: 8, fontWeight: 600, fontSize: 13,
        }}>
          <Plus size={15} /> Add Assignment
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--green-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--green-primary)' : '2px solid transparent',
              fontSize: 13.5,
              transition: 'all 0.15s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Main content */}
        <div style={{ flex: 1 }}>
          {/* Summary cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Upcoming Deadlines', value: upcomingCount, color: '#F57C00', bg: '#FFF3E0', icon: Calendar },
              { label: 'Overdue Deadlines',  value: overdueCount,  color: '#D32F2F', bg: '#FFEBEE', icon: AlertCircle },
              { label: 'Total Assignments',  value: ASSIGNMENTS.length, color: '#2E7D32', bg: '#EBF0E9', icon: ClipboardList },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14, flex: 1,
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <c.icon size={20} color={c.color} strokeWidth={1.8} />
                </div>
                <div>
                  <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{c.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#FAFAFA' }}>
                  {['Assignment', 'Course', 'Assigned', 'Due Date', 'Status', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                      letterSpacing: '0.02em',
                    }}>
                      {h && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {h}
                          {['Assignment','Due Date'].includes(h) && <ChevronDown size={12} />}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, idx) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate('assignment-detail', a)}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#F7F8FA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AssignmentIcon type={a.type} size={30} />
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: 600, fontSize: 13 }}>{a.course}</p>
                      <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{a.courseName}</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>{a.assigned}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{
                        fontWeight: 600, fontSize: 13,
                        color: a.status === 'overdue' ? 'var(--red)' :
                               a.status === 'completed' ? 'var(--text-secondary)' : 'var(--orange)',
                      }}>
                        {a.dueDate}
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {a.status === 'overdue' ? `${Math.abs(a.daysLeft)} days overdue` :
                         a.status === 'completed' ? '' : `${a.daysLeft} days left`}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={a.status} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button style={{ color: 'var(--text-muted)', padding: 4, borderRadius: 4 }}>
                        ···
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing 1 to {filtered.length} of {ASSIGNMENTS.length} assignments
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {['‹', '1', '2', '3', '›'].map((p, i) => (
                <button key={i} style={{
                  width: 30, height: 30, borderRadius: 6, fontSize: 13,
                  background: p === '1' ? 'var(--green-primary)' : '#fff',
                  color: p === '1' ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  fontWeight: p === '1' ? 600 : 400,
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters sidebar */}
        <div style={{ width: 240, flexShrink: 0 }}>
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Filter size={14} color="var(--text-secondary)" />
              <span style={{ fontWeight: 700, fontSize: 14 }}>Filters</span>
            </div>

            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search assignments..."
                style={{
                  width: '100%', padding: '8px 10px 8px 30px',
                  border: '1px solid var(--border)', borderRadius: 7, fontSize: 12.5,
                  outline: 'none', color: 'var(--text-primary)',
                }}
              />
            </div>

            {['All Courses', 'All Statuses', 'All Types'].map(label => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px',
                marginBottom: 8, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{label}</span>
                <ChevronDown size={13} color="#bbb" />
              </div>
            ))}
          </div>

          {/* Heatmap */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Workload Heatmap</span>
              <BarChart2 size={13} color="var(--text-muted)" />
            </div>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>Darker days indicate higher accumulated workload.</p>
            <WorkloadHeatmap />
          </div>

          {/* Workload insight */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Workload Insights</span>
              <BarChart2 size={13} color="var(--green-primary)" />
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              6 assignments due — one step at a time.
            </p>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>You've got this! 💚</p>
          </div>
        </div>
      </div>
    </div>
  );
}