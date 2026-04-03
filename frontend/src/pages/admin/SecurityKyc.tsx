import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserResponseDTO, UserStatus } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronRight, 
  Eye, 
  Ban, 
  CheckCircle2, 
  Loader2, 
  Mail,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const SecurityKyc: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<UserResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [kycFilter, setKycFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    userId: number;
    userName: string;
    actionType: 'suspend' | 'activate';
  }>({ isOpen: false, userId: 0, userName: '', actionType: 'suspend' });

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await userApi.getAdminClients({ page: 0, size: 50 });
      setClients(res.content || []);
    } catch (err) {
      addToast('Failed to load clients for KYC review.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const executeAction = async () => {
    const { userId, actionType } = confirmState;
    try {
      if (actionType === 'suspend') {
        await userApi.suspend(userId);
      } else {
        await userApi.activate(userId);
      }
      addToast(`Account ${actionType}ed successfully`, 'success');
      fetchClients();
    } catch(err: any) {
      addToast(err.response?.data?.message || `Action failed`, 'error');
    } finally {
      setConfirmState({ ...confirmState, isOpen: false });
    }
  };

  const requestAction = (id: number, name: string, action: 'suspend' | 'activate') => {
    setConfirmState({ isOpen: true, userId: id, userName: name, actionType: action });
  };

  const filteredClients = clients.filter(c => {
    const matchesFilter = kycFilter === 'ALL' || (kycFilter === 'VERIFIED' ? c.kycVerified : !c.kycVerified);
    const matchesSearch = `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compliance & KYC</h1>
          <p className="text-slate-500 mt-1">Review institutional compliance and manage high-level security access.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="finova-card px-6 py-3 flex items-center gap-4 bg-white border-slate-200">
            <div className="text-center border-r border-slate-100 pr-4">
              <div className="text-2xl font-bold text-indigo-600">{clients.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clients</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-2xl font-bold text-emerald-500">{clients.filter(c => c.kycVerified).length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="finova-card p-4 bg-slate-50/50 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={kycFilter} 
              onChange={e => setKycFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">All KYC Statuses</option>
              <option value="VERIFIED">Verified Only</option>
              <option value="UNVERIFIED">Pending Review</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="finova-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Identity</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account State</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-xl w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded-xl w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="text-slate-200" size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold">No clients found</h3>
                    <p className="text-slate-500 text-sm mt-1">We couldn't find any clients matching your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                          {client.firstName[0]}{client.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{client.firstName} {client.lastName}</h4>
                          <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                            <Mail size={12} className="text-slate-400" />
                            {client.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {client.kycVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <CheckCircle2 size={12} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        client.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        client.status === UserStatus.BLOCKED ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/admin/users/${client.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Compliance File"
                        >
                          <Eye size={18} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        {client.status === UserStatus.ACTIVE ? (
                          <button 
                            onClick={() => requestAction(client.id, `${client.firstName} ${client.lastName}`, 'suspend')}
                            className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg hover:bg-amber-100 transition-all active:scale-95"
                          >
                            <Ban size={14} /> Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => requestAction(client.id, `${client.firstName} ${client.lastName}`, 'activate')}
                            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all active:scale-95"
                          >
                            <RotateCcw size={14} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={`Confirm Security ${confirmState.actionType === 'suspend' ? 'Suspension' : 'Activation'}`}
        message={`Are you sure you want to ${confirmState.actionType} ${confirmState.userName}'s account? This action will restrict their access to the Finova ecosystem.`}
        confirmText={confirmState.actionType.toUpperCase()}
        confirmStyle={confirmState.actionType === 'suspend' ? 'danger' : 'primary'}
        onConfirm={executeAction}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default SecurityKyc;