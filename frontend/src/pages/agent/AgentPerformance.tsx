import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Download,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { agentApiService, AgentPerformanceDTO } from '../../services/agentApiService';

const AgentPerformance: React.FC = () => {
  const [performance, setPerformance] = useState<AgentPerformanceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const data = await agentApiService.getAgentPerformance();
      
      // Map API data to DTO format needed for charts
      const formattedPerformance: any = {
        ...data,
        monthlyData: [
          { month: 'Current', approvals: data.totalApprovals, rejections: data.totalRejections, score: data.performanceScore, processingTime: data.averageProcessingTime }
        ],
        actionBreakdown: [
          { action: 'Approvals', count: data.totalApprovals, percentage: (data.totalApprovals / ((data.totalApprovals + data.totalRejections) || 1)) * 100 },
          { action: 'Rejections', count: data.totalRejections, percentage: (data.totalRejections / ((data.totalApprovals + data.totalRejections) || 1)) * 100 }
        ]
      };
      
      setPerformance(formattedPerformance);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data available</h3>
      </div>
    );
  }

  const approvalRate = Math.round((performance.totalApprovals / ((performance.totalApprovals + performance.totalRejections) || 1)) * 100);
  const COLORS = ['#10B981', '#EF4444', '#3B82F6', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Track your performance metrics and achievements</p>
        </div>
      </div>

      {/* Performance Score Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 rounded-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Award className="h-8 w-8 mr-3" />
              <h2 className="text-2xl font-bold">Performance Score</h2>
            </div>
            <div className="text-5xl font-bold mb-2">{performance.performanceScore}%</div>
            <p className="text-purple-100 mb-4">
              {performance.performanceScore >= 80 ? 'Excellent performance - Keep up the great work!' : 'Keep working to improve your score!'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Approvals</h3>
          <p className="text-2xl font-bold text-gray-900">{performance.totalApprovals}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Rejections</h3>
          <p className="text-2xl font-bold text-gray-900">{performance.totalRejections}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Processing Time</h3>
          <p className="text-2xl font-bold text-gray-900">{performance.averageProcessingTime}h</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Success Rate</h3>
          <p className="text-2xl font-bold text-gray-900">{approvalRate}%</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performance.actionBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="count"
              >
                {performance.actionBreakdown?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformance;
