import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, ClipboardList, Upload,
  Grid2x2, LogOut, RefreshCw, ShieldCheck, Users, Menu, X
} from 'lucide-react';
import API_URL, { authFetch } from '../api';
import useIsMobile from '../hooks/useIsMobile';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'calendar',    label: 'Calendar',    icon: Calendar },
  { id: 'assignments', label: 'Assignments', icon: ClipboardList },
  { id: 'upload-pdf',  label: 'Upload PDF',  icon: Upload },
  { id: 'canvas-sync', label: 'Sync Canvas', icon: RefreshCw },
  { id: 'team',        label: 'Team',        icon: Users },
];

export default function Sidebar({ currentPage, navigate }) {
  const activePage = currentPage === 'assignment-detail' || currentPage === 'decompose' ? 'assignments' : currentPage;
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    authFetch(`${API_URL}/auth/me`)
      .then(r => r.json())
      .then(data => { if (data.is_admin) setIsAdmin(true); })
      .catch(() => {});
  }, []);

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  function handleNavigate(id) {
    navigate(id);
    if (isMobile) setOpen(false);
  }

  return (
    <>
      {isMobile && !open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 200,
            width: 38, height: 38, borderRadius: 8,
            background: '#fff', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Menu size={18} />
        </button>
      )}

      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 150 }}
        />
      )}

      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-white)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 0',
        zIndex: 200,
        transform: isMobile && !open ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.2s ease',
      }}>
        <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--green-primary)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Grid2x2 size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Procrastinot</span>
          </div>
          {isMobile && (
            <button onClick={() => setOpen(false)} style={{ padding: 4 }}>
              <X size={18} color="var(--text-secondary)" />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, padding: '0 8px' }}>
          {[...NAV_ITEMS, ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : [])].map(({ id, label, icon: Icon }) => {
            const active = activePage === id;
            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                  background: active ? 'var(--green-bg)' : 'transparent',
                  color: active ? 'var(--green-primary)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400, fontSize: 13.5,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '0 8px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8,
              color: 'var(--text-secondary)', fontSize: 13.5,
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}