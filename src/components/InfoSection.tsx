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
  ChevronDown, 
  HelpCircle, 
  Clock, 
  HeartPulse, 
  Copy,
  Award,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { User, BANGLADESH_DISTRICTS, BloodGroup } from '../types';

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
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchDistrictQuery, setSearchDistrictQuery] = useState<string>('');
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState<boolean>(false);
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
      console.error('Failed fetching explorer data matrix', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 5-second dynamic polling integration to ensure database levels are synchronized and real-time
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(true);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    loadData();
  };

  // Helper method to parse status fields mathematically
  const getDonorStatus = (donor: User) => {
    if (donor.isAvailable === false) {
      return 'busy';
    }
    if (donor.lastDonationDate) {
      const lastDate = new Date(donor.lastDonationDate);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      if (lastDate > ninetyDaysAgo) {
        return 'recently_donated';
      }
    }
    return 'available';
  };

  const handleCopyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2005);
  };

  // Live query-based real statistics
  const totalRegisteredCount = donors.length;
  const activeCount = donors.filter(d => !d.isSuspended).length;
  const availableCount = donors.filter(d => d.isAvailable).length;
  const emergencyReadyCount = donors.filter(d => d.isAvailable && d.isVerified).length;

  // Real-time calculated counts for each blood group across whole country
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

  // Real-time calculated counts for top districts of Bangladesh
  const districtStats = useMemo(() => {
    const counts: Record<string, number> = {};
    donors.forEach(d => {
      const dist = d.district || 'Barishal';
      counts[dist] = (counts[dist] || 0) + 1;
    });
    return counts;
  }, [donors]);

  // Final filtering logic (Instant responsive search state)
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
      // 3. Filter by District
      if (selectedDistrict && d.district !== selectedDistrict) {
        return false;
      }
      // 4. Search by Department or Hall Placement
      if (searchDept) {
        const query = searchDept.toLowerCase();
        const deptMatch = d.department?.toLowerCase().includes(query);
        const hallMatch = d.hall?.toLowerCase().includes(query);
        const addressMatch = d.address?.toLowerCase().includes(query);
        if (!deptMatch && !hallMatch && !addressMatch) {
          return false;
        }
      }
      // 5. Filter by Availability Status
      if (selectedStatus !== 'all') {
        const dStatus = getDonorStatus(d);
        if (selectedStatus === 'available' && dStatus !== 'available') return false;
        if (selectedStatus === 'busy' && dStatus !== 'busy') return false;
        if (selectedStatus === 'recently_donated' && dStatus !== 'recently_donated') return false;
        if (selectedStatus === 'verified' && !d.isVerified) return false;
      }
      return true;
    });
  }, [donors, searchName, selectedGroup, selectedDistrict, searchDept, selectedStatus]);

  // All 64 Districts selection filtered by inline query
  const filteredDistrictOptions = BANGLADESH_DISTRICTS.filter(dist => 
    dist.toLowerCase().includes(searchDistrictQuery.toLowerCase())
  );

  // Framer Motion Animation Settings
  const fadeUpContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const fadeUpItem = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <div className="w-full space-y-12 pb-16 text-white" id="premium_donor_discovery">
      
      {/* 1. PREMIUM HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1220] text-white px-6 py-12 md:py-20 shadow-xl border border-white/8">
        
        {/* Glowing Radials & Particle Atmosphere Backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,30,30,0.12),transparent_60%)] pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-96 h-96 rounded-full bg-[#FF1E1E]/5 blur-3xl pointer-events-none" />
        
        {/* Soft Falling Micro Particles Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[10%] left-[20%] w-2 h-2 rounded-full bg-[#FF1E1E] animate-pulse" />
          <div className="absolute top-[40%] left-[80%] w-3 h-3 rounded-full bg-[#FF1E1E]/80 animate-bounce" style={{ animationDuration: '4s' }} />
          <div className="absolute top-[70%] left-[15%] w-1.5 h-1.5 rounded-full bg-[#FF1E1E]/40" />
          <div className="absolute top-[30%] left-[50%] w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" style={{ animationDuration: '3s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          
          {/* Tagline */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-3.5 py-1 text-xs font-bold text-[#FF1E1E] tracking-wider uppercase"
          >
            <span className="flex h-2 w-2 rounded-full bg-[#FF1E1E] animate-ping" />
            <span>Emergency Mission Command</span>
          </motion.div>

          {/* Large Bold Animated Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
          >
            One Drop Can Save <span className="shining-text font-black">Bangladesh</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-sm md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Discover verified emergency-ready blood donors across Bangladesh in real time. Filter seamlessly and connect directly to save a precious life today.
          </motion.p>

          {/* Dynamic real-time connection counters banner */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="pt-6"
          >
            <div className="inline-grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 bg-[#050816]/70 border border-white/8 backdrop-blur-md rounded-2xl p-5 shadow-inner">
              <div className="text-center">
                <span className="block text-[14px] text-gray-400 font-bold uppercase tracking-wider">Registered</span>
                <span className="font-display block text-2xl font-black text-white mt-1">{totalRegisteredCount} Donors</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-[14px] text-gray-400 font-bold uppercase tracking-wider">Ready Now</span>
                <span className="font-display block text-2xl font-black text-emerald-450 text-emerald-400 mt-1">{availableCount} Status</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-[14px] text-gray-400 font-bold uppercase tracking-wider">Verified</span>
                <span className="font-display block text-2xl font-black text-sky-400 mt-1">{emergencyReadyCount} Heroes</span>
              </div>
              <div className="text-center border-l border-white/5">
                <span className="block text-[14px] text-gray-400 font-bold uppercase tracking-wider">Districts</span>
                <span className="font-display block text-2xl font-black text-[#FF1E1E] mt-1">64 Active</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* 2. DYNAMIC BROADCAST / FILTER TOOLBAR CARDS LINKED TO LIVE AVAILABILITY */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="font-display text-base font-black text-white flex items-center gap-2">
              <HeartPulse className="h-4.5 w-4.5 text-[#FF1E1E] animate-pulse" />
              <span>Live Blood Availability Matrix</span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold">Currently online and healthy donors segregated by classification</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-450 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{availableCount} Active Volunteers Online</span>
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
                      Group Code
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

      {/* 3. MAIN FINDER PANEL AND CRITERIA */}
      <div className="bg-[#0B1220] text-white rounded-3xl p-5 md:p-6 shadow-2xl border border-white/8 sticky top-1 z-35" id="criteria_finder_search">
        
        {/* Dynamic header row inside criteria box */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#FF1E1E] text-white shadow shadow-[#FF1E1E]/40">
              <Filter className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-extrabold tracking-tight">Real-Time Search & Filtration Protocol</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Customize constraints dynamically to pinpoint emergency donors instantly</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(searchName || selectedGroup || selectedDistrict || searchDept || selectedStatus !== 'all') && (
              <button
                onClick={() => {
                  setSearchName('');
                  setSelectedGroup('');
                  setSelectedDistrict('');
                  setSearchDept('');
                  setSelectedStatus('all');
                }}
                className="text-[11px] font-extrabold text-[#FF1E1E] hover:text-[#ff3c3c] bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
              >
                Reset Constraints
              </button>
            )}

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-[#111827] hover:bg-white/5 px-3 py-1.5 border border-white/8 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 text-[#FF1E1E] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Force Sync'}</span>
            </button>
          </div>
        </div>

        {/* Filter input elements matrix */}
        <div className="grid gap-4 sm:grid-cols-5">

          {/* Donor Name Search Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Donor Name Search
            </label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Type name..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-9 pr-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]/60 focus:ring-1 focus:ring-[#FF1E1E]/30"
              />
            </div>
          </div>

          {/* 64 Districts Dropdown Selector */}
          <div className="space-y-1 relative">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Bangladesh District
            </label>

            {selectedDistrict ? (
              <div className="flex h-10 w-full items-center justify-between rounded-xl border border-[#FF1E1E]/30 bg-[#FF1E1E]/10 px-3 text-xs font-bold text-[#FF1E1E]">
                <span className="flex items-center gap-1 truncate text-[#FF1E1E]">
                  <MapPin className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                  <span className="truncate">{selectedDistrict}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('')}
                  className="rounded-full p-0.5 text-gray-400 hover:bg-white/10 hover:text-white shrink-0 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-white/8 bg-[#111827] px-3 text-left text-xs font-semibold text-gray-300 hover:border-[#FF1E1E]/40 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 text-gray-455 text-gray-400 truncate">
                    <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                    <span className="truncate">All 64 Districts</span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                </button>

                {isDistrictDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 z-50 rounded-xl border border-white/8 bg-[#111827] p-2 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
                    <input
                      type="text"
                      placeholder="Type district name..."
                      value={searchDistrictQuery}
                      onChange={(e) => setSearchDistrictQuery(e.target.value)}
                      className="h-8 w-full rounded-lg border border-white/10 bg-[#0B1220] px-2.5 text-xs font-semibold text-white placeholder-gray-500 outline-none focus:border-[#FF1E1E]"
                      autoFocus
                    />
                    <div className="mt-1.5 max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar text-left scrollbar-thin scrollbar-thumb-white/10">
                      {filteredDistrictOptions.length === 0 ? (
                        <div className="p-2 text-center text-[10px] text-gray-500 italic">No district found</div>
                      ) : (
                        filteredDistrictOptions.map(dist => (
                          <button
                            type="button"
                            key={dist}
                            onClick={() => {
                              setSelectedDistrict(dist);
                              setIsDistrictDropdownOpen(false);
                            }}
                            className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs text-gray-300 hover:bg-[#FF1E1E]/20 hover:text-[#FF1E1E] font-semibold flex items-center justify-between cursor-pointer"
                          >
                            <span>{dist}</span>
                            {districtStats[dist] && (
                              <span className="text-[10px] font-bold text-[#FF1E1E] bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-1.5 rounded">
                                {districtStats[dist]}
                              </span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Status Category */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Availability Filter
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-gray-200 outline-none transition-all focus:border-[#FF1E1E]"
            >
              <option value="all" className="bg-[#0B1220]">Any Availability</option>
              <option value="available" className="bg-[#0B1220]">Ready & Available</option>
              <option value="busy" className="bg-[#0B1220]">Busy Now</option>
              <option value="recently_donated" className="bg-[#0B1220]">Recently Donated</option>
              <option value="verified" className="bg-[#0B1220]">Verified Approved Badge</option>
            </select>
          </div>

          {/* Department / Halls searching constraint */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Dept / Campus Address
            </label>
            <div className="relative">
              <MapPin className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="e.g. Physics, Hall room..."
                value={searchDept}
                onChange={(e) => setSearchDept(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-9 pr-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]"
              />
            </div>
          </div>

          {/* Targeted active blood group */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
              Specific Blood Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none transition-all focus:border-[#FF1E1E]"
            >
              <option value="" className="bg-[#0B1220]">Any blood group</option>
              {bloodGroups.map(bg => (
                <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* 4. BANGLADESH DISTRICTS STRENGTH EXPLORER */}
      <div className="rounded-3xl border border-white/8 bg-[#0B1220]/80 p-5 md:p-6" id="district-strength-map">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
          <div>
            <h3 className="font-display text-sm font-black text-white flex items-center gap-1.5">
              <Globe className="h-4.5 w-4.5 text-[#FF1E1E] drop-shadow-[0_0_8px_rgba(255,30,30,0.4)]" />
              <span>Bangladesh District Strength Explorer</span>
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">Click on any district below to immediately view local volunteers on the grid</p>
          </div>
          <span className="text-[10px] font-extrabold text-gray-300 bg-[#111827] border border-white/8 px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center">
            Database coverage: 64 Districts
          </span>
        </div>

        {/* 6 Districts Quick Slider Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Barishal', 'Khulna'].map(distName => {
            const numVal = districtStats[distName] || 0;
            const dstSelected = selectedDistrict === distName;

            return (
              <button
                type="button"
                key={distName}
                onClick={() => setSelectedDistrict(selectedDistrict === distName ? '' : distName)}
                className={`text-center rounded-2xl p-3 border transition-all duration-300 cursor-pointer ${
                  dstSelected 
                    ? 'bg-[#FF1E1E] border-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.3)]' 
                    : 'bg-[#111827] border-white/5 hover:border-[#FF1E1E]/30 hover:bg-white/5 text-gray-200'
                }`}
              >
                <MapPin className={`mx-auto h-4 w-4 mb-1.5 ${dstSelected ? 'text-white' : 'text-[#FF1E1E]'}`} />
                <h4 className="font-display text-xs font-black truncate">{distName}</h4>
                <span className={`inline-block font-mono text-[10px] font-extrabold px-2 py-0.5 mt-2 rounded-full ${
                  dstSelected ? 'bg-black/30 text-white' : 'bg-[#FF1E1E]/10 text-[#FF1E1E]'
                }`}>
                  {numVal} {numVal === 1 ? 'Donor' : 'Donors'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. REDESIGNED DONOR CARDS GRID & LOADER SECTION */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="font-display text-sm font-black text-white flex items-center gap-1.5">
              <span>Verified Campus Registry</span>
              <span className="text-xs text-[#FF1E1E] font-bold bg-[#FF1E1E]/15 border border-[#FF1E1E]/20 px-2 rounded-full">
                {filteredDonors.length} Contributor Record Match
              </span>
            </h2>
            <p className="text-xs text-gray-400 font-semibold">Showing matched healthy campus volunteers</p>
          </div>
        </div>

        {/* Public Emergency Access Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[#FF1E1E]/20 bg-gradient-to-r from-[#FF1E1E]/5 to-[#FF1E1E]/15 p-4 shadow-lg shadow-black/30 hover:shadow-[#FF1E1E]/10 transition-shadow duration-300">
          <div className="absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-[#FF1E1E]/10 blur-2xl pointer-events-none animate-pulse" />
          <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#FF1E1E]/5 blur-2xl pointer-events-none animate-pulse" />
          
          <div className="flex items-center space-x-3.5 relative z-10">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.5)] animate-pulse">
              <Heart className="h-4.5 w-4.5 fill-current text-white animate-heartbeat" />
            </span>
            <div className="min-w-0 flex-1">
              <h5 className="font-display text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                <span>Medical Emergency Directive</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF1E1E] animate-ping" />
              </h5>
              <p className="text-[11px] text-gray-300 font-bold mt-0.5 leading-relaxed">
                Emergency access enabled — donor contact cards are publicly searchable to speed up critical medical requirements.
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 animate-pulse">
            {[1, 2, 3].map(item => (
              <div key={item} className="rounded-3xl border border-white/5 bg-[#0B1220] p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#111827]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-[#111827]" />
                    <div className="h-3 w-1/2 rounded bg-[#111827]" />
                  </div>
                </div>
                <div className="h-10 rounded bg-[#111827]/60" />
                <div className="h-12 rounded-xl bg-[#111827]" />
              </div>
            ))}
          </div>
        ) : filteredDonors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-[#0B1220] py-16 text-center max-w-xl mx-auto space-y-4 shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#FF1E1E] shadow-[0_0_15px_rgba(255,30,30,0.15)] animate-bounce">
              <Users className="h-7 w-7" />
            </div>
            <h4 className="font-display text-base font-black text-white">No matches found</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              We couldn't locate any active donor aligning with your filter combination. Try clearing your filters or testing another home district search.
            </p>
            <button
              onClick={() => {
                setSearchName('');
                setSelectedGroup('');
                setSelectedDistrict('');
                setSearchDept('');
                setSelectedStatus('all');
              }}
              className="rounded-xl bg-[#FF1E1E] hover:bg-[#ff3c3c] px-5.5 py-2 text-xs font-bold text-white shadow transition-all whitespace-nowrap cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <motion.div 
            variants={fadeUpContainer}
            initial="hidden"
            animate="show"
            className="grid gap-6 sm:grid-cols-2 md:grid-cols-3"
          >
            {filteredDonors.map(donor => {
              const dStatus = getDonorStatus(donor);

              return (
                <motion.div
                  variants={fadeUpItem}
                  key={donor.id}
                  className="group relative rounded-3xl border border-white/8 bg-[#0B1220] p-5.5 shadow-lg hover:shadow-[0_8px_30px_rgba(255,30,30,0.12)] hover:border-[#FF1E1E]/30 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF1E1E] via-rose-500 to-red-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                  {/* Top line with Availability status bubble */}
                  <div className="absolute top-5 right-5 z-10 flex items-center gap-1.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      dStatus === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      dStatus === 'busy' ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-red-500 shadow-[0_0_8px_rgba(255,30,30,0.8)]'
                    } animate-pulse`} />
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 select-none">
                      {dStatus === 'available' ? 'Ready' : dStatus === 'busy' ? 'Busy' : 'Resting'}
                    </span>
                  </div>

                  <div>
                    {/* Visual profile header */}
                    <div className="flex items-start space-x-3.5">
                      <div className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_10px_rgba(255,30,30,0.4)] group-hover:scale-105 transition-transform">
                        <span className="font-mono text-xl font-black leading-none">{donor.bloodGroup}</span>
                        <span className="text-[8px] font-bold uppercase tracking-wider opacity-90 mt-0.5">group</span>
                      </div>

                      <div className="min-w-0 pr-12">
                        <div className="flex items-center gap-1">
                          <h4 className="truncate font-display text-sm font-black text-white group-hover:text-[#FF1E1E] transition-colors">
                            {donor.name}
                          </h4>
                          {donor.isVerified && (
                            <CheckCircle className="h-4 w-4 fill-emerald-500 text-[#0B1220] shrink-0" title="Verified Campus Student" />
                          )}
                        </div>
                        <p className="truncate text-[11px] font-bold text-gray-400 mt-0.5">
                          {donor.department} &bull; <strong className="text-gray-500">{donor.batch || 'Batch'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Metadata attributes lines */}
                    <div className="mt-4 pt-3.5 border-t border-white/5 space-y-2.5 text-xs text-gray-300 font-medium font-sans">
                      
                      {/* Homeland District */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                        <span className="text-gray-400">Home District: <strong className="text-white font-semibold">{donor.district || 'Barishal'}</strong></span>
                      </div>

                      {/* Resident Hall */}
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400 text-ellipsis overflow-hidden whitespace-nowrap">Residence: <strong className="text-white font-semibold">{donor.hall}</strong></span>
                      </div>

                      {/* Calendars detail */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="text-gray-400">Last Donated: <strong className="text-white font-semibold">{donor.lastDonationDate || 'First Registration'}</strong></span>
                      </div>

                      {/* Historical contribution counters */}
                      <div className="flex items-center gap-2 text-[#FF1E1E]">
                        <Activity className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                        <span>Historical Contributions: <strong className="font-black text-white">{donor.donationCount || 0} donations</strong></span>
                      </div>

                    </div>
                  </div>

                  {/* Active call to action or protected privacy view */}
                  <div className="mt-5 pt-3.5 border-t border-white/5 flex-none space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-[#111827] border border-white/8 p-2 text-xs font-bold text-gray-250">
                      <span className="flex items-center gap-1.5 text-gray-300 font-mono transition-colors group-hover:text-[#FF1E1E]">
                        <Phone className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                        <span>{donor.phone}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopyPhone(donor.id, donor.phone)}
                        className="rounded-lg bg-[#0B1220] p-1.5 shadow border border-white/10 text-gray-400 hover:text-[#FF1E1E] hover:bg-white/5 transition-all cursor-pointer shrink-0"
                        title="Copy Phone Number"
                      >
                        {copiedId === donor.id ? (
                          <span className="text-[9px] text-[#FF1E1E] uppercase font-black tracking-tight font-sans">Copied!</span>
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>

                    {donor.email && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-gray-450 text-gray-400 px-1 font-medium truncate">
                        <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <span className="truncate">{donor.email}</span>
                      </div>
                    )}

                    {/* Quick premium Red Emergency Action Buttons */}
                    <div className="space-y-2">
                      <a
                        href={`tel:${donor.phone}`}
                        className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF1E1E] hover:bg-[#ff3c3c] active:scale-95 text-white font-black text-xs shadow-md shadow-[#FF1E1E]/20 hover:shadow-[0_0_15px_rgba(255,30,30,0.55)] transition-all cursor-pointer text-center duration-200 select-none"
                        title="Call Volunteer Now"
                      >
                        <Phone className="h-3.5 w-3.5 animate-pulse shrink-0" />
                        <span>Call Donor Now</span>
                      </a>
                      
                      <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-black uppercase tracking-wider select-none">
                        <a
                          href={`tel:${donor.phone}`}
                          className="py-2 rounded-lg bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 hover:bg-[#FF1E1E]/20 transition-colors cursor-pointer"
                        >
                          Contact Instantly
                        </a>
                        <a
                          href={`tel:${donor.phone}`}
                          className="py-2 rounded-lg bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 hover:bg-[#FF1E1E]/20 transition-colors cursor-pointer"
                        >
                          Emergency Unit
                        </a>
                      </div>
                    </div>
                  </div>

                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* 6. BEAUTIFUL INFORMATIONAL BENTO SECTIONS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 pt-4">

        {/* Why Fast Blood Access Matters */}
        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-[#FF1E1E] shrink-0">
            <HeartPulse className="h-16 w-16" />
          </div>
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white">Why Fast Access Matters</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Every minute counts during emergency procedures. Our localized database minimizes matching delay to seconds compared to tedious phone queues.
            </p>
          </div>
        </div>

        {/* Emergency Ready Heroes */}
        <div className="rounded-3xl border border-emerald-500/10 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-400 shrink-0">
            <Award className="h-16 w-16" />
          </div>
          <div>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-emerald-400">Emergency Ready Heroes</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Registered students hold verified badge marks ensuring strict physical fitness and health parameters are checked prior to listing.
            </p>
          </div>
        </div>

        {/* Verified University Donor Network */}
        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white shrink-0">
            <Users className="h-16 w-16" />
          </div>
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/15 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white font-semibold">Verified alumni Matrix</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Integrating university halls, departments, and class batches dynamically. Filter volunteers based on physical proximity on campus.
            </p>
          </div>
        </div>

        {/* Real-time Blood Support Across Bangladesh */}
        <div className="rounded-3xl border border-white/8 bg-[#0B1220] p-6 shadow-sm relative overflow-hidden group hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-[#FF1E1E] shrink-0">
            <Globe className="h-16 w-16" />
          </div>
          <div>
            <div className="h-10 w-10 rounded-2xl bg-[#FF1E1E]/10 text-[#FF1E1E] border border-[#FF1E1E]/20 flex items-center justify-center mb-4">
              <Globe className="h-5 w-5" />
            </div>
            <h4 className="font-display text-sm font-black text-white">National Support system</h4>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Bridging blood centers and universities across 64 Bangladesh districts. Dynamic query routing speeds up emergency responses.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
