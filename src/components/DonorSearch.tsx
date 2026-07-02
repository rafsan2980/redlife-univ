import React, { useState, useEffect } from 'react';
import { Search, Droplet, Phone, Mail, MapPin, Calendar, CheckCircle, ShieldAlert, X, Filter } from 'lucide-react';
import { User, BloodGroup, BANGLADESH_DISTRICTS } from '../types';

interface DonorSearchProps {
  donors: User[];
  isLoggedIn: boolean;
  onOpenAuth: (view: 'login' | 'register') => void;
  onSearch: (filters: { bloodGroup?: string; location?: string; availableOnly?: boolean; district?: string }) => void;
  isLoading: boolean;
  districtModalOpen?: boolean;
  setDistrictModalOpen?: (open: boolean) => void;
}

export default function DonorSearch({
  donors,
  isLoggedIn,
  onOpenAuth,
  onSearch,
  isLoading,
  districtModalOpen = false,
  setDistrictModalOpen,
}: DonorSearchProps) {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');

  // List of all blood groups
  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Trigger search on change
  useEffect(() => {
    onSearch({
      bloodGroup: selectedGroup,
      location: locationQuery,
      availableOnly,
      district: selectedDistrict,
    });
  }, [selectedGroup, locationQuery, availableOnly, selectedDistrict]);

  const handleReset = () => {
    setSelectedGroup('');
    setLocationQuery('');
    setAvailableOnly(false);
    setSelectedDistrict('');
    setDistrictSearchQuery('');
  };

  return (
    <div className="w-full">
      {/* Search Filter Bar */}
      <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-[0_4px_30px_rgba(0,0,0,0.25)] relative overflow-hidden">
        <h2 className="font-display text-xl font-bold text-white mb-5">
          Find Campus Donors
        </h2>

        <div className="grid gap-4 md:grid-cols-12 md:items-end">
          {/* Blood group selection */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Blood Group
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8 md:grid-cols-4">
              {bloodGroups.map((group) => (
                <button
                  key={group}
                  type="button"
                  onClick={() => setSelectedGroup(selectedGroup === group ? '' : group)}
                  className={`flex h-10 items-center justify-center rounded-xl font-mono text-xs font-bold border transition-all cursor-pointer ${
                    selectedGroup === group
                      ? 'bg-[#FF1E1E] border-[#FF1E1E] text-white shadow-[0_0_15px_rgba(255,30,30,0.55)]'
                      : 'border-white/10 bg-[#111827] text-gray-300 hover:border-[#FF1E1E]/50 hover:bg-[#FF1E1E]/10'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Location details input */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Search Hall or Dept
            </label>
            <div className="relative">
              <MapPin className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Sher-e-Bangla Hall"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-[#111827] pl-10 pr-4 text-xs font-semibold text-white placeholder-gray-500 outline-none transition-all focus:border-[#FF1E1E]/60 focus:bg-[#111827] focus:ring-2 focus:ring-[#FF1E1E]/20"
              />
            </div>
          </div>

          {/* District filter search button */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              District (Bangladesh)
            </label>
            {selectedDistrict ? (
              <div className="flex h-10 w-full items-center justify-between rounded-xl border border-[#FF1E1E]/30 bg-[#FF1E1E]/10 px-3 text-xs font-bold text-white">
                <span className="flex items-center gap-1.5 text-[#FF1E1E] truncate drop-shadow-[0_0_4px_rgba(255,30,30,0.3)]">
                  <MapPin className="h-4 w-4 shrink-0 text-[#FF1E1E]" />
                  <span className="truncate">{selectedDistrict}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDistrict('')}
                  className="rounded-full p-1 text-gray-450 text-gray-400 hover:bg-white/10 hover:text-white shrink-0 cursor-pointer"
                  title="Clear district filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDistrictModalOpen && setDistrictModalOpen(true)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-white/10 bg-[#111827] px-3.5 text-left text-xs font-semibold text-gray-300 hover:border-[#FF1E1E]/40 hover:bg-white/5 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Filter className="h-3.5 w-3.5" />
                  <span>All Districts</span>
                </span>
                <span className="text-[10px] text-[#FF1E1E] font-bold bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 rounded px-1.5 py-0.5 shadow-sm shrink-0">Choose</span>
              </button>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex flex-wrap items-center gap-4 md:col-span-3 md:justify-end">
            <label className="flex cursor-pointer items-center space-x-2 select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4.5 w-4.5 rounded border-white/15 bg-[#111827] text-[#FF1E1E] focus:ring-[#FF1E1E] accent-[#FF1E1E]"
              />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
                Available Only
              </span>
            </label>

            <button
              onClick={handleReset}
              className="rounded-xl px-4 py-2.5 font-display text-xs font-bold text-gray-400 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Public Emergency Access Banner */}
      <div className="mt-6 relative overflow-hidden rounded-2xl border border-[#FF1E1E]/20 bg-gradient-to-r from-[#FF1E1E]/5 to-[#FF1E1E]/15 p-4 shadow-lg shadow-black/30 hover:shadow-[#FF1E1E]/10 transition-shadow duration-300">
        <div className="absolute -right-12 -bottom-12 h-36 w-36 rounded-full bg-[#FF1E1E]/10 blur-2xl pointer-events-none animate-pulse" />
        <div className="absolute -left-12 -top-12 h-36 w-36 rounded-full bg-[#FF1E1E]/5 blur-2xl pointer-events-none animate-pulse" />
        
        <div className="flex items-center space-x-3.5 relative z-10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.5)]">
            <ShieldAlert className="h-4.5 w-4.5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <h5 className="font-display text-xs font-black text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>Medical Emergency Directive</span>
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FF1E1E] animate-ping" />
            </h5>
            <p className="text-[11px] text-gray-300 font-bold mt-0.5 leading-relaxed">
              Global authorization enabled — donor contacts are publicly queried to safely accelerate urgent assistance.
            </p>
          </div>
        </div>
      </div>

      {/* Main Donor List Header */}
      <div className="mt-8 flex items-center justify-between">
        <h3 className="font-display font-medium text-gray-300">
          {selectedDistrict ? (
            <span>
              <strong className="font-mono text-lg text-[#FF1E1E] font-black drop-shadow-[0_0_6px_rgba(255,30,30,0.4)]">{donors.length}</strong> {donors.length === 1 ? 'volunteer' : 'volunteers'} in <strong className="text-white font-black">{selectedDistrict}</strong>
            </span>
          ) : (
            <span>Campus Volunteers ({donors.length})</span>
          )}
        </h3>
        {isLoading && (
          <span className="text-xs font-semibold text-rose-500 animate-pulse">
            Refreshed inventory...
          </span>
        )}
      </div>

      {/* Donors Cards Grid Layout */}
      {donors.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-[#0B1220] py-16 text-center shadow-lg">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#FF1E1E] shadow-[0_0_15px_rgba(255,30,30,0.15)]">
            <Droplet className="h-7 w-7" />
          </div>
          <h4 className="mt-4 font-display text-base font-bold text-white">No matching donors found</h4>
          <p className="mx-auto mt-2 max-w-sm text-xs text-gray-400">
            Try adjusting filters, searching a different hall, or including resting donors.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((donor) => {
            const canDonate = donor.isAvailable;
            
            return (
              <div
                key={donor.id}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg transition-all duration-250 hover:-translate-y-1 hover:border-[#FF1E1E]/30 hover:shadow-[0_8px_30px_rgba(255,30,30,0.12)]"
              >
                {/* Available Badge Icon */}
                <div className="absolute top-5 right-5 flex items-center space-x-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      canDonate 
                        ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)]' 
                        : 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.85)]'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">
                    {canDonate ? 'Ready' : 'Resting'}
                  </span>
                </div>

                {/* Main Card Header */}
                <div className="flex items-start space-x-3.5">
                  {/* Blood Group Display Plate */}
                  <div className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.4)] transition-transform group-hover:scale-105">
                    <span className="font-mono text-xl font-black leading-none">{donor.bloodGroup}</span>
                    <span className="text-[9px] font-black uppercase tracking-wider opacity-90 mt-0.5">Blood</span>
                  </div>

                  {/* Profile info */}
                  <div className="min-w-0 pr-12">
                    <div className="flex items-center space-x-1">
                      <h4 className="truncate font-display text-sm font-extrabold text-[#FFFFFF] group-hover:text-[#FF1E1E] transition-colors leading-6">
                        {donor.name}
                      </h4>
                      {donor.isVerified && (
                        <CheckCircle className="h-4 w-4 fill-emerald-500 text-[#050816] shrink-0" title="Verified University Student" />
                      )}
                    </div>
                    <p className="truncate text-xs font-semibold text-gray-400 mt-1">
                      {donor.department}
                    </p>
                  </div>
                </div>

                {/* Main Card Body details */}
                <div className="mt-5 space-y-2 border-t border-white/5 pt-4 text-xs font-medium text-gray-300">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="truncate text-gray-400">Residence: <strong className="text-white font-semibold">{donor.hall}</strong></span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-[#FF1E1E] shrink-0" />
                    <span className="truncate text-gray-400">District: <strong className="text-white font-semibold">{donor.district || 'Barishal'}</strong></span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="text-gray-400">Last Donated: <strong className="text-white font-semibold">{donor.lastDonationDate || 'Never / Fresh volunteer'}</strong></span>
                  </div>
                </div>

                {/* Direct Donor Contact Area */}
                <div className="mt-5 border-t border-white/5 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs rounded-xl bg-[#111827] border border-white/8 p-2.5 font-bold text-gray-100">
                    <div className="flex items-center space-x-1.5 font-mono text-gray-300">
                      <Phone className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0" />
                      <span>{donor.phone}</span>
                    </div>
                  </div>
                  
                  {donor.email && (
                    <div className="flex items-center space-x-1.5 text-xs text-gray-400 px-1 font-medium truncate">
                      <Mail className="h-3.5 w-3.5 text-gray-550 text-gray-500 shrink-0" />
                      <span className="truncate">{donor.email}</span>
                    </div>
                  )}

                  {/* Red Premium Action Buttons */}
                  <div className="space-y-2 mt-1">
                    <a
                      href={`tel:${donor.phone}`}
                      className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF1E1E] hover:bg-[#ff3c3c] active:scale-95 text-white font-extrabold text-xs shadow-[0_0_12px_rgba(255,30,30,0.3)] transition-all cursor-pointer text-center duration-250 select-none"
                    >
                      <Phone className="h-3.5 w-3.5 animate-pulse shrink-0" />
                      <span>Call Donor Now</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-black uppercase tracking-wider">
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

              </div>
            );
          })}
        </div>
      )}

      {/* 
        ========================================================
        MODERN SEARCHABLE DISTRICT SELECTOR MODAL
        ========================================================
      */}
      {districtModalOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-[#050816]/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md rounded-3xl border border-white/8 bg-[#0B1220] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/8 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  Select Donor District
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Filter campus volunteers by home district
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDistrictModalOpen && setDistrictModalOpen(false)}
                className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input Filter bar */}
            <div className="p-4 bg-[#111827] border-b border-white/8">
              <div className="relative">
                <Search className="absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type to search district... e.g. Barishal"
                  value={districtSearchQuery}
                  onChange={(e) => setDistrictSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#0B1220] pl-10 pr-4 text-xs font-semibold text-white placeholder-gray-550 outline-none transition-all focus:border-[#FF1E1E]/60 focus:ring-2 focus:ring-[#FF1E1E]/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Grid list of Districts */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 select-none">
              <button
                type="button"
                onClick={() => {
                  setSelectedDistrict('');
                  setDistrictModalOpen && setDistrictModalOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-xs font-bold transition-all cursor-pointer ${
                  !selectedDistrict 
                    ? 'bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30' 
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <span>All Districts (Show Everyone)</span>
                {!selectedDistrict && (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF1E1E] shadow-[0_0_8px_rgba(255,30,30,0.85)]" />
                )}
              </button>

              <div className="border-t border-white/5 my-1" />

              {BANGLADESH_DISTRICTS.filter(d => 
                d.toLowerCase().includes(districtSearchQuery.toLowerCase())
              ).map(dist => {
                const isSelected = selectedDistrict === dist;
                return (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => {
                      setSelectedDistrict(dist);
                      setDistrictModalOpen && setDistrictModalOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-[#FF1E1E]/20 text-[#FF1E1E] font-bold border border-[#FF1E1E]/30' 
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{dist}</span>
                    {isSelected && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#FF1E1E] shadow-[0_0_8px_rgba(255,30,30,0.85)]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Suggestions / Selected status footer */}
            <div className="p-4 border-t border-white/8 bg-[#111827] text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Bangladesh Blood Donor Network
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
