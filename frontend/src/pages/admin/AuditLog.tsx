import React, { useEffect, useState } from 'react';
import { UserActivityResponseDTO, UserRole } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';

type LogWithRole = UserActivityResponseDTO & { roleSource?: string };

const AuditLog: React.FC = () => {
  const [allLogs, setAllLogs] = useState<LogWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  // Filters
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  
  const fetchAllLogs = async () => {
    try {
      setLoading(true);
      // Fetch logs for all roles to provide a unified global view
      const [adminLogs, employeeLogs, clientLogs] = await Promise.all([
        userApi.getAdminActivitiesByRole(UserRole.ADMIN).catch(() => []),
        userApi.getAdminActivitiesByRole(UserRole.EMPLOYEE).catch(() => []),
        userApi.getAdminActivitiesByRole(UserRole.CLIENT).catch(() => [])
      ]);

      // Tag logs with their role source
      const taggedAdminLogs = adminLogs.map(log => ({ ...log, roleSource: 'ADMIN' }));
      const taggedEmployeeLogs = employeeLogs.map(log => ({ ...log, roleSource: 'EMPLOYEE' }));
      const taggedClientLogs = clientLogs.map(log => ({ ...log, roleSource: 'CLIENT' }));

      const mergedLogs = [...taggedAdminLogs, ...taggedEmployeeLogs, ...taggedClientLogs]
        // Sort by most recent first
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setAllLogs(mergedLogs);
    } catch (err) {
      console.error(err);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const uniqueActions = Array.from(new Set(allLogs.map(l => l.activityType))).sort();

  const filteredLogs = allLogs.filter(log => {
    if (filterAction !== 'ALL' && log.activityType !== filterAction) return false;
    if (filterRole !== 'ALL' && log.roleSource !== filterRole) return false;
    if (filterRisk !== 'ALL') {
      if (filterRisk === 'HIGH' && !log.isSuspicious) return false;
      if (filterRisk === 'LOW' && log.isSuspicious) return false;
    }
    if (filterDate) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== filterDate) return false;
    }
    return true;
  });

  const totalLogs = allLogs.length;
  const suspiciousLogs = allLogs.filter(l => l.isSuspicious).length;
  const todayLogs = allLogs.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(l.timestamp).toISOString().split('T')[0] === today;
  }).length;

  const getRoleBadge = (role?: string) => {
    switch(role) {
      case 'ADMIN': return <span className="badge badge-admin">ADMIN</span>;
      case 'EMPLOYEE': return <span className="badge badge-employee">AGENT</span>;
      case 'CLIENT': return <span className="badge badge-client">CLIENT</span>;
      default: return <span className="badge bg-secondary">Unknown</span>;
    }
  };

  const getActionBadge = (actionType: string) => {
    if (actionType.includes('CREATE') || actionType.includes('CREATED')) {
      return <span className="badge bg-success">{actionType}</span>;
    }
    if (actionType.includes('DELETE') || actionType.includes('DELETED')) {
      return <span className="badge bg-danger">{actionType}</span>;
    }
    if (actionType.includes('UPDATE') || actionType.includes('UPDATED') || actionType.includes('CHANGE')) {
      return <span className="badge bg-primary">{actionType}</span>;
    }
    if (actionType.includes('BLOCK') || actionType.includes('SUSPEND')) {
      return <span className="badge bg-warning">{actionType}</span>;
    }
    return <span className="badge bg-secondary">{actionType}</span>;
  };

  const hasActiveFilters = filterDate || filterAction !== 'ALL' || filterRole !== 'ALL' || filterRisk !== 'ALL';

  return (
    <div className="audit-log wow fadeInUp">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Total Activities</p>
          <div className="value mt-1 text-3xl font-bold">{totalLogs}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Suspicious</p>
          <div className="value mt-1 text-3xl font-bold text-danger">{suspiciousLogs}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Today's Activities</p>
          <div className="value mt-1 text-3xl font-bold text-primary">{todayLogs}</div>
        </div>
        <div className="stat-card">
          <p className="text-muted text-sm font-medium">Filtered Results</p>
          <div className="value mt-1 text-3xl font-bold text-success">{filteredLogs.length}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">System Audit Log</h2>
          <p className="text-muted">Comprehensive tracking of all system and user activities</p>
        </div>
        <button onClick={fetchAllLogs} className="btn btn-outline" disabled={loading}>
          {loading ? 'Syncing...' : '↻ Refresh Logs'}
        </button>
      </div>
      
      {/* Filters */}
      <div className="card filter-bar mb-6">
        <div className="filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="text-muted text-xs uppercase font-semibold mb-1 block">Action Type</label>
            <select 
              value={filterAction} 
              onChange={e => setFilterAction(e.target.value)} 
              className="form-control"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-muted text-xs uppercase font-semibold mb-1 block">User Role</label>
            <select 
              value={filterRole} 
              onChange={e => setFilterRole(e.target.value)} 
              className="form-control"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="EMPLOYEE">Agent</option>
              <option value="CLIENT">Client</option>
            </select>
          </div>

          <div>
            <label className="text-muted text-xs uppercase font-semibold mb-1 block">Risk Level</label>
            <select 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)} 
              className="form-control"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
          
          <div>
            <label className="text-muted text-xs uppercase font-semibold mb-1 block">Date</label>
            <input 
              type="date" 
              className="form-control"
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
            />
          </div>
          
          {hasActiveFilters && (
            <div className="flex items-end">
              <button 
                className="btn btn-sm btn-outline w-full"
                onClick={() => { 
                  setFilterDate(''); 
                  setFilterAction('ALL'); 
                  setFilterRole('ALL'); 
                  setFilterRisk('ALL'); 
                }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card p-0">
        <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <table className="table m-0">
            <thead className="bg-light sticky top-0">
              <tr>
                <th>Timestamp</th>
                <th>Role</th>
                <th>Action ID</th>
                <th>Target User</th>
                <th>Actor</th>
                <th>Event Type</th>
                <th>Description</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {loading && allLogs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8">
                  <div className="spinner inline-block"></div>
                  <p className="text-muted mt-2">Loading audit logs...</p>
                </td></tr>
              ) : 
               filteredLogs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8">
                  <div className="empty-state">
                    <div className="empty-icon text-4xl mb-4">🔍</div>
                    <h3>No audit records match filters</h3>
                    <p className="text-muted">Try adjusting your search criteria.</p>
                    {hasActiveFilters && (
                      <button 
                        className="btn btn-sm btn-outline mt-4"
                        onClick={() => { 
                          setFilterDate(''); 
                          setFilterAction('ALL'); 
                          setFilterRole('ALL'); 
                          setFilterRisk('ALL'); 
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td></tr>
               ) :
               filteredLogs.map(log => (
                <tr key={log.activityId} className={log.isSuspicious ? 'bg-danger-light' : ''}>
                  <td className="whitespace-nowrap">
                    <div className="font-medium text-sm">{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-muted text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td>{getRoleBadge(log.roleSource)}</td>
                  <td className="text-muted text-xs">#{log.activityId}</td>
                  <td>
                    <span className="badge bg-primary-light text-primary">User #{log.userId}</span>
                  </td>
                  <td>
                    {log.actorId ? (
                      <span className="badge bg-info-light text-info">U-{log.actorId}</span>
                    ) : (
                      <span className="badge bg-secondary">System</span>
                    )}
                  </td>
                  <td>{getActionBadge(log.activityType)}</td>
                  <td className="max-w-md" title={log.description}>
                    <small className="text-muted">{log.description}</small>
                  </td>
                  <td>
                    {log.isSuspicious ? (
                      <span className="badge bg-danger">⚠️ High</span>
                    ) : (
                      <span className="badge bg-success text-xs">✓ Low</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-muted">
            <span>Showing {filteredLogs.length} of {totalLogs} records</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
