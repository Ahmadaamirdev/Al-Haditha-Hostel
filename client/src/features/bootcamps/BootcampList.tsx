import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Bootcamp, AllocationUnit, Allotment } from '../../types';
import { formatUnitCode } from '../../utils';
import { Building2, Search } from 'lucide-react';
import IsoBootcamp from './IsoBootcamp';

export const BootcampList: React.FC = () => {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [allotments, setAllotments] = useState<Allotment[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Allocate / Check-out modal state (wired to existing flows)
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<AllocationUnit | null>(null);
  const [selectedAllotment, setSelectedAllotment] = useState<Allotment | null>(null);
  const [selectedBootcamp, setSelectedBootcamp] = useState<Bootcamp | null>(null);

  // Allocate form state
  const [eligibleEmployees, setEligibleEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [plannedStayDuration, setPlannedStayDuration] = useState(7);
  const [allocateError, setAllocateError] = useState<string | null>(null);

  // Checkout form state
  const [checkoutDate, setCheckoutDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchBootcamps = async () => {
    try {
      setLoading(true);
      const query = categoryFilter ? `?category=${categoryFilter}` : '';
      const data = await apiRequest<Bootcamp[]>(`/bootcamps${query}`);
      setBootcamps(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllotments = async () => {
    try {
      const data = await apiRequest<Allotment[]>('/allotments');
      setAllotments(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBootcamps();
    fetchAllotments();
  }, [categoryFilter]);

  // ── Allocate flow (triggered from IsoBootcamp bed click) ─────────────────

  const handleAllocate = async (unit: AllocationUnit, bc: Bootcamp) => {
    setAllocateError(null);
    setSelectedUnit(unit);
    setSelectedBootcamp(bc);
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setPlannedStayDuration(7);
    setEmployeeSearch('');
    try {
      const employees = await apiRequest<any[]>('/employees?hasActiveAllotment=false');
      // Pre-filter to employees matching this bootcamp's category
      const eligible = employees.filter((e) => e.category === bc.category);
      setEligibleEmployees(eligible);
      setSelectedEmployeeId(eligible.length > 0 ? eligible[0]._id : '');
    } catch (err: any) {
      setEligibleEmployees([]);
      setAllocateError(err.message || 'Failed to load eligible employees');
    }
    setIsAllocateOpen(true);
  };

  const handleConfirmAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocateError(null);
    if (!selectedUnit) return;
    try {
      const selectedDate = new Date(checkInDate).toISOString();
      await apiRequest('/allotments', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          allocationUnitId: selectedUnit._id,
          checkInDate: selectedDate,
          expectedCheckInDate: selectedDate,
          plannedStayDuration: Number(plannedStayDuration),
        }),
      });
      setIsAllocateOpen(false);
      fetchBootcamps();
      fetchAllotments();
    } catch (err: any) {
      setAllocateError(err.message || 'Failed to create allotment');
    }
  };

  // ── Checkout flow (triggered from IsoBootcamp bed click) ─────────────────

  const handleCheckout = (allotment: Allotment, bc: Bootcamp) => {
    setCheckoutError(null);
    setSelectedAllotment(allotment);
    setSelectedBootcamp(bc);
    setCheckoutDate(new Date().toISOString().split('T')[0]);
    setIsCheckoutOpen(true);
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);
    if (!selectedAllotment) return;
    try {
      await apiRequest(`/allotments/${selectedAllotment._id}/check-out`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualCheckoutDate: new Date(checkoutDate).toISOString(),
        }),
      });
      setIsCheckoutOpen(false);
      fetchBootcamps();
      fetchAllotments();
    } catch (err: any) {
      setCheckoutError(err.message || 'Checkout failed');
    }
  };

  // Filter eligible employees by ID or name
  const filteredEligibleEmployees = eligibleEmployees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const query = employeeSearch.toLowerCase().trim();
    return (
      emp.employeeId?.toLowerCase().includes(query) ||
      emp.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-[12px] p-5 border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00a651] flex items-center justify-center font-semibold">
            <Building2 className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">
              Hostel Bootcamp Facilities &amp; Units
            </h2>
            <p className="text-[13px] font-normal text-[#64748b] mt-0.5">
              Granular view of physical buildings, portions, and individual bed status.
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2">
        {(['', 'VIP', 'SENIOR', 'JUNIOR'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition ${
              categoryFilter === cat
                ? 'bg-[#00a651] text-white font-medium'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-[#e5e9f0]'
            }`}
          >
            {cat === '' ? 'All Bootcamps' : `${cat} Only`}
          </button>
        ))}
      </div>

      {/* Bootcamp Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-[#64748b] text-[13px]">Loading bootcamps...</div>
      ) : bootcamps.length === 0 ? (
        <div className="p-8 text-center text-[#64748b] text-[13px]">No bootcamps found.</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '14px',
          }}
        >
          {bootcamps.map((bc) => (
            <div
              key={bc._id}
              className="bg-white rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 overflow-hidden flex flex-col"
            >
              {/* Compact Card Header */}
              <div className="px-3 py-2.5 border-b border-[#e5e9f0] bg-[#fbfdfc] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-mono text-[13px] font-medium text-slate-900 truncate">
                    {bc.bootcampCode}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[12px] font-medium text-slate-800 whitespace-nowrap">
                    {bc.occupiedCount}/{bc.totalCapacity}
                  </div>
                </div>
              </div>

              {/* Isometric Room View */}
              <div className="p-3 flex-1">
                <IsoBootcamp
                  bootcamp={bc}
                  allotments={allotments}
                  onAllocate={handleAllocate}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal: Allocate Bed ────────────────────────────────────────────── */}
      {isAllocateOpen && selectedUnit && selectedBootcamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Allocate Bed</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Assign a {selectedBootcamp.category} employee to unit{' '}
              <strong className="font-mono font-medium">{formatUnitCode(selectedUnit.unitCode)}</strong> in{' '}
              {selectedBootcamp.name}.
            </p>

            {allocateError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {allocateError}
              </div>
            )}

            <form onSubmit={handleConfirmAllocate} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Eligible Employee *
                </label>
                {eligibleEmployees.length === 0 ? (
                  <div className="text-[13px] text-rose-600 bg-rose-50 p-3 rounded-[8px] border border-rose-200">
                    No eligible {selectedBootcamp.category} employees available without an active stay.
                  </div>
                ) : (
                  <div className="space-y-2">
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
                            emp.employeeId?.toLowerCase().includes(val.toLowerCase()) ||
                            emp.name?.toLowerCase().includes(val.toLowerCase())
                          );
                          if (filtered.length > 0 && !filtered.some((f) => f._id === selectedEmployeeId)) {
                            setSelectedEmployeeId(filtered[0]._id);
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
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                      >
                        {filteredEligibleEmployees.map((emp) => (
                          <option key={emp._id} value={emp._id}>
                            {emp.employeeId} &bull; {emp.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
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
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-4 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={filteredEligibleEmployees.length === 0 || !selectedEmployeeId}
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] disabled:opacity-50 text-white rounded-[8px] text-[13px] font-medium shadow-none"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Confirm Check-Out ───────────────────────────────────────── */}
      {isCheckoutOpen && selectedAllotment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">
              Confirm Physical Check-Out
            </h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Confirming checkout will release unit{' '}
              <strong className="font-mono font-medium">{formatUnitCode((selectedAllotment.allocationUnitId as any)?.unitCode)}</strong> immediately
              for subsequent stays.
            </p>

            {checkoutError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {checkoutError}
              </div>
            )}

            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  Checkout Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-[#e5e9f0] rounded-[8px] text-[13px] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
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
    </div>
  );
};
