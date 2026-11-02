import React, { useState, useEffect } from 'react';
import { User, BloodRequest, BloodGroup, Notification } from '../types';
import { api } from '../lib/api';
import { 
  ShieldCheck, 
  Calendar, 
  Activity, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  Save, 
  Sparkles, 
  MapPin, 
  Heart, 
  PlusCircle, 
  Bell, 
  MailOpen, 
  Mail, 
  Phone, 
  Flame, 
  Clock, 
  AlertTriangle,
  X
} from 'lucide-react';

interface DonorDashboardProps {
  currentUser: User;
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  userRequests: BloodRequest[];
  onOpenCreateRequest: () => void;
  onUpdateRequestStatus: (id: string, status: 'pending' | 'fulfilled' | 'cancelled') => void;
}

export default function DonorDashboard({
  currentUser,
  onUpdateProfile,
  userRequests,
  onOpenCreateRequest,
  onUpdateRequestStatus,
}: DonorDashboardProps) {
  // Profiles settings form states
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(currentUser.bloodGroup);
  const [department, setDepartment] = useState(currentUser.department);
  const [hall, setHall] = useState(currentUser.hall);
  const [lastDonationDate, setLastDonationDate] = useState(currentUser.lastDonationDate);
  const [isAvailable, setIsAvailable] = useState(currentUser.isAvailable);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Notifications API states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed fetching matching emergency alerts inbox', err);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set up rapid periodic alerts checking - simulates real-time Supabase subscriptions!
    const pollId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(pollId);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      // Refresh statistics locally
      if (selectedNotif && selectedNotif.id === id) {
        setSelectedNotif({ ...selectedNotif, isRead: true });
      }
    } catch (err) {
      console.error('Could not archive notification', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    try {
      await onUpdateProfile({
        name,
        phone,
        bloodGroup,
        department,
        hall,
        lastDonationDate,
        isAvailable,
      });
      setSuccessMsg('Profile information updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch {
      alert('Failed updating profile settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailable = async () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    try {
      await onUpdateProfile({ isAvailable: nextVal });
    } catch {
      setIsAvailable(!nextVal);
    }
  };

  // Badge calculations
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="grid gap-8 lg:grid-cols-12 animate-fade-in text-white text-left">
      
      {/* ==================================== */}
      {/* SIDEBAR OVERVIEW                     */}
      {/* ==================================== */}
      <div className="lg:col-span-4 space-y-6 text-left">
        <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl text-center">
          
          {/* Large Avatar Plate */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#FF1E1E]/15 text-[#FF1E1E] font-display text-3xl font-black ring-4 ring-[#FF1E1E]/5 shadow-[0_0_12px_rgba(255,30,30,0.3)]">
            {currentUser.bloodGroup}
            {currentUser.isVerified && (
              <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-[#0B1220]" title="Verified University Student">
                <ShieldCheck className="h-4 w-4" />
              </span>
            )}
          </div>

          <h3 className="mt-4 font-display text-lg font-bold text-white flex items-center justify-center gap-1.5">
            {currentUser.name}
          </h3>
          <p className="text-xs text-gray-400 lowercase mt-0.5">{currentUser.email}</p>

          <div className="mt-3 inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-300 border border-white/5">
            <span>{currentUser.role === 'admin' ? 'University Admin' : 'Donor Network Member'}</span>
          </div>

          {/* Quick toggle banner */}
          <div className="mt-6 border-t border-white/5 pt-5 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Live Donation Dispatch</h4>
            <div 
              className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                isAvailable 
                  ? 'border-emerald-550/20 bg-emerald-500/5 hover:bg-emerald-500/10' 
                  : 'border-white/8 bg-white/5 hover:bg-white/10'
              }`}
              onClick={handleToggleAvailable}
            >
              <div>
                <span className={`text-xs font-bold uppercase block transition-colors ${isAvailable ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {isAvailable ? 'Ready to Donate' : 'Temporarily Resting'}
                </span>
                <span className="text-[10px] text-gray-500">Toggles campus visibility</span>
              </div>
              <button type="button" className="cursor-pointer">
                {isAvailable ? (
                  <ToggleRight className="h-8 w-8 text-emerald-400 fill-emerald-500/10" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Campuses guide info card */}
        <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl text-left">
          <h4 className="font-display text-sm font-bold text-white mb-4">Campuses Action Guide</h4>
          <ul className="space-y-3.5 text-xs text-gray-300 font-semibold text-left">
            <li className="flex items-start gap-2.5 text-left">
              <span className="h-5 w-5 shrink-0 rounded-full bg-[#FF1E1E]/15 text-[#FF1E1E] flex items-center justify-center text-[10px] font-black border border-[#FF1E1E]/20">1</span>
              <div>
                <p className="font-bold text-white">Keep Last Donation Date Accurate</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Assists our coordinators when tracking safety timelines.</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-left">
              <span className="h-5 w-5 shrink-0 rounded-full bg-[#FF1E1E]/15 text-[#FF1E1E] flex items-center justify-center text-[10px] font-black border border-[#FF1E1E]/20">2</span>
              <div>
                <p className="font-bold text-white">Watch Your Emergency Messages</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Matching notifications triggers ONLY for your blood group type!</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5 text-left">
              <span className="h-5 w-5 shrink-0 rounded-full bg-[#FF1E1E]/15 text-[#FF1E1E] flex items-center justify-center text-[10px] font-black border border-[#FF1E1E]/20">3</span>
              <div>
                <p className="font-bold text-white">Prompt responses save lives</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">Your immediate verification is crucial in clinical situations.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* ==================================== */}
      {/* MAIN MODULES PANEL                   */}
      {/* ==================================== */}
      <div className="lg:col-span-8 space-y-8">

        {/* ============================================================== */}
        {/* 🚨 REQUISITE: EMERGENCY MESSAGE INBOX / NOTIFICATION CENTER   */}
        {/* ============================================================== */}
        <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl text-left">
          <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4 text-left">
            <div>
              <h3 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-[#FF1E1E] animate-bounce" />
                <span>My Emergency Broadcast Center</span>
                {unreadCount > 0 && (
                  <span className="bg-[#FF1E1E] text-white font-mono text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-[0_0_8px_rgba(255,30,30,0.5)]">
                    {unreadCount} NEW
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 font-medium">Exclusive real-time alerts matching your blood group ({currentUser.bloodGroup})</p>
            </div>

            <button 
              onClick={fetchNotifications}
              className="text-[10px] font-extrabold uppercase bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg border border-white/5 transition-colors cursor-pointer"
            >
              Sync Alerts
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center rounded-xl bg-white/5 border border-dashed border-white/10">
              <MailOpen className="h-7 w-7 text-gray-500 mx-auto opacity-75 animate-bounce-slow" />
              <h4 className="mt-2 text-xs font-bold text-white">Inbox looks clear</h4>
              <p className="mt-1 text-[10.5px] text-gray-400">No urgent requests matching {currentUser.bloodGroup} have been flagged today.</p>
            </div>
          ) : (
            <div className="grid gap-3.5 max-h-80 overflow-y-auto pr-1 text-left custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => setSelectedNotif(notif)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all hover:border-[#FF1E1E]/20 text-left ${
                    notif.isRead 
                      ? 'bg-white/5 border-white/5' 
                      : 'bg-[#FF1E1E]/10 border-[#FF1E1E]/20 font-bold ring-1 ring-[#FF1E1E]/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 text-left">
                    <div className="flex items-start space-x-2.5 text-left">
                      <span className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${notif.isRead ? 'bg-white/5 text-gray-400' : 'bg-[#FF1E1E]/15 text-[#FF1E1E]'}`}>
                        {notif.isRead ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4 fill-[#FF1E1E] text-red-600 animate-pulse" />}
                      </span>
                      
                      <div className="text-left">
                        <p className={`text-white leading-tight block text-left ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-1.5 text-[10.5px] text-gray-400 font-mono flex-wrap">
                          <span>Patient: <strong className="text-white font-sans">{notif.patientName}</strong></span>
                          <span>&bull;</span>
                          <span>Priority: <strong className="text-white font-sans">{notif.emergencyLevel}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 select-none">
                      <span className="text-[9.5px] text-gray-500 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      {!notif.isRead && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkRead(notif.id);
                          }}
                          className="mt-1.5 bg-[#FF1E1E] hover:bg-[#ff3c3c] text-[10px] text-white font-bold rounded px-2.5 py-1 block transition-all shadow-[0_0_8px_rgba(255,30,30,0.3)] cursor-pointer"
                        >
                          Archive Info
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected notification details dialog modal */}
        {selectedNotif && (
          <div className="fixed inset-0 bg-[#050816]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#0B1220] rounded-2xl w-full max-w-md shadow-2xl border border-white/8 overflow-hidden animate-modal-enter text-left text-white">
              <div className="bg-[#111827] text-white p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4.5 w-4.5 text-[#FF1E1E] fill-[#FF1E1E] animate-pulse" />
                  <span className="font-display font-black text-sm uppercase tracking-wider">Clinical Alert details</span>
                </div>
                <button 
                  onClick={() => setSelectedNotif(null)}
                  className="bg-white/5 text-white rounded-full h-7 w-7 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 p-4 rounded-xl text-center">
                  <span className="font-mono text-2xl font-black text-[#FF1E1E] bg-[#FF1E1E]/15 border border-[#FF1E1E]/20 px-3 py-1 rounded-xl">{selectedNotif.bloodGroupNeeded} needed</span>
                  <p className="font-bold text-white mt-3 text-sm leading-relaxed">{selectedNotif.message}</p>
                </div>

                <div className="divide-y divide-white/5 text-xs text-left">
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Patient Name</span>
                    <strong className="text-white text-right">{selectedNotif.patientName}</strong>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Target Hospital</span>
                    <strong className="text-white text-right">{selectedNotif.hospital}</strong>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Emergency Level</span>
                    <strong className="text-[#FF1E1E] font-bold text-right uppercase">{selectedNotif.emergencyLevel}</strong>
                  </div>
                  <div className="py-2.5 flex justify-between">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider">Required Date/Time</span>
                    <strong className="text-white text-right">{selectedNotif.requiredDate} &bull; {selectedNotif.requiredTime || 'ASAP'}</strong>
                  </div>
                  <div className="py-3 flex flex-col pt-3">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Direct Clinical Contact</span>
                    <a 
                      href={`tel:${selectedNotif.phone}`}
                      className="inline-flex items-center justify-center space-x-1.5 h-10 w-full rounded-xl bg-[#FF1E1E] text-white font-mono text-sm font-black hover:bg-[#ff3c3c] hover:shadow-lg transition-all shadow-[0_0_12px_rgba(255,30,30,0.45)]"
                    >
                      <Phone className="h-4 w-4 fill-white text-white animate-pulse" />
                      <span>{selectedNotif.phone} (Call Now)</span>
                    </a>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={() => {
                      handleMarkRead(selectedNotif.id);
                      setSelectedNotif(null);
                    }}
                    className="h-10 w-full rounded-xl border border-white/10 text-gray-400 font-extrabold uppercase hover:bg-white/5 cursor-pointer transition-all"
                  >
                    Mark message as Read
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Update Form */}
        <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl md:p-8 text-left">
          <div className="border-b border-white/5 pb-5 mb-5 text-left">
            <h3 className="font-display text-lg font-bold text-white">Donor Profile Settings</h3>
            <p className="text-xs text-gray-400">Ensure contact information is accurate for crisis times</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            {successMsg && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs text-emerald-400 font-bold flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2 text-left">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10.5 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-sm font-medium text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  University Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10.5 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-sm font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="h-10.5 w-full rounded-xl border border-[#0B1220] border-white/8 bg-[#111827] px-3 text-sm font-bold text-white outline-none focus:border-[#FF1E1E]"
                >
                  {bloodGroups.map((g) => (
                    <option key={g} value={g} className="bg-[#0B1220]">
                      Blood Group: {g}
                    </option>
                  ))}
                </select>
              </div>



              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  Last Donation Date
                </label>
                <input
                  type="date"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                  className="h-10.5 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-sm font-medium text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  Faculty / Academic Department
                </label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science & Engineering"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-10.5 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-sm font-medium text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wide text-gray-400 mb-2">
                  Dormitory / Hall Residence
                </label>
                <input
                  type="text"
                  required
                  placeholder="Sher-e-Bangla Hall"
                  value={hall}
                  onChange={(e) => setHall(e.target.value)}
                  className="h-10.5 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-sm font-medium text-white outline-none focus:border-[#FF1E1E]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center space-x-2 rounded-xl bg-[#FF1E1E] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff3c3c] hover:shadow-lg disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(255,30,30,0.4)]"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Settings Changes'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Requests Created by Current User */}
        <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl text-left">
          <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 mb-4 gap-4 text-left">
            <div>
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-1.5">
                <Activity className="h-5 w-5 text-[#FF1E1E]" />
                <span>My Active Appeals ({userRequests.length})</span>
              </h3>
              <p className="text-xs text-gray-400 font-semibold">Track and respond donor progress for requests raised by you</p>
            </div>

            <button
              onClick={onOpenCreateRequest}
              className="inline-flex items-center space-x-1 rounded-lg bg-[#FF1E1E] text-white px-3.5 py-2 text-xs font-bold hover:bg-[#ff3c3c] cursor-pointer shadow-[0_0_10px_rgba(255,30,30,0.35)] transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>New Appeal</span>
            </button>
          </div>

          {userRequests.length === 0 ? (
            <div className="py-12 text-center rounded-xl bg-white/5 border border-dashed border-white/10">
              <Heart className="h-8 w-8 text-gray-500 mx-auto opacity-70 animate-pulse-slow" />
              <h4 className="mt-2 text-xs font-extrabold text-white">No current assistance appeals</h4>
              <p className="mt-1 text-[11px] text-gray-400">You haven't initiated any emergency blood requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-white/5 bg-[#111827] p-4 transition-all hover:border-[#FF1E1E]/20 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2.5 text-left">
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm font-black text-white bg-[#FF1E1E] px-2.5 py-0.5 rounded-md shadow-[0_0_8px_rgba(255,30,30,0.35)]">
                          {req.bloodGroup}
                        </span>
                        <h4 className="font-display text-sm font-bold text-white text-left">
                          {req.patientName} &bull; <span className="text-gray-400 font-normal">{(req as any).emergencyLevel || "Normal"}</span>
                        </h4>
                      </div>
                      <p className="text-[11px] text-gray-450 text-gray-400 mt-1.5">Needed units: <strong className="text-white font-mono">{req.unitsRequired} bags</strong> &bull; Hospital: {req.hospital}</p>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                        req.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : req.status === 'fulfilled'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-gray-500 border border-white/10'
                      }`}>
                        {req.status}
                      </span>

                      {req.status === 'pending' && (
                        <div className="flex items-center space-x-1 pl-1">
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, 'fulfilled')}
                            className="text-[10px] font-bold bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded px-2 py-1 transition-colors cursor-pointer"
                          >
                            Mark Saved
                          </button>
                          <button
                            onClick={() => onUpdateRequestStatus(req.id, 'cancelled')}
                            className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded px-2 py-1 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
