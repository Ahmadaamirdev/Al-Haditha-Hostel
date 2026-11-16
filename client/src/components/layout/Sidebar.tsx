import React, { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { apiRequest } from '../../services/apiClient';
import { subscribeToMutation } from '../../services/eventBus';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  FileText,
  Bell,
  LogOut,
  X,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const { logout } = useAuth();
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(0);

  const fetchAlertsCount = async () => {
    try {
      const res = await apiRequest<{ summary: { upcomingCount: number; dueTodayCount: number; overdueCount: number } }>('/notifications');
      const total = (res?.summary?.overdueCount || 0) + (res?.summary?.dueTodayCount || 0) + (res?.summary?.upcomingCount || 0);
      setUnreadAlertsCount(total);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchAlertsCount();
    const unsubscribe = subscribeToMutation('notifications', () => {
      fetchAlertsCount();
    });
    return () => unsubscribe();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'allotments', label: 'Allotments', icon: CalendarCheck2 },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'bootcamps', label: 'Bootcamps', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadAlertsCount },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-56 bg-[#0a192f] text-slate-300 flex flex-col justify-between shrink-0 h-screen border-r border-slate-800/80 transition-transform duration-200 ease-in-out
          md:sticky md:top-0 md:h-screen md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Brand Logo Container + Mobile Close Button */}
          <div className="p-4 flex items-center justify-between shrink-0">
            <div className="bg-white rounded-[12px] p-3 flex items-center justify-center border border-[#e5e9f0] flex-1">
              <img
                src={logoImg}
                alt="Al Haditha Energy Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
            {mobileOpen && (
              <button
                onClick={onCloseMobile}
                className="md:hidden ml-2 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="px-3 space-y-1 mt-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }}
                  className={`w-full h-10 flex items-center justify-between px-3.5 rounded-[10px] text-[14px] font-medium transition duration-150 ${
                    isActive
                      ? 'bg-[#00a651] text-white font-medium'
                      : 'text-slate-400 hover:text-white hover:bg-[#132844]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      isActive ? 'bg-white text-[#00a651]' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            onClick={logout}
            className="w-full h-10 flex items-center gap-2.5 px-3.5 text-[14px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-[10px] transition duration-150"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
