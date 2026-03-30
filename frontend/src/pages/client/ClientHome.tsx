import React, { useEffect, useState } from 'react';
import { ClientRiskScoreDTO, ClientEligibilityDTO, UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_CLIENT_RISK, MOCK_ACTIVITIES, relativeTime, getActivityIcon, ELIGIBILITY_CONFIG } from '../../utils/mockData';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';

const ClientHome: React.FC = () => {
  const { currentUser } = useAuth();
  const [riskScore, setRiskScore] = useState<ClientRiskScoreDTO | null>(null);
  const [eligibility, setEligibility] = useState<ClientEligibilityDTO | null>(null);
  const [activities, setActivities] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAll = async () => {
      setLoading(true);
      try {
        const [risk, elig, acts] = await Promise.all([
          userApi.getClientRiskScore(currentUser.id).catch(() => null),
          userApi.getClientEligibility(currentUser.id).catch(() => null),
          userApi.getClientActivities(currentUser.id).catch(() => [])
        ]);
        setRiskScore(risk || (MOCK_CLIENT_RISK as unknown as ClientRiskScoreDTO));
        setEligibility(elig || { eligibilityLevel: 'HIGH', estimatedLoanCapacity: 25000, monthlyIncome: 3200, existingDebt: 1800 } as unknown as ClientEligibilityDTO);
        setActivities(acts.length > 0 ? acts : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]));
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
  const eligConfig = ELIGIBILITY_CONFIG[eligKey];
  const score = riskScore?.riskScore ?? (MOCK_CLIENT_RISK as any).reliabilityScore;
  const scoreData = [{ name: 'Score', value: score, fill: eligConfig.color }];

  if (loading) {
    return (
      <div className="client-home">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="card h-40 flex items-center justify-center">
              <div className="spinner"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="client-home wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {currentUser?.firstName} 👋</h2>
          <p className="text-muted">Here's your financial profile overview</p>
        </div>
        <span className="badge px-4 py-2 text-sm font-bold" style={{ backgroundColor: eligConfig.bg, color: eligConfig.color }}>
          {eligConfig.score} {eligConfig.label}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Credit Score Radial */}
        <div className="card flex flex-col items-center p-6">
          <h3 className="font-bold mb-4 self-start text-lg">My Credit Score</h3>
          <div className="relative" style={{ height: '200px', width: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="75%" outerRadius="90%" data={scoreData} startAngle={90} endAngle={-270}>
                <RadialBar background={{ fill: '#F4F7FE' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold" style={{ color: eligConfig.color }}>{score}</div>
              <div className="text-xs text-muted font-medium">out of 100</div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="font-bold" style={{ color: eligConfig.color }}>{eligKey} ELIGIBILITY</div>
            <div className="text-xs text-muted">Updated monthly</div>
          </div>
        </div>

        {/* Loan Capacity */}
        <div className="card flex flex-col justify-between p-6">
          <h3 className="font-bold text-lg mb-4">Estimated Loan Capacity</h3>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">
              {(eligibility?.maxLoanAmount ?? 15000).toLocaleString()} TND
            </div>
            <div className="text-sm text-muted mb-4">Based on your current financial profile</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">Utilization</span>
                  <span className="font-semibold">45%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: '#F4F7FE' }}>
                  <div className="h-2 rounded-full" style={{ background: '#4318FF', width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-full mt-4" disabled>Apply for Loan →</button>
        </div>

        {/* Quick Stats */}
        <div className="card flex flex-col gap-4 p-6">
          <h3 className="font-bold text-lg">Account Summary</h3>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted text-sm">KYC Status</span>
            <span className="font-bold" style={{ color: currentUser?.kycVerified ? '#05CD99' : '#FFCE20' }}>
              {currentUser?.kycVerified ? '✅ Verified' : '⏳ Pending'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted text-sm">Account Status</span>
            <span className="font-bold text-success">Active ✓</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted text-sm">Member Since</span>
            <span className="font-semibold">{new Date(currentUser?.createdAt || Date.now()).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-muted text-sm">Last Login</span>
            <span className="font-semibold text-sm">{relativeTime(new Date(Date.now() - 3600000).toISOString())}</span>
          </div>
        </div>

      </div>

      {/* Recent Activity */}
      <div className="card p-0">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="font-bold">Recent Account Activity</h3>
          <a href="/client/activities" className="text-primary text-sm font-medium hover:underline">View all →</a>
        </div>
        <div className="divide-y">
          {activities.slice(0, 5).map((act) => (
            <div key={act.activityId} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#F4F7FE' }}>
                {getActivityIcon(act.activityType)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm">{act.description}</div>
                <div className="text-xs text-muted mt-1">{act.activityType}</div>
              </div>
              <span className="text-xs text-muted whitespace-nowrap">{relativeTime(act.timestamp)}</span>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="empty-state border-0 py-8">
              <p className="text-muted">No recent activity found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientHome;
