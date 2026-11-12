import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { Users, BedDouble, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { EmployeeCategory } from '../../types';

export const DashboardOverview: React.FC<{
  onNavigate: (tab: string) => void;
}> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    vipCount: 0,
    seniorCount: 0,
    juniorCount: 0,
    seniorOccupied: 0,
    seniorCapacity: 0,
    juniorOccupied: 0,
    juniorCapacity: 0,
    vipOccupied: 0,
    vipCapacity: 0,
    totalBootcamps: 0,
    totalCapacity: 0,
    occupiedUnits: 0,
    availableUnits: 0,
    activeStays: 0,
    overdueCount: 0,
  });
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
        let jrCap = 0, jrOcc = 0;
        let srCap = 0, srOcc = 0;
        let vipCap = 0, vipOcc = 0;

        bootcamps.forEach((b) => {
          totalCap += b.totalCapacity;
          occupied += b.occupiedCount;
          if (b.category === EmployeeCategory.JUNIOR) {
            jrCap += b.totalCapacity;
            jrOcc += b.occupiedCount;
          } else if (b.category === EmployeeCategory.SENIOR) {
            srCap += b.totalCapacity;
            srOcc += b.occupiedCount;
          } else if (b.category === EmployeeCategory.VIP) {
            vipCap += b.totalCapacity;
            vipOcc += b.occupiedCount;
          }
        });

        setStats({
          totalEmployees: employees.length,
          vipCount: employees.filter((e) => e.category === EmployeeCategory.VIP).length,
          seniorCount: employees.filter((e) => e.category === EmployeeCategory.SENIOR).length,
          juniorCount: employees.filter((e) => e.category === EmployeeCategory.JUNIOR).length,
          seniorOccupied: srOcc,
          seniorCapacity: srCap,
          juniorOccupied: jrOcc,
          juniorCapacity: jrCap,
          vipOccupied: vipOcc,
          vipCapacity: vipCap,
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

  const juniorPct = stats.juniorCapacity > 0 ? Math.round((stats.juniorOccupied / stats.juniorCapacity) * 100) : 0;
  const seniorPct = stats.seniorCapacity > 0 ? Math.round((stats.seniorOccupied / stats.seniorCapacity) * 100) : 0;
  const vipPct = stats.vipCapacity > 0 ? Math.round((stats.vipOccupied / stats.vipCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Category Capacity Cards matching the screenshot's Junior & Senior cards */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a651] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Hostel Category Occupancy Overview</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>📅 {new Date().toLocaleDateString('en-GB')}</span>
            <span className="text-[#00a651] font-semibold">&bull; Active Cycle</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Junior Category Card (Emerald accent like screenshot) */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-[#fbfdfc] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Junior (Beds)
                </span>
                <span className="text-3xl font-extrabold text-slate-800 mt-1 block">
                  {stats.juniorCapacity}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">
                  Occupied: <strong className="text-slate-800">{stats.juniorOccupied}</strong> ({juniorPct}%)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#00a651] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#00a651] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(juniorPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Senior Category Card (Cyan Blue accent like screenshot) */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-[#fbfdfe] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Senior (Portions)
                </span>
                <span className="text-3xl font-extrabold text-slate-800 mt-1 block">
                  {stats.seniorCapacity}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">
                  Occupied: <strong className="text-slate-800">{stats.seniorOccupied}</strong> ({seniorPct}%)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#f0f9ff] text-[#0284c7] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#0284c7] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(seniorPct, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* VIP Category Card (Purple accent) */}
          <div className="p-5 rounded-2xl border border-slate-100 bg-[#fdfcff] shadow-sm flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  VIP (Bootcamps)
                </span>
                <span className="text-3xl font-extrabold text-slate-800 mt-1 block">
                  {stats.vipCapacity}
                </span>
                <span className="text-xs font-medium text-slate-500 mt-1 block">
                  Occupied: <strong className="text-slate-800">{stats.vipOccupied}</strong> ({vipPct}%)
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-5">
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(vipPct, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Hostel Capacity</span>
            <BedDouble className="w-5 h-5 text-[#00a651]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">
            {stats.occupiedUnits} <span className="text-sm font-normal text-slate-400">/ {stats.totalCapacity} units</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            {stats.availableUnits} units available for stay
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Stays</span>
            <Sparkles className="w-5 h-5 text-[#0284c7]" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{stats.activeStays}</div>
          <div className="text-xs text-[#0284c7] font-semibold mt-1">
            Currently checked-in & pending
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Workforce</span>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-800">{stats.totalEmployees}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">
            VIP: {stats.vipCount} &bull; SR: {stats.seniorCount} &bull; JR: {stats.juniorCount}
          </div>
        </div>

        <div
          onClick={() => onNavigate('notifications')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm cursor-pointer hover:border-rose-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Stays</span>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{stats.overdueCount}</div>
          <div className="text-xs text-rose-600 font-semibold mt-1">
            Click to view checkout alerts
          </div>
        </div>
      </div>
    </div>
  );
};
