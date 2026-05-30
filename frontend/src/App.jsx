import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [page, setPage] = useState('dashboard');

  const navigate = (p) => {
    setPage(p);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} navigate={navigate} />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', overflow: 'auto' }}>
        {page === 'dashboard' && <Dashboard navigate={navigate} />}
      </main>
    </div>
  );
}