import React, { useEffect, useState } from 'react';
import { AdminStatsDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const AdminStats: React.FC = () => {
  const [stats, setStats] = useState<AdminStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.getAdminStats()
      .then(setStats)
      .catch((err: Error) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading global statistics...</p>
    </div>
  );
  if (error) return <div className="empty-state wow scaleUp"><div className="empty-icon">⚠️</div><h3>Failed to Load Data</h3><p>{error}</p></div>;
  if (!stats) return null;

  const activationRate = stats.totalUser > 0 ? Math.round((stats.activeUser / stats.totalUser) * 100) : 0;
  const systemHealth = stats.systemHealthIndex ? Math.round(stats.systemHealthIndex) : 0;

  // Transform real data from backend
  const evolutionData = stats.registrationEvolution && Object.keys(stats.registrationEvolution).length > 0
    ? Object.entries(stats.registrationEvolution)
        .map(([month, count]) => ({ month, users: count }))
        .reverse()
    : [
        { month: 'No Data', users: 0 }
      ];

  const roleDistribution = [
    { name: 'Admins', value: stats.roleDistribution?.ADMIN || 0, color: '#4318FF' },
    { name: 'Agents', value: stats.roleDistribution?.AGENT || 0, color: '#FFCE20' },
    { name: 'Clients', value: stats.roleDistribution?.CLIENT || 0, color: '#05CD99' },
  ].filter(r => r.value > 0);

  // Use recent activities to show on the dashboard or as a chart if needed
  // For now, let's keep the activityData mock for the bar chart if we don't have enough daily aggregates
  const activityData = [
    { day: 'Recent', actions: stats.recentActivities?.length || 0 },
  ];

  return (
    <div className="admin-stats wow fadeInUp">
      
      {/* KPI Cards */}
      <div className="stats-grid mb-6">
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Total Users</p>
          <div className="value mt-1 text-3xl font-bold">{stats.totalUser}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Active Users</p>
          <div className="value mt-1 text-3xl font-bold text-success">{stats.activeUser}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Total Agents</p>
          <div className="value mt-1 text-3xl font-bold">{stats.totalAgent}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Total Clients</p>
          <div className="value mt-1 text-3xl font-bold">{stats.totalClient}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Activation Rate</p>
          <div className="value mt-1 text-3xl font-bold text-primary">{activationRate}%</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">System Health</p>
          <div className="value mt-1 text-3xl font-bold">{systemHealth}%</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Evolution Chart */}
        <div className="section-card">
          <div className="card-header border-b">
            <h3>Registration Evolution</h3>
          </div>
          <div className="card-body" style={{ minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Pie Chart */}
        <div className="section-card">
          <div className="card-header border-b">
            <h3>Role Distribution</h3>
          </div>
          <div className="card-body flex justify-center items-center" style={{ minHeight: '300px', width: '100%' }}>
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
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
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted">No roles data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity Bar Chart */}
        <div className="section-card lg:col-span-2">
          <div className="card-header border-b">
            <h3>Recent System Activity</h3>
          </div>
          <div className="card-body" style={{ minHeight: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="actions" fill="#4318FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AdminStats;
