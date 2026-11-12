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
      <div>
        <h2 className="text-xl font-bold text-slate-900">Checkout Notifications & Alerts</h2>
        <p className="text-sm text-slate-500">
          Computed from active stays in real-time. Overdue status does NOT auto-release allocation units.
        </p>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-900">
              {data?.summary?.overdueCount ?? 0}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
              Overdue Checkouts
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-600 text-white rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-900">
              {data?.summary?.dueTodayCount ?? 0}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Due Today
            </div>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-sky-600 text-white rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-sky-900">
              {data?.summary?.upcomingCount ?? 0}
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              Upcoming (2 Days)
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-500" />
            Active Alert Stream
          </div>
          <button
            onClick={fetchNotifications}
            className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Evaluating active stays...</div>
        ) : !data || data.alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            All active allotments are within normal schedule. No checkout alerts pending.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.alerts.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition ${
                  item.type === NotificationType.OVERDUE
                    ? 'bg-rose-50/40 hover:bg-rose-50/70'
                    : item.type === NotificationType.DUE_TODAY
                    ? 'bg-amber-50/40 hover:bg-amber-50/70'
                    : 'bg-white hover:bg-slate-50'
                }`}
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
                      <span className="p-1.5 rounded-full bg-sky-100 text-sky-700 inline-block">
                        <Clock className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {item.employee?.name}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        ({item.employee?.employeeId})
                      </span>
                      <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.employee?.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 mt-1">
                      Assigned to <strong>{item.unit?.unitCode}</strong> &bull; {item.bootcamp?.name}
                    </div>

                    <div className="text-xs text-slate-400 mt-0.5">
                      Expected Departure: {formatDate(item.expectedCheckoutDate)}
                    </div>
                  </div>
                </div>

                <div>
                  {item.type === NotificationType.OVERDUE && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      Overdue by {item.daysOverdue} {item.daysOverdue === 1 ? 'day' : 'days'}
                    </span>
                  )}
                  {item.type === NotificationType.DUE_TODAY && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      Checkout Due Today
                    </span>
                  )}
                  {item.type === NotificationType.UPCOMING && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
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
