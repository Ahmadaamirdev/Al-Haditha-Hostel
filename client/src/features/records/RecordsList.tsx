import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
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
    fetchRecords();
  }, [search]);

  const filteredRecords = records.filter((item) => {
    if (filterCategory === 'ALL') return true;
    return item.employeeId?.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Stay & Visit History Records
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#0284c7] border border-sky-200/60">
                  Comprehensive Archive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete historical record of all personnel visits, allocated rooms, check-in & checkout dates, and duration.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Total Recorded Stays: {records.length}
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Category:
            </span>
            {['ALL', 'VIP', 'SENIOR', 'JUNIOR'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  filterCategory === cat
                    ? 'bg-[#0a192f] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'All Records' : cat}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="Search by staff, ID, unit, bootcamp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a651] transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading visit records...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No visit records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs table-auto">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Staff Member</th>
                  <th className="py-3 px-3">Emp ID</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Allocated Unit</th>
                  <th className="py-3 px-3">Check-In</th>
                  <th className="py-3 px-3">Check-Out</th>
                  <th className="py-3 px-3 text-center">Duration</th>
                  <th className="py-3 px-3 text-right">Stay Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-bold text-slate-900 capitalize whitespace-nowrap">
                      {item.employeeId?.name || '—'}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {item.employeeId?.department || 'Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {item.employeeId?.employeeId || '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
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
                    <td className="py-3 px-3">
                      <div className="font-mono font-semibold text-slate-800 whitespace-nowrap">
                        {item.allocationUnitId?.unitCode || '—'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[170px]">
                        {item.bootcampId?.name}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {formatDate(item.actualCheckInDate || item.checkInDate || item.expectedCheckInDate || item.createdAt)}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                      {item.actualCheckoutDate
                        ? formatDate(item.actualCheckoutDate)
                        : item.checkoutDate || item.expectedCheckoutDate
                        ? formatDate(item.checkoutDate || item.expectedCheckoutDate)
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {item.plannedStayDuration} Days
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      {item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <UserCheck className="w-3 h-3 text-slate-500" />
                          Completed & Departed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00a651]"></span>
                          Currently In Residence
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
