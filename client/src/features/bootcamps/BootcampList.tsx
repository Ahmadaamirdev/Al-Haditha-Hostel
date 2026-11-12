import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Bootcamp, EmployeeCategory, AllocationUnit } from '../../types';
import { Building2, Plus } from 'lucide-react';

export const BootcampList: React.FC = () => {
  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Bootcamp state
  const [bootcampCode, setBootcampCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EmployeeCategory>(EmployeeCategory.JUNIOR);
  const [locationBlock, setLocationBlock] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchBootcamps();
  }, [categoryFilter]);

  const handleCreateBootcamp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await apiRequest('/bootcamps', {
        method: 'POST',
        body: JSON.stringify({
          bootcampCode,
          name,
          category,
          locationBlock,
        }),
      });
      setIsModalOpen(false);
      setBootcampCode('');
      setName('');
      setLocationBlock('');
      fetchBootcamps();
    } catch (err: any) {
      setFormError(err.message || 'Failed to initialize bootcamp');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a651] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Hostel Bootcamp Facilities & Units
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular view of physical buildings, portions, and individual bed status.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Bootcamp Building
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2">
        {['', 'VIP', 'SENIOR', 'JUNIOR'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              categoryFilter === cat
                ? 'bg-[#00a651] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat === '' ? 'All Bootcamps' : `${cat} Only`}
          </button>
        ))}
      </div>

      {/* Bootcamp Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading bootcamps...</div>
      ) : bootcamps.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-xs">No bootcamps found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bootcamps.map((bc) => (
            <div
              key={bc._id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 bg-[#fbfdfc] flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {bc.bootcampCode}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          bc.category === 'VIP'
                            ? 'bg-purple-100 text-purple-800'
                            : bc.category === 'SENIOR'
                            ? 'bg-[#f0f9ff] text-[#0284c7]'
                            : 'bg-[#ecfdf5] text-[#00a651]'
                        }`}
                      >
                        {bc.category}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {bc.name} {bc.locationBlock && `• ${bc.locationBlock}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">
                    Occupancy: {bc.occupiedCount} / {bc.totalCapacity}
                  </div>
                  <div className="text-[11px] font-semibold text-[#00a651]">
                    {bc.availableCount} available
                  </div>
                </div>
              </div>

              {/* Units Visualizer */}
              <div className="p-5 flex-1 flex flex-col justify-center">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Granular Units ({bc.units?.length || 0})
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {bc.units?.map((unit: AllocationUnit) => (
                    <div
                      key={unit._id}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition ${
                        unit.isOccupied
                          ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                          : 'bg-[#ecfdf5]/50 border-emerald-200 text-[#00a651]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-[11px]">
                          {unit.unitCode}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            unit.isOccupied ? 'bg-rose-500' : 'bg-[#00a651]'
                          }`}
                        />
                      </div>

                      <div className="text-[11px] font-medium text-slate-700">
                        {unit.unitType === 'WHOLE' && 'Entire Building'}
                        {unit.unitType === 'PORTION' && unit.portionIdentifier}
                        {unit.unitType === 'BED' &&
                          `${unit.portionIdentifier} • ${unit.bedIdentifier}`}
                      </div>

                      <div className="mt-2 text-[10px] font-bold">
                        {unit.isOccupied ? (
                          <span className="text-rose-600">● Occupied</span>
                        ) : (
                          <span className="text-[#00a651]">● Available</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Bootcamp Building</h3>
            <p className="text-xs text-slate-500 mb-4">
              Permanent category assignment will auto-generate independent allocation units.
            </p>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateBootcamp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bootcamp Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BC-JR-01"
                  value={bootcampCode}
                  onChange={(e) => setBootcampCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bootcamp Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Al Haditha Junior Block A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Permanent Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EmployeeCategory)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                >
                  <option value={EmployeeCategory.JUNIOR}>
                    Junior (Generates 2 Portions, 6 Beds)
                  </option>
                  <option value={EmployeeCategory.SENIOR}>
                    Senior (Generates 2 Independent Portions)
                  </option>
                  <option value={EmployeeCategory.VIP}>
                    VIP (Generates 1 Entire Bootcamp Unit)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location Block / Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block 4 Sector North"
                  value={locationBlock}
                  onChange={(e) => setLocationBlock(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20"
                >
                  Create & Generate Units
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
