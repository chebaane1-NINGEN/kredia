import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  Target,
  Activity,
  Eye,
  MessageSquare,
  Bell,
  Star,
  Zap,
  AlertTriangle,
  UserPlus,
  FileText,
  Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { agentApiService, AgentPerformanceDTO } from '../../services/agentApiService';
import { Link, useNavigate } from 'react-router-dom';

interface AgentStats {
  totalClients: number;
  activeClients: number;
  pendingApplications: number;
  approvalsToday: number;
  rejectionsToday: number;
  avgProcessingTime: number;
  performanceScore: number;
  weeklyTrend: number;
}

interface ClientNote {
  id: string;
  clientId: number;
  clientName: string;
  content: string;
  type: 'risk' | 'performance' | 'general';
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'new_client' | 'status_change' | 'deadline' | 'system' | 'password_blocked';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

const AgentDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [performance, setPerformance] = useState<AgentPerformanceDTO | null>(null);
  const [recentNotes, setRecentNotes] = useState<ClientNote[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch performance data
      const performanceData = await agentApiService.getAgentPerformance();
      setPerformance(performanceData);
      
      // Calculate stats from performance data
      const calculatedStats: AgentStats = {
        totalClients: performanceData.totalClients,
        activeClients: performanceData.activeClients,
        pendingApplications: 0, // TODO: Implement pending applications count
        approvalsToday: 0, // TODO: Implement today's approvals
        rejectionsToday: 0, // TODO: Implement today's rejections
        avgProcessingTime: performanceData.averageProcessingTime,
        performanceScore: performanceData.performanceScore,
        weeklyTrend: 0 // TODO: Calculate from historical data
      };
      
      setStats(calculatedStats);
      
      // Mock recent notes
      setRecentNotes([
        {
          id: '1',
          clientId: 1,
          clientName: 'Mohamed Ben Ali',
          content: 'High-value client, expedite processing',
          type: 'performance',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);
      
      // Mock comprehensive notifications
      setNotifications([
        {
          id: '1',
          type: 'new_client',
          title: 'New Client Assigned',
          message: 'Ahmed Gharbi has been assigned to you',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'password_blocked',
          title: 'Password Blocked Alert',
          message: 'Client Karim Tounsi account blocked after 3 failed login attempts',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high'
        }
      ]);
      
    } catch (error) {
      addToast('Failed to fetch dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 75) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const getNoteIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'performance': return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <MessageSquare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_client': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'status_change': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'password_blocked': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'deadline': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats || !performance) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Unable to load dashboard data</p>
      </div>
    );
  }

  const performanceBadge = getPerformanceBadge(stats.performanceScore);
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-600">Welcome back, {currentUser?.firstName}! Here's your performance overview.</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <Bell size={20} />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Performance Score</h2>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">{stats.performanceScore}</span>
              <span className="text-xl ml-2">/100</span>
            </div>
            <div className="flex items-center mt-2">
              {stats.weeklyTrend > 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="text-sm">
                {Math.abs(stats.weeklyTrend)}% from last {selectedPeriod}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${performanceBadge.color}`}>
              {performanceBadge.text}
            </div>
            <div className="mt-4">
              <Award className="w-12 h-12 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingApplications}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}h</p>
            </div>
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
          <div className="space-y-3">
            {performance.last7DaysActivity?.map((day, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{day.date}</div>
                <div className="flex-1 mx-4">
                  <div className="flex space-x-1">
                    <div
                      className="bg-green-500 rounded"
                      style={{
                        height: '8px',
                        width: `${(day.approvals / (Math.max(...performance.last7DaysActivity.map(d => d.approvals)) || 1)) * 100}%`
                      }}
                    ></div>
                    <div
                      className="bg-red-500 rounded"
                      style={{
                        height: '8px',
                        width: `${(day.rejections / (Math.max(...performance.last7DaysActivity.map(d => d.rejections)) || 1)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-green-600">{day.approvals}</span>
                  <span className="text-red-600">{day.rejections}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Approvals</span>
                <span className="font-medium">{performance.totalApprovals}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(performance.totalApprovals / ((performance.totalApprovals + performance.totalRejections) || 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Rejections</span>
                <span className="font-medium">{performance.totalRejections}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{
                    width: `${(performance.totalRejections / ((performance.totalApprovals + performance.totalRejections) || 1)) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approval Rate</span>
              <span className={`text-lg font-bold ${getPerformanceColor(stats.performanceScore)}`}>
                {Math.round((performance.totalApprovals / ((performance.totalApprovals + performance.totalRejections) || 1)) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/agent/clients/new"
            className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Client
          </Link>
          <Link 
            to="/agent/clients"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            View All Clients
          </Link>
          <Link 
            to="/agent/performance"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance Report
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
