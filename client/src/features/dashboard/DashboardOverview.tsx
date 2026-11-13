import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import {
  Users,
  BedDouble,
  Sparkles,
  Building2,
  ShieldAlert,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { EmployeeCategory, NotificationItem, NotificationType } from '../../types';
import { formatDate, formatUnitCode } from '../../utils';

interface DashboardOverviewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
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
  });

  const [notificationData, setNotificationData] = useState<{
    summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
    alerts: NotificationItem[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [employees, bootcamps, allotments, notifications] = await Promise.all([
        apiRequest<any[]>('/employees'),
        apiRequest<any[]>('/bootcamps'),
        apiRequest<any[]>('/allotments'),
        apiRequest<{
          summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
          alerts: NotificationItem[];
        }>('/notifications'),
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
      });

      setNotificationData(notifications);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const juniorPct = stats.juniorCapacity > 0 ? Math.round((stats.juniorOccupied / stats.juniorCapacity) * 100) : 0;
  const seniorPct = stats.seniorCapacity > 0 ? Math.round((stats.seniorOccupied / stats.seniorCapacity) * 100) : 0;
  const vipPct = stats.vipCapacity > 0 ? Math.round((stats.vipOccupied / stats.vipCapacity) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ── Key Performance Metrics Strip (3 Cards) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Workforce */}
        <div
          onClick={() => onNavigate('employees')}
          className="bg-white p-4 rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748b]">
              Total Workforce
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-[26px] font-semibold tabular-nums leading-none text-slate-800">
              {stats.totalEmployees}
            </div>
            <ArrowRight className="w-[18px] h-[18px] text-[#64748b]" />
          </div>
        </div>

        {/* Hostel Capacity */}
        <div
          onClick={() => onNavigate('bootcamps')}
          className="bg-white p-4 rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748b]">
              Hostel Capacity
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00a651] flex items-center justify-center">
              <BedDouble className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-semibold tabular-nums leading-none text-slate-800">
                {stats.occupiedUnits}
              </span>
              <span className="text-[13px] font-normal text-[#64748b]">
                / {stats.totalCapacity} units
              </span>
            </div>
            <ArrowRight className="w-[18px] h-[18px] text-[#64748b]" />
          </div>
        </div>

        {/* Active Stays */}
        <div
          onClick={() => onNavigate('allotments')}
          className="bg-white p-4 rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#64748b]">
              Active Stays
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-[#0284c7] flex items-center justify-center">
              <Sparkles className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-[26px] font-semibold tabular-nums leading-none text-slate-800">
              {stats.activeStays}
            </div>
            <ArrowRight className="w-[18px] h-[18px] text-[#64748b]" />
          </div>
        </div>
      </div>

      {/* ── Category Occupancy & Visual Capacity ── */}
      <div className="bg-white rounded-[12px] p-5 border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#00a651] flex items-center justify-center">
              <Building2 className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
                Hostel Category Distribution
              </h3>
              <p className="text-[13px] font-normal text-[#64748b]">
                Capacity and occupancy breakdown by employee category
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('bootcamps')}
            className="text-[13px] font-medium text-[#00a651] hover:text-[#008c44] flex items-center gap-1 transition"
          >
            <span>View 3D Rooms</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Junior Category Card */}
          <div className="p-4 rounded-[10px] border border-[#e5e9f0] bg-slate-50/50 hover:border-emerald-400/80 hover:bg-white transition duration-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[12px] font-medium text-emerald-800 uppercase tracking-[0.04em] block">
                Junior Accommodation
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-semibold tabular-nums leading-none text-slate-800">
                  {stats.juniorOccupied}
                </span>
                <span className="text-[13px] font-normal text-[#64748b]">
                  / {stats.juniorCapacity} beds
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#00a651] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(juniorPct, 100))}%` }}
              />
            </div>
          </div>

          {/* Senior Category Card */}
          <div className="p-4 rounded-[10px] border border-[#e5e9f0] bg-slate-50/50 hover:border-emerald-400/80 hover:bg-white transition duration-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[12px] font-medium text-[#0284c7] uppercase tracking-[0.04em] block">
                Senior Residence
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-semibold tabular-nums leading-none text-slate-800">
                  {stats.seniorOccupied}
                </span>
                <span className="text-[13px] font-normal text-[#64748b]">
                  / {stats.seniorCapacity} portions
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#0284c7] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(seniorPct, 100))}%` }}
              />
            </div>
          </div>

          {/* VIP Category Card */}
          <div className="p-4 rounded-[10px] border border-[#e5e9f0] bg-slate-50/50 hover:border-emerald-400/80 hover:bg-white transition duration-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[12px] font-medium text-purple-800 uppercase tracking-[0.04em] block">
                VIP Executive Villas
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[22px] font-semibold tabular-nums leading-none text-slate-800">
                  {stats.vipOccupied}
                </span>
                <span className="text-[13px] font-normal text-[#64748b]">
                  / {stats.vipCapacity} villas
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(vipPct, 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Checkout Notifications & Live Actionable Alerts ── */}
      <div className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-semibold">
              <ShieldAlert className="w-[18px] h-[18px]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-slate-900 leading-tight">
                Hostel Checkout Notifications &amp; Stay Monitoring
              </h3>
              <p className="text-[13px] font-normal text-[#64748b] mt-0.5">
                Active alerts for overdue stays, departures due today, and upcoming checkouts.
              </p>
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-[8px] border border-[#e5e9f0] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Alerts'}</span>
          </button>
        </div>

        {/* 3 Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-rose-200 rounded-[12px] p-4 flex items-center gap-3.5 hover:border-rose-400 hover:shadow-[0_2px_12px_rgba(244,63,94,0.08)] transition duration-200">
            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <ShieldAlert className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="text-[26px] font-semibold tabular-nums leading-none text-rose-600">
                {notificationData?.summary?.overdueCount ?? 0}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-rose-700 mt-1">
                Overdue Checkouts
              </div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-[12px] p-4 flex items-center gap-3.5 hover:border-amber-400 hover:shadow-[0_2px_12px_rgba(245,158,11,0.08)] transition duration-200">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="text-[26px] font-semibold tabular-nums leading-none text-amber-600">
                {notificationData?.summary?.dueTodayCount ?? 0}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-amber-700 mt-1">
                Due Today
              </div>
            </div>
          </div>

          <div className="bg-white border border-emerald-200 rounded-[12px] p-4 flex items-center gap-3.5 hover:border-emerald-400 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200">
            <div className="w-8 h-8 bg-emerald-50 text-[#00a651] rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <div>
              <div className="text-[26px] font-semibold tabular-nums leading-none text-[#00a651]">
                {notificationData?.summary?.upcomingCount ?? 0}
              </div>
              <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#00a651] mt-1">
                Upcoming (2 Days)
              </div>
            </div>
          </div>
        </div>

        {/* Live Actionable Alerts Feed */}
        <div className="bg-white rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e5e9f0] bg-slate-50/60 flex items-center justify-between">
            <span className="text-[12px] font-medium text-slate-700 uppercase tracking-[0.04em]">
              Live Actionable Alerts ({notificationData?.alerts?.length || 0})
            </span>
            <button
              onClick={() => onNavigate('allotments')}
              className="text-[13px] font-medium text-[#00a651] hover:underline flex items-center gap-1"
            >
              <span>Go to Allotments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[#64748b] text-[13px]">Evaluating active stays...</div>
          ) : !notificationData || notificationData.alerts.length === 0 ? (
            <div className="p-8 text-center text-[#64748b] text-[13px] flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-[#00a651]" />
              <span className="font-medium text-slate-800 text-[14px]">All active allotments are within schedule</span>
              <span className="text-[#64748b]">No overdue, due today, or urgent departure alerts pending.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e9f0] text-[14px]">
              {notificationData.alerts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === NotificationType.OVERDUE && (
                        <span className="p-1 rounded-full bg-rose-100 text-rose-700 inline-block">
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {item.type === NotificationType.DUE_TODAY && (
                        <span className="p-1 rounded-full bg-amber-100 text-amber-700 inline-block">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </span>
                      )}
                      {item.type === NotificationType.UPCOMING && (
                        <span className="p-1 rounded-full bg-[#ecfdf5] text-[#00a651] inline-block">
                          <Clock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-[14px]">
                          {item.employee?.name}
                        </span>
                        <span className="font-mono text-[13px] text-[#64748b]">
                          ({item.employee?.employeeId})
                        </span>
                        <span className="text-[11px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.employee?.category}
                        </span>
                      </div>

                      <div className="text-[13px] text-[#64748b] mt-0.5">
                        Assigned to <strong className="text-slate-700 font-mono font-medium">{formatUnitCode(item.unit?.unitCode)}</strong> &bull; {item.bootcamp?.name}
                      </div>

                      <div className="text-[12px] text-[#64748b] mt-0.5">
                        Departure Date: {formatDate(item.checkoutDate || item.expectedCheckoutDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.type === NotificationType.OVERDUE && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        Overdue by {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'}
                      </span>
                    )}
                    {item.type === NotificationType.DUE_TODAY && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Due Today
                      </span>
                    )}
                    {item.type === NotificationType.UPCOMING && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
                        {item.daysRemaining} {item.daysRemaining === 1 ? 'day' : 'days'} remaining
                      </span>
                    )}

                    <button
                      onClick={() => onNavigate('allotments')}
                      className="px-2.5 py-1 text-[13px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition"
                    >
                      View in Registry
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
