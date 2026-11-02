import React, { useState } from 'react';
import { X, Droplet, Check, Heart, Users, ShieldCheck } from 'lucide-react';
import { BloodGroup } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: 'login' | 'register';
  onAuthSuccess: (token: string, user: any) => void;
  apiRegister: (details: any) => Promise<any>;
  apiLogin: (identifier: string, pass: string) => Promise<any>;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialView,
  onAuthSuccess,
  apiRegister,
  apiLogin,
}: AuthModalProps) {
  // Active inner view state
  const [view, setView] = useState<'login' | 'register'>(initialView);

  // Sync state with open/close views
  React.useEffect(() => {
    setView(initialView);
    setErrorMsg('');
  }, [initialView, isOpen]);

  // Registration States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [roll, setRoll] = useState('');
  const [batch, setBatch] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [donationCount, setDonationCount] = useState<number | ''>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [password, setPassword] = useState('');

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  // Barishal address dropdown for the signup form (replaces Residential Hall)
  const barishalAreas = [
    'Barishal Sadar',
    'Kawnia',
    'Rupatoli',
    'Nathullabad',
    'Kashipur',
    'Amanatganj',
    'Sagardi',
    'Alekanda',
    'Nabogram Road',
    'Ruiya',
    'Sadar Road',
    'Chowmatha',
    'Bangla Bazar',
    'Palashpur',
    'Other Area in Barishal',
  ];

  if (!isOpen) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    // Roll validation: exactly 2 digits
    if (roll && !/^\d{2}$/.test(roll)) {
      setErrorMsg('Roll must accept exactly 2 digits.');
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRegister({
        name,
        email: `${phone}@univ.edu`, // Programmatic email since input is removed
        phone,
        bloodGroup,
        department,
        hall: address, // maps to residential hall
        address,
        roll,
        batch,
        donationCount: donationCount === '' ? 0 : Number(donationCount),
        lastDonationDate,
        isAvailable,
        password,
      });
      onAuthSuccess(data.token, data.user);
      setIsSubmittedSuccessfully(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Ensure all information is correct.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const data = await apiLogin(loginPhone, loginPassword);
      onAuthSuccess(data.token, data.user);
      onClose(); // Automatically close and dismiss modal to redirect
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid mobile phone number or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubmittedSuccessfully(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/80 p-4 backdrop-blur-md">
      <div 
        className={`relative w-full ${isSubmittedSuccessfully ? 'max-w-3xl' : 'max-w-lg'} rounded-3xl border border-white/8 bg-[#0B1220] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 md:p-8">
          
          {isSubmittedSuccessfully ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl animate-in zoom-in-95 duration-300">
              {/* Top red banner: solid red, so white text stays white in both themes */}
              <div className="bg-[#FF1E1E] px-6 py-5 text-center">
                <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg">
                  <Droplet className="h-8 w-8 fill-[#FF1E1E] text-[#FF1E1E]" />
                  <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white border-2 border-white">
                    <Check className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-white">
                  Welcome{name ? `, ${name}` : ''}!
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  Your donor profile is now live
                </p>
              </div>

              {/* Main welcome area: dark text on white, with a filled side panel */}
              <div className="grid md:grid-cols-5">
                <div className="p-6 md:p-8 md:col-span-3 text-left">
                  <h2 className="font-display text-2xl font-black leading-tight text-[#0B132B]">
                    Welcome to Trust University Barishal Campus Blood Donation Network
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Thank you for joining our volunteer donor network. You are now ready to help save lives on campus, and your profile will show up for emergency calls.
                  </p>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-red-50 p-3">
                      <Heart className="mt-0.5 h-5 w-5 shrink-0 fill-[#FF1E1E] text-[#FF1E1E]" />
                      <div>
                        <p className="text-sm font-bold text-[#0B132B]">Ready for emergencies</p>
                        <p className="text-xs leading-relaxed text-slate-600">Available donors can be contacted quickly when blood is needed urgently.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-slate-100 p-3">
                      <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#0B132B]" />
                      <div>
                        <p className="text-sm font-bold text-[#0B132B]">Campus network</p>
                        <p className="text-xs leading-relaxed text-slate-600">Students and faculty of Trust University, Barishal, helping each other.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-sm font-bold text-[#0B132B]">Verified profile</p>
                        <p className="text-xs leading-relaxed text-slate-600">You can log in anytime and update your availability.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClose}
                    className="mt-6 w-full rounded-xl bg-[#FF1E1E] py-3.5 font-display text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-[#ff3c3c] transition-all cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>

                {/* Side panel, so the popup does not look empty on wide screens */}
                <div className="bg-[#FF1E1E] p-6 md:p-7 md:col-span-2 flex flex-col justify-center text-center">
                  <Droplet className="mx-auto h-12 w-12 fill-white text-white" />
                  <p className="mt-4 font-display text-xl font-black leading-tight text-white">
                    Every Drop Saves a Life
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white">
                    One donation can help save more than one life. Your kindness today can give someone a tomorrow.
                  </p>
                  <div className="mt-5 border-t border-white pt-4 text-left">
                    <p className="text-xs font-bold uppercase tracking-widest text-white">
                      Trust University, Barishal
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white">
                      Ruiya, Nabogram Road, Barishal
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-white">
                      CSE • BBA • Pharmacy • EEE • English
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Modal Branding Header */}
              <div className="text-center mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF1E1E] text-white shadow-[0_0_12px_rgba(255,30,30,0.4)]">
                  <Droplet className="h-6 w-6 fill-white" />
                </div>
                <h2 className="mt-4 font-display text-xl font-extrabold text-white">
                  {view === 'login' ? 'Log In to Network' : 'Register as a Donor'}
                </h2>
                <p className="text-xs text-gray-450 text-gray-400 mt-1">
                  {view === 'login' 
                    ? 'Access your volunteer dashboard and update donation availability' 
                    : 'Share your blood count, contact coordinates to help save lives on campus'}
                </p>
              </div>

              {/* Error Message Plate */}
              {errorMsg && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/45 text-xs font-semibold text-red-400 p-3.5 mb-5 leading-normal">
                  {errorMsg}
                </div>
              )}

              {view === 'login' ? (
                /* Login Form Screen */
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Mobile Phone Number <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/8 bg-[#111827] px-3.5 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Password <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/8 bg-[#111827] px-3.5 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-[#FF1E1E] py-3.5 font-display text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_12px_rgba(255,30,30,0.45)] hover:bg-[#ff3c3c] disabled:opacity-45 transition-colors cursor-pointer mt-2"
                  >
                    {isLoading ? 'Verifying Credentials...' : 'Log In'}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-400">
                      Don't have a donor profile?{' '}
                      <button
                        type="button"
                        onClick={() => { setView('register'); setErrorMsg(''); }}
                        className="font-bold text-[#FF1E1E] hover:underline cursor-pointer"
                      >
                        Register as a Donor
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                /* Register Form Layout */
                <form onSubmit={handleRegister} className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-left custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                  <div className="grid gap-4 sm:grid-cols-2 text-left">
                    
                    {/* 1. Full Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Rafsan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* 2. Mobile Number */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                      />
                    </div>

                    {/* Blood Group */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Blood Group
                      </label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                      >
                        {bloodGroups.map(bg => (
                          <option key={bg} value={bg} className="bg-[#0B1220]">{bg}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Department */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Academic Department
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="CSE"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* 4. Address (Barishal dropdown, replaces Residential Hall) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Address
                      </label>
                      <select
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      >
                        <option value="" className="bg-[#0B1220]">Select your area in Barishal</option>
                        {barishalAreas.map(area => (
                          <option key={area} value={area} className="bg-[#0B1220]">{area}</option>
                        ))}
                      </select>
                    </div>

                    {/* 5. Roll (last 2 digits only) */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Roll (last 2 digits)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        pattern="\d{2}"
                        placeholder="02"
                        value={roll}
                        onChange={(e) => setRoll(e.target.value.replace(/\D/g, '').substring(0, 2))}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                      />
                    </div>

                    {/* 6. Batch */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Batch
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="9th Batch"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* How many times donated blood */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Times Donated Blood (Optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="4"
                        value={donationCount}
                        onChange={(e) => setDonationCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                      />
                    </div>

                    {/* Last Blood Donation Date */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Last Blood Donation Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={lastDonationDate}
                        onChange={(e) => setLastDonationDate(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* Create Password */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Create Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* Available for donation checkbox */}
                    <div className="sm:col-span-2 pt-1 border-t border-white/5 mt-2">
                      <label className="flex items-center space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAvailable}
                          onChange={(e) => setIsAvailable(e.target.checked)}
                          className="h-4.5 w-4.5 rounded border-white/10 bg-[#111827] text-[#FF1E1E] focus:ring-[#FF1E1E]"
                        />
                        <div className="text-left select-none">
                          <span className="text-xs font-bold text-gray-300 uppercase block">Available for donation</span>
                          <span className="text-[10px] text-gray-500 block leading-tight">Your profile will show up live as ready for emergency calls.</span>
                        </div>
                      </label>
                    </div>

                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-[#FF1E1E] py-3.5 font-display text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-[#ff3c3c] disabled:opacity-45 transition-colors cursor-pointer"
                  >
                    {isLoading ? 'Creating Profile...' : 'Sign Up'}
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-400">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => { setView('login'); setErrorMsg(''); }}
                        className="font-bold text-[#FF1E1E] hover:underline cursor-pointer"
                      >
                        Log In
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
