import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UsersList from './UsersList';
import AdminStats from './AdminStats';
import UserDetail from './UserDetail';
import UserCreate from './UserCreate';
import AuditLog from './AuditLog';
import SecurityKyc from './SecurityKyc';
import ReportingPerformance from './ReportingPerformance';
import AdminMessages from './AdminMessages';

const AdminDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="flex items-center gap-2 text-primary">
            <span className="text-3xl">⚡</span> Kredia
          </h2>
        </div>
        
        <div className="user-profile-sm">
          <div className="avatar">
            {currentUser?.firstName?.[0] || 'A'}{currentUser?.lastName?.[0] || 'U'}
          </div>
          <div className="user-info">
            <p className="name">Hello, {currentUser?.firstName || 'Admin'}</p>
            <p className="badge badge-admin">{currentUser?.email || 'admin@kredia.com'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">📊</span> Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">👥</span> User Management
          </NavLink>
          <NavLink to="/admin/security" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">🛡️</span> Security & KYC
          </NavLink>
          <NavLink to="/admin/audit" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">📝</span> System Audit Log
          </NavLink>
          <NavLink to="/admin/reports" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">📈</span> Performance
          </NavLink>
          <NavLink to="/admin/messages" className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}>
            <span className="mr-3 text-lg">💬</span> Messages
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-outline btn-full flex justify-center items-center gap-2">
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="w-1/3">
            <input 
              type="text" 
              placeholder="Find something here..." 
              className="bg-white rounded-full px-5 py-3 w-full border-none shadow-sm focus:ring-2 focus:ring-primary"
              style={{ borderRadius: '9999px', boxShadow: '0px 4px 10px rgba(0,0,0,0.02)' }}
            />
          </div>
          
          <div className="topbar-actions text-sm font-semibold text-muted">
            <span className="cursor-pointer hover:text-main">Socials</span>
            <span className="text-danger cursor-pointer hover:text-danger-dark">• Live Training</span>
            <span className="cursor-pointer hover:text-main">Blog</span>
            <span className="cursor-pointer hover:text-main">Trading News</span>
            
            <div className="flex items-center gap-4 ml-6 border-l border-gray-200 pl-6">
              <span className="text-2xl cursor-pointer">🔔</span>
              <span className="text-2xl cursor-pointer">💬</span>
              <span className="text-2xl cursor-pointer">🎁</span>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer shadow-md">
                ⚙️
              </div>
            </div>
          </div>
        </header>
        
        <div className="content-area pt-6">
          <Routes>
            <Route path="/" element={<AdminStats />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/new" element={<UserCreate />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/security" element={<SecurityKyc />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/reports" element={<ReportingPerformance />} />
            <Route path="/messages" element={<AdminMessages />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
