import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Allotment, Employee, AllocationUnit, EmployeeCategory } from '../../types';
import { formatDate, formatUnitCode } from '../../utils';
import {
  Plus,
  LogOut,
  Edit2,
  Sparkles,
  CalendarCheck2,
  Search,
} from 'lucide-react';

export const AllotmentList: React.FC = () => {
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Modals state
  const [isNewAllotmentOpen, setIsNewAllotmentOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  // Selected allotment for actions
  const [selectedAllotment, setSelectedAllotment] = useState<Allotment | null>(null);

  // Form states
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [availableUnits, setAvailableUnits] = useState<AllocationUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [checkInDate, setCheckInDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [plannedStayDuration, setPlannedStayDuration] = useState(7);
  const [suggestedUnitNote, setSuggestedUnitNote] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Date inputs for check-in / check-out
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState(7);

  const fetchActiveAllotments = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      const data = await apiRequest<Allotment[]>(`/allotments?${query.toString()}`);
      setAllotments(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActiveAllotments();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openNewAllotmentModal = async () => {
    try {
      setActionError(null);
      setSuggestedUnitNote(null);
      setEmployeeSearch('');
      const employees = await apiRequest<Employee[]>('/employees?hasActiveAllotment=false');
      setEligibleEmployees(employees);
      if (employees.length > 0) {
        setSelectedEmployeeId(employees[0]._id);
        loadUnitsForCategory(employees[0].category);
      }
      setIsNewAllotmentOpen(true);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadUnitsForCategory = async (category: EmployeeCategory) => {
    try {
      const units = await apiRequest<AllocationUnit[]>(
        `/bootcamps/units/available?category=${category}`
      );
      setAvailableUnits(units);
      if (units.length > 0) {
        setSelectedUnitId(units[0]._id);
      } else {
        setSelectedUnitId('');
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleEmployeeChange = (empId: string) => {
    setSelectedEmployeeId(empId);
    setSuggestedUnitNote(null);
    const emp = eligibleEmployees.find((e) => e._id === empId);
    if (emp) {
      loadUnitsForCategory(emp.category);
    }
  };

  const handleRequestSuggestion = async () => {
    const emp = eligibleEmployees.find((e) => e._id === selectedEmployeeId);
    if (!emp) return;

    try {
      const result = await apiRequest<{ suggestedUnit: AllocationUnit; reason: string }>(
        `/bootcamps/units/suggest?category=${emp.category}`
      );
      if (result?.suggestedUnit) {
        setSelectedUnitId(result.suggestedUnit._id);
        setSuggestedUnitNote(result.reason);
      }
    } catch (err: any) {
      setActionError(err.message || 'No suggestion available');
    }
  };

  const handleCreateAllotment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      const selectedDate = new Date(checkInDate).toISOString();
      await apiRequest('/allotments', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          allocationUnitId: selectedUnitId,
          checkInDate: selectedDate,
          expectedCheckInDate: selectedDate,
          plannedStayDuration: Number(plannedStayDuration),
        }),
      });
      setIsNewAllotmentOpen(false);
      fetchActiveAllotments();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create allotment');
    }
  };

  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllotment) return;
    setActionError(null);
    try {
      await apiRequest(`/allotments/${selectedAllotment._id}/check-out`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualCheckoutDate: new Date(actionDate).toISOString(),
        }),
      });
      setIsCheckOutModalOpen(false);
      fetchActiveAllotments();
    } catch (err: any) {
      setActionError(err.message || 'Checkout failed');
    }
  };

  const handleUpdateDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllotment) return;
    setActionError(null);
    try {
      await apiRequest(`/allotments/${selectedAllotment._id}/duration`, {
        method: 'PATCH',
        body: JSON.stringify({
          plannedStayDuration: Number(newDuration),
        }),
      });
      setIsDurationModalOpen(false);
      fetchActiveAllotments();
    } catch (err: any) {
      setActionError(err.message || 'Duration update failed');
    }
  };

  // Filter eligible employees by ID or name
  const filteredEligibleEmployees = eligibleEmployees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const query = employeeSearch.toLowerCase().trim();
    return (
      emp.employeeId.toLowerCase().includes(query) ||
      emp.name.toLowerCase().includes(query)
    );
  });

  // Filter allotments by category
  const displayedAllotments = allotments.filter((item) => {
    if (!categoryFilter) return true;
    return item.employeeId?.category === categoryFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-[12px] p-5 border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00a651] flex items-center justify-center font-semibold">
              <CalendarCheck2 className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">
                Live Allotment &amp; Stay Registry
              </h2>
              <p className="text-[13px] font-normal text-[#64748b] mt-0.5">
                Real-time accommodation assignments. Showing active pending and checked-in stays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openNewAllotmentModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-[8px] text-[14px] font-medium transition"
            >
              <Plus className="w-4 h-4" />
              Assign Allotment
            </button>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-5 pt-4 border-t border-[#e5e9f0] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {(['', 'VIP', 'SENIOR', 'JUNIOR'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition ${
                  categoryFilter === cat
                    ? 'bg-[#00a651] text-white font-medium'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e5e9f0]'
                }`}
              >
                {cat === '' ? 'All Categories' : `${cat} Only`}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search staff name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-1.5 text-[13px] bg-slate-50 border border-[#e5e9f0] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
            />
          </div>
        </div>
      </div>

      {/* Table matching Al Haditha screenshot */}
      <div className="bg-white rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#64748b] text-[13px]">Loading active allotments...</div>
        ) : displayedAllotments.length === 0 ? (
          <div className="p-8 text-center text-[#64748b] text-[13px]">No active allotments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px] sm:text-[13px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-[#e5e9f0] text-[#64748b] font-medium uppercase tracking-[0.04em] text-[10px] sm:text-[11px]">
                  <th className="py-2.5 px-2 sm:px-3">Date</th>
                  <th className="py-2.5 px-2 sm:px-3">Emp ID</th>
                  <th className="py-2.5 px-2 sm:px-3">Staff Name</th>
                  <th className="py-2.5 px-1.5 sm:px-2">Category</th>
                  <th className="py-2.5 px-2 sm:px-3">Allocated Unit</th>
                  <th className="py-2.5 px-2 sm:px-3">Stay</th>
                  <th className="py-2.5 px-1.5 sm:px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 sm:px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e9f0]">
                {displayedAllotments.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-2 sm:px-3 font-mono text-slate-600 whitespace-nowrap text-[11px] sm:text-[12px]">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 font-mono font-medium text-slate-800 whitespace-nowrap text-[11px] sm:text-[12px]">
                      {item.employeeId?.employeeId}
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 font-medium text-slate-900 capitalize whitespace-nowrap">
                      <div className="truncate max-w-[130px] sm:max-w-[170px]" title={item.employeeId?.name}>
                        {item.employeeId?.name}
                      </div>
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          item.employeeId?.category === 'JUNIOR'
                            ? 'bg-[#ecfdf5] text-[#00a651]'
                            : item.employeeId?.category === 'SENIOR'
                            ? 'bg-[#f0f9ff] text-[#0284c7]'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {item.employeeId?.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-800 truncate max-w-[130px] sm:max-w-[160px]" title={formatUnitCode(item.allocationUnitId?.unitCode)}>
                        {formatUnitCode(item.allocationUnitId?.unitCode)}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {item.plannedStayDuration}d
                      </span>
                      <span className="block text-[11px] text-[#64748b]">
                        Out: {formatDate(item.checkoutDate || item.expectedCheckoutDate)}
                      </span>
                    </td>
                    <td className="py-2.5 px-1.5 sm:px-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00a651]"></span>
                        Active
                      </span>
                    </td>
                    <td className="py-2.5 px-2 sm:px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAllotment(item);
                            setActionDate(new Date().toISOString().split('T')[0]);
                            setIsCheckOutModalOpen(true);
                          }}
                          className="px-2 py-1 rounded-[6px] bg-rose-50 text-rose-600 hover:bg-rose-100 transition text-[11px] font-medium inline-flex items-center gap-1 border border-rose-200"
                        >
                          <LogOut className="w-3 h-3" />
                          Check-Out
                        </button>

                        <button
                          onClick={() => {
                            setSelectedAllotment(item);
                            setNewDuration(item.plannedStayDuration);
                            setIsDurationModalOpen(true);
                          }}
                          title="Edit Duration"
                          className="p-1 rounded-[6px] text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-[#e5e9f0] transition"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: New Allotment Creation */}
      {isNewAllotmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-lg w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Assign New Allotment</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Select eligible employee, choose a manual or system-suggested unit, and set planned duration.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateAllotment} className="space-y-4">
              {/* Eligible Employee with Search by ID */}
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Eligible Employee *
                </label>

                {eligibleEmployees.length === 0 ? (
                  <div className="text-[13px] text-rose-600 bg-rose-50 p-3 rounded-[8px] border border-rose-200">
                    No eligible employees available without an active stay.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Search by ID input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search employee by ID or name..."
                        value={employeeSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEmployeeSearch(val);
                          const filtered = eligibleEmployees.filter((emp) =>
                            emp.employeeId.toLowerCase().includes(val.toLowerCase()) ||
                            emp.name.toLowerCase().includes(val.toLowerCase())
                          );
                          if (filtered.length > 0 && !filtered.some((f) => f._id === selectedEmployeeId)) {
                            handleEmployeeChange(filtered[0]._id);
                          }
                        }}
                        className="w-full pl-8 pr-3.5 py-1.5 border border-[#e5e9f0] rounded-[8px] text-[13px] bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                      />
                    </div>

                    {filteredEligibleEmployees.length === 0 ? (
                      <div className="text-[13px] text-[#64748b] py-1">
                        No employees found matching "{employeeSearch}".
                      </div>
                    ) : (
                      <select
                        value={selectedEmployeeId}
                        onChange={(e) => handleEmployeeChange(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                      >
                        {filteredEligibleEmployees.map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.employeeId} &bull; {e.name} ({e.category})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-medium text-slate-700">
                    Available Allocation Unit *
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestSuggestion}
                    className="text-[12px] text-[#00a651] hover:text-[#008c44] font-medium inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Suggest Optimal Unit
                  </button>
                </div>

                {suggestedUnitNote && (
                  <div className="mb-2 p-2.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[#00a651] text-[13px] font-medium">
                    {suggestedUnitNote}
                  </div>
                )}

                {availableUnits.length === 0 ? (
                  <div className="text-[13px] text-amber-700 bg-amber-50 p-3 rounded-[8px] border border-amber-200">
                    No available units found matching this employee's category.
                  </div>
                ) : (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] font-mono text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  >
                    {availableUnits.map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {formatUnitCode(u.unitCode)} — {u.bootcampId?.name} ({u.unitType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-slate-700 mb-1">
                    Planned Stay (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedStayDuration}
                    onChange={(e) => setPlannedStayDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewAllotmentOpen(false)}
                  className="px-4 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableUnits.length === 0 || filteredEligibleEmployees.length === 0 || !selectedEmployeeId}
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] disabled:opacity-50 text-white rounded-[8px] text-[13px] font-medium shadow-none"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Check-Out */}
      {isCheckOutModalOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Confirm Physical Check-Out</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Confirming checkout will release unit{' '}
              <strong className="font-mono">{formatUnitCode(selectedAllotment.allocationUnitId?.unitCode)}</strong> immediately for subsequent stays.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckOut} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Checkout Date *
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-[8px] text-[13px] font-medium shadow-none"
                >
                  Complete Checkout &amp; Release Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Update Duration */}
      {isDurationModalOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Adjust Planned Stay Duration</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Increasing or decreasing duration will automatically recalculate the expected checkout date.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateDuration} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  New Planned Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDurationModalOpen(false)}
                  className="px-4 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-[8px] text-[13px] font-medium shadow-none"
                >
                  Recalculate &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
