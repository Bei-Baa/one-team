import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { QuickCreateModal } from './components/modals/QuickCreateModal';
import { DashboardPage } from './pages/DashboardPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { StrategyPage } from './pages/StrategyPage';
import { TeamPage } from './pages/TeamPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { FinancePage } from './pages/FinancePage';
import { ClientsPage } from './pages/ClientsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GoalModal } from './components/strategy/GoalModal';
import { PriorityModal } from './components/strategy/PriorityModal';
import { PlanItemModal } from './components/strategy/PlanItemModal';
import { MissionModal } from './components/strategy/MissionModal';
import { VisionModal } from './components/strategy/VisionModal';
import {
  LayoutDashboard,
  KanbanSquare,
  FolderGit2,
  Target,
  Users,
  BarChart3,
  Wallet,
  Building2,
  Settings as SettingsIcon,
  X,
} from 'lucide-react';
import { PageId } from './types';
import { Avatar } from './components/common/Avatar';

const MainLayout: React.FC = () => {
  const { activePage, setActivePage, settings } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navItems: { id: PageId; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
    { id: 'workspace', label: 'Рабочее пространство', icon: KanbanSquare },
    { id: 'projects', label: 'Проекты', icon: FolderGit2 },
    { id: 'strategy', label: 'Стратегия', icon: Target },
    { id: 'team', label: 'Команда', icon: Users },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'finance', label: 'Финансы', icon: Wallet },
    { id: 'clients', label: 'Клиенты', icon: Building2 },
    { id: 'settings', label: 'Настройки', icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-[#F5F7FB] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Desktop Persistent Sidebar (8 sections) */}
      <Sidebar />

      {/* Mobile Drawer Backdrop & Panel */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 bg-[#111827] text-white flex flex-col justify-between p-4 z-10 shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-cyan-400 flex items-center justify-center">
                    <span className="text-white font-extrabold text-sm">A</span>
                  </div>
                  <span className="font-bold text-base tracking-wider text-white">
                    ONE TEAM
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items (8 sections) */}
              <nav className="space-y-1 mt-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* User Profile in mobile drawer */}
            <div
              onClick={() => {
                setActivePage('settings');
                setMobileDrawerOpen(false);
              }}
              className="p-3 bg-slate-800/60 rounded-xl flex items-center gap-3 cursor-pointer mt-4"
            >
              <Avatar
                src={settings.currentUser.avatar}
                name={settings.currentUser.name}
                size="sm"
                showOnlineStatus
                isOnline={true}
              />
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {settings.currentUser.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {settings.currentUser.position}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onMobileMenuToggle={() => setMobileDrawerOpen(true)} />

        {/* Dynamic Page Content Viewport for 9 Pages */}
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {activePage === 'dashboard' && <DashboardPage />}
          {activePage === 'workspace' && <WorkspacePage />}
          {activePage === 'projects' && <ProjectsPage />}
          {activePage === 'strategy' && <StrategyPage />}
          {activePage === 'team' && <TeamPage />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'finance' && <FinancePage />}
          {activePage === 'clients' && <ClientsPage />}
          {activePage === 'settings' && <SettingsPage />}
        </main>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>

      {/* Global Quick Create Modal */}
      <QuickCreateModal />

      {/* Strategy Management Modals */}
      <GoalModal />
      <PriorityModal />
      <PlanItemModal />
      <MissionModal />
      <VisionModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
