import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Heart, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  X, 
  Filter, 
  RefreshCw, 
  Activity, 
  HelpCircle, 
  Clock, 
  HeartPulse, 
  Copy,
  Award,
  GraduationCap,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { isDonorEligible, getNextEligibleDate, formatEligibleDate } from '../lib/eligibility';
import { User, BloodGroup } from '../types';

interface InfoSectionProps {
  currentUser: User | null;
  onOpenAuth: (view: 'login' | 'register') => void;
}

export default function InfoSection({ currentUser, onOpenAuth }: InfoSectionProps) {
  // Database States
  const [donors, setDonors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Search/Filter States
  const [searchName, setSearchName] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [searchDept, setSearchDept] = useState<string>('');

  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, available, busy, recently_donated, verified

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Load database rows dynamically
  const loadData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const donorsData = await api.getDonors({});
      setDonors(donorsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed fetching university donor directory', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Synchronize periodic status
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    loadData();
  };

  // 3-month rule: a donor is 'recently_donated' (not callable yet) until
  // 3 calendar months have passed since the last donation. First-time
  // donors (no donation yet) count as available.
  const getDonorStatus = (donor: User) => {
    if (donor.isAvailable === false) {
      return 'busy';
    }
    if (!isDonorEligible(donor)) {
      return 'recently_donated';
    }
    return 'available';
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Live query-based real statistics (only past-the-3-month-wait donors count as ready)
  const totalRegisteredCount = donors.length;
  const availableCount = donors.filter(d => getDonorStatus(d) === 'available').length;
  const emergencyReadyCount = donors.filter(d => getDonorStatus(d) === 'available' && d.isVerified).length;
  const uniqueHallsCount = new Set(donors.map(d => d.hall).filter(Boolean)).size;

  // Real-time calculated counts for each blood group across university
  const bloodGroupStats = useMemo(() => {
    const stats: Record<string, { total: number; available: number }> = {};
    bloodGroups.forEach(g => {
      stats[g] = { total: 0, available: 0 };
    });
    
    donors.forEach(d => {
      if (stats[d.bloodGroup]) {
        stats[d.bloodGroup].total++;
        if (d.isAvailable && getDonorStatus(d) === 'available') {
          stats[d.bloodGroup].available++;
        }
      }
    });
    return stats;
  }, [donors]);

  // Final filtering logic
  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      // 1. Search by Name
      if (searchName && !d.name.toLowerCase().includes(searchName.toLowerCase())) {
        return false;
      }
      // 2. Filter by Blood Group
      if (selectedGroup && d.bloodGroup !== selectedGroup) {
        return false;
      }
      // 3. Search by Department
      if (searchDept && !d.department?.toLowerCase().includes(searchDept.toLowerCase())) {
        return false;
      }
      // 4. Filter by Availability Status
      if (selectedStatus !== 'all') {
        const dStatus = getDonorStatus(d);
        if (selectedStatus === 'available' && dStatus !== 'available') return false;
        if (selectedStatus === 'busy' && dStatus !== 'busy') return false;
        if (selectedStatus === 'recently_donated' && dStatus !== 'recently_donated') return false;
        if (selectedStatus === 'verified' && !d.isVerified) return false;
      }
      return true;
    });
  }, [donors, searchName, selectedGroup, searchDept, selectedStatus]);

  // Framer Motion Animation Settings
  const fadeUpContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const fadeUpItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div className="w-full space-y-12 pb-16 text-white" id="university_donor_discovery">
      
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1220] text-white px-6 py-12 md:py-16 shadow-xl border border-white/8">
        
        {/* Glowing Radials & Background Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,30,30,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-[#FF1E1E]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-3.5 py-1 text-xs font-bold text-[#FF1E1E] tracking-wider uppercase"
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span>Campus Volunteer Medical Network</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight"
          >
            University <span className="shining-text font-black text-[#FF1E1E]">Donor Directory</span> & Guidelines
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Connecting student donors across departments and batches. Check live availability and donate blood safely within our campus community.
          </motion.p>

          {/* Real-time counters banner */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-4"
          >
            <div className="inline-grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-[#050816]/70 border border-white/8 backdrop-blur-md rounded-2xl p-5 shadow-inner">
              <div className="text-center">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Registered</span>
                <span className="font-display block text-2xl font-black text-white mt-1">{totalRegisteredCount} Donors</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Ready Now</span>
                <span className="font-display block text-2xl font-black text-emerald-400 mt-1">{availableCount} Ready</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Verified</span>
                <span className="font-display block text-2xl font-black text-sky-400 mt-1">{emergencyReadyCount} Verified</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider">Halls / Units</span>
                <span className="font-display block text-2xl font-black text-[#FF1E1E] mt-1">{uniqueHallsCount || 'Campus'} Active</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 2. LIVE BLOOD AVAILABILITY MATRIX */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="font-display text-base font-black text-white flex items-center gap-2">
              <HeartPulse className="h-4.5 w-4.5 text-[#FF1E1E] animate-pulse" />
              <span>Campus Blood Availability Matrix</span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold">Active campus volunteers sorted by blood group</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{availableCount} Available Students</span>
          </div>
        </div>

        {/* Dynamic Grid representing A+, O+, etc. */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bloodGroups.map(group => {
            const avail = bloodGroupStats[group]?.available || 0;
            const total = bloodGroupStats[group]?.total || 0;
            const isGroupSelected = selectedGroup === group;

            return (
              <button
                key={group}
                onClick={() => setSelectedGroup(selectedGroup === group ? '' : group)}
                className={`group text-left relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 cursor-pointer ${
                  isGroupSelected 
                    ? 'bg-[#FF1E1E] border-[#FF1E1E] text-white shadow-[0_0_15px_rgba(255,30,30,0.5)] -translate-y-1' 
                    : 'bg-[#0B1220] border-white/8 hover:border-[#FF1E1E]/30 hover:shadow-lg hover:-translate-y-0.5 text-gray-300'
                }`}
              >
                {avail > 0 && !isGroupSelected && (
                  <span className="absolute top-2 right-2 flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                )}

                <div className="flex flex-col h-full justify-between">
                  <div>
                    <span className={`font-mono text-2xl font-black ${isGroupSelected ? 'text-white' : 'text-white group-hover:text-[#FF1E1E]'}`}>
                      {group}
                    </span>
                    <span className={`block text-[10px] font-bold uppercase tracking-widest mt-1 ${isGroupSelected ? 'text-red-100' : 'text-gray-500'}`}>
                      Group
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
                    <div>
                      <span className={`font-display text-lg font-black leading-none ${isGroupSelected ? 'text-white' : 'text-white'}`}>
                        {avail}
                      </span>
                      <span className={`text-[10px] ml-1 font-bold ${isGroupSelected ? 'text-red-200' : 'text-gray-400'}`}>
                        ready
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium font-mono ${isGroupSelected ? 'text-red-100' : 'text-gray-500'}`}>
                      /{total} tot
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. FILTER TOOLBAR */}
      <div className="bg-[#0B1220] text-white rounded-3xl p-5 md:p-6 shadow-2xl border border-white/8" id="criteria_finder_search">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF1E1E] text-white shadow shadow-[#FF1E1E]/40">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold tracking-tight">University Donor Directory Search</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Filter campus volunteers by department and availability</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(searchName || selectedGroup || searchDept || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchName('');
                  setSelectedGroup('');
                  setSearchDept('');
                  setSelectedStatus('all');
                }}
                className="text-[11px] font-extrabold text-[#FF1E1E] hover:text-[#ff3c3c] bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Reset Filters
              </button>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#111827] hover:bg-white/5 px-3 py-1.5 border border-white/8 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 text-[#FF1E1E] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Filter input elements matrix */}
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Donor Name Search Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Student Donor Name
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tariqul Islam"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-9 pr-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]/60 focus:ring-1 focus:ring-[#FF1E1E]/30"
              />
            </div>
          </div>

          {/* Department Search */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Academic Department
            </label>
            <div className="relative">
              <GraduationCap className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="CSE, BBA, EEE..."
                value={searchDept}
                onChange={(e) => setSearchDept(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-9 pr-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]/60 focus:ring-1 focus:ring-[#FF1E1E]/30"
              />
            </div>
          </div>

          {/* Availability Status Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Status Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]/60"
            >
              <option value="all" className="bg-[#0B1220]">All Statuses</option>
              <option value="available" className="bg-[#0B1220]">Ready to Donate</option>
              <option value="busy" className="bg-[#0B1220]">Resting / Busy</option>
              <option value="verified" className="bg-[#0B1220]">Verified Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. DONORS LISTING */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold text-gray-300">
            Filtered Campus Volunteers ({filteredDonors.length})
          </h3>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1220] py-14 text-center">
            <Users className="h-10 w-10 text-gray-500 mx-auto opacity-60" />
            <h4 className="mt-3 font-display text-sm font-bold text-white">No matching campus donors found</h4>
            <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
              Try adjusting your department or blood group search criteria.
            </p>
          </div>
        ) : (
          <motion.div 
            variants={fadeUpContainer}
            initial="hidden"
            animate="show"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {filteredDonors.map(donor => {
              const dStatus = getDonorStatus(donor);
              const nextDate = donor.nextEligibleDate ?? getNextEligibleDate(donor.lastDonationDate || '');

              return (
                <motion.div
                  variants={fadeUpItem}
                  key={donor.id}
                  className="group relative rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg hover:border-[#FF1E1E]/30 hover:shadow-[0_8px_30px_rgba(255,30,30,0.12)] transition-all flex flex-col justify-between"
                >
                  {/* Status Indicator */}
                  <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      dStatus === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      dStatus === 'busy' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-red-500'
                    }`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 select-none">
                      {dStatus === 'available' ? 'Ready' : dStatus === 'recently_donated' ? `From ${formatEligibleDate(nextDate)}` : 'Resting'}
                    </span>
                  </div>

                  <div>
                    {/* Header: Blood group + Info */}
                    <div className="flex items-start space-x-3.5">
                      <div className="relative flex h-13 w-13 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_10px_rgba(255,30,30,0.4)]">
                        <span className="font-mono text-lg font-black leading-none">{donor.bloodGroup}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-90 mt-0.5">Blood</span>
                      </div>

                      <div className="min-w-0 pr-12">
                        <div className="flex items-center gap-1">
                          <h4 className="truncate font-display text-sm font-extrabold text-white group-hover:text-[#FF1E1E] transition-colors">
                            {donor.name}
                          </h4>
                          {donor.isVerified && (
                            <CheckCircle className="h-4 w-4 fill-emerald-500 text-[#0B1220] shrink-0" title="Verified Campus Student" />
                          )}
                        </div>
                        <p className="truncate text-xs font-semibold text-gray-400 mt-0.5">
                          {donor.department}
                        </p>
                        {donor.batch && (
                          <p className="text-[10px] font-mono text-[#FF1E1E] font-bold mt-0.5">
                            {donor.batch} {donor.roll ? `• Roll ${donor.roll}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs text-gray-300 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400 truncate">Residence: <strong className="text-white font-semibold">{donor.hall}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400">Last Donated: <strong className="text-white font-semibold">{donor.lastDonationDate || 'Fresh volunteer'}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                        <span className="text-gray-400">Total Donated: <strong className="font-bold text-white">{donor.donationCount || 0} times</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* 3-month wait: show when they can donate next */}
                  {dStatus === 'recently_donated' && nextDate && (
                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs font-bold text-amber-300">
                      🗓 Available for donation from {formatEligibleDate(nextDate)}
                    </div>
                  )}

                  {/* Actions - phone only for logged-in visitors */}
                  {donor.phone ? (
                  <div className="mt-5 pt-3 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-[#111827] border border-white/8 p-2 text-xs font-bold text-gray-300">
                      <span className="flex items-center gap-1.5 font-mono">
                        <Phone className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                        <span>{donor.phone}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyPhone(donor.id, donor.phone)}
                        className="rounded-lg bg-[#0B1220] p-1.5 border border-white/10 text-gray-400 hover:text-[#FF1E1E] transition-all cursor-pointer shrink-0"
                        title="Copy Phone Number"
                      >
                        {copiedId === donor.id ? (
                          <span className="text-[9px] text-[#FF1E1E] uppercase font-black">Copied!</span>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {dStatus !== 'recently_donated' && (
                    <a
                      href={`tel:${donor.phone}`}
                      className="w-full flex h-9.5 items-center justify-center gap-2 rounded-xl bg-[#FF1E1E] hover:bg-[#ff3c3c] text-white font-bold text-xs shadow-md transition-all cursor-pointer text-center select-none"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>Call Donor</span>
                    </a>
                    )}
                  </div>
                  ) : (
                  <div className="mt-5 pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-400 font-semibold">Donor er phone number dekhte Log In korun.</p>
                  </div>
                  )}

                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* 5. UNIVERSITY DONATION GUIDELINES BENTO */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4">

        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white">Rapid Campus Dispatch</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Every minute is critical in medical emergencies. Student donors residing in halls can reach campus medical units in minutes.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/10 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-emerald-400">Verified Student Volunteers</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Profiles are authenticated with university department and roll number records for reliability.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/15 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <Building2 className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white">Residential Halls Network</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Structured across university dormitories so patients and families can contact donors nearby in their specific hall.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <Heart className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white">Safe 90-Day Intervals</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Donors rest for 90 days after each donation. System automatically calculates eligibility to ensure donor health safety.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
