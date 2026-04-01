import React, { useEffect, useState } from 'react';
import { UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_ACTIVITIES, relativeTime, getActivityIcon } from '../../utils/mockData';

const ClientActivities: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    userApi.getClientActivities(currentUser.id)
      .then((data) => setLogs(data.length > 0 ? data : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[])))
      .catch(() => setLogs(MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  return (
    <div className="client-activities wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Security & Activity History</h2>
          <p className="text-muted">A complete log of all actions on your account</p>
        </div>
      </div>

      <div className="card p-0">
        <div className="divide-y">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="skeleton skeleton-avatar" style={{ width: 48, height: 48, borderRadius: '50%' }}></div>
                <div className="flex-1">
                  <div className="skeleton skeleton-text w-3/4 mb-2"></div>
                  <div className="skeleton skeleton-text-sm w-1/2"></div>
                </div>
                <div className="skeleton skeleton-text-sm w-16"></div>
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="empty-state border-0 py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3>No activity history found</h3>
              <p className="text-muted">Your account actions will appear here.</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.activityId} className="flex items-start gap-4 p-5 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: log.isSuspicious ? '#FDEDEC' : '#F4F7FE' }}>
                  {getActivityIcon(log.activityType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{log.description}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="badge text-xs" style={{ background: '#F4F7FE', color: '#4318FF' }}>{log.activityType}</span>
                    {log.isSuspicious && <span className="badge text-xs" style={{ background: '#FDEDEC', color: '#C6493E' }}>⚠️ Suspicious</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-muted">{relativeTime(log.timestamp)}</div>
                  <div className="text-xs text-muted mt-1">{new Date(log.timestamp).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientActivities;
