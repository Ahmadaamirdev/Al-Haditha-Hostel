import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { subscribeToMutation } from '../../services/eventBus';
import { Allotment } from '../../types';
import { formatDate } from '../../utils';
import { History, Search, Clock, UserCheck } from 'lucide-react';

export const RecordsList: React.FC = () => {
  const [records, setRecords] = useState<Allotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      const data = await apiRequest<Allotment[]>(`/allotments/records?${query.toString()}`);
      setRecords(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecords();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Event-driven update: refresh records only when allotments/checkout are mutated
  useEffect(() => {
    const unsubscribe = subscribeToMutation('records', () => {
      fetchRecords();
    });
    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.employeeId?.category === filterCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-[12px] p-5 border border-[#e5e9f0] hover:border-sky-400/80 hover:shadow-[0_2px_12px_rgba(2,132,199,0.08)] transition duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <History className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">
                  Stay & Visit History Records
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-[#0284c7] border border-sky-200/60">
                  Live Archive
                </span>
              </div>
              <p className="text-[13px] font-normal text-[#64748b] mt-0.5">
                All personnel visits, allocated rooms, check-in & checkout dates, and stay duration.
              </p>
            </div>
          </div>
          <span className="text-[12px] font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-[8px] border border-slate-200 whitespace-nowrap">
            {records.length} Total Records
          </span>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', 'VIP', 'SENIOR', 'JUNIOR'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition ${
                  filterCategory === cat
                    ? 'bg-[#0a192f] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e5e9f0]'
                }`}
              >
                {cat === 'ALL' ? 'All Records' : cat}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              placeholder="Search by staff, ID, unit, bootcamp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-[13px] bg-slate-50 border border-[#e5e9f0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#0284c7] transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-[12px] border border-[#e5e9f0] hover:border-sky-400/80 hover:shadow-[0_2px_12px_rgba(2,132,199,0.08)] transition duration-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading visit records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No visit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px] sm:text-[13px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-medium uppercase tracking-[0.04em] text-[10px] sm:text-[11px]">
                  <th className="py-2.5 px-2 sm:px-3">Staff Member</th>
                  <th className="py-2.5 px-2 sm:px-3">Emp ID</th>
                  <th className="py-2.5 px-1.5 sm:px-2">Category</th>
                  <th className="py-2.5 px-2 sm:px-3">Allocated Unit</th>
                  <th className="py-2.5 px-2 sm:px-3">Check-In</th>
                  <th className="py-2.5 px-2 sm:px-3">Check-Out</th>
                  <th className="py-2.5 px-1.5 sm:px-2 text-center">Duration</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right">Stay Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-2 sm:px-3 font-medium text-slate-900 capitalize whitespace-nowrap">
                      <div className="truncate max-w-[130px] sm:max-w-[170px]" title={item.employeeId?.name}>
                        {item.employeeId?.name || '—'}
                      </div>
                      <span className="block text-[10px] text-slate-400 font-normal truncate max-w-[130px] sm:max-w-[170px]">
                        {item.employeeId?.department || 'Staff'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 font-medium text-slate-800 whitespace-nowrap text-[11px] sm:text-[12px]">
                      {item.employeeId?.employeeId || '—'}
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          item.employeeId?.category === 'JUNIOR'
                            ? 'bg-[#ecfdf5] text-[#00a651]'
                            : item.employeeId?.category === 'SENIOR'
                            ? 'bg-[#f0f9ff] text-[#0284c7]'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {item.employeeId?.category || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800 truncate max-w-[120px] sm:max-w-[160px]" title={item.allocationUnitId?.unitCode}>
                        {item.allocationUnitId?.unitCode || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal truncate max-w-[120px] sm:max-w-[160px]">
                        {item.bootcampId?.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-slate-700 whitespace-nowrap text-[11px] sm:text-[12px]">
                      {formatDate(item.actualCheckInDate || item.checkInDate || item.expectedCheckInDate || item.createdAt)}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-slate-700 whitespace-nowrap text-[11px] sm:text-[12px]">
                      {item.actualCheckoutDate
                        ? formatDate(item.actualCheckoutDate)
                        : item.checkoutDate || item.expectedCheckoutDate
                        ? formatDate(item.checkoutDate || item.expectedCheckoutDate)
                        : '—'}
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {item.plannedStayDuration}d
                      </span>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap">
                      {item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          Departed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a651]"></span>
                          In Residence
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
