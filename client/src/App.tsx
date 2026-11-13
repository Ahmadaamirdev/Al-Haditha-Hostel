import React, { useState } from 'react';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginForm } from './features/auth/LoginForm';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { AllotmentList } from './features/allotments/AllotmentList';
import { BootcampList } from './features/bootcamps/BootcampList';
import { EmployeeList } from './features/employees/EmployeeList';
import { Menu } from 'lucide-react';
import logoImg from './assets/logo.png';
import { NotificationPanel } from './features/notifications/NotificationPanel';
import { RecordsList } from './features/records/RecordsList';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a192f] text-white text-[14px]">
        Initializing Al Haditha Management System...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="h-screen bg-[#f3f6f9] flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Top App Bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a192f] border-b border-slate-800 text-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="bg-white rounded px-2 py-0.5">
            <img src={logoImg} alt="Al Haditha" className="h-6 w-auto object-contain" />
          </div>
        </div>
        <span className="text-[13px] font-medium text-slate-300 capitalize">
          {currentTab}
        </span>
      </div>

      {/* Dark Sidebar with Mobile Slide-over Drawer */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {currentTab === 'dashboard' && <Header />}

        <main className={`flex-1 px-4 sm:px-6 pb-6 ${currentTab === 'dashboard' ? 'pt-2' : 'pt-4 sm:pt-6'}`}>
          {currentTab === 'dashboard' && <DashboardOverview onNavigate={setCurrentTab} />}
          {currentTab === 'employees' && <EmployeeList />}
          {currentTab === 'allotments' && <AllotmentList />}
          {currentTab === 'records' && <RecordsList />}
          {currentTab === 'bootcamps' && <BootcampList />}
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
