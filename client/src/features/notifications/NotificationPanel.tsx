import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/apiClient';
import { NotificationItem, NotificationType } from '../../types';
import { formatDate } from '../../utils';
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
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Hostel Checkout Notifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Overdue, Due Today, and Upcoming (2 days) checkout monitors.
            </p>
          </div>
        </div>

        <button
          onClick={fetchNotifications}
          className="text-xs font-bold text-[#00a651] hover:text-[#008c44] bg-[#ecfdf5] px-3.5 py-1.5 rounded-xl border border-[#a7f3d0] transition"
        >
          Refresh Feed
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-rose-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-rose-600">
              {data?.summary?.overdueCount ?? 0}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Overdue Checkouts
            </div>
          </div>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-amber-600">
              {data?.summary?.dueTodayCount ?? 0}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Due Today
            </div>
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-[#00a651] rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[#00a651]">
              {data?.summary?.upcomingCount ?? 0}
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#00a651]">
              Upcoming (2 Days)
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 text-xs font-bold text-slate-700">
          Live Actionable Alerts
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Evaluating active stays...</div>
        ) : !data || data.alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            All active allotments are within normal schedule. No checkout alerts pending.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {data.alerts.map((item, idx) => (
              <div
                key={idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.type === NotificationType.OVERDUE && (
                      <span className="p-1.5 rounded-full bg-rose-100 text-rose-700 inline-block">
                        <ShieldAlert className="w-4 h-4" />
                      </span>
                    )}
                    {item.type === NotificationType.DUE_TODAY && (
                      <span className="p-1.5 rounded-full bg-amber-100 text-amber-700 inline-block">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    )}
                    {item.type === NotificationType.UPCOMING && (
                      <span className="p-1.5 rounded-full bg-[#ecfdf5] text-[#00a651] inline-block">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {item.employee?.name}
                      </span>
                      <span className="font-mono text-slate-400">
                        ({item.employee?.employeeId})
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.employee?.category}
                      </span>
                    </div>

                    <div className="text-slate-500 mt-1">
                      Assigned to <strong className="text-slate-700">{item.unit?.unitCode}</strong> &bull; {item.bootcamp?.name}
                    </div>

                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Expected Departure: {formatDate(item.expectedCheckoutDate)}
                    </div>
                  </div>
                </div>

                <div>
                  {item.type === NotificationType.OVERDUE && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Overdue by {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'}
                    </span>
                  )}
                  {item.type === NotificationType.DUE_TODAY && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Due Today
                    </span>
                  )}
                  {item.type === NotificationType.UPCOMING && (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#00a651] border border-[#a7f3d0]">
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
