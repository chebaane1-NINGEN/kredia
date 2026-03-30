import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserResponseDTO, UserRole, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { useDebounce } from '../../hooks/useDebounce';

type SortField = 'id' | 'firstName' | 'email' | 'role' | 'status';
type SortDir = 'asc' | 'desc';

const UsersList: React.FC = () => {
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

  const SortArrow = ({ field }: { field: SortField }) => (
    <span className="ml-1 text-xs opacity-60 cursor-pointer">
      {sortField === field ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );

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
      addToast(`✅ Action '${actionType}' applied to ${confirmState.userName}`, 'success');
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

  return (
    <div className="users-list wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted">{totalElements} total users</p>
        </div>
        <Link to="/admin/users/new" className="btn btn-primary">+ Add User</Link>
      </div>

      <div className="card filter-bar mb-6">
        <div className="filters">
          <input 
            type="text" 
            placeholder="🔍 Search by email..." 
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
          />
          <select value={role} onChange={e => { setRole(e.target.value as UserRole | ''); }}>
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="CLIENT">Client</option>
          </select>
          <select value={status} onChange={e => { setStatus(e.target.value as UserStatus | ''); }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
          </select>
          {(role || status || emailInput) && (
            <button className="btn btn-sm btn-outline" onClick={() => { setRole(''); setStatus(''); setEmailInput(''); }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="card p-0">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')} className="cursor-pointer">
                  ID <SortArrow field="id" />
                </th>
                <th onClick={() => toggleSort('firstName')} className="cursor-pointer">
                  Name <SortArrow field="firstName" />
                </th>
                <th onClick={() => toggleSort('email')} className="cursor-pointer">
                  Email <SortArrow field="email" />
                </th>
                <th onClick={() => toggleSort('role')} className="cursor-pointer">
                  Role <SortArrow field="role" />
                </th>
                <th onClick={() => toggleSort('status')} className="cursor-pointer">
                  Status <SortArrow field="status" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton skeleton-text-sm w-8"></div></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="skeleton skeleton-avatar"></div>
                        <div className="skeleton skeleton-text w-28"></div>
                      </div>
                    </td>
                    <td><div className="skeleton skeleton-text w-40"></div></td>
                    <td><div className="skeleton skeleton-text w-16"></div></td>
                    <td><div className="skeleton skeleton-text w-16"></div></td>
                    <td><div className="skeleton skeleton-text w-32"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state border-0 py-12">
                      <div className="text-5xl mb-4">👤</div>
                      <h3>No users found</h3>
                      <p className="text-muted">Try adjusting the filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className={user.isDeleted ? 'row-deleted' : ''}>
                    <td className="text-muted text-xs">#{user.id}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: user.role === 'ADMIN' ? '#4318FF' : user.role === 'EMPLOYEE' ? '#FFCE20' : '#05CD99' }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{user.firstName} {user.lastName}</div>
                          {user.kycVerified && <div className="text-xs text-success">✓ KYC</div>}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-muted">{user.email}</td>
                    <td><span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span></td>
                    <td>
                      <span className={`badge bg-${user.status.toLowerCase()}`}>
                        {user.isDeleted ? 'DELETED' : user.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <Link to={`/admin/users/${user.id}`} className="btn btn-sm btn-outline">View</Link>
                      
                      {user.isDeleted ? (
                        <button onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'restore')} className="btn btn-sm btn-success">Restore</button>
                      ) : (
                        <>
                          {user.status !== 'ACTIVE' && (
                            <button onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'activate')} className="btn btn-sm btn-success">Activate</button>
                          )}
                          {user.status === 'ACTIVE' && (
                            <button onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'suspend')} className="btn btn-sm btn-warning">Suspend</button>
                          )}
                          {user.status !== 'BLOCKED' && (
                            <button onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'block')} className="btn btn-sm btn-danger">Block</button>
                          )}
                          <button onClick={() => requestAction(user.id, `${user.firstName} ${user.lastName}`, 'delete')} className="btn btn-sm btn-danger" title="Delete">🗑</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <span className="text-sm text-muted">
              Page {page + 1} of {totalPages} • {totalElements} results
            </span>
            <div className="flex gap-2">
              <button 
                className="btn btn-sm btn-outline" 
                disabled={page === 0} 
                onClick={() => setPage(p => Math.max(0, p - 1))}
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  className={`btn btn-sm ${i === page % 5 ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                className="btn btn-sm btn-outline" 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`${confirmState.actionType.charAt(0).toUpperCase() + confirmState.actionType.slice(1)} User`}
        message={`Are you sure you want to ${confirmState.actionType} ${confirmState.userName}? This action affects account access.`}
        confirmText={confirmState.actionType.charAt(0).toUpperCase() + confirmState.actionType.slice(1)}
        confirmStyle={confirmState.actionType === 'activate' || confirmState.actionType === 'restore' ? 'success' : 'danger'}
        onConfirm={executeAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default UsersList;
