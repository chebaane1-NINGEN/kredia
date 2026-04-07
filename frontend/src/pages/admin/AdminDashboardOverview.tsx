import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  TrendingUp, 
  Activity,
  ShieldCheck,
  AlertCircle,
  Download,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { userApi } from '../../api/userApi';
import { AdminStatsDTO } from '../../types/user.types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  // DEBUG: Vérifier que le nouveau dashboard est utilisé
  console.log('📊 AdminDashboardOverview rendu - NOUVEAU DASHBOARD');

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

  const exportReport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Metric', 'Value', 'Description'],
      ['Total Users', stats.totalUser.toString(), 'Total number of users'],
      ['Active Users', stats.activeUser.toString(), 'Users with ACTIVE status'],
      ['Total Agents', stats.totalAgent.toString(), 'Number of agents'],
      ['Total Clients', stats.totalClient.toString(), 'Number of clients'],
      ['Activation Rate', `${Math.round((stats.activeUser / stats.totalUser) * 100)}%`, 'Percentage of active users'],
      ['System Health', `${Math.round(stats.systemHealthIndex)}%`, 'System health index'],
      ['Last 24h Registrations', stats.last24hRegistrations.toString(), 'New users in last 24 hours']
    ];

    const csv = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kredia-dashboard-report-${new Date().toISOString().split('T')[0]}.csv`;
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
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load dashboard statistics</p>
      </div>
    );
  }

  // Prepare data for charts
  const evolutionData = stats.registrationEvolution && Object.keys(stats.registrationEvolution).length > 0
    ? Object.entries(stats.registrationEvolution).map(([month, count]) => ({
        month,
        registrations: count as number
      }))
    : [
        { month: 'Jan', registrations: 45 },
        { month: 'Feb', registrations: 52 },
        { month: 'Mar', registrations: 48 },
        { month: 'Apr', registrations: 61 },
        { month: 'May', registrations: 55 },
        { month: 'Jun', registrations: 67 }
      ];

  const roleDistribution = [
    { name: 'Admins', value: (stats.roleDistribution as any)?.ADMIN || 0, color: '#8B5CF6' },
    { name: 'Agents', value: (stats.roleDistribution as any)?.AGENT || 0, color: '#3B82F6' },
    { name: 'Clients', value: (stats.roleDistribution as any)?.CLIENT || 0, color: '#10B981' }
  ];

  const activationRate = stats.totalUser > 0 ? Math.round((stats.activeUser / stats.totalUser) * 100) : 0;
  const systemHealth = Math.round(stats.systemHealthIndex);

  const statCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUser, 
      icon: Users, 
      color: 'bg-indigo-100 text-indigo-600',
      change: '+12%',
      changeType: 'positive'
    },
    { 
      title: 'Active Users', 
      value: stats.activeUser, 
      icon: UserCheck, 
      color: 'bg-green-100 text-green-600',
      change: '+8%',
      changeType: 'positive'
    },
    { 
      title: 'Total Agents', 
      value: stats.totalAgent, 
      icon: ShieldCheck, 
      color: 'bg-blue-100 text-blue-600',
      change: '+5%',
      changeType: 'positive'
    },
    { 
      title: 'System Health', 
      value: `${systemHealth}%`, 
      icon: Activity, 
      color: 'bg-purple-100 text-purple-600',
      change: '+2%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor your system performance and user activity</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp size={16} className="text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{card.change}</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Evolution Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Registration Evolution</h3>
              <p className="text-sm text-gray-600">Monthly user registration trends</p>
            </div>
            <BarChart3 className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6B7280"
                fontSize={12}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="registrations" 
                stroke="#8B5CF6" 
                fillOpacity={1} 
                fill="url(#colorRegistrations)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution Chart */}
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
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-700">
                    {value}: {entry.payload.value}
                  </span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activation Rate</h3>
            <UserCheck className="text-green-600" size={20} />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{activationRate}%</span>
            <span className="ml-2 text-sm text-gray-500">of total users</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${activationRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Registrations</h3>
            <Calendar className="text-indigo-600" size={20} />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{stats.last24hRegistrations}</span>
            <span className="ml-2 text-sm text-gray-500">last 24 hours</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {stats.last24hRegistrations > 0 ? 'Above average' : 'Below average'} activity
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Clients</h3>
            <Users className="text-blue-600" size={20} />
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900">{stats.totalClient}</span>
            <span className="ml-2 text-sm text-gray-500">registered</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {stats.totalClient > 0 ? 'Growing steadily' : 'No clients yet'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
