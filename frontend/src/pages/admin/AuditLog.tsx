import React, { useEffect, useState } from 'react';
import { UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useToast } from '../../contexts/ToastContext';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  RotateCcw, 
  Calendar, 
  Shield, 
  Users, 
  ChevronRight,
  ArrowUpDown,
  Download,
  Loader2,
  X
} from 'lucide-react';

const AuditLog: React.FC = () => {
  const [allLogs, setAllLogs] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  
  // Filters
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  const fetchAllLogs = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAdminActivitiesByRole(undefined, { size: 100 });
      setAllLogs(response.content || []);
    } catch (err) {
      console.error(err);
      addToast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllLogs();
  }, []);

  const handleExportCSV = () => {
    try {
      // Create CSV content
      const csvContent = [
        ['Type Action', 'Description', 'IP Adresse', 'Suspicious', 'Timestamp'],
        ...filteredLogs.map(log => [
          log.actionType || '',
          log.description || '',
          log.ipAddress || '',
          log.isSuspicious ? 'Oui' : 'Non',
          new Date(log.timestamp).toLocaleString('fr-FR')
        ])
      ].map(row => row.join(',')).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `kredia-audit-log-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const uniqueActions = Array.from(new Set(allLogs.map(l => l.actionType))).filter(Boolean).sort();

  const filteredLogs = allLogs.filter(log => {
    if (filterAction !== 'ALL' && log.actionType !== filterAction) return false;
    if (filterRisk !== 'ALL') {
      if (filterRisk === 'HIGH' && log.isSuspicious !== true) return false;
      if (filterRisk === 'LOW' && log.isSuspicious === true) return false;
    }
    if (filterDate) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      if (logDate !== filterDate) return false;
    }
    if (searchTerm && !log.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const totalLogs = allLogs.length;
  const suspiciousLogs = allLogs.filter(l => l.isSuspicious === true).length;
  const todayLogs = allLogs.filter(l => {
    const today = new Date().toISOString().split('T')[0];
    return new Date(l.timestamp).toISOString().split('T')[0] === today;
  }).length;

  const getStatusStyle = (actionType: string) => {
    const type = String(actionType).toUpperCase();
    if (type.includes('CREATE') || type.includes('ACTIVATE') || type.includes('RESTORE')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (type.includes('DELETE') || type.includes('BLOCK')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (type.includes('SUSPEND')) return 'bg-amber-50 text-amber-600 border-amber-100';
    return 'bg-indigo-50 text-indigo-600 border-indigo-100';
  };

  const hasActiveFilters = filterDate || filterAction !== 'ALL' || filterRisk !== 'ALL' || searchTerm;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">System Audit Trail</h1>
          <p className="text-slate-500 mt-1">Immutable record of all institutional actions and security events.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAllLogs}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />}
            <span>Refresh</span>
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: totalLogs, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Security Alerts', value: suspiciousLogs, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Activity (24h)', value: todayLogs, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Filtered Result', value: filteredLogs.length, icon: Filter, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, idx) => (
          <div key={idx} className="finova-card p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="finova-card p-4 bg-slate-50/50 border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by description or IP..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterAction} 
              onChange={e => setFilterAction(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">All Actions</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterRisk} 
              onChange={e => setFilterRisk(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="date" 
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            {hasActiveFilters && (
              <button 
                onClick={() => { setFilterDate(''); setFilterAction('ALL'); setFilterRisk('ALL'); setSearchTerm(''); }}
                className="p-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
                title="Clear Filters"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="finova-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Type</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detailed Description</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Context</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-lg w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-64"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="text-slate-200" size={32} />
                    </div>
                    <h3 className="text-slate-900 font-bold">No matching records</h3>
                    <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search terms.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(log.actionType)}`}>
                        {log.actionType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{log.description}</p>
                      {log.ipAddress && <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-tighter">Terminal: {log.ipAddress}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {log.isSuspicious ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider border border-rose-100">
                          <AlertCircle size={12} /> High Risk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <CheckCircle2 size={12} /> Institutional
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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

export default AuditLog;