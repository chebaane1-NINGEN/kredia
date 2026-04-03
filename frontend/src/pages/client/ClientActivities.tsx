import React, { useEffect, useState } from 'react';
import { UserActivityResponseDTO } from '../../types/user.types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../contexts/AuthContext';
import { MOCK_ACTIVITIES, relativeTime, getActivityIcon } from '../../utils/mockData';
import { Search, Filter, Calendar, Activity, Clock, Shield, AlertCircle, ChevronRight } from 'lucide-react';

const ClientActivities: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<UserActivityResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    userApi.getClientActivities(currentUser.id)
      .then((data: any) => {
        const activitiesArray = data && 'content' in data ? data.content : (Array.isArray(data) ? data : []);
        setLogs(activitiesArray.length > 0 ? activitiesArray : (MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]));
      })
      .catch(() => setLogs(MOCK_ACTIVITIES as unknown as UserActivityResponseDTO[]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const uniqueTypes = Array.from(new Set(logs.map(l => l.actionType || 'ACTIVITY'))).sort();
  
  const filtered = logs.filter(l => {
    const matchesFilter = filterType === 'ALL' || (l.actionType === filterType);
    const matchesSearch = l.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity & Security</h1>
          <p className="text-slate-500 mt-1 text-lg">A transparent record of your financial journey.</p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-2xl border border-indigo-100">
          <Shield size={20} />
          <span className="font-bold">Secured Log</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="finova-card p-4 bg-slate-50/50 border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search your activity..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer transition-all"
              >
                <option value="ALL">All Events</option>
                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <button className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all">
              <Calendar size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="finova-card p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-6 animate-pulse flex items-center gap-6">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-2/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-1/4"></div>
                </div>
              </div>
            ))
          ) : filtered.length > 0 ? (
            filtered.map(log => (
              <div key={log.id} className="p-6 hover:bg-slate-50/80 transition-all flex items-start gap-6 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all flex-shrink-0 ${log.isSuspicious ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-white border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:scale-110'}`}>
                  {getActivityIcon(log.actionType)}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {log.description}
                    </h4>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Clock size={12} />
                      {relativeTime(log.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${log.isSuspicious ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                      {log.actionType}
                    </span>
                    {log.isSuspicious && (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle size={12} />
                        Security Flag
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center self-center">
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Activity className="text-slate-200" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No events found</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">Try adjusting your filters to see more activity history.</p>
              <button 
                onClick={() => {setFilterType('ALL'); setSearchTerm('');}}
                className="mt-6 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Show all events
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientActivities;
