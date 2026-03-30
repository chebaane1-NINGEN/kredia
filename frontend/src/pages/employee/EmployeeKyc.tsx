import React, { useEffect, useState } from 'react';
import { UserResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { MOCK_USERS } from '../../utils/mockData';

interface KycClient extends UserResponseDTO {
  kycAction?: 'validate' | 'reject' | null;
}

const EmployeeKyc: React.FC = () => {
  const { addToast } = useToast();
  const [clients, setClients] = useState<KycClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

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
    // Simulate UI action (no backend KYC endpoint — purely frontend)
    await new Promise(resolve => setTimeout(resolve, 1200));
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, kycAction: action, kycVerified: action === 'validate' } : c));
    addToast(action === 'validate' ? '✅ KYC validated successfully' : '❌ KYC rejected', action === 'validate' ? 'success' : 'error');
    setProcessingId(null);
  };

  const pending = clients.filter(c => !c.kycVerified);
  const verified = clients.filter(c => c.kycVerified);

  return (
    <div className="employee-kyc wow fadeInUp">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">KYC Review Center</h2>
          <p className="text-muted">Review and validate client identity documents</p>
        </div>
        <div className="flex gap-3">
          <div className="card p-3 text-center mb-0" style={{ minWidth: '80px' }}>
            <div className="text-2xl font-bold text-warning-dark">{pending.length}</div>
            <div className="text-xs text-muted">Pending</div>
          </div>
          <div className="card p-3 text-center mb-0" style={{ minWidth: '80px' }}>
            <div className="text-2xl font-bold text-success">{verified.length}</div>
            <div className="text-xs text-muted">Verified</div>
          </div>
        </div>
      </div>

      {/* Pending KYC */}
      {pending.length > 0 && (
        <div className="card p-0 mb-6">
          <div className="p-4 border-b flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#FFCE20', display: 'inline-block' }}></span>
            <h3 className="font-bold">Pending Review ({pending.length})</h3>
          </div>
          <div className="divide-y">
            {pending.map(client => (
              <div key={client.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#FFCE20', color: '#fff' }}>
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{client.firstName} {client.lastName}</div>
                  <div className="text-xs text-muted">{client.email}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <span className="badge bg-pending">Awaiting Review</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-success"
                    disabled={processingId === client.id}
                    onClick={() => handleKycAction(client.id, 'validate')}
                  >
                    {processingId === client.id ? '...' : '✅ Validate'}
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    disabled={processingId === client.id}
                    onClick={() => handleKycAction(client.id, 'reject')}
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Clients */}
      {loading ? (
        <div className="card flex items-center justify-center" style={{ height: '200px' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="card p-0">
          <div className="p-4 border-b flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#05CD99', display: 'inline-block' }}></span>
            <h3 className="font-bold">Verified Clients ({verified.length})</h3>
          </div>
          <div className="divide-y">
            {verified.map(client => (
              <div key={client.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#05CD99' }}>
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{client.firstName} {client.lastName}</div>
                  <div className="text-xs text-muted">{client.email}</div>
                </div>
                <span className="badge bg-active">✅ KYC Verified</span>
              </div>
            ))}
            {verified.length === 0 && (
              <div className="empty-state border-0 py-8">
                <p className="text-muted">No verified clients yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeKyc;
