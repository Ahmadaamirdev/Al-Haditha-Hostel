import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f] text-white text-sm">
        Initializing Al Haditha Management System...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] flex">
      {/* Dark Sidebar matching Al Haditha style */}
      <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <main className="flex-1 px-4 lg:px-6 pb-8">
          {currentTab === 'dashboard' && <DashboardOverview onNavigate={setCurrentTab} />}
          {currentTab === 'allotments' && <AllotmentList />}
          {currentTab === 'bootcamps' && <BootcampList />}
          {currentTab === 'employees' && <EmployeeList />}
          {currentTab === 'notifications' && <NotificationPanel />}
        </main>
      </div>
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
