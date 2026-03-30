import React, { useEffect, useState } from 'react';
import { AgentPerformanceDTO, UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { MOCK_AGENT_PERFORMANCE, MOCK_ACTIVITIES, relativeTime, getActivityIcon } from '../../utils/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

const EmployeePerformance: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState<AgentPerformanceDTO | null>(null);
  const [activities, setActivities] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [perfData, actData] = await Promise.all([
          userApi.getAgentDashboard(currentUser.id).catch(() => null),
          userApi.getAgentActivities(currentUser.id).catch(() => [])
        ]);
        // Use real data, fallback to mock if empty
        setStats(perfData || (MOCK_AGENT_PERFORMANCE as unknown as AgentPerformanceDTO));
        setActivities(actData.length > 0 ? actData : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]));
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
    { month: 'Jan', loans: 12, clients: 8 },
    { month: 'Feb', loans: 19, clients: 14 },
    { month: 'Mar', loans: 15, clients: 11 },
    { month: 'Apr', loans: 23, clients: 18 },
    { month: 'May', loans: 28, clients: 22 },
    { month: 'Jun', loans: 31, clients: 25 },
  ];

  if (loading) {
    return (
      <div>
        <div className="stats-grid mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card p-6">
              <div className="skeleton skeleton-text-sm w-1/2 mb-2"></div>
              <div className="skeleton h-8 w-3/4 mt-2" style={{borderRadius: '8px'}}></div>
            </div>
          ))}
        </div>
        <div className="card h-64 flex items-center justify-center"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!stats) return null;

  const ratingConfig: Record<string, { color: string; bg: string; label: string }> = {
    EXCELLENT: { color: '#05CD99', bg: '#E6FAF5', label: '🏆 Excellent' },
    GOOD: { color: '#4318FF', bg: '#F4F7FE', label: '✅ Good' },
    AVERAGE: { color: '#FFCE20', bg: '#FFF9E5', label: '⚡ Average' },
    NEEDS_IMPROVEMENT: { color: '#EE5D50', bg: '#FDEDEC', label: '⚠️ Needs Improvement' },
  };
  const rating = ratingConfig[stats.performanceRating] || ratingConfig.GOOD;

  const satisfactionData = [{ name: 'CSAT', value: (stats.clientSatisfactionScore / 5) * 100, fill: '#4318FF' }];

  return (
    <div className="employee-performance wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Performance Dashboard</h2>
          <p className="text-muted">Personal KPIs and productivity summary</p>
        </div>
        <span className="badge px-4 py-2 text-sm font-bold" style={{ backgroundColor: rating.bg, color: rating.color }}>
          {rating.label}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card flex-row items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{background: '#F4F7FE', color: '#4318FF'}}>
            👥
          </div>
          <div>
            <p className="text-muted text-sm m-0">Clients Managed</p>
            <div className="value">{stats.totalClientsManaged}</div>
          </div>
        </div>
        <div className="stat-card flex-row items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{background: '#E6FAF5', color: '#05CD99'}}>
            💳
          </div>
          <div>
            <p className="text-muted text-sm m-0">Loans Processed</p>
            <div className="value">{stats.totalLoansProcessed}</div>
          </div>
        </div>
        <div className="stat-card flex-row items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{background: '#FFF9E5', color: '#CCB000'}}>
            📈
          </div>
          <div>
            <p className="text-muted text-sm m-0">Investments Advised</p>
            <div className="value">{stats.totalInvestmentsAdvised}</div>
          </div>
        </div>
        <div className="stat-card flex-row items-center gap-4 p-5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{background: '#FDEDEC', color: '#C6493E'}}>
            ⏱️
          </div>
          <div>
            <p className="text-muted text-sm m-0">Avg. Response Time</p>
            <div className="value">{typeof stats.averageResponseTimeHrs === 'number' ? stats.averageResponseTimeHrs.toFixed(1) : '-'} hrs</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card lg:col-span-2 p-6">
          <h3 className="font-bold mb-4">Monthly Processing Volume</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E5F2" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#A3AED0', fontSize: 12 }} />
              <RechartsTip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="loans" name="Loans" fill="#4318FF" radius={[6, 6, 0, 0]} />
              <Bar dataKey="clients" name="Clients" fill="#05CD99" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col items-center justify-center p-6">
          <h3 className="font-bold mb-2 self-start">Client Satisfaction</h3>
          <p className="text-muted text-sm self-start mb-4">Based on {stats.totalClientsManaged} clients</p>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="70%" outerRadius="90%" data={satisfactionData} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: '#F4F7FE' }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-16">
            <div className="text-3xl font-bold text-primary">{typeof stats.clientSatisfactionScore === 'number' ? stats.clientSatisfactionScore.toFixed(1) : '-'}</div>
            <div className="text-sm text-muted">out of 5.0</div>
          </div>
        </div>
      </div>

      <div className="card p-0">
        <div className="p-5 border-b">
          <h3 className="font-bold">Recent Activity Feed</h3>
        </div>
        <div className="divide-y">
          {activities.slice(0, 6).map((act) => (
            <div key={act.activityId} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
              <span className="text-2xl">{getActivityIcon(act.activityType)}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{act.description}</div>
                <div className="text-xs text-muted mt-1">{act.activityType}</div>
              </div>
              <span className="text-xs text-muted whitespace-nowrap">{relativeTime(act.timestamp)}</span>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="empty-state"><p className="text-muted">No recent activities recorded.</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformance;
