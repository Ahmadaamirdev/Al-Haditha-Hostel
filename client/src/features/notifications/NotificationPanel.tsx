import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { subscribeToMutation } from '../../services/eventBus';
import { NotificationItem, NotificationType } from '../../types';
import { formatDate, formatUnitCode } from '../../utils';
import { Bell, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

export const NotificationPanel: React.FC = () => {
  const [data, setData] = useState<{
    summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
    alerts: NotificationItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{
        summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number };
        alerts: NotificationItem[];
      }>('/notifications');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = subscribeToMutation('notifications', () => {
      fetchNotifications();
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-[12px] p-5 border border-[#e5e9f0] shadow-none flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-semibold">
            <Bell className="w-[18px] h-[18px]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900 leading-tight">
              Hostel Checkout Notifications
            </h2>
            <p className="text-[13px] font-normal text-[#64748b] mt-0.5">
              Overdue, Due Today, and Upcoming (2 days) checkout monitors.
            </p>
          </div>
        </div>

        <button
          onClick={fetchNotifications}
          className="text-[13px] font-medium text-[#00a651] hover:text-[#008c44] bg-[#ecfdf5] px-3 py-1.5 rounded-[8px] border border-[#a7f3d0] transition"
        >
          Refresh Feed
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-rose-200 rounded-[12px] p-4 flex items-center gap-3.5 shadow-none">
          <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
            <ShieldAlert className="w-[18px] h-[18px]" />
          </div>
          <div>
            <div className="text-[26px] font-semibold tabular-nums leading-none text-rose-600">
              {data?.summary?.overdueCount ?? 0}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-rose-700 mt-1">
              Overdue Checkouts
            </div>
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-[12px] p-4 flex items-center gap-3.5 shadow-none">
          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-[18px] h-[18px]" />
          </div>
          <div>
            <div className="text-[26px] font-semibold tabular-nums leading-none text-amber-600">
              {data?.summary?.dueTodayCount ?? 0}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-amber-700 mt-1">
              Due Today
            </div>
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-[12px] p-4 flex items-center gap-3.5 shadow-none">
          <div className="w-8 h-8 bg-emerald-50 text-[#00a651] rounded-lg flex items-center justify-center">
            <Clock className="w-[18px] h-[18px]" />
          </div>
          <div>
            <div className="text-[26px] font-semibold tabular-nums leading-none text-[#00a651]">
              {data?.summary?.upcomingCount ?? 0}
            </div>
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#00a651] mt-1">
              Upcoming (2 Days)
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white rounded-[12px] border border-[#e5e9f0] shadow-none overflow-hidden">
        <div className="p-4 border-b border-[#e5e9f0] bg-slate-50/60 text-[12px] font-medium text-slate-700 uppercase tracking-[0.04em]">
          Live Actionable Alerts
        </div>

        {loading ? (
          <div className="p-8 text-center text-[#64748b] text-[13px]">Evaluating active stays...</div>
        ) : !data || data.alerts.length === 0 ? (
          <div className="p-8 text-center text-[#64748b] text-[13px]">
            All active allotments are within normal schedule. No checkout alerts pending.
          </div>
        ) : (
          <div className="divide-y divide-[#e5e9f0] text-[14px]">
            {data.alerts.map((item, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition"
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
                      <span className="font-medium text-slate-900 text-[14px]">
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

                <div>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
