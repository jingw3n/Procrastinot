import React from 'react';
import {
  LayoutDashboard, Calendar, BookOpen, ClipboardList,
  BarChart2, Users, Bell, Settings, HelpCircle, Grid2x2, LogOut
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentPage, navigate }) {
  const activePage = currentPage === 'assignment-detail' ? 'assignments' : currentPage;

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-white)',
      borderRight: '1px solid var(--border)',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--green-primary)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Grid2x2 size={16} color="white" />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Procrastinot</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 8px' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 10px',
                borderRadius: 8,
                marginBottom: 2,
                background: active ? 'var(--green-bg)' : 'transparent',
                color: active ? 'var(--green-primary)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 13.5,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '0 8px' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 8,
          color: 'var(--text-secondary)', fontSize: 13.5,
        }}>
          <HelpCircle size={16} strokeWidth={1.8} />
          Need help?
        </button>
        <p style={{ fontSize: 11.5, color: 'var(--green-primary)', paddingLeft: 10, fontWeight: 500 }}>
          View Tutorial
        </p>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, marginTop: 4,
            color: 'var(--text-secondary)', fontSize: 13.5,
          }}
        >
          <LogOut size={16} strokeWidth={1.8} />
          Log Out
        </button>
      </div>
    </aside>
  );
}