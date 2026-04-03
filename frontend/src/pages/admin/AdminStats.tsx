import React, { useEffect, useState } from 'react';
import { AdminStatsDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, Briefcase, CreditCard, Activity, Heart, TrendingUp, ArrowUpRight } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium">Chargement des statistiques...</p>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-20">
      <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center text-danger mx-auto mb-4">
        <Activity size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Erreur de chargement</h3>
      <p className="text-slate-500">{error}</p>
    </div>
  );
  
  if (!stats) return null;

  const activationRate = stats.totalUser > 0 ? Math.round((stats.activeUser / stats.totalUser) * 100) : 0;
  const systemHealth = stats.systemHealthIndex ? Math.round(stats.systemHealthIndex) : 0;

  // Transform real data from backend
  const evolutionData = stats.registrationEvolution && Object.keys(stats.registrationEvolution).length > 0
    ? Object.entries(stats.registrationEvolution)
        .map(([month, count]) => ({ month, users: count }))
        .sort((a, b) => a.month.localeCompare(b.month))
    : [{ month: 'Aucune donnée', users: 0 }];

  const roleDistribution = [
    { name: 'Admins', value: (stats.roleDistribution as any)?.ADMIN || 0, color: '#4F46E5' },
    { name: 'Agents', value: (stats.roleDistribution as any)?.AGENT || 0, color: '#F59E0B' },
    { name: 'Clients', value: (stats.roleDistribution as any)?.CLIENT || 0, color: '#10B981' },
  ].filter(r => r.value > 0);

  const statCards = [
    { 
      title: 'Total Utilisateurs', 
      value: stats.totalUser, 
      icon: Users, 
      color: 'bg-primary-50 text-primary-600',
      trend: '+12%' 
    },
    { 
      title: 'Utilisateurs Actifs', 
      value: stats.activeUser, 
      icon: UserCheck, 
      color: 'bg-success/10 text-success-600',
      trend: '+8%' 
    },
    { 
      title: 'Total Agents', 
      value: stats.totalAgent, 
      icon: Briefcase, 
      color: 'bg-warning/10 text-warning-600',
      trend: '+5%' 
    },
    { 
      title: 'Total Clients', 
      value: stats.totalClient, 
      icon: CreditCard, 
      color: 'bg-purple-50 text-purple-600',
      trend: '+15%' 
    },
    { 
      title: 'Taux d\'activation', 
      value: `${activationRate}%`, 
      icon: Activity, 
      color: 'bg-info/10 text-info',
      trend: '+3%' 
    },
    { 
      title: 'Santé Système', 
      value: `${systemHealth}%`, 
      icon: Heart, 
      color: 'bg-rose-50 text-rose-600',
      trend: 'Stable' 
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord Admin</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de la plateforme et métriques clés</p>
        </div>
        <button className="btn-secondary text-sm">
          <TrendingUp size={16} />
          Exporter le rapport
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, index) => (
          <div key={index} className="card-hover p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-success">
                <ArrowUpRight size={14} />
                {card.trend}
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">{card.title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Evolution Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Évolution des inscriptions</h3>
              <p className="text-sm text-slate-500">Nouveaux utilisateurs par mois</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              Utilisateurs
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontSize: 12 }}
                />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#4F46E5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Pie Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Distribution des rôles</h3>
              <p className="text-sm text-slate-500">Répartition des utilisateurs par rôle</p>
            </div>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            {roleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 text-sm font-medium ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
