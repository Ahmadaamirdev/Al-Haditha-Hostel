import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  Bell,
  LogOut,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'allotments', label: 'Allotments', icon: CalendarCheck2 },
    { id: 'bootcamps', label: 'Bootcamps', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-[#0a192f] text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800/80">
      <div>
        {/* Brand Logo Container matching the Al Haditha Energy card */}
        <div className="p-6">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-center shadow-md border border-slate-200/50">
            <img
              src={logoImg}
              alt="Al Haditha Energy Logo"
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 space-y-2 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? 'bg-[#00a651] text-white shadow-lg shadow-[#00a651]/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#132844]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom of sidebar matching the UI screenshot */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition duration-150"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

