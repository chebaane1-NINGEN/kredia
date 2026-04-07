import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit2, 
  Trash2, 
  Eye, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import { UserResponseDTO, UserRole, UserStatus, AdminStatsDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<AdminStatsDTO | null>(null);
  const { addToast } = useToast();
  
  // Filters
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    action: string;
  }>({ isOpen: false, userId: 0, userName: '', action: '' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [response, stats] = await Promise.all([
        userApi.search({
          role: role || undefined,
          status: status || undefined,
          email: searchTerm || undefined,
          page: page - 1,
          size: 10,
          sort: 'id,desc'
        }),
        userApi.getAdminStats()
      ]);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setSystemStats(stats);
    } catch (error) {
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isLastAdmin = (user: UserResponseDTO) => {
    return !!(systemStats && (systemStats.roleDistribution as any)?.[UserRole.ADMIN] <= 1 && user.role === UserRole.ADMIN);
  };

  const canPerformAction = (user: UserResponseDTO, action: string) => {
    if (!isLastAdmin(user)) return true;
    
    switch (action) {
      case 'delete':
      case 'block':
      case 'suspend':
        return false;
      case 'roleChange':
        return false;
      default:
        return true;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, role, status, searchTerm]);

  const handleAction = (userId: number, userName: string, action: string) => {
    setConfirmModal({
      isOpen: true,
      userId,
      userName,
      action
    });
  };

  const executeAction = async () => {
    const { userId, userName, action } = confirmModal;
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    // Vérifier la protection Admin
    if (!canPerformAction(user, action)) {
      let message = '';
      switch (action) {
        case 'delete':
          message = 'CRITICAL: Cannot delete the last ADMIN. Please create another ADMIN account first.';
          break;
        case 'block':
          message = 'CRITICAL: Cannot block the last ADMIN. Please create another ADMIN account first.';
          break;
        case 'suspend':
          message = 'CRITICAL: Cannot suspend the last ADMIN. Please create another ADMIN account first.';
          break;
        default:
          message = 'This action cannot be performed on the last ADMIN.';
      }
      addToast(message, 'error');
      setConfirmModal({ isOpen: false, userId: 0, userName: '', action: '' });
      return;
    }
    
    try {
      switch (action) {
        case 'delete':
          await userApi.delete(userId);
          addToast('User deleted successfully', 'success');
          break;
        case 'restore':
          await userApi.restore(userId);
          addToast('User restored successfully', 'success');
          break;
        case 'activate':
          await userApi.activate(userId);
          addToast('User activated successfully', 'success');
          break;
        case 'suspend':
          await userApi.suspend(userId);
          addToast('User suspended successfully', 'success');
          break;
        case 'block':
          await userApi.block(userId);
          addToast('User blocked successfully', 'success');
          break;
      }
      setConfirmModal({ isOpen: false, userId: 0, userName: '', action: '' });
      fetchUsers();
    } catch (error) {
      addToast(`Failed to ${action} user`, 'error');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      ADMIN: 'bg-purple-100 text-purple-800',
      AGENT: 'bg-blue-100 text-blue-800',
      CLIENT: 'bg-green-100 text-green-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role]}`}>
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      SUSPENDED: 'bg-yellow-100 text-yellow-800',
      BLOCKED: 'bg-red-100 text-red-800',
      DELETED: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage all users in the system</p>
        </div>
        <Link 
          to="/admin/users/new"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          <UserPlus size={20} className="mr-2" />
          Add User
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'SUSPENDED').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <Ban className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Blocked</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'BLOCKED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="AGENT">Agent</option>
            <option value="CLIENT">Client</option>
          </select>
          
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as UserStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BLOCKED">Blocked</option>
            <option value="DELETED">Deleted</option>
          </select>
          
          {(role || status || searchTerm) && (
            <button
              onClick={() => {
                setRole('');
                setStatus('');
                setSearchTerm('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Protection
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isLastAdmin(user) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Shield size={12} className="mr-1" />
                          Last Admin
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}?edit=true`)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit User"
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        {user.status.toString() === 'DELETED' ? (
                          <button
                            onClick={() => handleAction(user.id, `${user.firstName} ${user.lastName}`, 'restore')}
                            className="text-green-600 hover:text-green-900"
                            title="Restore User"
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : (
                          <>
                            {user.status !== 'ACTIVE' && (
                              <button
                                onClick={() => handleAction(user.id, `${user.firstName} ${user.lastName}`, 'activate')}
                                className="text-green-600 hover:text-green-900"
                                title="Activate User"
                                disabled={!canPerformAction(user, 'activate')}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                            )}
                            
                            {user.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleAction(user.id, `${user.firstName} ${user.lastName}`, 'suspend')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Suspend User"
                                disabled={!canPerformAction(user, 'suspend')}
                              >
                                <Clock size={16} />
                              </button>
                            )}
                            
                            {user.status !== 'BLOCKED' && (
                              <button
                                onClick={() => handleAction(user.id, `${user.firstName} ${user.lastName}`, 'block')}
                                className="text-red-600 hover:text-red-900"
                                title="Block User"
                                disabled={!canPerformAction(user, 'block')}
                              >
                                <Ban size={16} />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleAction(user.id, `${user.firstName} ${user.lastName}`, 'delete')}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                              disabled={!canPerformAction(user, 'delete')}
                            >
                              <Trash2 size={16} />
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
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * 10, totalElements)}</span> of{' '}
                    <span className="font-medium">{totalElements}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`${confirmModal.action.charAt(0).toUpperCase() + confirmModal.action.slice(1)} User`}
        message={`Are you sure you want to ${confirmModal.action} user "${confirmModal.userName}"?`}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ isOpen: false, userId: 0, userName: '', action: '' })}
      />
    </div>
  );
};

export default UsersManagement;
