import React, { useEffect, useState } from 'react';
import { UserResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { MOCK_USERS } from '../../utils/mockData';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, FileText, Search, User, Mail, Clock, ChevronRight, Loader2, Shield } from 'lucide-react';

interface KycClient extends UserResponseDTO {
  kycAction?: 'validate' | 'reject' | null;
}

const AgentKyc: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<KycClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await userApi.getAdminClients({ page: 0, size: 50 });
        const list = res.content || [];
        setClients(list.length > 0 ? list : (MOCK_USERS.filter(u => u.role === 'CLIENT') as unknown as KycClient[]));
      } catch {
        setClients(MOCK_USERS.filter(u => u.role === 'CLIENT') as unknown as KycClient[]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleKycAction = async (clientId: number, action: 'validate' | 'reject') => {
    setProcessingId(clientId);
    await new Promise(resolve => setTimeout(resolve, 1200));
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, kycAction: action, kycVerified: action === 'validate' } : c));
    addToast(action === 'validate' ? 'KYC validated successfully' : 'KYC rejected', action === 'validate' ? 'success' : 'error');
    setProcessingId(null);
  };

  const pending = clients.filter(c => !c.kycVerified && `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const verified = clients.filter(c => c.kycVerified && `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Compliance Center</h1>
          <p className="text-slate-500 mt-1 text-lg">Review and verify client identity documentation (KYC).</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="finova-card px-6 py-3 flex items-center gap-4 bg-white border-slate-200">
            <div className="text-center border-r border-slate-100 pr-4">
              <div className="text-2xl font-bold text-amber-500">{clients.filter(c => !c.kycVerified).length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-2xl font-bold text-emerald-500">{clients.filter(c => c.kycVerified).length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="finova-card p-4 bg-slate-50/50 border-slate-200">
        <div className="relative group max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Pending KYC Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldAlert className="text-amber-500" size={20} />
            <h3 className="font-bold text-slate-900 text-lg">Needs Attention</h3>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{pending.length}</span>
          </div>

          <div className="finova-card p-0 overflow-hidden">
            <div className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : pending.length > 0 ? (
                pending.map(client => (
                  <div key={client.id} className="p-6 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{client.firstName} {client.lastName}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Mail size={14} className="text-slate-400" /> {client.email}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={14} className="text-slate-400" /> 2h ago</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={processingId === client.id}
                        onClick={() => handleKycAction(client.id, 'reject')}
                        className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
                        title="Reject KYC"
                      >
                        <XCircle size={20} />
                      </button>
                      <button
                        disabled={processingId === client.id}
                        onClick={() => handleKycAction(client.id, 'validate')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 min-w-[120px] justify-center"
                      >
                        {processingId === client.id ? <Loader2 size={18} className="animate-spin" /> : <><CheckCircle2 size={18} /> <span>Verify</span></>}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShieldCheck className="text-emerald-500" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Queue is clear!</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">All client identities have been verified. Great work!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verified Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="text-emerald-500" size={20} />
            <h3 className="font-bold text-slate-900 text-lg">Verified Archive</h3>
            <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">{verified.length}</span>
          </div>

          <div className="finova-card p-0 overflow-hidden bg-slate-50/30">
            <div className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-6 animate-pulse flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : verified.length > 0 ? (
                verified.map(client => (
                  <div key={client.id} className="p-6 hover:bg-white transition-all flex items-center gap-6 group">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate">{client.firstName} {client.lastName}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Verified on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                      <FileText size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Shield className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">No verified clients</h3>
                  <p className="text-slate-500 mt-2 max-w-xs mx-auto">Verified accounts will appear here once you approve them.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentKyc;
