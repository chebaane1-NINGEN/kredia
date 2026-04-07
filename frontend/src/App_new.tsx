import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import UsersManagement from './pages/admin/UsersManagement';
import UserCreate from './pages/admin/UserCreate';
import UserDetail from './pages/admin/UserDetail';
import AdminStats from './pages/admin/AdminStats';
import AuditLog from './pages/admin/AuditLog';
import PlatformSettings from './pages/admin/PlatformSettings';
import AdminMessages from './pages/admin/AdminMessages';
import SecurityKyc from './pages/admin/SecurityKyc';
import ReportingPerformance from './pages/admin/ReportingPerformance';
import UserProfile from './pages/admin/UserProfile';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardOverview />
      },
      {
        path: 'users',
        element: <UsersManagement />
      },
      {
        path: 'users/new',
        element: <UserCreate />
      },
      {
        path: 'users/:id',
        element: <UserDetail />
      },
      {
        path: 'statistics',
        element: <AdminStats />
      },
      {
        path: 'audit',
        element: <AuditLog />
      },
      {
        path: 'settings',
        element: <PlatformSettings />
      },
      {
        path: 'messages',
        element: <AdminMessages />
      },
      {
        path: 'security',
        element: <SecurityKyc />
      },
      {
        path: 'reports',
        element: <ReportingPerformance />
      },
      {
        path: 'profile',
        element: <UserProfile />
      }
    ]
  },
  {
    path: '/',
    element: <Login />
  }
]);

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
