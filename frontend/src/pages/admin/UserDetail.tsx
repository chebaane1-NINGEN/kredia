import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserResponseDTO, UserRole, UserActivityResponseDTO, AdminStatsDTO, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { 
  ChevronLeft, 
  Shield, 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Activity, 
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  RotateCcw,
  Ban,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
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
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [userData, logsData, statsData] = await Promise.all([
        userApi.getById(Number(id)),
        userApi.getAdminAudit(Number(id)).catch(() => ({ content: [] })),
        userApi.getAdminStats().catch(() => null)
      ]);
      setUser(userData);
      setNewRole(userData.role);
      setAuditLogs((logsData as any).content || []);
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
    
    const adminCount = (systemStats.roleDistribution as any)?.[UserRole.ADMIN] || 0;
    const isLastAdmin = adminCount <= 1 && user.role === UserRole.ADMIN;
    
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
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 size={40} className="text-indigo-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Loading user profile...</p>
    </div>
  );
  
  if (error || !user) return (
    <div className="finova-card p-12 text-center max-w-lg mx-auto">
      <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="text-rose-500" size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900">User Not Found</h3>
      <p className="text-slate-500 mt-2">{error || "The user you're looking for doesn't exist or has been permanently removed."}</p>
      <button 
        onClick={() => navigate('/admin/users')}
        className="mt-8 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all mx-auto shadow-lg shadow-indigo-100"
      >
        <ChevronLeft size={20} /> Back to Users
      </button>
    </div>
  );

  const isLastAdmin = !!(systemStats && (systemStats.roleDistribution as any)?.[UserRole.ADMIN] <= 1 && user.role === UserRole.ADMIN);

  const getStatusStyle = (s: string) => {
    switch(s) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'BLOCKED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'SUSPENDED': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'DELETED': return 'bg-slate-900 text-white border-slate-900';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.firstName} {user.lastName}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Shield size={14} className="text-indigo-600" /> {user.role}
              </span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(user.isDeleted ? 'DELETED' : user.status)}`}>
                {user.isDeleted ? 'DELETED' : user.status}
              </span>
            </div>
          </div>
        </div>
        {isLastAdmin && (
          <div className="flex items-center gap-3 px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 animate-pulse">
            <AlertCircle size={20} />
            <span className="font-bold text-sm uppercase tracking-wider">System Critical: Last Admin</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="finova-card p-8 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-4xl font-bold shadow-xl shadow-indigo-200 mb-6 overflow-hidden">
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                `${user.firstName[0]}${user.lastName[0]}`
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900">Account Identity</h3>
            <p className="text-sm text-slate-500 mt-1">User since {new Date(user.createdAt).toLocaleDateString()}</p>
            
            <div className="w-full mt-8 pt-8 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-4 text-left">
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Mail size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Phone size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-slate-700">{user.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><ShieldCheck size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KYC Status</p>
                  <p className={`text-sm font-bold ${user.kycVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {user.kycVerified ? 'Verified' : 'Pending Verification'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl"><Clock size={18} /></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</p>
                  <p className="text-sm font-bold text-slate-700">{user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : 'Never logged in'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="finova-card p-6 bg-slate-900 text-white border-none">
            <h3 className="font-bold flex items-center gap-2 mb-6">
              <Info size={18} className="text-indigo-400" />
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actions</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-xs font-bold uppercase">{user.isDeleted ? 'Deleted' : user.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Administration */}
        <div className="lg:col-span-8 space-y-8">
          {/* Role Management Card */}
          <div className="finova-card p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="text-indigo-600" size={20} />
                Access Control
              </h3>
              {isLastAdmin && <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider border border-rose-100">Protected</span>}
            </div>
            
            <p className="text-slate-500 mb-6">Elevate or restrict platform access by modifying the user's role. This affects available features and dashboard views.</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex flex-1 p-1 bg-slate-100 rounded-2xl w-full">
                {Object.values(UserRole).map(role => (
                  <button
                    key={role}
                    disabled={user.isDeleted || (isLastAdmin && role !== UserRole.ADMIN)}
                    onClick={() => setNewRole(role)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${newRole === role ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 disabled:opacity-50'}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              <button 
                onClick={openRoleModal}
                disabled={changingRole || user.isDeleted || user.role === newRole || (isLastAdmin && newRole !== UserRole.ADMIN)}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {changingRole ? <Loader2 size={18} className="animate-spin" /> : 'Apply Role'}
              </button>
            </div>
          </div>

          {/* Status Control Card */}
          <div className="finova-card p-8">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-8">
              <Activity className="text-indigo-600" size={20} />
              Status & Security
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {user.isDeleted ? (
                <button 
                  onClick={() => requestStatusAction('restore')} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                >
                  <RotateCcw size={18} /> Restore Account
                </button>
              ) : (
                <>
                  {user.status !== UserStatus.ACTIVE && (
                    <button 
                      onClick={() => requestStatusAction('activate')} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                      <CheckCircle2 size={18} /> Activate Access
                    </button>
                  )}
                  {user.status === UserStatus.ACTIVE && (
                    <button 
                      onClick={() => requestStatusAction('suspend')} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-100"
                    >
                      <Clock size={18} /> Suspend
                    </button>
                  )}
                  {user.status !== UserStatus.BLOCKED && (
                    <button 
                      disabled={isLastAdmin}
                      onClick={() => requestStatusAction('block')} 
                      className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all active:scale-95 shadow-lg shadow-rose-100 disabled:opacity-50"
                    >
                      <Ban size={18} /> Block Account
                    </button>
                  )}
                  <button 
                    disabled={isLastAdmin}
                    onClick={() => requestStatusAction('delete')} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-white border border-rose-200 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all active:scale-95 ml-auto disabled:opacity-50"
                  >
                    <Trash2 size={18} /> Soft Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="finova-card p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="text-indigo-600" size={20} />
                User Audit Trail
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">{auditLogs.length} Records</span>
            </div>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
              {auditLogs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 sticky top-0 z-10">
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                            {log.actionType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-700 line-clamp-1" title={log.description}>{log.description}</p>
                          {log.ipAddress && <p className="text-[10px] text-slate-400 mt-0.5">IP: {log.ipAddress}</p>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {log.isSuspicious ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                              <AlertCircle size={10} /> High
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                              <CheckCircle2 size={10} /> Low
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="text-slate-200" size={32} />
                  </div>
                  <h3 className="text-slate-900 font-bold">No activities recorded</h3>
                  <p className="text-slate-500 text-sm mt-1">This user has not performed any auditable actions yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      <ConfirmModal
        isOpen={isRoleModalOpen}
        title="Confirm Role Change"
        message={`Are you sure you want to change this user's role from ${user.role} to ${newRole}? This will immediately update their permissions.`}
        confirmText="Confirm Change"
        onConfirm={executeRoleChange}
        onCancel={() => setIsRoleModalOpen(false)}
      />

      {/* Status Action Modal with Warning */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`Confirm ${confirmState.actionType.toUpperCase()}`}
        message={confirmState.warning || `Are you sure you want to ${confirmState.actionType} this account? This action will be logged for audit purposes.`}
        confirmText={confirmState.warning?.includes('CRITICAL') ? 'Action Blocked' : confirmState.actionType.toUpperCase()}
        confirmStyle={confirmState.warning?.includes('CRITICAL') ? 'primary' : (confirmState.actionType === 'activate' || confirmState.actionType === 'restore' ? 'primary' : 'danger')}
        onConfirm={executeStatusAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default UserDetail;