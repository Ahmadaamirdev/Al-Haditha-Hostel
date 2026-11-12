import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Allotment, Employee, AllocationUnit, EmployeeCategory } from '../../types';
import { formatDate } from '../../utils';
import {
  Plus,
  LogOut,
  Edit2,
  Sparkles,
  CalendarCheck2,
} from 'lucide-react';

export const AllotmentList: React.FC = () => {
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [isNewAllotmentOpen, setIsNewAllotmentOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  // Selected allotment for actions
  const [selectedAllotment, setSelectedAllotment] = useState<Allotment | null>(null);

  // Form states
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [availableUnits, setAvailableUnits] = useState<AllocationUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [checkInDate, setCheckInDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [plannedStayDuration, setPlannedStayDuration] = useState(7);
  const [notes, setNotes] = useState('');
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
    fetchActiveAllotments();
  }, [search]);

  const openNewAllotmentModal = async () => {
    try {
      setActionError(null);
      setSuggestedUnitNote(null);
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
          notes,
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

  return (
    <div className="space-y-6">
      {/* Live Stream Header Card like screenshot */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a651] flex items-center justify-center font-bold">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800">
                  Live Allotment & Stay Registry
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#00a651] border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a651] animate-pulse"></span>
                  Active Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time accommodation assignments. Showing active pending and checked-in stays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              Showing {allotments.length} active stays
            </span>
            <button
              onClick={openNewAllotmentModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20 transition"
            >
              <Plus className="w-4 h-4" />
              Assign Allotment
            </button>
          </div>
        </div>

        {/* Search & Action Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-[#00a651] border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-[#00a651]"></span>
              Active Stays
            </span>
          </div>

          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Search staff name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a651] transition"
            />
          </div>
        </div>
      </div>

      {/* Table matching Al Haditha screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading active allotments...</div>
        ) : allotments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No active allotments found.</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Date & Time</th>
                <th className="py-3 px-5">Employee ID</th>
                <th className="py-3 px-5">Staff Name</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Allocated Unit</th>
                <th className="py-3 px-5">Planned Duration</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allotments.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                    {item.employeeId?.employeeId}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">
                    {item.employeeId?.name}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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
                  <td className="py-3.5 px-5 font-mono font-semibold text-slate-800">
                    {item.allocationUnitId?.unitCode}
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      {item.bootcampId?.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-slate-800">
                      {item.plannedStayDuration} Days
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Checkout: {formatDate(item.checkoutDate || item.expectedCheckoutDate)}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00a651]"></span>
                      Active Stay
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedAllotment(item);
                          setActionDate(new Date().toISOString().split('T')[0]);
                          setIsCheckOutModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition text-xs font-semibold inline-flex items-center gap-1.5 border border-rose-200"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check-Out
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAllotment(item);
                          setNewDuration(item.plannedStayDuration);
                          setIsDurationModalOpen(true);
                        }}
                        title="Edit Duration"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal 1: New Allotment Creation */}
      {isNewAllotmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign New Allotment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select eligible employee, choose a manual or system-suggested unit, and set planned duration.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateAllotment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Eligible Employee *
                </label>
                {eligibleEmployees.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                    No eligible employees available without an active stay.
                  </div>
                ) : (
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  >
                    {eligibleEmployees.map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.employeeId}) &bull; {e.category}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Available Allocation Unit *
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestSuggestion}
                    className="text-xs text-[#00a651] hover:text-[#008c44] font-bold inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Suggest Optimal Unit
                  </button>
                </div>

                {suggestedUnitNote && (
                  <div className="mb-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[#00a651] text-xs font-medium">
                    {suggestedUnitNote}
                  </div>
                )}

                {availableUnits.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No available units found matching this employee's category.
                  </div>
                ) : (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  >
                    {availableUnits.map((u: any) => (
                      <option key={u._id} value={u._id}>
                        {u.unitCode} — {u.bootcampId?.name} ({u.unitType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Planned Stay (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedStayDuration}
                    onChange={(e) => setPlannedStayDuration(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Project deployment"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewAllotmentOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableUnits.length === 0 || eligibleEmployees.length === 0}
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Physical Check-Out</h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirming checkout will release unit{' '}
              <strong>{selectedAllotment.allocationUnitId?.unitCode}</strong> immediately for subsequent stays.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckOut} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Checkout Date *
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Complete Checkout & Release Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Update Duration */}
      {isDurationModalOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Adjust Planned Stay Duration</h3>
            <p className="text-xs text-slate-500 mb-4">
              Increasing or decreasing duration will automatically recalculate the expected checkout date.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateDuration} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Planned Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDurationModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20"
                >
                  Recalculate & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
