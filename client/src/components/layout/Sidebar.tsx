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
    <aside className="w-56 bg-[#0a192f] text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800/80">
      <div>
        {/* Brand Logo Container matching the Al Haditha Energy card */}
        <div className="p-4">
          <div className="bg-white rounded-xl p-3 flex items-center justify-center shadow-md border border-slate-200/50">
            <img
              src={logoImg}
              alt="Al Haditha Energy Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1.5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition duration-150 ${
                  isActive
                    ? 'bg-[#00a651] text-white shadow-md shadow-[#00a651]/20 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[#132844]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout button at bottom of sidebar matching the UI screenshot */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

