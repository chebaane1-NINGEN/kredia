import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user.types';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import OAuth2Redirect from '../pages/OAuth2Redirect';
import VerifyEmail from '../pages/VerifyEmail';
import ResetPassword from '../pages/ResetPassword';
import Home from '../pages/Home';
import Contact from '../pages/Contact';
import AdminLayout from '../layouts/AdminLayout';
import AgentLayout from '../layouts/AgentLayout';
import UsersManagement from '../pages/admin/UsersManagement';
import UserCreate from '../pages/admin/UserCreate';
import UserDetail from '../pages/admin/UserDetail';
import Statistics from '../pages/admin/Statistics';
import AuditLog from '../pages/admin/AuditLog';
import PlatformSettings from '../pages/admin/PlatformSettings';
import AdminMessages from '../pages/admin/AdminMessages';
import ReportingPerformance from '../pages/admin/ReportingPerformance';
import UserProfile from '../pages/admin/UserProfile';
import AgentDashboard from '../pages/agent/AgentDashboard';
import AgentClients from '../pages/agent/AgentClients';
import AgentPerformance from '../pages/agent/AgentPerformance';
import AgentAudit from '../pages/agent/AgentAudit';
import AgentProfile from '../pages/agent/AgentProfile';
import AgentClientCreate from '../pages/agent/AgentClientCreate';
import AgentMessages from '../pages/agent/AgentMessages';
import ClientDashboard from '../pages/client/ClientDashboard';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { currentUser, isLoading, authError } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading application...</p>
          {authError && <p className="mt-2 text-red-500 text-sm">{authError}</p>}
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
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
      <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Statistics />} />
        <Route path="users" element={<UsersManagement />} />
        <Route path="users/new" element={<UserCreate />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="reports" element={<ReportingPerformance />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="settings" element={<PlatformSettings />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      
      {/* Agent Routes */}
      <Route path="/agent" element={
        <ProtectedRoute allowedRoles={[UserRole.AGENT]}>
          <AgentLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboard />} />
        <Route path="clients" element={<AgentClients />} />
        <Route path="clients/new" element={<AgentClientCreate />} />
        <Route path="clients/:id" element={<UserDetail />} />
        <Route path="performance" element={<AgentPerformance />} />
        <Route path="audit" element={<AgentAudit />} />
        <Route path="messages" element={<AgentMessages />} />
        <Route path="profile" element={<AgentProfile />} />
      </Route>
      
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
