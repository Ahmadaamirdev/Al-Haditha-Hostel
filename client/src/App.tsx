import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { Navbar } from './components/layout/Navbar';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { AllotmentList } from './features/allotments/AllotmentList';
import { BootcampList } from './features/bootcamps/BootcampList';
import { EmployeeList } from './features/employees/EmployeeList';
import { NotificationPanel } from './features/notifications/NotificationPanel';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-sm">
        Initializing Al Haditha Management System...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && <DashboardOverview onNavigate={setCurrentTab} />}
        {currentTab === 'allotments' && <AllotmentList />}
        {currentTab === 'bootcamps' && <BootcampList />}
        {currentTab === 'employees' && <EmployeeList />}
        {currentTab === 'notifications' && <NotificationPanel />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
