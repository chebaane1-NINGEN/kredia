import React, { useEffect, useState } from 'react';
import { UserResponseDTO, ClientRiskScoreDTO, ClientEligibilityDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_USERS, ELIGIBILITY_CONFIG } from '../../utils/mockData';

interface EnrichedClient extends UserResponseDTO {
  riskScore?: ClientRiskScoreDTO | null;
  eligibility?: ClientEligibilityDTO | null;
}

const EmployeeClients: React.FC = () => {
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
        // If no real clients, use mock data
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
    <div className="employee-clients wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Clients</h2>
          <p className="text-muted">{clients.length} clients in your portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client List */}
        <div className="card p-0">
          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="🔍 Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
            />
          </div>
          <div className="divide-y" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <div className="skeleton skeleton-avatar"></div>
                  <div className="flex-1">
                    <div className="skeleton skeleton-text w-1/2 mb-2"></div>
                    <div className="skeleton skeleton-text-sm w-3/4"></div>
                  </div>
                </div>
              ))
            ) : filtered.map(client => (
              <div
                key={client.id}
                onClick={() => handleViewClient(client)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'bg-primary-light border-l-4 border-primary' : 'hover:bg-gray-50'}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#4318FF' }}>
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{client.firstName} {client.lastName}</div>
                  <div className="text-xs text-muted truncate">{client.email}</div>
                </div>
                <span className={`badge ${client.status === 'ACTIVE' ? 'bg-active' : client.status === 'SUSPENDED' ? 'bg-suspended' : 'bg-pending'}`} style={{ fontSize: '0.65rem' }}>
                  {client.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Client Detail */}
        <div className="card">
          {!selectedClient ? (
            <div className="empty-state border-0">
              <div className="text-5xl mb-4">👤</div>
              <h3>Select a Client</h3>
              <p className="text-muted">Click on a client to view their profile, risk score, and eligibility.</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: '#4318FF' }}>
                  {selectedClient.firstName[0]}{selectedClient.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedClient.firstName} {selectedClient.lastName}</h3>
                  <p className="text-muted text-sm">{selectedClient.email}</p>
                </div>
                <button className="ml-auto btn btn-sm btn-outline" onClick={() => setSelectedClient(null)}>✕</button>
              </div>

              {detailLoading ? (
                <div className="flex justify-center py-8"><div className="spinner"></div></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl text-center" style={{ background: '#F4F7FE' }}>
                      <div className="text-xs text-muted mb-1 font-medium">Risk Score</div>
                      <div className="text-3xl font-bold text-primary">{selectedClient.riskScore?.riskScore ?? '—'}</div>
                      <div className="text-xs text-muted">/ 100</div>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: ELIGIBILITY_CONFIG[getEligKey(selectedClient.eligibility)].bg }}>
                      <div className="text-xs text-muted mb-1 font-medium">Eligibility</div>
                      <div className="text-xl font-bold" style={{ color: ELIGIBILITY_CONFIG[getEligKey(selectedClient.eligibility)].color }}>
                        {ELIGIBILITY_CONFIG[getEligKey(selectedClient.eligibility)].score} {selectedClient.eligibility?.isEligibleForPremium ? 'HIGH' : 'MEDIUM'}
                      </div>
                      <div className="text-xs text-muted">{ELIGIBILITY_CONFIG[getEligKey(selectedClient.eligibility)].label}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl mb-4" style={{ background: '#E6FAF5' }}>
                    <div className="text-xs text-muted mb-1 font-medium">Estimated Loan Capacity</div>
                    <div className="text-2xl font-bold" style={{ color: '#04A67A' }}>
                      {selectedClient.eligibility?.maxLoanAmount?.toLocaleString() ?? '—'} TND
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Account Status</span>
                      <span className={`badge ${selectedClient.status === 'ACTIVE' ? 'bg-active' : 'bg-suspended'}`}>{selectedClient.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">KYC Verified</span>
                      <span className="font-semibold">{selectedClient.kycVerified ? '✅ Verified' : '❌ Pending'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Member Since</span>
                      <span className="font-semibold">{new Date(selectedClient.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeClients;
