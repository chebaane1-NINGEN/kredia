import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { UserResponseDTO, UserRole, UserActivityResponseDTO, AdminStatsDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserResponseDTO | null>(null);
  const [auditLogs, setAuditLogs] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [systemStats, setSystemStats] = useState<AdminStatsDTO | null>(null);
  
  const { addToast } = useToast();
  
  // Role Modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CLIENT);
  const [changingRole, setChangingRole] = useState(false);

  // Status Modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    actionType: 'block' | 'activate' | 'suspend' | 'deactivate' | 'restore' | 'delete';
    warning?: string;
  }>({ isOpen: false, actionType: 'block' });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userData, logsData, statsData] = await Promise.all([
        userApi.getById(Number(id)),
        userApi.getAdminAudit(Number(id)).catch(() => []),
        userApi.getAdminStats().catch(() => null)
      ]);
      setUser(userData);
      setNewRole(userData.role);
      setAuditLogs(logsData || []);
      setSystemStats(statsData);
    } catch (err) {
      setError('Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Business Rules Validation
  const getBusinessRuleWarning = (action: string): string | null => {
    if (!user || !systemStats) return null;
    
    const isLastAdmin = systemStats.totalAdmins <= 1 && user.role === UserRole.ADMIN;
    
    switch (action) {
      case 'delete':
        if (isLastAdmin) {
          return 'CRITICAL: This is the last ADMIN in the system. Deleting this account would lock out all administrative access.';
        }
        return null;
      case 'block':
        if (isLastAdmin) {
          return 'WARNING: This is the last ADMIN. Blocking this account would prevent any administrative actions.';
        }
        return null;
      case 'role':
        if (isLastAdmin && newRole !== UserRole.ADMIN) {
          return 'CRITICAL: Cannot downgrade the last ADMIN. Please create another ADMIN account first.';
        }
        return null;
      default:
        return null;
    }
  };

  const isActionAllowed = (action: string): boolean => {
    const warning = getBusinessRuleWarning(action);
    if (warning && warning.includes('CRITICAL')) {
      return false;
    }
    return true;
  };

  const executeRoleChange = async () => {
    if (!user || user.role === newRole) return;
    
    const warning = getBusinessRuleWarning('role');
    if (warning && warning.includes('CRITICAL')) {
      addToast(warning, 'error');
      setIsRoleModalOpen(false);
      return;
    }
    
    setChangingRole(true);
    setIsRoleModalOpen(false);
    try {
      const updatedUser = await userApi.changeRole(user.id, newRole);
      setUser(updatedUser);
      addToast(`Role updated to ${newRole} successfully`, 'success');
      fetchData();
    } catch(err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || 'Role update failed';
      addToast(message, 'error');
    } finally {
      setChangingRole(false);
    }
  };

  const executeStatusAction = async () => {
    if (!user) return;
    const { actionType } = confirmState;
    
    if (!isActionAllowed(actionType)) {
      addToast(getBusinessRuleWarning(actionType) || 'Action not allowed', 'error');
      setConfirmState({ ...confirmState, isOpen: false });
      return;
    }
    
    try {
      if (actionType === 'delete') {
        await userApi.delete(user.id);
      } else {
        switch(actionType) {
          case 'block': await userApi.block(user.id); break;
          case 'activate': await userApi.activate(user.id); break;
          case 'suspend': await userApi.suspend(user.id); break;
          case 'deactivate': await userApi.deactivate(user.id); break;
          case 'restore': await userApi.restore(user.id); break;
        }
      }
      addToast(`Action '${actionType}' completed successfully`, 'success');
      fetchData();
    } catch(err: any) {
      const message = err.response?.data?.message || err.response?.data?.error || `Action failed`;
      addToast(message, 'error');
    } finally {
      setConfirmState({ ...confirmState, isOpen: false });
    }
  };

  const requestStatusAction = (action: 'block' | 'activate' | 'suspend' | 'deactivate' | 'restore' | 'delete') => {
    const warning = getBusinessRuleWarning(action);
    setConfirmState({ 
      isOpen: true, 
      actionType: action,
      warning: warning || undefined
    });
  };

  const openRoleModal = () => {
    const warning = getBusinessRuleWarning('role');
    if (warning && warning.includes('CRITICAL')) {
      addToast(warning, 'error');
      return;
    }
    setIsRoleModalOpen(true);
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Loading profile...</p>
    </div>
  );
  
  if (error || !user) return (
    <div className="empty-state wow scaleUp">
      <div className="empty-icon">⚠️</div>
      <h3>User Not Found</h3>
      <p>{error}</p>
      <Link to="/admin/users" className="btn btn-primary mt-4">← Back to Users</Link>
    </div>
  );

  const isLastAdmin = !!(systemStats && systemStats.totalAdmins <= 1 && user.role === UserRole.ADMIN);

  return (
    <div className="user-detail wow fadeInUp">
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/users" className="btn btn-outline">← Back to Users</Link>
          <h2 className="text-2xl font-bold">User Profile: {user.firstName} {user.lastName}</h2>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
          <span className={`badge bg-${user.status.toLowerCase()}`}>{user.isDeleted ? 'DELETED' : user.status}</span>
          {isLastAdmin && (
            <span className="badge bg-danger text-white" title="This is the last admin account">👑 LAST ADMIN</span>
          )}
        </div>
      </div>

      {/* Last Admin Warning Banner */}
      {isLastAdmin && (
        <div className="alert alert-danger mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <strong>System Critical Account</strong>
              <p className="text-sm mb-0">This is the last remaining ADMIN account. Certain destructive actions are restricted to prevent system lockout.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Info */}
        <div className="section-card lg:col-span-1">
          <div className="card-header border-b">
            <h3>Identity Information</h3>
          </div>
          <div className="card-body">
            <div className="info-group mb-3">
              <span className="text-muted text-sm block">System ID</span>
              <strong className="text-lg">#{user.id}</strong>
            </div>
            <div className="info-group mb-3">
              <span className="text-muted text-sm block">Email Address</span>
              <strong>{user.email}</strong>
            </div>
            <div className="info-group mb-3">
              <span className="text-muted text-sm block">Phone Number</span>
              <strong>{user.phoneNumber || 'N/A'}</strong>
            </div>
            <div className="info-group mb-3">
              <span className="text-muted text-sm block">KYC Status</span>
              <strong className={user.kycVerified ? 'text-success' : 'text-warning'}>
                {user.kycVerified ? '✅ Verified' : '⏳ Pending'}
              </strong>
            </div>
            <div className="info-group mb-3">
              <span className="text-muted text-sm block">Account Created</span>
              <strong>{new Date(user.createdAt).toLocaleDateString()}</strong>
              <span className="text-muted text-xs block">{new Date(user.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="info-group">
              <span className="text-muted text-sm block">Last Active</span>
              <strong>{user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : 'Never logged in'}</strong>
            </div>
          </div>
        </div>

        {/* Administration Actions */}
        <div className="section-card lg:col-span-2 space-y-6">
          
          {/* Role Management */}
          <div>
            <div className="card-header border-b flex justify-between items-center">
              <h3>Role Management</h3>
              {isLastAdmin && (
                <span className="badge bg-danger text-white text-xs">Protected</span>
              )}
            </div>
            <div className="card-body">
              <p className="text-muted mb-4">Change the user's elevated access level across the platform.</p>
              
              {isLastAdmin && (
                <div className="alert alert-warning mb-4">
                  <small>⚠️ Cannot downgrade the last ADMIN. Create another ADMIN account first.</small>
                </div>
              )}
              
              <div className="flex gap-4 items-center flex-wrap">
                <div className="flex gap-2">
                  {Object.values(UserRole).map(role => (
                    <button
                      key={role}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        newRole === role
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isLastAdmin && role !== UserRole.ADMIN ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => setNewRole(role)}
                      disabled={user.isDeleted || (isLastAdmin && role !== UserRole.ADMIN)}
                    >
                      {role === UserRole.ADMIN && '👑 '}
                      {role === UserRole.EMPLOYEE && '👔 '}
                      {role === UserRole.CLIENT && '👤 '}
                      {role}
                    </button>
                  ))}
                </div>
                <button 
                  className="btn btn-primary ml-auto" 
                  onClick={openRoleModal} 
                  disabled={changingRole || user.isDeleted || user.role === newRole || (isLastAdmin && newRole !== UserRole.ADMIN)}
                >
                  {changingRole ? (
                    <>
                      <span className="spinner spinner-sm mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    'Update Role'
                  )}
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <small className="text-muted">
                  <strong>Current Role:</strong> {user.role} • 
                  <strong> New Role:</strong> {newRole}
                  {user.role === newRole && (
                    <span className="text-warning ml-2">(No change)</span>
                  )}
                </small>
              </div>
            </div>
          </div>

          {/* Status Control */}
          <div>
            <div className="card-header border-b flex justify-between items-center">
              <h3>Status Control</h3>
              <span className="text-muted text-sm">Current: <strong>{user.status}</strong></span>
            </div>
            <div className="card-body">
              <p className="text-muted mb-4">Manage account access and availability.</p>
              
              <div className="flex gap-3 flex-wrap">
                {user.isDeleted ? (
                   <button 
                     onClick={() => requestStatusAction('restore')} 
                     className="btn btn-success"
                   >
                     🔄 Restore Account
                   </button>
                ) : (
                  <>
                    {user.status !== 'ACTIVE' && (
                       <button 
                         onClick={() => requestStatusAction('activate')} 
                         className="btn btn-success"
                         disabled={isLastAdmin && user.status === 'BLOCKED'}
                         title={isLastAdmin && user.status === 'BLOCKED' ? 'Cannot activate last admin from blocked state' : ''}
                       >
                         ✅ Activate Access
                       </button>
                    )}
                    {user.status === 'ACTIVE' && (
                       <button 
                         onClick={() => requestStatusAction('suspend')} 
                         className="btn btn-warning text-white"
                       >
                         ⏸️ Suspend Account
                       </button>
                    )}
                    {user.status !== 'BLOCKED' && (
                       <button 
                         onClick={() => requestStatusAction('block')} 
                         className="btn btn-danger"
                         disabled={isLastAdmin}
                         title={isLastAdmin ? 'Cannot block the last admin' : ''}
                       >
                         🚫 Block Immediately
                       </button>
                    )}
                    <button 
                      onClick={() => requestStatusAction('delete')} 
                      className="btn btn-outline-danger ml-auto border-2"
                      disabled={isLastAdmin}
                      title={isLastAdmin ? 'Cannot delete the last admin' : ''}
                    >
                      🗑️ Soft Delete
                    </button>
                  </>
                )}
              </div>
              
              {isLastAdmin && (
                <div className="alert alert-warning mt-4">
                  <small>⚠️ Some actions are disabled because this is the last ADMIN account.</small>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{auditLogs.length}</div>
              <div className="text-xs text-muted">Total Activities</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-success">{user.kycVerified ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted">KYC Verified</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">{user.isActive ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted">Active</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-danger">{user.isDeleted ? 'Yes' : 'No'}</div>
              <div className="text-xs text-muted">Deleted</div>
            </div>
          </div>

        </div>

        {/* Audit Log History */}
        <div className="section-card lg:col-span-3">
          <div className="card-header border-b flex justify-between items-center">
            <h3>Recent User Activity</h3>
            <span className="badge bg-secondary">{auditLogs.length} records</span>
          </div>
          <div className="card-body p-0">
            {auditLogs && auditLogs.length > 0 ? (
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="table m-0">
                  <thead className="bg-light sticky top-0">
                    <tr>
                      <th>Action ID</th>
                      <th>Event Type</th>
                      <th>Description</th>
                      <th>IP Address</th>
                      <th>Timestamp</th>
                      <th>Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className={log.isSuspicious ? 'bg-danger-light' : ''}>
                        <td className="text-muted">#{log.activityId}</td>
                        <td>
                          <span className={`badge ${
                            log.activityType.includes('CREATE') ? 'bg-success' :
                            log.activityType.includes('DELETE') ? 'bg-danger' :
                            log.activityType.includes('UPDATE') ? 'bg-primary' :
                            'bg-secondary'
                          }`}>
                            {log.activityType}
                          </span>
                        </td>
                        <td className="max-w-md" title={log.description}>
                          <small>{log.description}</small>
                        </td>
                        <td className="text-muted text-xs">{log.ipAddress || 'N/A'}</td>
                        <td className="text-xs">{new Date(log.timestamp).toLocaleString()}</td>
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
            ) : (
              <div className="empty-state py-8">
                <div className="empty-icon text-4xl mb-4">📜</div>
                <h4>No tracking history available</h4>
                <p className="text-muted">This user has not performed any auditable actions yet.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Role Change Modal */}
      <ConfirmModal
        isOpen={isRoleModalOpen}
        title="Confirm Role Change"
        message={`Are you sure you want to change this user's role from ${user.role} to ${newRole}?`}
        confirmText="Confirm Change"
        confirmStyle="primary"
        onConfirm={executeRoleChange}
        onCancel={() => setIsRoleModalOpen(false)}
      />

      {/* Status Action Modal with Warning */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`Confirm ${confirmState.actionType.charAt(0).toUpperCase() + confirmState.actionType.slice(1)}`}
        message={confirmState.warning || `Are you sure you want to ${confirmState.actionType} this user?`}
        confirmText={confirmState.warning?.includes('CRITICAL') ? 'Action Blocked' : `Yes, ${confirmState.actionType}`}
        confirmStyle={confirmState.warning?.includes('CRITICAL') ? 'primary' : (confirmState.actionType === 'activate' || confirmState.actionType === 'restore' ? 'success' : 'danger')}
        onConfirm={executeStatusAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default UserDetail;
