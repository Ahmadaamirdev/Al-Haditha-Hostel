import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { UserPlus, Filter, Users } from 'lucide-react';
import { Employee, EmployeeCategory } from '../../types';

export const EmployeeList: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Employee Form State
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EmployeeCategory>(EmployeeCategory.JUNIOR);
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (categoryFilter) query.append('category', categoryFilter);
      if (search) query.append('search', search);

      const data = await apiRequest<Employee[]>(`/employees?${query.toString()}`);
      setEmployees(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [categoryFilter, search]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await apiRequest('/employees', {
        method: 'POST',
        body: JSON.stringify({
          employeeId,
          name,
          category,
          department,
          contactNumber,
        }),
      });
      setIsModalOpen(false);
      setEmployeeId('');
      setName('');
      setDepartment('');
      setContactNumber('');
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register employee');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Al Haditha screenshot */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#00a651] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Staff & Workforce Directory
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage VIP, Senior, and Junior personnel eligible for bootcamp lodging.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-xl text-xs font-bold shadow-md shadow-[#00a651]/20 transition"
        >
          <UserPlus className="w-4 h-4" />
          Register Staff Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00a651] font-semibold text-slate-700"
          >
            <option value="">All Staff</option>
            <option value="VIP">VIP</option>
            <option value="SENIOR">Senior</option>
            <option value="JUNIOR">Junior</option>
          </select>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search staff name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00a651]"
          />
        </div>
      </div>

      {/* Table matching Al Haditha screenshot style */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading employee records...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No employees found.</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Employee ID</th>
                <th className="py-3 px-5">Staff Name</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Contact</th>
                <th className="py-3 px-5">Allotment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-800">
                    {emp.employeeId}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">{emp.name}</td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.category === 'JUNIOR'
                          ? 'bg-[#ecfdf5] text-[#00a651]'
                          : emp.category === 'SENIOR'
                          ? 'bg-[#f0f9ff] text-[#0284c7]'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {emp.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600 font-medium">{emp.department || '—'}</td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono">{emp.contactNumber || '—'}</td>
                  <td className="py-3.5 px-5">
                    {emp.hasActiveAllotment ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        ● Active Stay
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00a651] bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
                        ✓ Available
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Registering Employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">Register New Staff Member</h3>
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AHP-1001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs uppercase focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Al-Balushi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EmployeeCategory)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                >
                  <option value={EmployeeCategory.JUNIOR}>Junior (Bed Allocation)</option>
                  <option value={EmployeeCategory.SENIOR}>Senior (Portion Allocation)</option>
                  <option value={EmployeeCategory.VIP}>VIP (Entire Bootcamp Allocation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations, Field Logistics"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00a651]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +968 9123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
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
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
