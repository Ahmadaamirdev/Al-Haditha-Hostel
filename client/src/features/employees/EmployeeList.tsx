import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { UserPlus, Filter, CheckCircle2 } from 'lucide-react';
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
      {/* Header with Search and New Employee button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
          <p className="text-sm text-slate-500">
            Manage VIP, Senior, and Junior workforce members eligible for bootcamp allotment.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Register Employee
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Category Filter:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Categories</option>
            <option value="VIP">VIP</option>
            <option value="SENIOR">Senior</option>
            <option value="JUNIOR">Junior</option>
          </select>
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No employees found.</div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Allotment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-50/60 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    {emp.employeeId}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{emp.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        emp.category === 'VIP'
                          ? 'bg-purple-100 text-purple-800'
                          : emp.category === 'SENIOR'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {emp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{emp.department || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{emp.contactNumber || '—'}</td>
                  <td className="py-3 px-4">
                    {emp.hasActiveAllotment ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Active Allotment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                        Available for Stay
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Register New Employee</h3>
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Employee ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP-1010"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Salim Al-Maskari"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Designated Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EmployeeCategory)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value={EmployeeCategory.JUNIOR}>Junior (Bed Allocation)</option>
                  <option value={EmployeeCategory.SENIOR}>Senior (Portion Allocation)</option>
                  <option value={EmployeeCategory.VIP}>VIP (Entire Bootcamp Allocation)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Operations, Logistics"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +968 9123 4567"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-medium shadow-sm"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
