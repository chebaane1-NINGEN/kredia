import React, { useEffect, useState } from 'react';
import { UserResponseDTO, ClientRiskScoreDTO, ClientEligibilityDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_USERS, ELIGIBILITY_CONFIG } from '../../utils/mockData';
import { Search, User, Mail, Phone, Calendar, Shield, TrendingUp, CreditCard, ChevronRight, X, UserCheck, AlertCircle } from 'lucide-react';

interface EnrichedClient extends UserResponseDTO {
  riskScore?: ClientRiskScoreDTO | null;
  eligibility?: ClientEligibilityDTO | null;
}

const AgentClients: React.FC = () => {
  const { currentUser } = useAuth();
  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await userApi.getAdminClients({ page: 0, size: 50 });
        const list = res.content || [];
        setClients(list.length > 0 ? list : (MOCK_USERS.filter(u => u.role === 'CLIENT') as unknown as EnrichedClient[]));
      } catch {
        setClients(MOCK_USERS.filter(u => u.role === 'CLIENT') as unknown as EnrichedClient[]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, [currentUser]);

  const handleViewClient = async (client: EnrichedClient) => {
    setSelectedClient(client);
    setDetailLoading(true);
    try {
      const [risk, elig] = await Promise.all([
        userApi.getClientRiskScore(client.id).catch(() => null),
        userApi.getClientEligibility(client.id).catch(() => null)
      ]);
      setSelectedClient(prev => prev ? { ...prev, riskScore: risk, eligibility: elig } : null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const getEligKey = (e?: ClientEligibilityDTO | null): keyof typeof ELIGIBILITY_CONFIG => {
    return (e?.isEligibleForPremium ? 'HIGH' : 'MEDIUM');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Client Portfolio</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your assigned client accounts.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl border border-indigo-100">
          <UserCheck size={20} />
          <span className="font-bold">{clients.length} Active Clients</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Client List Section */}
        <div className="lg:col-span-5 space-y-4">
          <div className="finova-card p-0 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-100 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 animate-pulse flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-1/3"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : filtered.length > 0 ? (
                filtered.map(client => (
                  <div
                    key={client.id}
                    onClick={() => handleViewClient(client)}
                    className={`p-4 cursor-pointer transition-all flex items-center gap-4 group ${selectedClient?.id === client.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all ${selectedClient?.id === client.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{client.firstName} {client.lastName}</h4>
                      <p className="text-xs text-slate-500 truncate">{client.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {client.status}
                      </span>
                      <ChevronRight size={16} className={`transition-transform ${selectedClient?.id === client.id ? 'translate-x-1 text-indigo-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-slate-300" size={24} />
                  </div>
                  <h3 className="text-slate-900 font-bold">No clients found</h3>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your search criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Details Section */}
        <div className="lg:col-span-7">
          {!selectedClient ? (
            <div className="finova-card h-full flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-slate-200 bg-transparent shadow-none">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                <User className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Select a Client</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">Click on a client from the list to view their detailed profile, risk analysis, and financial eligibility.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Profile Header */}
              <div className="finova-card p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                  <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-200">
                    {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                  </div>
                  <div className="text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedClient.firstName} {selectedClient.lastName}</h2>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedClient.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {selectedClient.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5"><Mail size={16} className="text-indigo-500" /> {selectedClient.email}</div>
                      {selectedClient.phoneNumber && <div className="flex items-center gap-1.5"><Phone size={16} className="text-indigo-500" /> {selectedClient.phoneNumber}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div className="finova-card p-20 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                  <p className="text-slate-500 font-medium">Analyzing client data...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk & Eligibility Stats */}
                  <div className="finova-card p-6 bg-slate-900 text-white border-none shadow-indigo-900/10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                        <Shield size={20} />
                      </div>
                      <h3 className="font-bold">Risk Assessment</h3>
                    </div>
                    <div className="flex items-end gap-4 mb-4">
                      <span className="text-5xl font-bold tracking-tight">{selectedClient.riskScore?.riskScore ?? '—'}</span>
                      <div className="mb-1">
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${selectedClient.riskScore?.riskCategory === 'LOW' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {selectedClient.riskScore?.riskCategory ?? 'PENDING'}
                        </div>
                        <span className="text-slate-400 text-xs block mt-1">/ 100 points</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`rounded-full h-2 transition-all duration-1000 ${selectedClient.riskScore?.riskScore && selectedClient.riskScore.riskScore > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                        style={{ width: `${selectedClient.riskScore?.riskScore ?? 0}%` }}
                      ></div>
                    </div>
                    <p className="mt-4 text-xs text-slate-400">Score calculated based on 12 financial factors and history.</p>
                  </div>

                  <div className="finova-card p-6 border-indigo-100 bg-indigo-50/30">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-600 rounded-lg text-white">
                        <TrendingUp size={20} />
                      </div>
                      <h3 className="font-bold text-slate-900">Financial Tier</h3>
                    </div>
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-indigo-600">
                        {selectedClient.eligibility?.isEligibleForPremium ? 'PREMIUM TIER' : 'STANDARD TIER'}
                      </div>
                      <p className="text-slate-500 text-xs font-medium mt-1">Eligibility Status</p>
                    </div>
                    <div className="space-y-2 mt-4">
                      {selectedClient.eligibility?.reasons?.slice(0, 2).map((reason, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                          {reason}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Limits */}
                  <div className="finova-card p-6 md:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                      <CreditCard size={18} className="text-indigo-600" />
                      Assigned Limits
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Loan Limit</p>
                        <h4 className="text-2xl font-bold text-slate-900">
                          {selectedClient.eligibility?.maxLoanAmount?.toLocaleString() ?? '—'} <span className="text-sm font-medium text-slate-500">TND</span>
                        </h4>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Max Investment</p>
                        <h4 className="text-2xl font-bold text-slate-900">
                          {selectedClient.eligibility?.maxInvestmentLimit?.toLocaleString() ?? '—'} <span className="text-sm font-medium text-slate-500">TND</span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Profile Metadata */}
                  <div className="finova-card p-6 md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar size={18} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Member Since</p>
                          <p className="text-sm font-bold text-slate-700">{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Shield size={18} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Status</p>
                          <p className={`text-sm font-bold ${selectedClient.kycVerified ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {selectedClient.kycVerified ? 'Verified' : 'Pending'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><AlertCircle size={18} /></div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Activity</p>
                          <p className="text-sm font-bold text-slate-700">{selectedClient.lastLoginDate ? new Date(selectedClient.lastLoginDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
                      <button className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                        Send Message
                      </button>
                      <button className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all active:scale-95">
                        Account Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentClients;
