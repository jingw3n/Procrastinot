import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Assignments from './pages/Assignments';
import AssignmentDetail from './pages/AssignmentDetail';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const navigate = (p, data = null) => {
    setPage(p);
    if (data) setSelectedAssignment(data);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar currentPage={page} navigate={navigate} />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', overflow: 'auto' }}>
        {page === 'dashboard' && <Dashboard navigate={navigate} />}
        {page === 'assignments' && <Assignments navigate={navigate} />}
        {page === 'assignment-detail' && <AssignmentDetail assignment={selectedAssignment} navigate={navigate} />}
      </main>
    </div>
  );
}
