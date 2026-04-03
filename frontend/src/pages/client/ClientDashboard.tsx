import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  History, 
  LogOut, 
  Search, 
  Bell, 
  Menu, 
  X,
  ChevronRight,
  Settings,
  HelpCircle,
  CreditCard,
  PieChart,
  ShieldCheck
} from 'lucide-react';
import ClientHome from './ClientHome';
import ClientProfile from './ClientProfile';
import ClientActivities from './ClientActivities';

const ClientDashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/client', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/client/profile', icon: User, label: 'My Profile' },
    { to: '/client/activities', icon: History, label: 'Activity Log' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <span className="text-white text-xl font-bold italic">F</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">FINOVA</span>
            </div>
            <button className="lg:hidden p-2 text-slate-400 hover:text-slate-600" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <div className="px-4 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Personal Banking</div>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                <item.icon size={20} className={location.pathname === item.to || (item.end && location.pathname === '/client') ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span>{item.label}</span>
                {(location.pathname === item.to || (item.end && location.pathname === '/client')) && (
                  <ChevronRight size={14} className="ml-auto" />
                )}
              </NavLink>
            ))}

            <div className="px-4 mt-8 mb-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Services</div>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
              <CreditCard size={20} className="text-slate-400" />
              <span>Loans & Credit</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
              <PieChart size={20} className="text-slate-400" />
              <span>Investments</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all">
              <HelpCircle size={20} className="text-slate-400" />
              <span>Help Center</span>
            </button>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-sm">
                  {currentUser?.firstName?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{currentUser?.firstName} {currentUser?.lastName}</p>
                  <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                    {currentUser?.kycVerified && <ShieldCheck size={10} className="text-emerald-500" />}
                    {currentUser?.kycVerified ? 'Verified Client' : 'Pending Verification'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-900">Client Portal</span>
              <ChevronRight size={14} />
              <span className="capitalize">{location.pathname.split('/').pop() || 'Overview'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Find a service..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <button className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 border-2 border-white rounded-full"></span>
            </button>
            <div 
              className="flex items-center gap-3 pl-3 border-l border-slate-200 cursor-pointer group"
              onClick={() => navigate('/client/profile')}
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all overflow-hidden shadow-sm">
                {currentUser?.profilePictureUrl ? (
                  <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Routes>
              <Route path="/" element={<ClientHome />} />
              <Route path="/profile" element={<ClientProfile />} />
              <Route path="/activities" element={<ClientActivities />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
