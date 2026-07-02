import React, { useState } from 'react';
import { X, Droplet, Check } from 'lucide-react';
import { BloodGroup, BANGLADESH_DISTRICTS } from '../types';

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
  const [district, setDistrict] = useState('Barishal');
  const [password, setPassword] = useState('');

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

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
        hall: address, // legacy support for search & view layout mapping
        address,
        district,
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
        className="relative w-full max-w-lg rounded-3xl border border-white/8 bg-[#0B1220] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-white"
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
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-in zoom-in-50 duration-300">
                <Check className="h-12 w-12" />
              </div>
              <div className="text-center">
                <h2 className="font-display text-2xl font-black text-white">
                  Registered Successfully!
                </h2>
                <p className="text-sm font-semibold text-emerald-400 mt-2">
                  Campus donor profile live
                </p>
                <p className="text-xs text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">
                  Thank you for enrolling in our volunteer donor network. Your life-saving contribution is highly appreciated on campus.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full max-w-xs rounded-xl bg-[#FF1E1E] py-3.5 font-display text-xs font-bold uppercase tracking-widest text-white shadow-[0_0_12px_rgba(255,30,30,0.45)] hover:bg-[#ff3c3c] transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
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
                        placeholder="e.g. Jane Doe"
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

                    {/* District Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        District
                      </label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                      >
                        {BANGLADESH_DISTRICTS.map(dist => (
                          <option key={dist} value={dist} className="bg-[#0B1220]">{dist}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Address */}
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Address
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Pritilata Hall, Room 304"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* 4. Department */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Department
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. CSE, BBA, Pharmacy"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
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
                        placeholder="e.g. 42"
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
                        placeholder="e.g. 52nd Batch"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                      />
                    </div>

                    {/* How many times donated blood */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Times Donated Blood
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="e.g. 4"
                        value={donationCount}
                        onChange={(e) => setDonationCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                        className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                      />
                    </div>

                    {/* Last Blood Donation Date */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Last Blood Donation Date
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
                    {isLoading ? 'Initiating Profile Setup...' : 'Enroll in Donor Network'}
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
