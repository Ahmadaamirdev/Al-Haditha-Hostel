import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Allotment, Employee, AllocationUnit, EmployeeCategory } from '../../types';
import { formatDate } from '../../utils';
import {
  Plus,
  LogIn,
  LogOut,
  Edit2,
  Sparkles,
} from 'lucide-react';

export const AllotmentList: React.FC = () => {
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isNewAllotmentOpen, setIsNewAllotmentOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);

  // Selected allotment for actions
  const [selectedAllotment, setSelectedAllotment] = useState<Allotment | null>(null);

  // Form states
  const [eligibleEmployees, setEligibleEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [availableUnits, setAvailableUnits] = useState<AllocationUnit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [expectedCheckInDate, setExpectedCheckInDate] = useState(
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
      if (statusFilter) query.append('status', statusFilter);
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
  }, [statusFilter, search]);

  // Load eligible employees when opening creation modal
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
      await apiRequest('/allotments', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          allocationUnitId: selectedUnitId,
          expectedCheckInDate: new Date(expectedCheckInDate).toISOString(),
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

  const handleConfirmCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllotment) return;
    setActionError(null);
    try {
      await apiRequest(`/allotments/${selectedAllotment._id}/check-in`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualCheckInDate: new Date(actionDate).toISOString(),
        }),
      });
      setIsCheckInModalOpen(false);
      fetchActiveAllotments();
    } catch (err: any) {
      setActionError(err.message || 'Check-in failed');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Active Allotments & Stays</h2>
          <p className="text-sm text-slate-500">
            Real-time accommodation assignments. Shows active pending and checked-in stays only.
          </p>
        </div>
        <button
          onClick={openNewAllotmentModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Assign New Allotment
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {['', 'PENDING', 'CHECKED_IN'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All Active' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search employee, bootcamp, unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading active allotments...</div>
        ) : allotments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No active allotments found.</div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Allocated Unit</th>
                <th className="py-3 px-4">Check-In Dates</th>
                <th className="py-3 px-4">Stay & Checkout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allotments.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900">{item.employeeId?.name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      {item.employeeId?.employeeId} &bull; {item.employeeId?.category}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono font-semibold text-slate-800 text-xs">
                      {item.allocationUnitId?.unitCode}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.bootcampId?.name} ({item.allocationUnitId?.unitType})
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-xs">
                      <span className="text-slate-400">Exp:</span>{' '}
                      {formatDate(item.expectedCheckInDate)}
                    </div>
                    <div className="text-xs mt-0.5">
                      <span className="text-slate-400">Act:</span>{' '}
                      {item.actualCheckInDate ? (
                        <span className="text-emerald-700 font-medium">
                          {formatDate(item.actualCheckInDate)}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Not confirmed</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-xs font-semibold text-slate-800">
                      {item.plannedStayDuration} Days Planned
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Exp. Departure: {formatDate(item.expectedCheckoutDate)}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'CHECKED_IN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status === 'CHECKED_IN' ? 'Checked In' : 'Pending Check-In'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {item.status === 'PENDING' && (
                        <button
                          onClick={() => {
                            setSelectedAllotment(item);
                            setActionDate(new Date().toISOString().split('T')[0]);
                            setIsCheckInModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition text-xs font-medium inline-flex items-center gap-1"
                          title="Confirm Physical Arrival"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          Check-In
                        </button>
                      )}

                      {item.status === 'CHECKED_IN' && (
                        <button
                          onClick={() => {
                            setSelectedAllotment(item);
                            setActionDate(new Date().toISOString().split('T')[0]);
                            setIsCheckOutModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition text-xs font-medium inline-flex items-center gap-1"
                          title="Confirm Physical Departure"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Check-Out
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedAllotment(item);
                          setNewDuration(item.plannedStayDuration);
                          setIsDurationModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition text-xs font-medium"
                        title="Modify Stay Duration"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Assign New Allotment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Select eligible employee, choose a manual or system-suggested unit, and set planned duration.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateAllotment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Eligible Employee *
                </label>
                {eligibleEmployees.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    No eligible employees available without an active stay.
                  </div>
                ) : (
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                  <label className="block text-xs font-medium text-slate-700">
                    Available Allocation Unit *
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestSuggestion}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Suggest Optimal Unit
                  </button>
                </div>

                {suggestedUnitNote && (
                  <div className="mb-2 p-2 rounded bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium">
                    {suggestedUnitNote}
                  </div>
                )}

                {availableUnits.length === 0 ? (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    No available units found matching this employee's category.
                  </div>
                ) : (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => setSelectedUnitId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-xs"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expected Check-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={expectedCheckInDate}
                    onChange={(e) => setExpectedCheckInDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Planned Stay (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={plannedStayDuration}
                    onChange={(e) => setPlannedStayDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Administrative Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Training cohort 4, Project Omega"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewAllotmentOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableUnits.length === 0 || eligibleEmployees.length === 0}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Check-In */}
      {isCheckInModalOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Physical Check-In</h3>
            <p className="text-xs text-slate-500 mb-4">
              Employee: <strong>{selectedAllotment.employeeId?.name}</strong> (
              {selectedAllotment.allocationUnitId?.unitCode})
            </p>

            <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-800">
              <strong>Approved Recalculation Rule Active:</strong> Expected checkout date will be
              automatically recomputed as <em>Actual Check-In + Planned Stay Duration</em>.
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Actual Check-In Date *
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckInModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Confirm Arrival
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Check-Out */}
      {isCheckOutModalOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Physical Check-Out</h3>
            <p className="text-xs text-slate-500 mb-4">
              Confirming checkout will release unit{' '}
              <strong>{selectedAllotment.allocationUnitId?.unitCode}</strong> immediately for subsequent stays.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckOut} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Actual Check-Out Date *
                </label>
                <input
                  type="date"
                  required
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckOutModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Adjust Planned Stay Duration</h3>
            <p className="text-xs text-slate-500 mb-4">
              Increasing or decreasing duration will automatically recalculate the expected checkout date.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {actionError}
              </div>
            )}

            <form onSubmit={handleUpdateDuration} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Planned Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDurationModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-sm"
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
