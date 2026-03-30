import React, { useEffect, useState } from 'react';
import { UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_ACTIVITIES, relativeTime, getActivityIcon } from '../../utils/mockData';

const EmployeeActivities: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (!currentUser) return;
    userApi.getAgentActivities(currentUser.id)
      .then((data) => setLogs(data.length > 0 ? data : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[])))
      .catch(() => setLogs(MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const uniqueTypes = Array.from(new Set(logs.map(l => l.activityType))).sort();
  const filtered = filterType === 'ALL' ? logs : logs.filter(l => l.activityType === filterType);

  return (
    <div className="employee-activities wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Activity History</h2>
          <p className="text-muted">All actions recorded on your account</p>
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="form-control"
          style={{ width: '200px' }}
        >
          <option value="ALL">All Activities</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="card p-0">
        <div className="divide-y">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="skeleton skeleton-avatar" style={{width: '48px', height: '48px', borderRadius: '50%'}}></div>
                <div className="flex-1">
                  <div className="skeleton skeleton-text w-3/4 mb-2"></div>
                  <div className="skeleton skeleton-text-sm w-1/2"></div>
                </div>
                <div className="skeleton skeleton-text-sm w-16"></div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-3">📋</div>
              <h3>No activities found</h3>
              <p className="text-muted">Try changing the filter.</p>
            </div>
          ) : (
            filtered.map(log => (
              <div key={log.activityId} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors cursor-default">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#F4F7FE' }}>
                  {getActivityIcon(log.activityType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-main">{log.description}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="badge" style={{ background: '#F4F7FE', color: '#4318FF', fontSize: '0.7rem' }}>{log.activityType}</span>
                    {log.isSuspicious && <span className="badge" style={{ background: '#FDEDEC', color: '#C6493E', fontSize: '0.7rem' }}>⚠️ Flagged</span>}
                  </div>
                </div>
                <span className="text-xs text-muted whitespace-nowrap">{relativeTime(log.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeActivities;
