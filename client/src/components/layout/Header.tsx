import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';

export const Header: React.FC = () => {
  const { user } = useAuth();

  return (
    <header className="px-6 pt-6 pb-2">
      <p className="text-[13px] font-normal text-[#64748b]">
        Welcome back,
      </p>
      <h1 className="text-[22px] font-semibold text-slate-900 leading-[1.25]">
        {user?.fullName || 'Master Administrator'}
      </h1>
    </header>
  );
};
