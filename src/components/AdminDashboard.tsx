import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, BloodRequest, BloodGroup, LiveActivity } from '../types';
import { 
  ShieldCheck, 
  UserMinus, 
  CheckCircle, 
  Search, 
  Trash2, 
  Mail, 
  Phone, 
  Users, 
  ShieldAlert, 
  Edit,
  UserX,
  X,
  Filter,
  Calendar,
  MapPin,
  Map,
  Clock,
  AlertTriangle,
  Flame,
  Award,
  Activity,
  Home
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  onRefreshStats: () => void;
}

export default function AdminDashboard({
  currentUser,
  onRefreshStats,
}: AdminDashboardProps) {
  // Navigation / views
  const [activeTab, setActiveTab] = useState<'overview' | 'donors' | 'requests' | 'activities'>('overview');

  // Core database pools
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  
  // Loading indicators
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Search & filter states - Donors tab
  const [donorSearch, setDonorSearch] = useState('');
  const [donorBloodGroup, setDonorBloodGroup] = useState<string>('');
  const [donorDept, setDonorDept] = useState<string>('');
  const [donorAvailability, setDonorAvailability] = useState<string>(''); // 'all', 'available', 'resting'

  // Search & filter states - Requests tab
  const [requestSearch, setRequestSearch] = useState('');
  const [requestBloodGroup, setRequestBloodGroup] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<string>('');
  const [requestLevel, setRequestLevel] = useState<string>('');

  // Editing Modals state
  const [editingDonor, setEditingDonor] = useState<User | null>(null);
  const [editingRequest, setEditingRequest] = useState<BloodRequest | null>(null);

  // Form states - Editing Donor details
  const [editDonorName, setEditDonorName] = useState('');
  const [editDonorPhone, setEditDonorPhone] = useState('');
  const [editDonorEmail, setEditDonorEmail] = useState('');
  const [editDonorBloodGroup, setEditDonorBloodGroup] = useState<BloodGroup>('O+');
  const [editDonorDept, setEditDonorDept] = useState('');
  const [editDonorHall, setEditDonorHall] = useState('');
  const [editDonorRoll, setEditDonorRoll] = useState('');
  const [editDonorBatch, setEditDonorBatch] = useState('');
  const [editDonorDonationCount, setEditDonorDonationCount] = useState(0);
  const [editDonorLastDate, setEditDonorLastDate] = useState('');
  const [editDonorAvailable, setEditDonorAvailable] = useState(true);
  const [editDonorVerified, setEditDonorVerified] = useState(true);

  // Form states - Editing Request details
  const [editReqPatient, setEditReqPatient] = useState('');
  const [editReqGroup, setEditReqGroup] = useState<BloodGroup>('O+');
  const [editReqBags, setEditReqBags] = useState(1);
  const [editReqHospital, setEditReqHospital] = useState('');
  const [editReqPhone, setEditReqPhone] = useState('');
  const [editReqDate, setEditReqDate] = useState('');
  const [editReqTime, setEditReqTime] = useState('');
  const [editReqAddress, setEditReqAddress] = useState('');
  const [editReqReason, setEditReqReason] = useState('');
  const [editReqLevel, setEditReqLevel] = useState<'Normal' | 'Urgent' | 'Critical'>('Normal');
  const [editReqStatus, setEditReqStatus] = useState<'pending' | 'fulfilled' | 'cancelled'>('pending');
  const [editReqNotes, setEditReqNotes] = useState('');

  const syncData = async () => {
    setIsLoading(true);
    try {
      const usersData = await api.adminGetUsers();
      setUsers(usersData);

      const reqData = await api.getRequests();
      setRequests(reqData);

      const actsData = await api.adminGetActivities();
      setActivities(actsData);
    } catch (err) {
      console.error('Failed fetching university network directory', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncData();
  }, []);

  const toastFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const handleToggleVerify = async (userId: string) => {
    try {
      const updatedUser = await api.adminToggleVerify(userId);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toastFeedback(`Verification status updated for ${updatedUser.name}`);
      onRefreshStats();
    } catch {
      alert('Could not update profile verification status');
    }
  };

  const handleToggleSuspend = async (userId: string) => {
    try {
      const updatedUser = await api.adminToggleSuspend(userId);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
      toastFeedback(`Account restriction updated: ${updatedUser.name} is now ${updatedUser.isSuspended ? 'Suspended' : 'Active'}`);
      onRefreshStats();
    } catch {
      alert('Could not apply user account block restriction');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDel = users.find(u => u.id === userId);
    if (!userToDel) return;

    if (window.confirm(`Are you absolutely sure you want to completely BAN and delete ${userToDel.name}? This removes all profile records to safeguard university safety.`)) {
      try {
        await api.adminDeleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        toastFeedback(`${userToDel.name} removed from registry successfully.`);
        onRefreshStats();
      } catch {
        alert('Could not remove target profile');
      }
    }
  };

  const handleOpenEditDonor = (donor: User) => {
    setEditingDonor(donor);
    setEditDonorName(donor.name || '');
    setEditDonorPhone(donor.phone || '');
    setEditDonorEmail(donor.email || '');
    setEditDonorBloodGroup(donor.bloodGroup || 'O+');
    setEditDonorDept(donor.department || '');
    setEditDonorHall(donor.hall || '');
    setEditDonorRoll(donor.roll || '');
    setEditDonorBatch(donor.batch || '');
    setEditDonorDonationCount(donor.donationCount || 0);
    setEditDonorLastDate(donor.lastDonationDate || '');
    setEditDonorAvailable(donor.isAvailable);
    setEditDonorVerified(donor.isVerified);
  };

  const handleSaveDonorDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDonor) return;

    try {
      const updated = await api.adminUpdateDonor(editingDonor.id, {
        name: editDonorName,
        phone: editDonorPhone,
        email: editDonorEmail,
        bloodGroup: editDonorBloodGroup,
        department: editDonorDept,
        hall: editDonorHall,
        roll: editDonorRoll,
        batch: editDonorBatch,
        donationCount: Number(editDonorDonationCount),
        lastDonationDate: editDonorLastDate,
        isAvailable: editDonorAvailable,
        isVerified: editDonorVerified,
      });

      setUsers(users.map(u => u.id === editingDonor.id ? updated : u));
      setEditingDonor(null);
      toastFeedback(`Donor ${updated.name} updated successfully`);
      onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed saving donor metadata corrections');
    }
  };

  const handleOpenEditRequest = (req: BloodRequest) => {
    setEditingRequest(req);
    setEditReqPatient(req.patientName || '');
    setEditReqGroup(req.bloodGroup || 'O+');
    setEditReqBags(req.unitsRequired || 1);
    setEditReqHospital(req.hospital || '');
    setEditReqPhone(req.phone || '');
    setEditReqDate(req.dateNeeded || '');
    setEditReqTime(req.requiredTime || '');
    setEditReqAddress(req.hospitalAddress || '');
    setEditReqReason(req.reason || '');
    setEditReqLevel(req.emergencyLevel || 'Normal');
    setEditReqStatus(req.status || 'pending');
    setEditReqNotes(req.notes || '');
  };

  const handleSaveRequestDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest) return;

    try {
      const updated = await api.adminUpdateRequest(editingRequest.id, {
        patientName: editReqPatient,
        bloodGroup: editReqGroup,
        unitsRequired: Number(editReqBags),
        hospital: editReqHospital,
        dateNeeded: editReqDate,
        phone: editReqPhone,
        reason: editReqReason,
        isEmergency: editReqLevel === 'Critical' || editReqLevel === 'Urgent',
        status: editReqStatus,
        requiredTime: editReqTime,
        hospitalAddress: editReqAddress,
        emergencyLevel: editReqLevel,
        notes: editReqNotes
      });

      setRequests(requests.map(r => r.id === editingRequest.id ? updated : r));
      setEditingRequest(null);
      toastFeedback(`Assistance request for ${updated.patientName} corrected`);
      onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Failed correction save');
    }
  };

  const handleUpdateStatusQuick = async (reqId: string, status: 'pending' | 'fulfilled' | 'cancelled') => {
    try {
      const updated = await api.adminUpdateRequest(reqId, { status });
      setRequests(requests.map(r => r.id === reqId ? updated : r));
      toastFeedback(`Request status transitioned to '${status.toUpperCase()}'`);
      onRefreshStats();
    } catch (err: any) {
      alert(err.message || 'Status transition denied');
    }
  };

  const activeDonorsCount = users.filter(u => u.role === 'donor' && !u.isSuspended).length;
  const availableDonorsCount = users.filter(u => u.role === 'donor' && u.isAvailable && !u.isSuspended).length;
  const totalBRequests = requests.length;
  const emergencyRequestsCount = requests.filter(r => r.isEmergency && r.status === 'pending').length;
  
  const todayStr = new Date().toISOString().substring(0, 10);
  const newUsersToday = users.filter(u => u.createdAt && u.createdAt.substring(0, 10) === todayStr).length;

  const bloodGroupStats: Record<BloodGroup, number> = {
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0, 'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
  };
  users.forEach(u => {
    if (u.role === 'donor' && u.bloodGroup in bloodGroupStats && !u.isSuspended) {
      bloodGroupStats[u.bloodGroup as BloodGroup]++;
    }
  });

  const hallStatsCount: Record<string, number> = {};
  users.forEach(u => {
    if (u.role === 'donor' && !u.isSuspended) {
      const hall = u.hall || 'Main Campus';
      hallStatsCount[hall] = (hallStatsCount[hall] || 0) + 1;
    }
  });
  const sortedHalls = Object.entries(hallStatsCount).sort((a, b) => b[1] - a[1]);

  const filteredUsers = users.filter(u => {
    if (u.id === currentUser.id) return false;

    const matchSearch = donorSearch === '' || 
      u.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      u.phone.includes(donorSearch) ||
      u.email.toLowerCase().includes(donorSearch.toLowerCase()) ||
      u.department.toLowerCase().includes(donorSearch.toLowerCase()) ||
      u.hall.toLowerCase().includes(donorSearch.toLowerCase());

    const matchBlood = donorBloodGroup === '' || u.bloodGroup === donorBloodGroup;
    const matchDept = donorDept === '' || u.department.toLowerCase().includes(donorDept.toLowerCase());

    let matchAvail = true;
    if (donorAvailability === 'available') {
      matchAvail = u.isAvailable === true;
    } else if (donorAvailability === 'resting') {
      matchAvail = u.isAvailable === false;
    }

    return matchSearch && matchBlood && matchDept && matchAvail;
  });

  // Easy reading: pending requests first, urgent/critical before normal,
  // then newest first — so a new request is always easy to spot at the top.
  const levelRank = (level?: string) => level === 'Critical' ? 0 : level === 'Urgent' ? 1 : 2;
  const filteredRequests = requests.filter(r => {
    const matchSearch = requestSearch === '' ||
      r.patientName.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.hospital.toLowerCase().includes(requestSearch.toLowerCase()) ||
      r.phone.includes(requestSearch) ||
      r.reason.toLowerCase().includes(requestSearch.toLowerCase());

    const matchBlood = requestBloodGroup === '' || r.bloodGroup === requestBloodGroup;
    const matchStatus = requestStatus === '' || r.status === requestStatus;
    const matchLevel = requestLevel === '' || r.emergencyLevel === requestLevel;

    return matchSearch && matchBlood && matchStatus && matchLevel;
  }).sort((a, b) => {
    const statusRank = (s: string) => s === 'pending' ? 0 : 1;
    if (statusRank(a.status) !== statusRank(b.status)) return statusRank(a.status) - statusRank(b.status);
    if (levelRank(a.emergencyLevel) !== levelRank(b.emergencyLevel)) return levelRank(a.emergencyLevel) - levelRank(b.emergencyLevel);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Easy labels for the request cards, filters and buttons (same values,
  // only the words shown on screen are simpler).
  const levelLabel = (level?: string) => level === 'Critical' ? 'Khub Joruri' : level === 'Urgent' ? 'Joruri' : 'Sadharon';
  const statusLabel = (status: string) => status === 'pending' ? 'Rokto Lagbe' : status === 'fulfilled' ? 'Pawa Geche' : 'Batil';
  const isNewRequest = (createdAt: string) => {
    const t = new Date(createdAt).getTime();
    return !isNaN(t) && Date.now() - t < 24 * 60 * 60 * 1000;
  };

  return (
    <div className="w-full text-white">
      {/* Toast Alert Feedback Banner */}
      {actionMessage && (
        <div className="fixed top-24 right-6 z-50 rounded-xl bg-teal-500/10 border border-teal-500/30 p-4 shadow-xl text-xs text-teal-400 font-bold flex items-center space-x-2 animate-bounce">
          <Award className="h-5 w-5 text-teal-400 animate-pulse" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Admin Dashboard Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-6 gap-4">
        <div>
          <h2 className="font-display text-2xl font-black text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-[#FF1E1E] drop-shadow-[0_0_8px_rgba(255,30,30,0.4)]" />
            <span>RedLife Control Room</span>
          </h2>
          <p className="text-xs text-gray-400">Coordinate emergency campus blood donor allocations and real-time requests</p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#111827] p-1 rounded-xl border border-white/5 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-[#FF1E1E] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'donors' 
                ? 'bg-[#FF1E1E] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 Donors ({users.filter(u => u.role === 'donor').length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'requests' 
                ? 'bg-[#FF1E1E] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🩸 Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'activities' 
                ? 'bg-[#FF1E1E] text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ⚡ Live Activity
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center">
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#111827] border border-[#FF1E1E]/20 text-[#FF1E1E] animate-spin">
            <span className="font-mono font-black text-xs">R</span>
          </div>
          <p className="mt-4 text-xs font-bold text-gray-400 animate-pulse">Syncing university database matrices...</p>
        </div>
      ) : (
        <>
          {/* ==================================== */}
          {/* 1. OVERVIEW TAB PANEL CONTAINER    * */}
          {/* ==================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick High-level Indicators Grid */}
              <div className="grid gap-4 grid-cols-2 lg:grid-cols-6 text-white">
                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Total Donors</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-white">{users.filter(u => u.role === 'donor').length}</p>
                    <Users className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase block mt-1.5">Registered index</span>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Active Donors</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-white">{activeDonorsCount}</p>
                    <CheckCircle className="h-5 w-5 text-[#FF1E1E]" />
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mt-1.5">Excluding suspended</span>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Available Ready</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-[#FF1E1E] drop-shadow-[0_0_8px_rgba(255,30,30,0.4)]">{availableDonorsCount}</p>
                    <Flame className="h-5 w-5 text-[#FF1E1E]" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 block mt-1.5 uppercase">Dispatch Ready</span>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Total Requests</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-white">{totalBRequests}</p>
                    <AlertTriangle className="h-5 w-5 text-gray-500" />
                  </div>
                  <span className="text-[9px] font-bold text-gray-400 uppercase block mt-1.5">Appeals log count</span>
                </div>

                <div className="rounded-2xl border border-[#FF1E1E]/20 bg-[#FF1E1E]/5 p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FF1E1E] block mb-1">Critical Urgents</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-[#FF1E1E] drop-shadow-[0_0_8px_rgba(255,30,30,0.5)]">{emergencyRequestsCount}</p>
                    <ShieldAlert className="h-5 w-5 text-[#FF1E1E] animate-pulse" />
                  </div>
                  <span className="text-[9px] font-bold text-[#FF1E1E] uppercase block mt-1.5">Immediate alerts</span>
                </div>

                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-lg">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 block mb-1">Signups Today</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <p className="font-mono text-3xl font-black text-indigo-400">{newUsersToday}</p>
                    <Clock className="h-5 w-5 text-indigo-400" />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-400 block mt-1.5 uppercase font-sans">New members joined</span>
                </div>
              </div>

              {/* Grid 2 - Statistics Visualization Tables */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Blood Group Matrix Counts */}
                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl">
                  <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide mb-4 flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-[#FF1E1E]" />
                    <span>Blood Distribution Matrix</span>
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(Object.keys(bloodGroupStats) as BloodGroup[]).map((grp) => {
                      const count = bloodGroupStats[grp];
                      return (
                        <div key={grp} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#111827] border border-white/5 hover:border-[#FF1E1E]/20 transition-colors">
                          <span className="font-mono text-xs font-black text-[#FF1E1E] bg-[#FF1E1E]/15 border border-[#FF1E1E]/25 px-2 py-0.5 rounded">
                            {grp}
                          </span>
                          <span className="font-mono text-lg font-black text-white mt-2">{count}</span>
                          <span className="text-[9px] text-gray-400 block font-semibold uppercase">donors</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hall Wise Donor Counts */}
                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <Home className="h-4 w-4 text-[#FF1E1E]" />
                      <span>Residential Hall Distribution</span>
                    </h3>
                    <p className="text-[11px] text-gray-400 mb-4">Total campus donors by university dormitory/residence</p>
                  </div>
                  
                  {sortedHalls.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 font-semibold italic">No dormitory statistics logged.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar scrollbar-thin scrollbar-thumb-white/10">
                      {sortedHalls.map(([hallName, num]) => {
                        const totalDonors = users.filter(u => u.role === 'donor').length || 1;
                        const pct = Math.max(5, Math.min(100, (num / totalDonors) * 100));
                        return (
                          <div key={hallName} className="flex flex-col space-y-1">
                            <div className="flex items-center justify-between text-xs text-gray-350 font-semibold">
                              <span className="truncate pr-1">{hallName}</span>
                              <span className="font-mono text-[#FF1E1E] font-extrabold">{num}</span>
                            </div>
                            <div className="h-1.5 w-full bg-[#111827] rounded-full overflow-hidden border border-white/5">
                              <div className="h-full bg-[#FF1E1E] rounded-full shadow-[0_0_8px_rgba(255,30,30,0.5)]" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid 3 - Mini Latest Activity stream & Recently registered donors */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Live stream logs */}
                <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-[#FF1E1E] animate-pulse" />
                      <span>Live Activity Logs</span>
                    </h3>
                  </div>

                  {activities.length === 0 ? (
                    <div className="py-12 text-center text-xs text-gray-500 font-semibold">No admin system log activities found yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                      {activities.slice(0, 7).map((act) => (
                        <div key={act.id} className="flex items-start text-xs border-b border-white/5 pb-2.5 last:border-b-0 text-gray-300">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider shrink-0 mr-3 border ${
                            act.type === 'registration' 
                              ? 'bg-[#FF1E1E]/15 text-[#FF1E1E] border-[#FF1E1E]/20' 
                              : act.type === 'request'
                              ? 'bg-amber-550 bg-amber-500/15 text-amber-400 border border-amber-500/20'
                              : act.type === 'login'
                              ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                              : 'bg-white/5 text-gray-400 border border-white/10'
                          }`}>
                            {act.type}
                          </span>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-semibold text-white break-words">{act.message}</p>
                            <span className="text-[9px] text-gray-500 mt-0.5 block flex items-center font-mono gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently registered donors panel */}
                <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl">
                  <h3 className="font-display text-sm font-bold text-white uppercase tracking-wide mb-4 pb-2 border-b border-white/5">
                    Recently Active/Joined
                  </h3>

                  <div className="space-y-4">
                    {users
                      .filter(u => u.role === 'donor' && !u.isSuspended)
                      .slice(-4)
                      .reverse()
                      .map((donor) => (
                        <div key={donor.id} className="flex items-center space-x-3 text-xs">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF1E1E] text-white font-mono font-black text-xs shadow-[0_0_8px_rgba(255,30,30,0.35)]">
                            {donor.bloodGroup}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="font-bold text-white truncate">{donor.name}</h4>
                            <p className="text-[10px] text-gray-400 truncate">{donor.department}</p>
                          </div>
                          <span className={`h-2 w-2 rounded-full ${donor.isAvailable ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-gray-600'}`} title={donor.isAvailable ? 'Available' : 'Resting'} />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* 2. DONORS DIRECTORY TAB PANEL      * */}
          {/* ==================================== */}
          {activeTab === 'donors' && (
            <div className="space-y-5">
              {/* Directory Controls header bar */}
              <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-xl">
                <div className="grid gap-3.5 sm:grid-cols-12">
                  <div className="relative sm:col-span-4">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name, phone, email, hall..."
                      value={donorSearch}
                      onChange={(e) => setDonorSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-10 pr-4 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={donorBloodGroup}
                      onChange={(e) => setDonorBloodGroup(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="" className="bg-[#0B1220]">Blood Group: All</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={donorAvailability}
                      onChange={(e) => setDonorAvailability(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="" className="bg-[#0B1220]">Availability: All</option>
                      <option value="available" className="bg-[#0B1220]">Ready to Donate</option>
                      <option value="resting" className="bg-[#0B1220]">Resting Now</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Department filter..."
                      value={donorDept}
                      onChange={(e) => setDonorDept(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                </div>
              </div>

              {/* Grid lists of donors */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 bg-[#0B1220] rounded-2xl border border-white/8 p-8 shadow-xl">
                  <UserMinus className="h-8 w-8 text-gray-500 mx-auto" />
                  <p className="mt-2 text-xs font-bold text-gray-400">No donor registered matches the specified directory query.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredUsers.map((donor) => (
                    <div 
                      key={donor.id} 
                      className={`relative rounded-2xl border bg-[#0B1220] p-5 shadow-xl overflow-hidden flex flex-col justify-between hover:border-[#FF1E1E]/30 transition-all ${
                        donor.isSuspended 
                          ? 'border-gray-700 opacity-60 bg-black/40' 
                          : donor.isVerified 
                          ? 'border-white/8' 
                          : 'border-amber-500/20 bg-amber-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 text-left">
                        <div className="flex items-start space-x-3">
                          <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl font-mono font-black text-base shadow-sm ${
                            donor.isSuspended 
                              ? 'bg-gray-800 text-gray-400' 
                              : 'bg-[#FF1E1E] text-white'
                          }`}>
                            <span>{donor.bloodGroup}</span>
                          </div>
                          
                          <div className="min-w-0 text-left">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <h4 className="font-display text-sm font-bold text-white truncate max-w-[140px]">{donor.name}</h4>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider border ${
                                donor.isSuspended
                                  ? 'bg-red-950 text-red-400 border-red-900/40'
                                  : donor.isVerified 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              }`}>
                                {donor.isSuspended ? 'SUSPENDED' : donor.isVerified ? 'VERIFIED' : 'PENDING'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 truncate">{donor.department}</p>
                            <p className="text-[10px] text-gray-500 flex items-center font-semibold gap-0.5 mt-0.5">
                              <MapPin className="h-3 w-3 text-[#FF1E1E] shrink-0" />
                              <span>{donor.hall} {donor.batch ? `&bull; ${donor.batch}` : ''}</span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-black block text-center uppercase tracking-wider border ${
                            donor.isAvailable 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-white/5 text-gray-400 border-white/5'
                          }`}>
                            {donor.isAvailable ? 'AVAILABLE' : 'RESTING'}
                          </span>
                        </div>
                      </div>

                      <div className="my-3.5 border-t border-white/5 pt-3 grid grid-cols-2 gap-3 text-[11px] text-gray-300 text-left">
                        <div>
                          <p className="text-[9px] text-gray-500 font-extrabold uppercase">Phone Code</p>
                          <p className="font-mono font-bold text-white">{donor.phone}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 font-extrabold uppercase">Email address</p>
                          <p className="truncate font-semibold text-white">{donor.email}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 font-extrabold uppercase">Roll & Batch</p>
                          <p className="font-medium text-white font-mono">
                            {donor.roll ? `Roll ${donor.roll}` : 'No Roll'} &bull; {donor.batch || 'Batch'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 font-extrabold uppercase">Donations count / last date</p>
                          <p className="font-bold text-white">
                            {donor.donationCount || 0} times ({donor.lastDonationDate || 'First Registration'})
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-white/5 pt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleToggleVerify(donor.id)}
                            className={`flex h-8 px-2.5 items-center justify-center rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer border ${
                              donor.isVerified 
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25'
                            } transition-colors`}
                          >
                            <ShieldCheck className="h-3.5 w-3.5 shrink-0 mr-1" />
                            {donor.isVerified ? 'Revoke Verify' : 'Approve Verify'}
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(donor.id)}
                            className={`flex h-8 px-2.5 items-center justify-center rounded-lg text-[9px] font-extrabold uppercase tracking-wide cursor-pointer border ${
                              donor.isSuspended 
                                ? 'bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/30 hover:bg-[#FF1E1E]/25' 
                                : 'bg-[#FF1E1E]/10 text-red-400 border border-[#FF1E1E]/20 hover:bg-[#FF1E1E]/20'
                            } transition-colors`}
                          >
                            <UserX className="h-3.5 w-3.5 shrink-0 mr-1" />
                            {donor.isSuspended ? 'Unsuspend' : 'Suspend Ban'}
                          </button>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleOpenEditDonor(donor)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/8 transition cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(donor.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF1E1E]/10 border border-[#FF1E1E]/20 text-[#FF1E1E] hover:bg-[#FF1E1E]/25 transition-colors cursor-pointer"
                            title="Delete / Ban fake account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================== */}
          {/* 3. BLOOD REQUESTS TAB PANEL        * */}
          {/* ==================================== */}
          {activeTab === 'requests' && (
            <div className="space-y-5">
              {/* Requests Search Options bar */}
              <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-xl">
                <div className="grid gap-3.5 sm:grid-cols-12">
                  <div className="relative sm:col-span-5">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search patient, hospital, context, phone..."
                      value={requestSearch}
                      onChange={(e) => setRequestSearch(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] pl-10 pr-4 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={requestBloodGroup}
                      onChange={(e) => setRequestBloodGroup(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="" className="bg-[#0B1220]">Blood Needed: All</option>
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                        <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={requestStatus}
                      onChange={(e) => setRequestStatus(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="" className="bg-[#0B1220]">Obostha: Shob</option>
                      <option value="pending" className="bg-[#0B1220]">Rokto Lagbe</option>
                      <option value="fulfilled" className="bg-[#0B1220]">Pawa Geche</option>
                      <option value="cancelled" className="bg-[#0B1220]">Batil</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <select
                      value={requestLevel}
                      onChange={(e) => setRequestLevel(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-2.5 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="" className="bg-[#0B1220]">Level: Shob</option>
                      <option value="Normal" className="bg-[#0B1220]">Sadharon</option>
                      <option value="Urgent" className="bg-[#0B1220]">Joruri</option>
                      <option value="Critical" className="bg-[#0B1220]">Khub Joruri</option>
                    </select>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 font-medium -mt-2 mb-1">
                Notun request shobar age upore dekhabe. Joruri request lal/holud diye chihnito. Button er mane: <strong className="text-white">Abar Kholo</strong> = request abar chalu, <strong className="text-white">Rokto Pawa Geche</strong> = rokto pawa geche, <strong className="text-white">Batil Koro</strong> = request batil.
              </p>

              {/* Grid indices of requests */}
              {filteredRequests.length === 0 ? (
                <div className="text-center py-16 bg-[#0B1220] rounded-2xl border border-white/8 p-8 shadow-xl">
                  <Flame className="h-8 w-8 text-gray-500 mx-auto animate-pulse" />
                  <p className="mt-2 text-xs font-bold text-gray-400">No assistant blood requests matches the specified query filters.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 text-white">
                  {filteredRequests.map((req) => (
                    <div 
                      key={req.id}
                      className="rounded-2xl border border-white/8 bg-[#0B1220] p-5 shadow-xl hover:border-[#FF1E1E]/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Appeal card header */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 gap-3 text-left">
                          <div className="flex items-center space-x-2.5">
                            <span className="font-mono text-sm font-black bg-[#FF1E1E] text-white px-3 py-1 rounded-lg shadow-[0_0_8px_rgba(255,30,30,0.35)]">
                              {req.bloodGroup}
                            </span>
                            {req.status === 'pending' && isNewRequest(req.createdAt) && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white animate-pulse">
                                NOTUN
                              </span>
                            )}
                            <div className="min-w-0 text-left">
                              <h4 className="font-display font-extrabold text-white truncate">{req.patientName}</h4>
                              <p className="text-[10px] text-gray-400">Needed Units: <strong className="text-white font-mono text-xs">{req.unitsRequired} bags</strong></p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1 select-none">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest border ${
                              req.emergencyLevel === 'Critical' 
                                ? 'bg-[#FF1E1E]/20 text-[#FF1E1E] border border-[#FF1E1E]/40 animate-pulse-slow' 
                                : req.emergencyLevel === 'Urgent'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-white/5 text-gray-400 border border-white/5'
                            }`}>
                              {levelLabel(req.emergencyLevel)}
                            </span>

                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              req.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : req.status === 'fulfilled'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-white/5 text-gray-500 border border-white/10'
                            }`}>
                              {statusLabel(req.status)}
                            </span>
                          </div>
                        </div>

                        {/* Middle grid attributes information */}
                        <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-300 pb-3 mb-3 border-b border-white/5 text-left">
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 font-extrabold">Hospital & Location</p>
                            <p className="font-bold text-white line-clamp-1">{req.hospital}</p>
                            {req.hospitalAddress && <p className="text-[10px] text-gray-500 uppercase leading-none truncate">{req.hospitalAddress}</p>}
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 font-extrabold">Contact Number</p>
                            <p className="font-bold font-mono text-white">{req.phone}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 font-extrabold">Required Date/Time</p>
                            <p className="font-bold text-white">{req.dateNeeded} &bull; {req.requiredTime || 'ASAP'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase text-gray-500 font-extrabold">Appeal Reason context</p>
                            <p className="italic text-gray-400 line-clamp-2">&ldquo;{req.reason}&rdquo;</p>
                          </div>
                        </div>
                      </div>

                      {/* Operation controllers buttons bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-auto">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdateStatusQuick(req.id, 'pending')}
                            disabled={req.status === 'pending'}
                            title="Ei request ta abar chalu koro (Rokto Lagbe)"
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-bold rounded cursor-pointer disabled:opacity-25"
                          >
                            Abar Kholo
                          </button>
                          <button
                            onClick={() => handleUpdateStatusQuick(req.id, 'fulfilled')}
                            disabled={req.status === 'fulfilled'}
                            title="Rokto pawa geche, request sesh koro"
                            className="px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-5–/30 text-[10px] font-bold rounded cursor-pointer disabled:opacity-25"
                          >
                            Rokto Pawa Geche ✓
                          </button>
                          <button
                            onClick={() => handleUpdateStatusQuick(req.id, 'cancelled')}
                            disabled={req.status === 'cancelled'}
                            title="Ei request ta batil koro"
                            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/8 text-[10px] font-bold rounded cursor-pointer disabled:opacity-25"
                          >
                            Batil Koro
                          </button>
                        </div>

                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditRequest(req)}
                            className="flex h-8 px-2.5 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/8 text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            <Edit className="h-3 w-3 mr-1 text-[#FF1E1E]" />
                            Thik Koro
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================================== */}
          {/* 4. SYSTEM ACTIVITIES LOGS TAB      * */}
          {/* ==================================== */}
          {activeTab === 'activities' && (
            <div className="rounded-2xl border border-white/8 bg-[#0B1220] p-6 shadow-xl text-left">
              <div className="border-b border-white/5 pb-4 mb-4">
                <h3 className="font-display text-lg font-extrabold text-white flex items-center gap-1.5">
                  <Activity className="h-5 w-5 text-[#FF1E1E] animate-pulse" />
                  <span>Real-time University Blood Network Activities</span>
                </h3>
                <p className="text-xs text-gray-400">Automatic system log recording signups today, logins, status updates, and emergency alerts</p>
              </div>

              {activities.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-8 w-8 text-gray-600 mx-auto" />
                  <p className="mt-2 text-xs font-bold text-gray-500">Clean system activity logs. No logs recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {activities.map((act) => (
                    <div key={act.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-left">
                      <div className="flex items-start space-x-3 min-w-0 text-left">
                        <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5 border ${
                          act.type === 'registration' 
                            ? 'bg-[#FF1E1E]/15 text-[#FF1E1E] border-[#FF1E1E]/20' 
                            : act.type === 'request'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : act.type === 'login'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-white/5 text-gray-400 border border-white/10 font-bold'
                        }`}>
                          {act.type}
                        </span>
                        <p className="font-semibold text-white text-left break-words">{act.message}</p>
                      </div>

                      <span className="text-[10px] text-gray-500 shrink-0 font-mono text-right flex items-center justify-end gap-1 select-none">
                        <Clock className="h-3 w-3 text-gray-600" />
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* 5. MODAL: EDIT DONOR PROFILE DETAILS (Overlay layout screen)   */}
      {/* ============================================================== */}
      {editingDonor && (
        <div className="fixed inset-0 bg-[#050816]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1220] rounded-2xl border border-white/8 w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-modal-enter text-left">
            <div className="bg-[#111827] text-white p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#FF1E1E]">Correct Donor Profiling</h3>
                <p className="text-[10px] text-gray-400">Rectifying university accounts indices verification parameters</p>
              </div>
              <button 
                onClick={() => setEditingDonor(null)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDonorDetails} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editDonorName}
                    onChange={(e) => setEditDonorName(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Mobile Phone (University)</label>
                  <input
                    type="text"
                    required
                    value={editDonorPhone}
                    onChange={(e) => setEditDonorPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={editDonorEmail}
                    onChange={(e) => setEditDonorEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Blood Group</label>
                  <select
                    value={editDonorBloodGroup}
                    onChange={(e) => setEditDonorBloodGroup(e.target.value as BloodGroup)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={editDonorDept}
                    onChange={(e) => setEditDonorDept(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Dormitory Hall</label>
                  <input
                    type="text"
                    required
                    value={editDonorHall}
                    onChange={(e) => setEditDonorHall(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>



                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Roll ID Number</label>
                  <input
                    type="text"
                    value={editDonorRoll}
                    onChange={(e) => setEditDonorRoll(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Batch Identifier</label>
                  <input
                    type="text"
                    value={editDonorBatch}
                    onChange={(e) => setEditDonorBatch(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Donation Count</label>
                  <input
                    type="number"
                    value={editDonorDonationCount}
                    onChange={(e) => setEditDonorDonationCount(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Last Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={editDonorLastDate}
                    onChange={(e) => setEditDonorLastDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div className="flex items-center space-x-4 pt-4 select-none">
                  <label className="flex items-center space-x-2 text-xs font-bold text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDonorAvailable}
                      onChange={(e) => setEditDonorAvailable(e.target.checked)}
                      className="rounded border-white/10 text-[#FF1E1E] bg-[#111827] focus:ring-red-400"
                    />
                    <span>Available status</span>
                  </label>

                  <label className="flex items-center space-x-2 text-xs font-bold text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDonorVerified}
                      onChange={(e) => setEditDonorVerified(e.target.checked)}
                      className="rounded border-white/10 text-[#FF1E1E] bg-[#111827] focus:ring-red-400"
                    />
                    <span>Verified approval</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-white/5 pt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="h-10 px-4 rounded-xl text-xs font-extrabold uppercase border border-white/10 text-gray-405 text-gray-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-[#FF1E1E] text-white hover:bg-[#ff3c3c] hover:shadow-[0_0_12px_rgba(255,30,30,0.5)] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. MODAL: EDIT BLOOD REQUEST DETAILS (Overlay layout screen) */}
      {/* ============================================================== */}
      {editingRequest && (
        <div className="fixed inset-0 bg-[#050816]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0B1220] rounded-2xl border border-white/8 w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-modal-enter text-left">
            <div className="bg-[#111827] text-white p-5 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-[#FF1E1E]">Modify Emergency Appeal</h3>
                <p className="text-[10px] text-gray-400">Adjust safety requirements and verification status</p>
              </div>
              <button 
                onClick={() => setEditingRequest(null)}
                className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRequestDetails} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={editReqPatient}
                    onChange={(e) => setEditReqPatient(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Blood Group Needed</label>
                  <select
                    value={editReqGroup}
                    onChange={(e) => setEditReqGroup(e.target.value as BloodGroup)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Bags Needed</label>
                  <input
                    type="number"
                    required
                    value={editReqBags}
                    onChange={(e) => setEditReqBags(Number(e.target.value))}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Hospital / Clinic Name</label>
                  <input
                    type="text"
                    required
                    value={editReqHospital}
                    onChange={(e) => setEditReqHospital(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Contact Number</label>
                  <input
                    type="text"
                    required
                    value={editReqPhone}
                    onChange={(e) => setEditReqPhone(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Date Needed</label>
                  <input
                    type="date"
                    required
                    value={editReqDate}
                    onChange={(e) => setEditReqDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Time details</label>
                  <input
                    type="text"
                    value={editReqTime}
                    onChange={(e) => setEditReqTime(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                    placeholder="10:00 AM"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Priority Severity Level</label>
                  <select
                    value={editReqLevel}
                    onChange={(e) => setEditReqLevel(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="Normal" className="bg-[#0B1220]">Normal Priority</option>
                    <option value="Urgent" className="bg-[#0B1220]">Urgent severity</option>
                    <option value="Critical" className="bg-[#0B1220]">Critical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Request status</label>
                  <select
                    value={editReqStatus}
                    onChange={(e) => setEditReqStatus(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                  >
                    <option value="pending" className="bg-[#0B1220]">Pending appeal</option>
                    <option value="fulfilled" className="bg-[#0B1220]">Fulfilled ✓</option>
                    <option value="cancelled" className="bg-[#0B1220]">Cancelled / Refused</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Hospital Address Location details</label>
                  <input
                    type="text"
                    value={editReqAddress}
                    onChange={(e) => setEditReqAddress(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Reason Context or Blood Appeal cause</label>
                  <textarea
                    required
                    value={editReqReason}
                    onChange={(e) => setEditReqReason(e.target.value)}
                    className="w-full h-20 rounded-xl border border-white/8 bg-[#111827] p-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E] resize-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Administrative Notes</label>
                  <input
                    type="text"
                    value={editReqNotes}
                    onChange={(e) => setEditReqNotes(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-semibold text-white outline-none focus:border-[#FF1E1E]"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRequest(null)}
                  className="h-10 px-4 rounded-xl text-xs font-extrabold uppercase border border-white/10 text-gray-400 hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-[#FF1E1E] text-white hover:bg-[#ff3c3c] hover:shadow-[0_0_12px_rgba(255,30,30,0.5)] cursor-pointer"
                >
                  Save Appeal details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
