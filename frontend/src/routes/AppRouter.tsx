import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user.types';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AgentDashboard from '../pages/agent/AgentDashboard';
import ClientDashboard from '../pages/client/ClientDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { currentUser, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading application...</p>
        {authError && <p className="error-text">{authError}</p>}
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to appropriate dashboard based on actual role
    if (currentUser.role === UserRole.ADMIN) return <Navigate to="/admin" replace />;
    if (currentUser.role === UserRole.AGENT) return <Navigate to="/agent" replace />;
    if (currentUser.role === UserRole.CLIENT) return <Navigate to="/client" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  
  switch (currentUser.role) {
    case UserRole.ADMIN: return <Navigate to="/admin" />;
    case UserRole.AGENT: return <Navigate to="/agent" />;
    case UserRole.CLIENT: return <Navigate to="/client" />;
    default: return <Navigate to="/login" />;
  }
};

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      
      {/* Admin Routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Agent Routes */}
      <Route path="/agent/*" element={
        <ProtectedRoute allowedRoles={[UserRole.AGENT]}>
          <AgentDashboard />
        </ProtectedRoute>
      } />
      
      {/* Client Routes */}
      <Route path="/client/*" element={
        <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
          <ClientDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
