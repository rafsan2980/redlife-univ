import React, { useState } from 'react';
import { Droplet, User, LogOut, ShieldAlert, Menu, X, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onOpenAuth: (view: 'login' | 'register') => void;
  onLogout: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenRequestBlood: () => void;
}

export default function Header({
  currentUser,
  onOpenAuth,
  onLogout,
  currentTab,
  setCurrentTab,
  onOpenRequestBlood,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'search', label: 'Find Donors' },
    { id: 'requests', label: 'Emergency Requests' },
    { id: 'guidelines', label: 'Donation Info' },
  ];

  if (currentUser) {
    navItems.push({ id: 'dashboard', label: 'My Dashboard' });
    if (currentUser.role === 'admin') {
      navItems.push({ id: 'admin', label: 'Admin Panel' });
    }
  }

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#F59E0B] bg-[#0F5A3A] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-2.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div 
          className="flex cursor-pointer items-center space-x-1 sm:space-x-2 shrink select-none overflow-visible" 
          onClick={() => handleTabChange('search')}
        >
          {/* Falling Blood Drop Track Container - now in a white box like the nav items,
              with the falling animation kept exactly as before */}
          <div className="hidden min-[390px]:flex relative w-6 sm:w-7 h-9 sm:h-11 items-center justify-center overflow-visible select-none pointer-events-none shrink-0 rounded-lg bg-white shadow-sm border border-white">
            {/* Falling Droplet Element */}
            <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center text-red-600 overflow-visible">
              <svg 
                viewBox="0 0 30 42" 
                className="absolute w-1.5 sm:w-2.5 h-3.5 sm:h-4.5 fill-current text-[#FF1E1E] animate-drop-fall"
                style={{ 
                  transformOrigin: 'bottom center',
                  filter: 'drop-shadow(0 0 8px rgba(255, 30, 30, 0.9))'
                }}
              >
                <path d="M15 3 C15 3 27 19 27 28 C27 34.6 21.6 40 15 40 C8.4 40 3 34.6 3 28 C3 19 15 3 15 3 Z" />
                <path d="M11 23 C10.5 24 10 25.5 10 27 C10 27.6 9.6 28 9 28 C8.4 28 8 27.6 8 27 C8 24.5 9 22.5 10 21 C10.4 20.4 11.2 20.2 11.7 20.7 C12.2 21.2 12 22 11 23 Z" fill="white" opacity="0.95" />
              </svg>
            </div>
            {/* Splash Ripple Ring */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-1 h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-full border border-[#FF1E1E] bg-[#FF1E1E]/45 animate-ripple-splash" />
          </div>

          <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#FF1E1E] text-white shadow-[0_0_15px_rgba(255,30,30,0.5)] shrink-0">
            <Droplet className="h-4.5 w-4.5 sm:h-6 sm:w-6 fill-white animate-heartbeat text-white" />
          </div>
          <div className="leading-none select-none">
            <span className="font-display text-xs min-[350px]:text-sm sm:text-lg md:text-xl font-extrabold tracking-tight text-white">
              RedLife <span className="text-[#FBBF24]">Univ</span>
            </span>
            <p className="hidden text-[10px] font-semibold tracking-wider uppercase text-gray-400 md:block">
              Campus Donor Network
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`rounded-lg border px-4 py-2 font-display text-sm font-semibold transition-all duration-250 bg-white text-[#0F5A3A] ${
                currentTab === item.id
                  ? 'border-[#F59E0B] shadow-sm'
                  : 'border-white hover:border-[#F59E0B]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Action Buttons - night mode toggle removed, site stays in light theme */}
        <div className="hidden items-center space-x-3 md:flex">
          <button
            onClick={onOpenRequestBlood}
            className="flex items-center space-x-1 rounded-lg bg-[#FF1E1E] px-4 py-2 font-display text-xs font-bold uppercase tracking-wider text-white transition-all duration-250 hover:bg-[#ff3c3c] hover:shadow-[0_0_20px_rgba(255,30,30,0.65)] hover:scale-[1.02] shadow-[0_0_12px_rgba(255,30,30,0.35)] cursor-pointer"
          >
            <span>Request Blood</span>
          </button>

          {currentUser ? (
            <div className="flex items-center space-x-3 border-l border-white/40 pl-3">
              <div 
                className="flex cursor-pointer items-center space-x-2 rounded-lg border border-white bg-white py-1 px-2 transition-colors"
                onClick={() => handleTabChange('dashboard')}
              >
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30">
                  <User className="h-4.5 w-4.5" />
                  {currentUser.isVerified && (
                    <span className="absolute -right-0.5 -top-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#050816]" />
                  )}
                </div>
                <div className="text-left leading-none">
                  <p className="max-w-[120px] truncate text-xs font-bold text-[#0F5A3A]">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600 uppercase">
                    {currentUser.bloodGroup} {currentUser.isVerified ? 'Verified' : 'Member'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#FF1E1E]/10 hover:text-[#FF1E1E]"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 border-l border-white/40 pl-3">
              <button
                onClick={() => onOpenAuth('login')}
                className="rounded-lg border border-white bg-white px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#0F5A3A]"
              >
                Log In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="rounded-lg border border-[#F59E0B] bg-[#F59E0B] px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-[#0B132B] transition-all hover:bg-[#FBBF24]"
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button - night mode toggle removed */}
        <div className="flex items-center space-x-1 sm:space-x-2 md:hidden shrink-0">
          <button
            onClick={onOpenRequestBlood}
            className="flex items-center justify-center text-center rounded-xl bg-[#FF1E1E] text-white shadow-[0_0_15px_rgba(255,30,30,0.4)] hover:bg-[#ff3c3c] active:scale-95 transition-all duration-200 font-display text-[9px] min-[365px]:text-[11px] font-extrabold uppercase tracking-tight py-1.5 px-2.5 min-[365px]:px-3.5 shrink-0 select-none cursor-pointer"
            style={{ touchAction: 'manipulation' }}
          >
            <span className="hidden min-[365px]:inline">Request Blood</span>
            <span className="inline min-[365px]:hidden">Request</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-white/5 hover:text-white active:bg-white/10 transition-colors shrink-0"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[#F59E0B] bg-[#0F5A3A] px-4 py-3 shadow-xl md:hidden">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`block w-full rounded-lg border px-4 py-2.5 text-left font-display text-sm font-semibold transition-all bg-white text-[#0F5A3A] ${
                  currentTab === item.id
                    ? 'border-[#F59E0B]'
                    : 'border-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 border-t border-white/8 pt-4">
            {currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30 font-bold">
                    {currentUser.bloodGroup}
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">{currentUser.name}</h3>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 px-4">
                  <button
                    onClick={() => handleTabChange('dashboard')}
                    className="flex items-center justify-center space-x-1 rounded-lg border border-white bg-white py-2 text-xs font-semibold text-[#0F5A3A]"
                  >
                    <span>Dashboard</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center space-x-1 rounded-lg bg-[#FF1E1E]/10 py-2 text-xs font-semibold text-[#FF1E1E] hover:bg-[#FF1E1E]/25"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-4">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('login');
                  }}
                  className="rounded-lg border border-white bg-white py-2.5 text-center font-display text-xs font-bold uppercase tracking-wider text-[#0F5A3A]"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('register');
                  }}
                  className="rounded-lg bg-[#FF1E1E] py-2.5 text-center font-display text-xs font-bold uppercase tracking-wider text-white hover:bg-[#ff3c3c] shadow-[0_0_15px_rgba(255,30,30,0.4)]"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
