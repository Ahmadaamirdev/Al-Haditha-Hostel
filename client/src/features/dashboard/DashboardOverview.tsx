import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { subscribeToMutation } from '../../services/eventBus';
import {
  Users,
  BedDouble,
  Building2,
  ShieldAlert,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  LogOut,
  CalendarCheck2,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../../types';
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

  const [activeFilter, setActiveFilter] = useState<'ALL' | NotificationType>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Action Modal states for immediate resolution right from the dashboard
  const [selectedAlert, setSelectedAlert] = useState<NotificationItem | null>(null);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
  const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
  const [actionDate, setActionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDuration, setNewDuration] = useState(7);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDashboardData = async (opts: { skipCache?: boolean } = {}) => {
    try {
      const [statsData, notifications] = await Promise.all([
        apiRequest<any>('/stats', { skipCache: opts.skipCache }),
        apiRequest<{
          summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
          alerts: NotificationItem[];
        }>('/notifications', { skipCache: opts.skipCache }),
      ]);

      setStats({
        totalEmployees: statsData.employees.total,
        vipCount: statsData.employees.VIP,
        seniorCount: statsData.employees.SENIOR,
        juniorCount: statsData.employees.JUNIOR,
        seniorOccupied: statsData.bootcamps.byCategory?.SENIOR?.occupied || 0,
        seniorCapacity: statsData.bootcamps.byCategory?.SENIOR?.capacity || 0,
        juniorOccupied: statsData.bootcamps.byCategory?.JUNIOR?.occupied || 0,
        juniorCapacity: statsData.bootcamps.byCategory?.JUNIOR?.capacity || 0,
        vipOccupied: statsData.bootcamps.byCategory?.VIP?.occupied || 0,
        vipCapacity: statsData.bootcamps.byCategory?.VIP?.capacity || 0,
        totalBootcamps: statsData.bootcamps.total,
        totalCapacity: statsData.bootcamps.totalCapacity,
        occupiedUnits: statsData.bootcamps.occupiedUnits,
        availableUnits: statsData.bootcamps.availableUnits,
        activeStays: statsData.activeStays,
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

    // Event-driven update: refresh stats only when a mutation occurs
    const unsubscribeAllotments = subscribeToMutation('allotments', () => {
      loadDashboardData({ skipCache: true });
    });
    const unsubscribeEmployees = subscribeToMutation('employees', () => {
      loadDashboardData({ skipCache: true });
    });
    const unsubscribeBootcamps = subscribeToMutation('bootcamps', () => {
      loadDashboardData({ skipCache: true });
    });
    const unsubscribeNotifications = subscribeToMutation('notifications', () => {
      loadDashboardData({ skipCache: true });
    });

    return () => {
      unsubscribeAllotments();
      unsubscribeEmployees();
      unsubscribeBootcamps();
      unsubscribeNotifications();
    };
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadDashboardData({ skipCache: true });
  };

  const handleOpenCheckout = (item: NotificationItem) => {
    setSelectedAlert(item);
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionError(null);
    setIsCheckOutModalOpen(true);
  };

  const handleOpenExtend = (item: NotificationItem) => {
    setSelectedAlert(item);
    setNewDuration(14);
    setActionError(null);
    setIsDurationModalOpen(true);
  };

  const handleConfirmCheckOut = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiRequest(`/allotments/${selectedAlert.allotmentId}/check-out`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualCheckoutDate: new Date(actionDate).toISOString(),
        }),
      });
      setIsCheckOutModalOpen(false);
      loadDashboardData({ skipCache: true });
    } catch (err: any) {
      setActionError(err.message || 'Checkout failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmExtend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiRequest(`/allotments/${selectedAlert.allotmentId}/duration`, {
        method: 'PATCH',
        body: JSON.stringify({
          plannedStayDuration: Number(newDuration),
        }),
      });
      setIsDurationModalOpen(false);
      loadDashboardData({ skipCache: true });
    } catch (err: any) {
      setActionError(err.message || 'Failed to extend stay');
    } finally {
      setActionLoading(false);
    }
  };

  const juniorPct = stats.juniorCapacity > 0 ? Math.round((stats.juniorOccupied / stats.juniorCapacity) * 100) : 0;
  const seniorPct = stats.seniorCapacity > 0 ? Math.round((stats.seniorOccupied / stats.seniorCapacity) * 100) : 0;
  const vipPct = stats.vipCapacity > 0 ? Math.round((stats.vipOccupied / stats.vipCapacity) * 100) : 0;

  const displayedAlerts = (notificationData?.alerts || []).filter((item) => {
    if (activeFilter === 'ALL') return true;
    return item.type === activeFilter;
  });

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
              <CalendarCheck2 className="w-[18px] h-[18px]" />
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

            <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 border-t border-slate-200/60">
              <span>{juniorPct}% Occupancy</span>
              <span>{stats.juniorCapacity - stats.juniorOccupied} Beds Free</span>
            </div>
          </div>

          {/* Senior Category Card */}
          <div className="p-4 rounded-[10px] border border-[#e5e9f0] bg-slate-50/50 hover:border-sky-400/80 hover:bg-white transition duration-200 flex flex-col justify-between gap-3">
            <div>
              <span className="text-[12px] font-medium text-sky-800 uppercase tracking-[0.04em] block">
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

            <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 border-t border-slate-200/60">
              <span>{seniorPct}% Occupancy</span>
              <span>{stats.seniorCapacity - stats.seniorOccupied} Portions Free</span>
            </div>
          </div>

          {/* VIP Category Card */}
          <div className="p-4 rounded-[10px] border border-[#e5e9f0] bg-slate-50/50 hover:border-purple-400/80 hover:bg-white transition duration-200 flex flex-col justify-between gap-3">
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

            <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-1 border-t border-slate-200/60">
              <span>{vipPct}% Occupancy</span>
              <span>{stats.vipCapacity - stats.vipOccupied} Villas Free</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comprehensive Notifications & Stay Monitoring Module ── */}
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-700 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-[8px] border border-[#e5e9f0] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh Alerts'}</span>
            </button>
          </div>
        </div>

        {/* 3 Interactive Metric Filter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Overdue Card */}
          <div
            onClick={() => setActiveFilter(activeFilter === NotificationType.OVERDUE ? 'ALL' : NotificationType.OVERDUE)}
            className={`bg-white border rounded-[12px] p-4 flex items-center gap-3.5 cursor-pointer transition duration-200 ${
              activeFilter === NotificationType.OVERDUE
                ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                : 'border-rose-200 hover:border-rose-400 hover:shadow-[0_2px_12px_rgba(244,63,94,0.08)]'
            }`}
          >
            <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0">
              <ShieldAlert className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="text-[26px] font-semibold tabular-nums leading-none text-rose-600">
                  {notificationData?.summary?.overdueCount ?? 0}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-rose-700 mt-1">
                  Overdue Checkouts
                </div>
              </div>
              {activeFilter === NotificationType.OVERDUE && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  Filtered
                </span>
              )}
            </div>
          </div>

          {/* Due Today Card */}
          <div
            onClick={() => setActiveFilter(activeFilter === NotificationType.DUE_TODAY ? 'ALL' : NotificationType.DUE_TODAY)}
            className={`bg-white border rounded-[12px] p-4 flex items-center gap-3.5 cursor-pointer transition duration-200 ${
              activeFilter === NotificationType.DUE_TODAY
                ? 'border-amber-500 ring-2 ring-amber-200 bg-amber-50/20'
                : 'border-amber-200 hover:border-amber-400 hover:shadow-[0_2px_12px_rgba(245,158,11,0.08)]'
            }`}
          >
            <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertCircle className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="text-[26px] font-semibold tabular-nums leading-none text-amber-600">
                  {notificationData?.summary?.dueTodayCount ?? 0}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-amber-700 mt-1">
                  Due Today
                </div>
              </div>
              {activeFilter === NotificationType.DUE_TODAY && (
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Filtered
                </span>
              )}
            </div>
          </div>

          {/* Upcoming Card */}
          <div
            onClick={() => setActiveFilter(activeFilter === NotificationType.UPCOMING ? 'ALL' : NotificationType.UPCOMING)}
            className={`bg-white border rounded-[12px] p-4 flex items-center gap-3.5 cursor-pointer transition duration-200 ${
              activeFilter === NotificationType.UPCOMING
                ? 'border-[#00a651] ring-2 ring-emerald-200 bg-emerald-50/20'
                : 'border-emerald-200 hover:border-emerald-400 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)]'
            }`}
          >
            <div className="w-8 h-8 bg-emerald-50 text-[#00a651] rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-[18px] h-[18px]" />
            </div>
            <div className="flex-1 flex items-center justify-between">
              <div>
                <div className="text-[26px] font-semibold tabular-nums leading-none text-[#00a651]">
                  {notificationData?.summary?.upcomingCount ?? 0}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#00a651] mt-1">
                  Upcoming (2 Days)
                </div>
              </div>
              {activeFilter === NotificationType.UPCOMING && (
                <span className="text-[11px] font-semibold text-[#00a651] bg-[#ecfdf5] px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                  Filtered
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Live Actionable Alerts Feed */}
        <div className="bg-white rounded-[12px] border border-[#e5e9f0] hover:border-emerald-400/80 hover:shadow-[0_2px_12px_rgba(0,166,81,0.08)] transition duration-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-[#e5e9f0] bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-slate-700 uppercase tracking-[0.04em]">
                Live Actionable Alerts ({displayedAlerts.length})
              </span>
              {activeFilter !== 'ALL' && (
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-800 underline ml-2"
                >
                  Show All ({notificationData?.alerts?.length || 0})
                </button>
              )}
            </div>
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
          ) : displayedAlerts.length === 0 ? (
            <div className="p-8 text-center text-[#64748b] text-[13px] flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-7 h-7 text-[#00a651]" />
              <span className="font-medium text-slate-800 text-[14px]">
                {activeFilter === 'ALL'
                  ? 'All active allotments are within schedule'
                  : `No ${activeFilter.toLowerCase().replace('_', ' ')} alerts found`}
              </span>
              <span className="text-[#64748b]">No active checkout warnings pending resolution.</span>
            </div>
          ) : (
            <div className="divide-y divide-[#e5e9f0] text-[14px]">
              {displayedAlerts.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        Departure Date: <strong className="text-slate-700">{formatDate(item.checkoutDate || item.expectedCheckoutDate)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {item.type === NotificationType.OVERDUE && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                        Overdue by {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'}
                      </span>
                    )}
                    {item.type === NotificationType.DUE_TODAY && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        Due Today
                      </span>
                    )}
                    {item.type === NotificationType.UPCOMING && (
                      <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0] whitespace-nowrap">
                        {item.daysRemaining} {item.daysRemaining === 1 ? 'day' : 'days'} remaining
                      </span>
                    )}

                    {/* Direct In-Place Action Buttons right on Dashboard */}
                    <button
                      onClick={() => handleOpenCheckout(item)}
                      className="px-2.5 py-1 text-[12px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-[6px] transition flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Check-Out</span>
                    </button>
                    <button
                      onClick={() => handleOpenExtend(item)}
                      className="px-2.5 py-1 text-[12px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-[6px] transition"
                    >
                      Extend Stay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Direct Check-Out from Dashboard */}
      {isCheckOutModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Confirm Physical Check-Out</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Confirming checkout for <strong>{selectedAlert.employee?.name}</strong> will release unit{' '}
              <strong className="font-mono">{formatUnitCode(selectedAlert.unit?.unitCode)}</strong> immediately.
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
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-[8px] text-[13px] font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Confirm Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Direct Duration Extension from Dashboard */}
      {isDurationModalOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[12px] shadow-2xl max-w-md w-full p-6 border border-[#e5e9f0]">
            <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Adjust Planned Stay Duration</h3>
            <p className="text-[13px] font-normal text-[#64748b] mb-4">
              Extend stay duration for <strong>{selectedAlert.employee?.name}</strong>. Departure date will be automatically recalculated.
            </p>

            {actionError && (
              <div className="mb-4 p-3 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[13px]">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmExtend} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-slate-700 mb-1">
                  New Total Duration (Days) *
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
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#00a651] hover:bg-[#008c44] text-white rounded-[8px] text-[13px] font-medium disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
