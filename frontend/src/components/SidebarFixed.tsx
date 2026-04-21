import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  History,
  BarChart3,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Shield,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/user.types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  role: 'admin' | 'agent';
}

const SidebarFixed: React.FC<SidebarProps> = ({ isOpen, onToggle, role }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const adminNavItems = [
    {
      to: '/admin',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true
    },
    {
      to: '/admin/users',
      label: 'Users Management',
      icon: Users
    },
    {
      to: '/admin/audit',
      label: 'Audit Logs',
      icon: History
    },
    {
      to: '/admin/reports',
      label: 'Reports / Performance',
      icon: TrendingUp
    },
    {
      to: '/admin/messages',
      label: 'Messages',
      icon: MessageSquare
    },
    {
      to: '/admin/settings',
      label: 'Platform Settings',
      icon: Settings
    },
    {
      to: '/admin/profile',
      label: 'Profile',
      icon: User
    }
  ];

  const agentNavItems = [
    {
      to: '/agent',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true
    },
    {
      to: '/agent/clients',
      label: 'Clients',
      icon: Users
    },
    {
      to: '/agent/performance',
      label: 'Performance',
      icon: TrendingUp
    },
    {
      to: '/agent/audit',
      label: 'Audit (Limited)',
      icon: History
    },
    {
      to: '/agent/messages',
      label: 'Messages',
      icon: MessageSquare
    },
    {
      to: '/agent/profile',
      label: 'Profile',
      icon: User
    }
  ];

  const navItems = role === 'admin' ? adminNavItems : agentNavItems;

  const isActive = (to: string, end?: boolean) => {
    if (end) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center h-16 px-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
              KREDIA
            </span>
          </div>
        </div>

        {/* Navigation Content */}
        <div className="flex flex-col h-[calc(100vh-64px)] justify-between">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 mb-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {role === 'admin' ? 'Administration' : 'Agent Portal'}
            </div>
            
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon 
                  size={18} 
                  className={isActive(item.to, item.end) 
                    ? 'text-indigo-600' 
                    : 'text-gray-400 group-hover:text-gray-500'
                  } 
                />
                <span className="flex-1">{item.label}</span>
                {isActive(item.to, item.end) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </NavLink>
            ))}
          </nav>

          {/* User & Logout Section */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 px-3 py-3 mb-2">
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {currentUser?.role?.toLowerCase()}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
            >
              <LogOut size={18} className="text-red-500 group-hover:translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarFixed;
