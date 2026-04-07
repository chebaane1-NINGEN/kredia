import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronRight, 
  User, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  UserPlus,
  Activity,
  ShieldCheck,
  MessageSquare,
  HelpCircle,
  LayoutDashboard,
  Users,
  TrendingUp,
  History
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
}

const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // DEBUG: Vérifier que le composant est bien utilisé
  console.log('🎨 AdminLayout rendu - NOUVEAU DESIGN ACTIF');

  const navItems: NavItem[] = [
    { to: '/admin', icon: TrendingUp, label: 'Statistics', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/audit', icon: History, label: 'Audit Logs' },
    { to: '/admin/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/admin/settings', icon: Settings, label: 'Platform Settings' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">K</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">Kredia</span>
            </div>
            <button className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="px-3 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Main</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={16} className="text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="text-xs text-gray-500">{currentUser?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-600"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button 
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>

              {/* Search */}
              <div className="flex-1 max-w-lg mx-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
