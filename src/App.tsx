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

      {/* Expanded footer, in the style of a university footer, with RedLife's own wording.
          University details below are the public campus facts (address, hotline, email,
          programme names) — no university logo, slogan or copyright line is copied. */}
      <footer className="border-t-2 border-[#F59E0B] bg-[#0F5A3A] backdrop-blur-md py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 text-left">
            <div>
              <div className="flex items-center space-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1E1E] text-white">
                  <Droplet className="h-6 w-6 fill-white" />
                </div>
                <div className="leading-none">
                  <span className="font-display text-lg font-extrabold text-white">RedLife <span className="text-[#FBBF24]">Univ</span></span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100">Campus Donor Network</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-emerald-100">
                A campus blood donor network for Trust University, Barishal students and faculty. Find donors, request blood in emergencies, and keep verified profiles ready.
              </p>
              <p className="mt-3 text-xs font-semibold text-[#FBBF24]">Every Drop Saves a Life</p>
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-white">Quick Links</h3>
              <div className="mt-2 h-1 w-10 bg-[#F59E0B]" />
              <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                <li><button onClick={() => setCurrentTab('search')} className="hover:text-white hover:underline cursor-pointer">Find Donors</button></li>
                <li><button onClick={() => setCurrentTab('requests')} className="hover:text-white hover:underline cursor-pointer">Emergency Requests</button></li>
                <li><button onClick={() => setCurrentTab('guidelines')} className="hover:text-white hover:underline cursor-pointer">Donation Info</button></li>
                <li><button onClick={() => { setAuthModalView('register'); setAuthModalOpen(true); }} className="hover:text-white hover:underline cursor-pointer">Become a Donor</button></li>
                <li><button onClick={() => setCurrentTab('search')} className="hover:text-white hover:underline cursor-pointer">Campus Donor Network</button></li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-white">Academic Programs</h3>
              <div className="mt-2 h-1 w-10 bg-[#F59E0B]" />
              <ul className="mt-4 space-y-2 text-sm text-emerald-100">
                <li>B.Sc. in Computer Science &amp; Engineering</li>
                <li>B.Sc. in Electrical and Electronic Engineering</li>
                <li>B.Sc. in Biochemistry &amp; Molecular Biology</li>
                <li>Bachelor of Business Administration (BBA)</li>
                <li>MBA &amp; EMBA</li>
                <li>B.A. (Honours) in English</li>
                <li>M.A. in English</li>
                <li>BSS (Hons.) in Economics and Banking</li>
                <li>M.Sc. in Biochemistry &amp; Biotechnology</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-white">Campus &amp; Contact</h3>
              <div className="mt-2 h-1 w-10 bg-[#F59E0B]" />
              <div className="mt-4 space-y-3 text-sm text-emerald-100">
                <p><span className="block text-xs font-bold uppercase tracking-wider text-[#FBBF24]">Campus Address</span>Ruiya, Nabogram Road, Barishal</p>
                <p><span className="block text-xs font-bold uppercase tracking-wider text-[#FBBF24]">Admission Hotline</span>+01844902012, +01844902013</p>
                <p><span className="block text-xs font-bold uppercase tracking-wider text-[#FBBF24]">Official Email</span>info@trustuniversity.edu.bd</p>
                <a href="https://www.trustuniversity.edu.bd/" target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-[#F59E0B] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#0B132B] hover:bg-[#FBBF24]">
                  Visit Trust University Website
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-white/20 pt-6 text-xs text-emerald-100">
            <p>&copy; 2026 RedLife Univ &bull; Campus Donor Network for Trust University, Barishal</p>
            <p className="font-semibold text-white">Trust University, Barishal &bull; Ruiya, Nabogram Road, Barishal</p>
          </div>
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
