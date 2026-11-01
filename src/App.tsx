import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import DonorSearch from './components/DonorSearch';
import EmergencyRequests from './components/EmergencyRequests';
import DonorDashboard from './components/DonorDashboard';
import AdminDashboard from './components/AdminDashboard';
import InfoSection from './components/InfoSection';
import AuthModal from './components/AuthModal';
import RequestBloodModal from './components/RequestBloodModal';
import { api, setAuthToken } from './lib/api';
import { User, BloodRequest, DonorStats } from './types';
import { ShieldCheck, Heart, AlertCircle, Droplet, Sparkles, LogIn, Users } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('blood_net_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    localStorage.setItem('blood_net_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('premium-dark', 'dark');
    } else {
      root.classList.remove('premium-dark', 'dark');
    }
  }, [theme]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [donors, setDonors] = useState<User[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [stats, setStats] = useState<DonorStats>({
    totalDonors: 0,
    availableDonors: 0,
    emergencyRequests: 0,
    livesSaved: 0
  });

  // Navigation and UI state managers
  const [currentTab, setCurrentTab] = useState<string>('search');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [requestBloodModalOpen, setRequestBloodModalOpen] = useState<boolean>(false);

  // Load state spinners
  const [isLoadingDonors, setIsLoadingDonors] = useState<boolean>(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isInitializingApp, setIsInitializingApp] = useState<boolean>(true);

  // Fetch initial base components
  useEffect(() => {
    const initialize = async () => {
      setIsInitializingApp(true);
      
      // 1. Authenticate cached profile token first if stored in localStorage
      const token = localStorage.getItem('blood_net_token');
      if (token) {
        setAuthToken(token);
        try {
          const data = await api.getMe();
          setCurrentUser(data.user);
        } catch {
          // Token expired or server was restarted
          setAuthToken('');
          localStorage.removeItem('blood_net_token');
        }
      }

      // 2. Fetch inventory and stats
      await handleFreshLoad();
      setIsInitializingApp(false);
    };

    initialize();
  }, []);

  const handleFreshLoad = async () => {
    await Promise.all([
      fetchStats(),
      fetchDonors({}),
      fetchRequests(),
    ]);
  };

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed fetching core statistics metrics', err);
    }
  };

  const fetchDonors = async (filters: { bloodGroup?: string; location?: string; availableOnly?: boolean }) => {
    setIsLoadingDonors(true);
    try {
      const data = await api.getDonors(filters);
      setDonors(data);
    } catch (err) {
      console.error('Failed querying active blood donors', err);
    } finally {
      setIsLoadingDonors(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed querying active emergency requests', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const handleAuthSuccess = (token: string, user: User) => {
    setAuthToken(token);
    setCurrentUser(user);
    handleFreshLoad();
    
    // Redirect donor user to dashboard automatically on authentication
    if (user.role === 'admin') {
      setCurrentTab('admin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    setCurrentUser(null);
    setCurrentTab('search');
    handleFreshLoad();
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    try {
      const data = await api.updateMe(updates);
      setCurrentUser(data.user);
      await handleFreshLoad(); // Update global donors lists with new values!
    } catch (err) {
      console.error('Failed updating donor profile', err);
      throw err;
    }
  };

  const handleCreateRequest = async (details: Partial<BloodRequest>) => {
    try {
      const newReq = await api.createRequest(details);
      setRequests([newReq, ...requests]);
      await handleFreshLoad();
      setCurrentTab('requests'); // Switch to requests tab to see broadcast
    } catch (err) {
      console.error('Broadcast failed', err);
      throw err;
    }
  };

  const handleUpdateRequestStatus = async (id: string, status: 'pending' | 'fulfilled' | 'cancelled') => {
    try {
      const updatedReq = await api.updateRequestStatus(id, status);
      setRequests(requests.map(r => r.id === id ? updatedReq : r));
      await handleFreshLoad();
    } catch (err) {
      alert('You are not authorized to transition the state of this request detail.');
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await api.deleteRequest(id);
      setRequests(requests.filter(r => r.id !== id));
      await handleFreshLoad();
    } catch (err) {
      alert('Request removal permission denied.');
    }
  };

  // Safe checks and loading states
  if (isInitializingApp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#050816]">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_20px_rgba(255,30,30,0.5)] animate-pulse">
          <Droplet className="h-10 w-10 fill-white animate-heartbeat" />
        </div>
        <span className="mt-4 font-display font-black text-rose-100 tracking-wide uppercase text-xs drop-shadow-[0_0_8px_rgba(255,30,30,0.4)]">
          Loading RedLife Network...
        </span>
      </div>
    );
  }

  // Get current user's requests
  const userRequests = currentUser
    ? requests.filter(r => r.createdBy === currentUser.id)
    : [];

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-main)] flex flex-col justify-between transition-colors duration-500" id="app_root">
      
      {/* Header Section */}
      <Header
        currentUser={currentUser}
        onOpenAuth={(view) => {
          setAuthModalView(view);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenRequestBlood={() => {
          setRequestBloodModalOpen(true);
        }}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main Layout Entry Area */}
      <main className="flex-1 pb-16">
        
        {/* Render HERO only on Search & Dashboard to look visually stunning */}
        {(currentTab === 'search' || currentTab === 'guidelines') && (
          <Hero
            stats={stats}
            currentTab={currentTab}
            setCurrentTab={(tab) => {
              setCurrentTab(tab);
            }}
            onOpenRegister={() => {
              setAuthModalView('register');
              setAuthModalOpen(true);
            }}
            onOpenRequestBlood={() => {
              if (!currentUser) {
                setAuthModalView('login');
                setAuthModalOpen(true);
              } else {
                setRequestBloodModalOpen(true);
              }
            }}
          />
        )}

        {/* Dynamic Content Panel view based on active Nav tabs */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          
          {currentTab === 'search' && (
            <DonorSearch
              donors={donors}
              isLoggedIn={!!currentUser}
              onOpenAuth={(view) => {
                setAuthModalView(view);
                setAuthModalOpen(true);
              }}
              onSearch={fetchDonors}
              isLoading={isLoadingDonors}
            />
          )}

          {currentTab === 'requests' && (
            <EmergencyRequests
              requests={requests}
              currentUser={currentUser}
              onOpenAuth={(view) => {
                setAuthModalView(view);
                setAuthModalOpen(true);
              }}
              onOpenCreateRequest={() => setRequestBloodModalOpen(true)}
              onUpdateRequestStatus={handleUpdateRequestStatus}
              onDeleteRequest={handleDeleteRequest}
            />
          )}

          {currentTab === 'guidelines' && (
            <InfoSection 
              currentUser={currentUser}
              onOpenAuth={(view) => {
                setAuthModalView(view);
                setAuthModalOpen(true);
              }}
            />
          )}

          {currentTab === 'dashboard' && currentUser && (
            <DonorDashboard
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              userRequests={userRequests}
              onOpenCreateRequest={() => setRequestBloodModalOpen(true)}
              onUpdateRequestStatus={handleUpdateRequestStatus}
            />
          )}

          {currentTab === 'admin' && currentUser && currentUser.role === 'admin' && (
            <AdminDashboard
              currentUser={currentUser}
              onRefreshStats={handleFreshLoad}
            />
          )}

        </div>

      </main>

      {/* Modern, Polished Footer */}
      <footer className="border-t border-white/8 bg-[#0B1220]/80 backdrop-blur-md py-8 text-center text-xs font-semibold text-gray-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2">
            <Droplet className="h-4.5 w-4.5 text-[#FF1E1E] fill-[#FF1E1E]" />
            <span className="font-display font-bold text-white tracking-wide">RedLife Network</span>
            <span className="text-gray-600">&bull;</span>
            <span className="text-gray-300">University Campus Network</span>
          </div>
          <p className="text-[11px] font-medium text-gray-500">
            &copy; 2569 - 2026 RedLife Univ Campus Donor Connection System. Built with pure state control handlers.
          </p>
        </div>
      </footer>

      {/* Reusable Core Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        onAuthSuccess={handleAuthSuccess}
        apiRegister={api.register}
        apiLogin={api.login}
      />

      <RequestBloodModal
        isOpen={requestBloodModalOpen}
        onClose={() => setRequestBloodModalOpen(false)}
        onSubmit={handleCreateRequest}
      />

    </div>
  );
}
