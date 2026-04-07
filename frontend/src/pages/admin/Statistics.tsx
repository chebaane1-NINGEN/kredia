import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Zap,
  Globe
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { userApi } from '../../api/userApi';
import { AdminStatsDTO } from '../../types/user.types';

const Statistics: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await userApi.getAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const exportDetailedReport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Métrique', 'Valeur', 'Description', 'Tendance'],
      ['Total Utilisateurs', stats.totalUser.toString(), 'Nombre total d\'utilisateurs', '↑'],
      ['Utilisateurs Actifs', stats.activeUser.toString(), 'Utilisateurs avec statut ACTIF', '↑'],
      ['Total Agents', stats.totalAgent.toString(), 'Nombre d\'agents dans le système', '↑'],
      ['Total Clients', stats.totalClient.toString(), 'Nombre de clients dans le système', '↑'],
      ['Taux d\'Activation', `${Math.round((stats.activeUser / stats.totalUser) * 100)}%`, 'Pourcentage d\'utilisateurs actifs', '↑'],
      ['Santé Système', `${Math.round(stats.systemHealthIndex)}%`, 'Indice de santé global du système', '→'],
      ['Inscriptions 24h', stats.last24hRegistrations.toString(), 'Nouveaux utilisateurs dernières 24h', '↑'],
      ['Admins', (stats.roleDistribution as any)?.ADMIN || 0, 'Nombre d\'administrateurs', '→'],
      ['Agents', (stats.roleDistribution as any)?.AGENT || 0, 'Nombre d\'agents', '↑'],
      ['Clients', (stats.roleDistribution as any)?.CLIENT || 0, 'Nombre de clients', '↑']
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kredia-detailed-statistics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load statistics data</p>
      </div>
    );
  }

  // Données pour graphiques avancés
  const monthlyData = [
    { month: 'Jan', users: 45, newUsers: 12, activeUsers: 38 },
    { month: 'Fev', users: 52, newUsers: 15, activeUsers: 45 },
    { month: 'Mar', users: 48, newUsers: 8, activeUsers: 42 },
    { month: 'Avr', users: 61, newUsers: 18, activeUsers: 55 },
    { month: 'Mai', users: 55, newUsers: 10, activeUsers: 48 },
    { month: 'Jun', users: 67, newUsers: 20, activeUsers: 60 },
    { month: 'Jul', users: 72, newUsers: 16, activeUsers: 65 }
  ];

  const roleDistribution = [
    { name: 'Admins', value: (stats.roleDistribution as any)?.ADMIN || 0, color: '#8B5CF6' },
    { name: 'Agents', value: (stats.roleDistribution as any)?.AGENT || 0, color: '#3B82F6' },
    { name: 'Clients', value: (stats.roleDistribution as any)?.CLIENT || 0, color: '#10B981' }
  ];

  const statusDistribution = [
    { name: 'Actifs', value: stats.activeUser, color: '#10B981' },
    { name: 'Inactifs', value: stats.totalUser - stats.activeUser - 5, color: '#6B7280' },
    { name: 'Suspendus', value: 3, color: '#F59E0B' },
    { name: 'Bloqués', value: 2, color: '#EF4444' }
  ];

  const performanceMetrics = [
    { metric: 'Taux Conversion', value: '68%', trend: 'up', change: '+5%' },
    { metric: 'Engagement', value: '82%', trend: 'up', change: '+12%' },
    { metric: 'Rétention', value: '91%', trend: 'down', change: '-2%' },
    { metric: 'Satisfaction', value: '4.6/5', trend: 'up', change: '+0.3' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistics & Analytics</h1>
          <p className="text-gray-600">Detailed analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportDetailedReport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            <Download size={16} className="mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold mt-1">{stats.totalUser}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+12% from last month</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold mt-1">{stats.activeUser}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpRight size={16} className="mr-1" />
                <span>+8% from last month</span>
              </div>
            </div>
            <UserCheck className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">System Health</p>
              <p className="text-3xl font-bold mt-1">{Math.round(stats.systemHealthIndex)}%</p>
              <div className="flex items-center mt-2 text-sm">
                <Activity size={16} className="mr-1" />
                <span>Optimal performance</span>
              </div>
            </div>
            <Zap className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">New Users (24h)</p>
              <p className="text-3xl font-bold mt-1">{stats.last24hRegistrations}</p>
              <div className="flex items-center mt-2 text-sm">
                <Target size={16} className="mr-1" />
                <span>Above average</span>
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{metric.metric}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{metric.value}</p>
              <div className={`flex items-center justify-center mt-2 text-sm ${
                metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span className="ml-1">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Evolution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Evolution</h3>
              <p className="text-sm text-gray-600">Monthly user growth and activity</p>
            </div>
            <Eye className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={2} name="Total Users" />
              <Line type="monotone" dataKey="newUsers" stroke="#10B981" strokeWidth={2} name="New Users" />
              <Line type="monotone" dataKey="activeUsers" stroke="#F59E0B" strokeWidth={2} name="Active Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Role Distribution</h3>
              <p className="text-sm text-gray-600">Users by role category</p>
            </div>
            <PieChart className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
              <p className="text-sm text-gray-600">Users by account status</p>
            </div>
            <BarChart3 className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Registration Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Registration Trends</h3>
              <p className="text-sm text-gray-600">Daily registration patterns</p>
            </div>
            <Calendar className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorNewUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#10B981" 
                fillOpacity={1} 
                fill="url(#colorNewUsers)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
