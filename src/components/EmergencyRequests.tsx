import React, { useState } from 'react';
import { Calendar, Heart, ShieldAlert, Phone, MapPin, Sparkles, Activity, BadgeAlert, Trash2, Check, X } from 'lucide-react';
import { BloodRequest, User, BloodGroup } from '../types';

interface EmergencyRequestsProps {
  requests: BloodRequest[];
  currentUser: User | null;
  onOpenAuth: (view: 'login' | 'register') => void;
  onOpenCreateRequest: () => void;
  onUpdateRequestStatus: (id: string, status: 'pending' | 'fulfilled' | 'cancelled') => void;
  onDeleteRequest: (id: string) => void;
}

export default function EmergencyRequests({
  requests,
  currentUser,
  onOpenAuth,
  onOpenCreateRequest,
  onUpdateRequestStatus,
  onDeleteRequest,
}: EmergencyRequestsProps) {
  const [filterGroup, setFilterGroup] = useState<string>('');
  
  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Filter requests based on selection
  const filteredRequests = filterGroup
    ? requests.filter(r => r.bloodGroup === filterGroup)
    : requests;

  return (
    <div className="w-full">
      {/* Top Request Creator CTA Bar */}
      <div className="rounded-2xl border border-white/8 bg-gradient-to-r from-[#0B1220] via-[#111827] to-[#120612] p-6 text-white md:p-8 relative overflow-hidden shadow-xl">
        {/* Soft glowing ambient drop */}
        <div className="absolute -right-10 -bottom-10 h-40 w-40 opacity-20 bg-[#FF1E1E] rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-1 rounded-full bg-[#FF1E1E]/10 px-2.5 py-1 text-[10px] font-bold text-[#FF1E1E] border border-[#FF1E1E]/20 uppercase tracking-widest mb-3">
              <Sparkles className="h-3 w-3 fill-[#FF1E1E]" />
              <span>Critical Requirement Hotline</span>
            </div>
            <h2 className="font-display text-2xl font-black text-white">
              Need Blood Urgently on Campus?
            </h2>
            <p className="mt-2 max-w-xl text-xs font-semibold text-gray-400 leading-relaxed">
              Submit your request instantly. All registered student donors matching your request will see the alert immediately in their feed.
            </p>
          </div>

          <div>
            <button
              onClick={onOpenCreateRequest}
              className="w-full shrink-0 rounded-xl bg-[#FF1E1E] px-6 py-4 font-display text-sm font-bold text-white shadow-lg shadow-[#FF1E1E]/20 hover:bg-[#ff3c3c] transition-all cursor-pointer"
            >
              Create Emergency Request
            </button>
          </div>
        </div>
      </div>

      {/* Group Quick Filter Tag Row */}
      <div className="mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
              <Activity className="h-5 w-5 text-[#FF1E1E] drop-shadow-[0_0_8px_rgba(255,30,30,0.5)]" />
              <span>Active Emergency Appeals</span>
            </h3>
            <p className="text-xs text-gray-400">Urgent blood requests currently active on university medical networks</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Group Filter:</span>
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setFilterGroup('')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  filterGroup === ''
                    ? 'bg-[#FF1E1E] text-white'
                    : 'bg-[#111827] border border-white/8 text-gray-300 hover:bg-white/5'
                }`}
              >
                All
              </button>
              {bloodGroups.map(bg => (
                <button
                  key={bg}
                  onClick={() => setFilterGroup(filterGroup === bg ? '' : bg)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    filterGroup === bg
                      ? 'bg-[#FF1E1E] text-white font-mono shadow-[0_0_8px_rgba(255,30,30,0.4)]'
                      : 'bg-[#111827] border border-white/8 text-gray-300 hover:bg-white/5 font-mono'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Requests Feed List */}
      <div className="mt-6 space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1220] py-16 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[#FF1E1E] shadow-[0_0_15px_rgba(255,30,30,0.15)]">
              <Heart className="h-7 w-7" />
            </div>
            <h4 className="mt-4 font-display text-base font-bold text-white">No active appeals</h4>
            <p className="mx-auto mt-2 max-w-sm text-xs text-gray-400">
              There belong to no pending blood requests {filterGroup ? `for blood group ${filterGroup}` : ''} at the moment. Excellent!
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isOwner = currentUser?.id === req.createdBy;
            const isAdmin = currentUser?.role === 'admin';
            const canManage = isOwner || isAdmin;
            const isCriticalPending = req.status === 'pending' && (req.emergencyLevel === 'Critical' || req.isEmergency);

            return (
              <div
                key={req.id}
                className={`group relative rounded-2xl border p-6 transition-all duration-200 ${
                  isCriticalPending
                    ? 'border-[#FF1E1E]/40 shadow-[0_0_20px_rgba(255,30,30,0.15)] bg-[#0B1220] hover:border-[#FF1E1E]/60'
                    : 'border-white/8 bg-[#0B1220] hover:border-[#FF1E1E]/20'
                }`}
              >
                {/* Emergency top tag */}
                <div className="absolute top-6 right-6 flex items-center space-x-2">
                  {req.emergencyLevel && req.status === 'pending' && (
                    <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest ${
                      req.emergencyLevel === 'Critical'
                        ? 'bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30 animate-pulse'
                        : req.emergencyLevel === 'Urgent'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/35'
                        : 'bg-emerald-550 bg-emerald-500/25 text-emerald-400 border border-emerald-500/35'
                    }`}>
                      <BadgeAlert className="h-3 w-3" />
                      <span>{req.emergencyLevel}</span>
                    </span>
                  )}
                  {(!req.emergencyLevel && req.isEmergency && req.status === 'pending') && (
                    <span className="inline-flex items-center space-x-1 rounded-full bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest">
                      <BadgeAlert className="h-3 w-3 animate-pulse" />
                      <span>CRITICAL</span>
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      req.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : req.status === 'fulfilled'
                        ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/35'
                        : 'bg-white/5 text-gray-400 border-white/10'
                    }`}
                  >
                    {req.status === 'pending' ? 'Pending Help' : req.status === 'fulfilled' ? 'Fulfilled ✓' : 'Cancelled'}
                  </span>
                </div>

                {/* Main Body Grid */}
                <div className="grid gap-6 md:grid-cols-12">
                  
                  {/* Blood units panel */}
                  <div className="md:col-span-3 flex items-start space-x-3.5">
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.45)]">
                      <span className="font-mono text-2xl font-black leading-none">{req.bloodGroup}</span>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider mt-1">Needed</span>
                    </div>

                    <div>
                      <h4 className="font-display font-extrabold text-white text-base">{req.unitsRequired} {req.unitsRequired > 1 ? 'Units' : 'Unit'}</h4>
                      <p className="text-xs font-semibold text-gray-400 mt-1">
                        Needed on {req.dateNeeded} {req.requiredTime ? `at ${req.requiredTime}` : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">Raised: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Patient detail context */}
                  <div className="md:col-span-6 space-y-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">Patient & Objective</label>
                      <h5 className="font-display text-sm font-bold text-gray-250 text-gray-200">{req.patientName}</h5>
                      <p className="text-xs font-medium text-gray-300 mt-1 leading-relaxed italic bg-[#111827] p-2.5 rounded-lg border border-white/5">
                        &ldquo;{req.reason}&rdquo;
                      </p>
                      {req.notes && (
                        <p className="text-[11px] font-semibold text-gray-400 mt-2 bg-[#111827]/60 p-2 rounded-lg border border-dashed border-white/10">
                          <span className="text-[9px] font-extrabold uppercase text-gray-500 block mb-0.5">Notes:</span>
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Hospital / Location</span>
                        <div className="flex items-start space-x-1 mt-0.5 text-left">
                          <MapPin className="h-3.5 w-3.5 text-[#FF1E1E] shrink-0 mt-0.5" />
                          <div className="text-left">
                            <span className="block text-xs font-bold text-white truncate max-w-[180px]">{req.hospital}</span>
                            {req.hospitalAddress && (
                              <span className="block text-[10px] text-gray-400 font-medium truncate max-w-[180px]">{req.hospitalAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Created By</span>
                        <span className="text-xs font-semibold text-gray-300 block mt-0.5">{req.creatorName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & Control Board */}
                  <div className="md:col-span-3 flex flex-col justify-between gap-4 border-l border-white/5 pl-0 md:pl-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Contact Attendant</span>
                      <a
                        href={`tel:${req.phone}`}
                        className="inline-flex items-center space-x-2 rounded-xl bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 px-4 py-2.5 text-xs font-bold text-[#FF1E1E] hover:bg-[#FF1E1E]/20 font-mono text-center shadow-[0_0_10px_rgba(255,30,30,0.1)] active:scale-95 transition-transform"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{req.phone}</span>
                      </a>
                    </div>

                    {/* Manage Panel Controls */}
                    {canManage && (
                      <div className="flex items-center gap-1.5 pt-2 mt-auto border-t border-white/5">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => onUpdateRequestStatus(req.id, 'fulfilled')}
                              title="Mark Fulfilled"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <Check className="h-4.5 w-4.5 font-bold" />
                            </button>
                            <button
                              onClick={() => onUpdateRequestStatus(req.id, 'cancelled')}
                              title="Mark Cancelled"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              <X className="h-4.5 w-4.5 font-bold" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this request permanent?')) {
                              onDeleteRequest(req.id);
                            }
                          }}
                          title="Delete Request"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 text-[#FF1E1E] hover:bg-[#FF1E1E]/25 transition-colors ml-auto cursor-pointer"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
