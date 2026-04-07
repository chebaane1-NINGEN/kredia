import React, { useState, useEffect, useMemo } from 'react';
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
  Users,
  Calendar,
  Download,
  CheckSquare,
  Square,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  UserX,
  Settings
} from 'lucide-react';
import { UserResponseDTO, UserRole, UserStatus, AdminStatsDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';

interface AdvancedFilters {
  searchTerm: string;
  roles: UserRole[];
  statuses: UserStatus[];
  dateFrom: string;
  dateTo: string;
  quickFilter: string;
}

interface BulkAction {
  type: 'ACTIVATE' | 'SUSPEND' | 'BLOCK' | 'DELETE' | 'CHANGE_ROLE';
  label: string;
  icon: any; // Changed from strict type to any for Lucide icons
  color: string;
}

const UsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<AdminStatsDTO | null>(null);
  const { addToast } = useToast();
  
  // Advanced Filters
  const [filters, setFilters] = useState<AdvancedFilters>({
    searchTerm: '',
    roles: [],
    statuses: [],
    dateFrom: '',
    dateTo: '',
    quickFilter: ''
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Bulk Actions
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    action: string;
  }>({ isOpen: false, userId: 0, userName: '', action: '' });

  // Bulk Actions Configuration
  const bulkActions: BulkAction[] = [
    {
      type: 'ACTIVATE',
      label: 'Activate',
      icon: CheckCircle2,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      type: 'SUSPEND',
      label: 'Suspend',
      icon: Clock,
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      type: 'BLOCK',
      label: 'Block',
      icon: Ban,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      type: 'DELETE',
      label: 'Delete',
      icon: Trash2,
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      type: 'CHANGE_ROLE',
      label: 'Change Role',
      icon: Shield,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  // Quick Filters
  const quickFilters = [
    { id: 'new_users', label: 'New Users (7 days)', icon: UserPlus, color: 'bg-blue-100 text-blue-800' },
    { id: 'inactive', label: 'Inactive Accounts', icon: UserX, color: 'bg-gray-100 text-gray-800' },
    { id: 'blocked', label: 'Blocked Accounts', icon: Ban, color: 'bg-red-100 text-red-800' },
    { id: 'high_risk', label: 'High Risk', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' }
  ];

  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params: any = {
        page: page - 1,
        size: pageSize
      };

      if (filters.searchTerm) {
        params.search = filters.searchTerm;
      }

      if (filters.roles.length > 0) {
        params.roles = filters.roles.join(',');
      }

      if (filters.statuses.length > 0) {
        params.statuses = filters.statuses.join(',');
      }

      if (filters.dateFrom) {
        params.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        params.dateTo = filters.dateTo;
      }

      // Apply quick filter logic
      if (filters.quickFilter === 'new_users') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        params.dateFrom = sevenDaysAgo.toISOString().split('T')[0];
      } else if (filters.quickFilter === 'inactive') {
        params.statuses = UserStatus.INACTIVE;
      } else if (filters.quickFilter === 'blocked') {
        params.statuses = UserStatus.BLOCKED;
      }

      const response = await userApi.search(params);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      addToast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const stats = await userApi.getAdminStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      roles: [],
      statuses: [],
      dateFrom: '',
      dateTo: '',
      quickFilter: ''
    });
    setPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.length === 0) {
      addToast('Please select users first', 'warning');
      return;
    }

    try {
      // Implement bulk action logic
      console.log(`Bulk action ${action.type} on users:`, selectedUsers);
      
      // For now, just show success message
      addToast(`${action.label} action applied to ${selectedUsers.length} users`, 'success');
      setSelectedUsers([]);
      fetchUsers(); // Refresh list
    } catch (error) {
      addToast(`Failed to ${action.label.toLowerCase()} users`, 'error');
    }
  };

  const exportUsers = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      // Build export parameters based on current filters
      const exportParams = {
        ...filters,
        format,
        selectedUsers: selectedUsers.length > 0 ? selectedUsers : undefined
      };

      console.log('Exporting users with params:', exportParams);
      addToast(`Exporting users as ${format.toUpperCase()}...`, 'success');
      
      // Implement actual export logic
      // const response = await userApi.exportUsers(exportParams);
      // downloadFile(response.data, `users.${format}`);
    } catch (error) {
      addToast('Failed to export users', 'error');
    }
  };

  const getRiskScore = (user: UserResponseDTO) => {
    // Simple risk calculation based on status and other factors
    if (user.status === UserStatus.BLOCKED) return 'HIGH';
    if (user.status === UserStatus.SUSPENDED) return 'MEDIUM';
    return 'LOW';
  };

  const getRiskBadge = (score: string) => {
    const colors = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-red-100 text-red-800'
    };
    return colors[score as keyof typeof colors] || colors.LOW;
  };

  const isAllSelected = users.length > 0 && selectedUsers.length === users.length;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage all system users with advanced controls</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter size={16} className="mr-2" />
            Advanced Filters
          </button>
          <div className="relative group">
            <button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download size={16} className="mr-2" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportUsers('csv')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              >
                Export as CSV
              </button>
              <button
                onClick={() => exportUsers('excel')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              >
                Export as Excel
              </button>
              <button
                onClick={() => exportUsers('pdf')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              >
                Export as PDF
              </button>
            </div>
          </div>
          <Link
            to="/admin/users/new"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <UserPlus size={16} className="mr-2" />
            Add User
          </Link>
        </div>
      </div>

      {/* System Stats */}
      {systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemStats.totalUser}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{systemStats.activeUser}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blocked Users</p>
                <p className="text-2xl font-bold text-red-600">{systemStats.blockedUser}</p>
              </div>
              <Ban className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New (24h)</p>
                <p className="text-2xl font-bold text-blue-600">{systemStats.last24hRegistrations}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Global Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search by name, email, phone..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
              <div className="space-y-2">
                {Object.values(UserRole).map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.roles.includes(role)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('roles', [...filters.roles, role]);
                        } else {
                          handleFilterChange('roles', filters.roles.filter(r => r !== role));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-2">
                {Object.values(UserStatus).map(status => (
                  <label key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(status)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleFilterChange('statuses', [...filters.statuses, status]);
                        } else {
                          handleFilterChange('statuses', filters.statuses.filter(s => s !== status));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange('quickFilter', filters.quickFilter === filter.id ? '' : filter.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.quickFilter === filter.id
                      ? filter.color
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <filter.icon size={14} className="inline mr-1" />
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Clear All Filters
            </button>
            <div className="text-sm text-gray-600">
              Showing {users.length} of {totalElements} users
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {bulkActions.map(action => (
                <button
                  key={action.type}
                  onClick={() => handleBulkAction(action)}
                  className={`flex items-center px-3 py-1 text-white text-sm rounded ${action.color}`}
                >
                  <action.icon size={14} className="mr-1" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
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
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">{user.phoneNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.AGENT ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                        user.status === UserStatus.INACTIVE ? 'bg-gray-100 text-gray-800' :
                        user.status === UserStatus.SUSPENDED ? 'bg-yellow-100 text-yellow-800' :
                        user.status === UserStatus.BLOCKED ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(getRiskScore(user))}`}>
                        {getRiskScore(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}?edit=true`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmModal({
                            isOpen: true,
                            userId: user.id,
                            userName: `${user.firstName} ${user.lastName}`,
                            action: 'delete'
                          })}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalElements)} of {totalElements} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={`Confirm ${confirmModal.action}`}
          message={`Are you sure you want to ${confirmModal.action} ${confirmModal.userName}?`}
          onConfirm={() => {
            console.log(`Confirmed ${confirmModal.action} for user ${confirmModal.userId}`);
            setConfirmModal({ isOpen: false, userId: 0, userName: '', action: '' });
            fetchUsers();
          }}
          onCancel={() => setConfirmModal({ isOpen: false, userId: 0, userName: '', action: '' })}
        />
      )}
    </div>
  );
};

export default UsersManagement;
