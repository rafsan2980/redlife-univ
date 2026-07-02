import React from 'react';
import { Heart, Users, Activity, CheckCircle, Droplet, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { DonorStats } from '../types';

interface HeroProps {
  stats: DonorStats;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenRegister: () => void;
  onOpenRequestBlood: () => void;
}

export default function Hero({
  stats,
  currentTab,
  setCurrentTab,
  onOpenRegister,
  onOpenRequestBlood,
}: HeroProps) {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.28,
      },
    },
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 25, 
      scale: 0.94,
      filter: 'blur(3px)'
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      filter: 'blur(0px)',
      transition: { 
        type: 'spring',
        damping: 18,
        stiffness: 70,
        duration: 0.95
      }
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#0B1220]/40 via-[#050816] to-transparent py-12 md:py-20 border-b border-white/5">
      
      {/* Visual glowing backdrop circle */}
      <div className="absolute top-1/2 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FF1E1E]/8 blur-[130px] opacity-70" />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Modern Premium Animated Floating Badge */}
        <div className="flex justify-center mb-6">
          <motion.div 
            className="inline-flex items-center space-x-2 rounded-full border border-white/8 bg-gradient-to-r from-[#0B1220] via-[#111827] to-[#0B1220] px-4.5 py-1.5 shadow-[0_0_15px_rgba(255,30,30,0.15)] select-none cursor-default"
            initial={{ opacity: 0, y: -25, scale: 0.94 }}
            animate={{ 
              opacity: 1, 
              y: [0, -6, 0], // Smooth floating animation loop
              scale: 1,
              boxShadow: [
                "0 0 15px rgba(255,30,30,0.15)",
                "0 0 25px rgba(255,30,30,0.35)",
                "0 0 15px rgba(255,30,30,0.15)"
              ]
            }}
            transition={{
              opacity: { duration: 0.75, ease: "easeOut" },
              y: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
              scale: { duration: 0.75, ease: "easeOut" },
              boxShadow: { repeat: Infinity, duration: 2.8, ease: "easeInOut" }
            }}
          >
            {/* Animated Blood Droplet Icon with subtle pulse & drip feeling */}
            <motion.div
              animate={{ 
                y: [0, -2, 4, -1, 0],
                scale: [1, 1.15, 0.92, 1.15, 1],
                filter: [
                  "drop-shadow(0 0 4px rgba(255,30,30,0.6))",
                  "drop-shadow(0 0 9px rgba(255,30,30,0.95))",
                  "drop-shadow(0 0 4px rgba(255,30,30,0.6))"
                ]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2.2, 
                ease: "easeInOut" 
              }}
              className="flex items-center justify-center shrink-0"
            >
              <Droplet className="h-4.5 w-4.5 fill-[#FF1E1E] text-[#FF1E1E]" />
            </motion.div>
            
            <span className="font-display text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#FF1E1E] flex items-center relative select-none">
              <span className="relative drop-shadow-[0_1px_4px_rgba(255,30,30,0.3)]">
                Every Drop Saves a Life
              </span>
            </span>
          </motion.div>
        </div>

        {/* Hero Title with Watermark */}
        <div className="relative inline-block mx-auto max-w-full">
          {/* Subtle floating background blur/light effect behind the text */}
          <div className="absolute top-1/2 left-1/2 -z-15 h-[140px] w-[95%] rounded-full bg-[#FF1E1E]/5 blur-3xl pointer-events-none animate-float-text-bg" />

          {/* Watermark Logo */}
          <img
            src="/logo.png"
            alt="Trust University Watermark Logo"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-24 sm:h-32 md:h-44 object-contain opacity-[0.04] -z-10 select-none pointer-events-none transition-all duration-300"
            referrerPolicy="no-referrer"
          />
          <motion.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl text-balance relative z-10 py-3 flex flex-wrap justify-center items-center gap-x-2 sm:gap-x-3.5"
          >
            <motion.span variants={wordVariants} className="inline-block">
              University
            </motion.span>
            
            <motion.span 
              variants={wordVariants} 
              className="inline-block animate-red-word text-[#FF1E1E] font-extrabold"
            >
              <span className="shining-text">Blood</span>
            </motion.span>
            
            <motion.span 
              variants={wordVariants} 
              className="inline-block animate-red-word text-[#FF1E1E] font-extrabold"
            >
              <span className="shining-text">Donation</span>
            </motion.span>

            <motion.span variants={wordVariants} className="inline-block">
              Network
            </motion.span>
          </motion.h1>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-gray-400 sm:text-lg">
          Connecting student donors, faculty, and emergency requests across campus halls and departments. 
          Real-time availability tracking and verified student profiles.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setCurrentTab('search')}
            className="flex items-center space-x-2 rounded-xl bg-[#FF1E1E] px-6 py-3.5 font-display text-sm font-bold text-white transition-all duration-200 hover:bg-[#ff3c3c] hover:shadow-[0_0_20px_rgba(255,30,30,0.5)] cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>Search Active Donors</span>
          </button>
          <button
            onClick={onOpenRegister}
            className="rounded-xl border border-white/10 bg-[#0B1220] px-6 py-3.5 font-display text-sm font-bold text-gray-200 transition-all duration-200 hover:bg-white/5 hover:border-[#FF1E1E]/30 hover:shadow-[0_0_15px_rgba(255,30,30,0.1)] cursor-pointer"
          >
            Become a Donor
          </button>
        </div>

        {/* Live Counters / Statistics Grid */}
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          
          {/* Card 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0B1220] p-5 text-left shadow-sm transition-all duration-250 hover:-translate-y-1 hover:border-[#FF1E1E]/30 hover:shadow-[0_0_20px_rgba(255,30,30,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Registered Donors</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1E1E]/10 text-[#FF1E1E] transition-colors group-hover:bg-[#FF1E1E]/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white mt-4 tracking-tight">
              {stats.totalDonors}
            </p>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Campus volunteers</p>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0B1220] p-5 text-left shadow-sm transition-all duration-250 hover:-translate-y-1 hover:border-[#FF1E1E]/30 hover:shadow-[0_0_20px_rgba(255,30,30,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Available Now</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 transition-colors group-hover:bg-emerald-500/20">
                <Droplet className="h-5 w-5 fill-emerald-400" />
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white mt-4 tracking-tight">
              {stats.availableDonors}
            </p>
            <p className="text-[11px] font-semibold text-emerald-400 mt-1">Ready to donate immediately</p>
          </div>

          {/* Card 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0B1220] p-5 text-left shadow-sm transition-all duration-250 hover:-translate-y-1 hover:border-[#FF1E1E]/30 hover:shadow-[0_0_20px_rgba(255,30,30,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Requests</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1E1E]/10 text-[#FF1E1E] transition-colors group-hover:bg-[#FF1E1E]/20">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-[#FF1E1E] mt-4 tracking-tight drop-shadow-[0_0_8px_rgba(255,30,30,0.35)]">
              {stats.emergencyRequests}
            </p>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Pending response</p>
          </div>

          {/* Card 4 */}
          <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0B1220] p-5 text-left shadow-sm transition-all duration-250 hover:-translate-y-1 hover:border-[#FF1E1E]/30 hover:shadow-[0_0_20px_rgba(255,30,30,0.15)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Lives Linked</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF1E1E] text-white shadow-[0_0_10px_rgba(255,30,30,0.3)] transition-colors group-hover:bg-[#ff3c3c]">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="font-mono text-3xl font-extrabold text-white mt-4 tracking-tight">
              {stats.livesSaved}
            </p>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Successful blood connections</p>
          </div>

        </div>

      </div>
    </div>
  );
}
