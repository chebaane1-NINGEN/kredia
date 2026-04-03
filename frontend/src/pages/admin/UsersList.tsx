import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserResponseDTO, UserRole, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useDebounce } from '../../hooks/useDebounce';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Shield, 
  UserCheck, 
  Ban, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Mail,
  Eye,
  CheckCircle2,
  User,
  MoreVertical,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

type SortField = 'id' | 'firstName' | 'email' | 'role' | 'status';
type SortDir = 'asc' | 'desc';

const UsersList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    actionType: 'block' | 'activate' | 'suspend' | 'deactivate' | 'restore' | 'delete';
  }>({ isOpen: false, userId: 0, userName: '', actionType: 'block' });
  
  // Filters
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [emailInput, setEmailInput] = useState('');
  const debouncedEmail = useDebounce(emailInput, 450);
  
  // Sort
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userApi.search({
        role: role || undefined,
        status: status || undefined,
        email: debouncedEmail || undefined,
        page,
        size: 10,
        sort: `${sortField},${sortDir}`
      });
      setUsers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err) {
      console.error('Error fetching users', err);
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [role, status, debouncedEmail, page, sortField, sortDir]);

  useEffect(() => {
    setPage(0);
  }, [role, status, debouncedEmail]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const executeAction = async () => {
    const { userId, actionType } = confirmState;
    try {
      if (actionType === 'delete') {
        await userApi.delete(userId);
      } else {
        switch(actionType) {
          case 'block': await userApi.block(userId); break;
          case 'activate': await userApi.activate(userId); break;
          case 'suspend': await userApi.suspend(userId); break;
          case 'deactivate': await userApi.deactivate(userId); break;
          case 'restore': await userApi.restore(userId); break;
        }
      }
      addToast(`Action '${actionType}' applied to ${confirmState.userName}`, 'success');
      fetchUsers();
    } catch(err: any) {
      addToast(err.response?.data?.message || `Action failed. Cannot ${actionType} user.`, 'error');
    } finally {
      setConfirmState({ ...confirmState, isOpen: false });
    }
  };

  const requestAction = (id: number, name: string, action: typeof confirmState.actionType) => {
    setConfirmState({ isOpen: true, userId: id, userName: name, actionType: action });
  };

  const getStatusStyle = (s: UserStatus) => {
    switch(s) {
      case UserStatus.ACTIVE: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case UserStatus.BLOCKED: return 'bg-rose-50 text-rose-600 border-rose-100';
      case UserStatus.SUSPENDED: return 'bg-amber-50 text-amber-600 border-amber-100';
      case UserStatus.PENDING_VERIFICATION: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getRoleIcon = (r: UserRole) => {
    switch(r) {
      case UserRole.ADMIN: return <Shield size={14} className="text-indigo-600" />;
      case UserRole.AGENT: return <UserCheck size={14} className="text-emerald-600" />;
      default: return <User size={14} className="text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform access, roles, and user statuses ({totalElements} total).</p>
        </div>
        <Link 
          to="/admin/users/new" 
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
        >
          <UserPlus size={20} />
          <span>Create User</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="finova-card p-4 bg-slate-50/50 border-slate-200">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by email address..." 
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select 
                value={role} 
                onChange={e => setRole(e.target.value as UserRole | '')}
                className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all min-w-[140px]"
              >
                <option value="">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="AGENT">Agent</option>
                <option value="CLIENT">Client</option>
              </select>
            </div>
            <div className="relative">
              <select 
                value={status} 
                onChange={e => setStatus(e.target.value as UserStatus | '')}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all min-w-[160px]"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING_VERIFICATION">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>
            {(role || status || emailInput) && (
              <button 
                onClick={() => { setRole(''); setStatus(''); setEmailInput(''); }}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Clear Filters"
              >
                <RotateCcw size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="finova-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('id')}>
                  <div className="flex items-center gap-1">
                    ID <ArrowUpDown size={12} className={`transition-opacity ${sortField === 'id' ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('firstName')}>
                  <div className="flex items-center gap-1">
                    User <ArrowUpDown size={12} className={`transition-opacity ${sortField === 'firstName' ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('role')}>
                  <div className="flex items-center gap-1">
                    Role <ArrowUpDown size={12} className={`transition-opacity ${sortField === 'role' ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => toggleSort('status')}>
                  <div className="flex items-center gap-1">
                    Status <ArrowUpDown size={12} className={`transition-opacity ${sortField === 'status' ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-8"></div></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-32"></div>
                          <div className="h-3 bg-slate-100 rounded w-48"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-32"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="text-slate-200" size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold">No users found</h3>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-slate-400">#{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform overflow-hidden">
                          {user.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            `${user.firstName ? user.firstName[0] : '?'}${user.lastName ? user.lastName[0] : '?'}`
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{user.firstName} {user.lastName}</h4>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {getRoleIcon(user.role)}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        
                        <div className="w-px h-4 bg-slate-200 mx-1" />

                        {user.isDeleted ? (
                          <button 
                            onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'restore')}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Restore User"
                          >
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <>
                            {user.status === UserStatus.ACTIVE ? (
                              <button 
                                onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'block')}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Block User"
                              >
                                <Ban size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'activate')}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Activate User"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'delete')}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Soft Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{users.length}</span> of <span className="text-slate-900 font-bold">{totalElements}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${page === i ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`${confirmState.actionType.toUpperCase()} User`}
        message={`Are you sure you want to ${confirmState.actionType} ${confirmState.userName}? This action can be undone later.`}
        confirmText={confirmState.actionType.toUpperCase()}
        onConfirm={executeAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
        confirmStyle={confirmState.actionType === 'delete' || confirmState.actionType === 'block' ? 'danger' : 'primary'}
      />
    </div>
  );
};

export default UsersList;