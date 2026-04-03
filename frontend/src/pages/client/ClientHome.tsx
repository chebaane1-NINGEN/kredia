import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientRiskScoreDTO, ClientEligibilityDTO, UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_CLIENT_RISK, MOCK_ACTIVITIES, relativeTime, getActivityIcon, ELIGIBILITY_CONFIG } from '../../utils/mockData';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip } from 'recharts';
import { Wallet, ShieldCheck, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Activity, Clock, ChevronRight, Star, AlertCircle } from 'lucide-react';

const ClientHome: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [riskScore, setRiskScore] = useState<ClientRiskScoreDTO | null>(null);
  const [eligibility, setEligibility] = useState<ClientEligibilityDTO | null>(null);
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
        const [risk, elig, acts] = await Promise.all([
          userApi.getClientRiskScore(currentUser.id).catch(() => null),
          userApi.getClientEligibility(currentUser.id).catch(() => null),
          userApi.getClientActivities(currentUser.id).catch(() => null)
        ]);
        
        setRiskScore(risk || (MOCK_CLIENT_RISK as unknown as ClientRiskScoreDTO));
        setEligibility(elig || { eligibilityLevel: 'HIGH', estimatedLoanCapacity: 25000, monthlyIncome: 3200, existingDebt: 1800 } as unknown as ClientEligibilityDTO);
        
        // Handle Page response
        const activitiesArray = acts && 'content' in acts ? acts.content : (Array.isArray(acts) ? acts : []);
        setActivities(activitiesArray.length > 0 ? activitiesArray : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]));
      } catch {
        setRiskScore(MOCK_CLIENT_RISK as unknown as ClientRiskScoreDTO);
        setEligibility({ eligibilityLevel: 'HIGH', estimatedLoanCapacity: 25000 } as unknown as ClientEligibilityDTO);
        setActivities(MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [currentUser]);

  const eligKey = eligibility?.isEligibleForPremium ? 'HIGH' : 'MEDIUM';
  const score = riskScore?.riskScore ?? (MOCK_CLIENT_RISK as any).reliabilityScore;
  const scoreData = [{ name: 'Score', value: score, fill: '#4F46E5' }];

  const spendingData = [
    { month: 'Jan', amount: 1200 },
    { month: 'Feb', amount: 1900 },
    { month: 'Mar', amount: 1500 },
    { month: 'Apr', amount: 2300 },
    { month: 'May', amount: 2800 },
    { month: 'Jun', amount: 3100 },
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {currentUser?.firstName} 👋</h1>
          <p className="text-slate-500 mt-1 text-lg">Your financial ecosystem at a glance.</p>
        </div>
        <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${currentUser?.kycVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} border border-current/10`}>
          {currentUser?.kycVerified ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold text-sm tracking-wide uppercase">
            {currentUser?.kycVerified ? 'KYC Verified' : 'Pending Verification'}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="finova-card p-6 group hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <Wallet size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight size={14} />
              +2.4%
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Estimated Wealth</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">42,500.00 <span className="text-xs text-slate-400">TND</span></h3>
        </div>

        <div className="finova-card p-6 group hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CreditCard size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowUpRight size={14} />
              Elite
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Loan Capacity</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{(eligibility?.maxLoanAmount ?? 25000).toLocaleString()} <span className="text-xs text-slate-400">TND</span></h3>
        </div>

        <div className="finova-card p-6 group hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-rose-50 text-rose-600">
              <ArrowDownRight size={14} />
              -1.2%
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Debt</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">1,800.00 <span className="text-xs text-slate-400">TND</span></h3>
        </div>

        <div className="finova-card p-6 group hover:border-indigo-200 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <Star size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-600">
              Score: {score}
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reliability Score</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{riskScore?.riskCategory || 'HIGH'}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 finova-card p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Spending Analysis</h3>
              <p className="text-sm text-slate-500">Monthly overview of your financial activity</p>
            </div>
            <button className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-all">
              View Full Report <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={spendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <RechartsTip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-8">
          {/* Reliability Score Card */}
          <div className="finova-card p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-6">Reliability Score</h3>
              <div className="flex items-center justify-center relative h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="80%" outerRadius="100%" data={scoreData} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: 'rgba(255,255,255,0.1)' }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold">{score}</span>
                  <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-wider">Excellent</span>
                </div>
              </div>
              <p className="mt-6 text-xs text-indigo-100 text-center leading-relaxed">
                Your score is based on your transaction history and repayment patterns.
              </p>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          </div>

          {/* Activity Feed */}
          <div className="finova-card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Activity size={18} className="text-indigo-600" />
                Recent Activity
              </h3>
              <button onClick={() => navigate('/client/activities')} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {activities.slice(0, 4).map((act) => (
                <div key={act.id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                      {getActivityIcon(act.actionType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{act.description}</p>
                      <div className="flex items-center gap-2 mt-1">
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

export default ClientHome;
