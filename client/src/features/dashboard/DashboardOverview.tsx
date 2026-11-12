import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Building2, Users, BedDouble, AlertCircle, Sparkles } from 'lucide-react';
import { EmployeeCategory } from '../../types';

export const DashboardOverview: React.FC<{
  onNavigate: (tab: string) => void;
}> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    vipCount: 0,
    seniorCount: 0,
    juniorCount: 0,
    totalBootcamps: 0,
    totalCapacity: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    activeStays: 0,
    overdueCount: 0,
  });
  // loading state
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        const [employees, bootcamps, allotments, notifications] = await Promise.all([
          apiRequest<any[]>('/employees'),
          apiRequest<any[]>('/bootcamps'),
          apiRequest<any[]>('/allotments'),
          apiRequest<any>('/notifications'),
        ]);

        let totalCap = 0;
        let occupied = 0;
        bootcamps.forEach((b) => {
          totalCap += b.totalCapacity;
          occupied += b.occupiedCount;
        });

        setStats({
          totalEmployees: employees.length,
          vipCount: employees.filter((e) => e.category === EmployeeCategory.VIP).length,
          seniorCount: employees.filter((e) => e.category === EmployeeCategory.SENIOR).length,
          juniorCount: employees.filter((e) => e.category === EmployeeCategory.JUNIOR).length,
          totalBootcamps: bootcamps.length,
          totalCapacity: totalCap,
          occupiedUnits: occupied,
          availableUnits: totalCap - occupied,
          activeStays: allotments.length,
          overdueCount: notifications?.summary?.overdueCount || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const occupancyRate = stats.totalCapacity > 0 ? Math.round((stats.occupiedUnits / stats.totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-sky-950 rounded-2xl text-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Phase 2 Activated: Complete Operational Suite
          </span>
          <h2 className="text-2xl font-bold tracking-tight">Al Haditha Hostel Overview</h2>
          <p className="text-sm text-slate-300 mt-1">
            Real-time occupancy tracking for VIP, Senior, and Junior workforce accommodations.
          </p>
        </div>

        <button
          onClick={() => onNavigate('allotments')}
          className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold shadow-md transition"
        >
          Manage Allotments &rarr;
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hostel Capacity</span>
            <BedDouble className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.occupiedUnits} <span className="text-base text-slate-400 font-normal">/ {stats.totalCapacity}</span></div>
          <div className="text-xs text-slate-500 mt-1">
            {occupancyRate}% Total Capacity Occupied
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Stays</span>
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.activeStays}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">
            {stats.availableUnits} Units Available for Assignment
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Employees</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalEmployees}</div>
          <div className="text-xs text-slate-500 mt-1">
            VIP: {stats.vipCount} &bull; SR: {stats.seniorCount} &bull; JR: {stats.juniorCount}
          </div>
        </div>

        <div
          onClick={() => onNavigate('notifications')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Alerts</span>
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-3xl font-bold text-rose-600">{stats.overdueCount}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            Click to inspect checkout alerts
          </div>
        </div>
      </div>
    </div>
  );
};
