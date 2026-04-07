import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Target,
  TrendingUp,
  Clock,
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

interface AgentStatsDTO {
  totalClients: number;
  activeClients: number;
  totalApprovals: number;
  totalRejections: number;
  performanceScore: number;
  averageProcessingTime: number;
  last7DaysActivity: Array<{
    date: string;
    approvals: number;
    rejections: number;
    clientRegistrations: number;
  }>;
  monthlyPerformance: Array<{
    month: string;
    score: number;
    approvals: number;
    rejections: number;
  }>;
}

const AgentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<AgentStatsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        // Simuler les données de l'API agent
        const mockStats: AgentStatsDTO = {
          totalClients: 15,
          activeClients: 12,
          totalApprovals: 45,
          totalRejections: 8,
          performanceScore: 85,
          averageProcessingTime: 24, // heures
          last7DaysActivity: [
            { date: 'Mon', approvals: 8, rejections: 1, clientRegistrations: 2 },
            { date: 'Tue', approvals: 6, rejections: 2, clientRegistrations: 1 },
            { date: 'Wed', approvals: 9, rejections: 0, clientRegistrations: 3 },
            { date: 'Thu', approvals: 7, rejections: 1, clientRegistrations: 1 },
            { date: 'Fri', approvals: 10, rejections: 3, clientRegistrations: 2 },
            { date: 'Sat', approvals: 3, rejections: 1, clientRegistrations: 0 },
            { date: 'Sun', approvals: 2, rejections: 0, clientRegistrations: 1 }
          ],
          monthlyPerformance: [
            { month: 'Jan', score: 78, approvals: 35, rejections: 10 },
            { month: 'Feb', score: 82, approvals: 42, rejections: 9 },
            { month: 'Mar', score: 85, approvals: 45, rejections: 8 },
            { month: 'Apr', score: 88, approvals: 48, rejections: 6 }
          ]
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Failed to fetch agent stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStats();
  }, []);

  const exportReport = () => {
    if (!stats) return;
    
    const csvContent = [
      ['Métrique', 'Valeur', 'Description'],
      ['Total Clients', stats.totalClients.toString(), 'Nombre de clients assignés'],
      ['Clients Actifs', stats.activeClients.toString(), 'Clients avec statut ACTIF'],
      ['Total Approuvées', stats.totalApprovals.toString(), 'Approuvations totales'],
      ['Total Rejetées', stats.totalRejections.toString(), 'Rejets totaux'],
      ['Score Performance', `${stats.performanceScore}%`, 'Score de performance global'],
      ['Temps Moyen Traitement', `${stats.averageProcessingTime}h`, 'Temps moyen de traitement']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-performance-${new Date().toISOString().split('T')[0]}.csv`;
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
        <Activity className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No statistics available</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load performance data</p>
      </div>
    );
  }

  const performanceData = [
    { name: 'Approvals', value: stats.totalApprovals, color: '#10B981' },
    { name: 'Rejections', value: stats.totalRejections, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.firstName}! Here's your performance overview.</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Clients</p>
              <p className="text-3xl font-bold mt-1">{stats.totalClients}</p>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpRight size={16} className="mr-1" />
                <span>{stats.activeClients} active</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approvals</p>
              <p className="text-3xl font-bold mt-1">{stats.totalApprovals}</p>
              <div className="flex items-center mt-2 text-sm">
                <CheckCircle2 size={16} className="mr-1" />
                <span>This month</span>
              </div>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Rejections</p>
              <p className="text-3xl font-bold mt-1">{stats.totalRejections}</p>
              <div className="flex items-center mt-2 text-sm">
                <XCircle size={16} className="mr-1" />
                <span>This month</span>
              </div>
            </div>
            <XCircle className="h-8 w-8 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Performance Score</p>
              <p className="text-3xl font-bold mt-1">{stats.performanceScore}%</p>
              <div className="flex items-center mt-2 text-sm">
                <Target size={16} className="mr-1" />
                <span>Excellent</span>
              </div>
            </div>
            <Target className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Processing Time</h3>
            <Clock className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.averageProcessingTime}h</div>
          <p className="text-sm text-gray-600 mt-1">Average processing time per request</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Approval Rate</h3>
            <TrendingUp className="text-gray-400" size={20} />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {Math.round((stats.totalApprovals / (stats.totalApprovals + stats.totalRejections)) * 100)}%
          </div>
          <p className="text-sm text-gray-600 mt-1">Success rate this month</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">7-Day Activity</h3>
              <p className="text-sm text-gray-600">Daily approvals and rejections</p>
            </div>
            <Activity className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.last7DaysActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip />
              <Bar dataKey="approvals" fill="#10B981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="rejections" fill="#EF4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Distribution</h3>
              <p className="text-sm text-gray-600">Approvals vs Rejections</p>
            </div>
            <Target className="text-gray-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Performance Trend */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
            <p className="text-sm text-gray-600">Monthly performance score evolution</p>
          </div>
          <TrendingUp className="text-gray-400" size={20} />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.monthlyPerformance}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#8B5CF6" strokeWidth={2} name="Performance Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AgentDashboard;
