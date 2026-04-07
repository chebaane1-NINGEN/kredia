import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Calendar,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Ban
} from 'lucide-react';
import { UserResponseDTO, UserStatus } from '../../types/user.types';
import { useToast } from '../../contexts/ToastContext';
import { agentApiService } from '../../services/agentApiService';

interface AgentClientsResponse {
  content: UserResponseDTO[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

const AgentClients: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const { addToast } = useToast();
  
  // Filters
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchClients();
  }, [page, status, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      
      // Utiliser l'API service pour récupérer les clients
      const response = await agentApiService.getAgentClients(
        page - 1, // Convert to 0-based indexing
        pageSize,
        status || undefined,
        searchTerm || undefined
      );

      setClients(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      addToast('Failed to fetch clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles: Record<string, string> = {
      [UserStatus.ACTIVE]: 'bg-green-100 text-green-800',
      [UserStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
      [UserStatus.SUSPENDED]: 'bg-yellow-100 text-yellow-800',
      [UserStatus.BLOCKED]: 'bg-red-100 text-red-800'
    };

    const style = styles[status.toString()] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}>
        {status.toString()}
      </span>
    );
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case UserStatus.ACTIVE:
        return <CheckCircle2 size={16} className="text-green-500" />;
      case UserStatus.INACTIVE:
        return <Clock size={16} className="text-gray-500" />;
      case UserStatus.SUSPENDED:
        return <XCircle size={16} className="text-yellow-500" />;
      case UserStatus.BLOCKED:
        return <Ban size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Clients</h1>
          <p className="text-gray-600">Manage your assigned clients</p>
        </div>
        <Link 
          to="/agent/clients/new"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700"
        >
          <UserPlus size={20} className="mr-2" />
          Add Client
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalElements}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === UserStatus.ACTIVE).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <XCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === UserStatus.SUSPENDED).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Clock className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(c => c.status === UserStatus.INACTIVE).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value={UserStatus.ACTIVE}>Active</option>
              <option value={UserStatus.INACTIVE}>Inactive</option>
              <option value={UserStatus.SUSPENDED}>Suspended</option>
              <option value={UserStatus.BLOCKED}>Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
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
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-8 bg-gray-200 rounded w-32 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                    <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {client.firstName?.[0]}{client.lastName?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.firstName} {client.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(client.status)}
                        <span className="ml-2">{getStatusBadge(client.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/agent/clients/${client.id}`)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/agent/clients/${client.id}?edit=true`)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit Client"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentClients;
