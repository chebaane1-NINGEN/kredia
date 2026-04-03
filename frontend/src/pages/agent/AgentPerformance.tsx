import React, { useEffect, useState } from 'react';
import { AgentPerformanceDTO, UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { MOCK_AGENT_PERFORMANCE, MOCK_ACTIVITIES, relativeTime, getActivityIcon } from '../../utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, CreditCard, TrendingUp, Clock, Star, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const AgentPerformance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<AgentPerformanceDTO | null>(null);
  const [activities, setActivities] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [perfData, actData] = await Promise.all([
          userApi.getAgentDashboard(currentUser.id).catch(() => null),
          userApi.getAgentActivities(currentUser.id).catch(() => null)
        ]);
        
        setStats(perfData || (MOCK_AGENT_PERFORMANCE as unknown as AgentPerformanceDTO));
        
        // Handle both Page object and direct Array response
        const activitiesArray = actData && 'content' in actData ? actData.content : (Array.isArray(actData) ? actData : []);
        setActivities(activitiesArray.length > 0 ? activitiesArray : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]));
      } catch {
        setStats(MOCK_AGENT_PERFORMANCE as unknown as AgentPerformanceDTO);
        setActivities(MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]);
        addToast('Displaying simulated performance data', 'info');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentUser]);

  const monthlyData = [
    { month: 'Jan', loans: 12, clients: 8, trend: 45 },
    { month: 'Feb', loans: 19, clients: 14, trend: 52 },
    { month: 'Mar', loans: 15, clients: 11, trend: 48 },
    { month: 'Apr', loans: 23, clients: 18, trend: 61 },
    { month: 'May', loans: 28, clients: 22, trend: 65 },
    { month: 'Jun', loans: 31, clients: 25, trend: 72 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="finova-card p-6 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="finova-card p-6 h-96 animate-pulse bg-slate-50"></div>
      </div>
    );
  }

  if (!stats) return null;

  const ratingConfig: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    EXCELLENT: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Elite Performer', icon: Star },
    GOOD: { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'High Performer', icon: Star },
    AVERAGE: { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Standard', icon: Star },
    NEEDS_IMPROVEMENT: { color: 'text-rose-600', bg: 'bg-rose-50', label: 'Needs Focus', icon: Star },
  };
  const rating = ratingConfig[stats.performanceRating] || ratingConfig.GOOD;

  const kpis = [
    { label: 'Managed Clients', value: stats.totalClientsManaged, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+12%', isPositive: true },
    { label: 'Loans Processed', value: stats.totalLoansProcessed, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+8%', isPositive: true },
    { label: 'Investments', value: stats.totalInvestmentsAdvised, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+15%', isPositive: true },
    { label: 'Avg. Response', value: `${stats.averageResponseTimeHrs.toFixed(1)}h`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-2h', isPositive: true },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Performance Hub</h1>
          <p className="text-slate-500 mt-1 text-lg">Track your productivity and client impact in real-time.</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${rating.bg} ${rating.color} border border-current/10`}>
          <rating.icon size={20} className="fill-current" />
          <span className="font-bold text-sm tracking-wide uppercase">{rating.label}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="finova-card p-6 group hover:border-indigo-200 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.trend}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1 tracking-tight">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 finova-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Volume Analysis</h3>
              <p className="text-sm text-slate-500">Monthly breakdown of processing efficiency</p>
            </div>
            <select className="bg-slate-50 border-none rounded-xl text-sm font-semibold px-4 py-2 text-slate-600 outline-none ring-0 focus:ring-2 focus:ring-indigo-600 transition-all">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 500 }}
                />
                <RechartsTip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="loans" 
                  stroke="#4F46E5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLoans)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="clients" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={0} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span className="text-sm font-semibold text-slate-600">Loans Processed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm font-semibold text-slate-600">New Clients</span>
            </div>
          </div>
        </div>

        {/* Satisfaction & Rating */}
        <div className="space-y-8">
          <div className="finova-card p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <Star className="fill-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Client CSAT</h3>
                  <p className="text-indigo-100 text-xs">Satisfaction Index</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold">{stats.clientSatisfactionScore.toFixed(1)}</span>
                <span className="text-indigo-100 font-medium mb-1">/ 5.0</span>
              </div>
              <div className="mt-6 w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white rounded-full h-2 transition-all duration-1000" 
                  style={{ width: `${(stats.clientSatisfactionScore / 5) * 100}%` }}
                ></div>
              </div>
              <p className="mt-4 text-sm text-indigo-100 leading-relaxed">
                Your performance is currently in the top 5% of all active agents. Keep up the excellent work!
              </p>
            </div>
            {/* Abstract Background Shapes */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
          </div>

          <div className="finova-card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                Live Activity
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.slice(0, 5).map((act) => (
                <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {getActivityIcon(act.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{act.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{act.actionType}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] text-slate-400 font-medium">{relativeTime(act.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;
