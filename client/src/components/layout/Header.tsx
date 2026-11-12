import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { User } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user } = useAuth();
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <header className="px-4 lg:px-6 py-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Welcome Back,
        </p>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {user?.fullName || 'Admin'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 shadow-sm font-medium">
          <span>📅 {todayFormatted}</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#00a651] font-semibold">Live System</span>
        </div>

        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm">
          <User className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </header>
  );
};
