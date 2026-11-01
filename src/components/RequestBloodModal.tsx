import React, { useState } from 'react';
import { X, Droplet, Clock, Navigation, CheckCircle2, Calendar, Phone, Activity, FileText, AlertTriangle } from 'lucide-react';
import { BloodGroup } from '../types';

interface RequestBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: any) => Promise<any>;
}

export default function RequestBloodModal({
  isOpen,
  onClose,
  onSubmit,
}: RequestBloodModalProps) {
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [dateNeeded, setDateNeeded] = useState('');
  const [requiredTime, setRequiredTime] = useState('');
  const [hospital, setHospital] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [emergencyLevel, setEmergencyLevel] = useState<'Normal' | 'Urgent' | 'Critical'>('Urgent');
  const [notes, setNotes] = useState('');
  const [allowNotifications, setAllowNotifications] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);

  const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await onSubmit({
        patientName,
        bloodGroup,
        unitsRequired,
        dateNeeded,
        requiredTime,
        hospital,
        hospitalAddress,
        phone,
        reason,
        emergencyLevel,
        notes,
        allowNotifications,
      });
      
      // Show success message state
      setIsSubmittedSuccessfully(true);

      // Clear values on successful state after some delay or when closed
      setPatientName('');
      setBloodGroup('O+');
      setUnitsRequired(1);
      setHospital('');
      setHospitalAddress('');
      setPhone('');
      setDateNeeded('');
      setRequiredTime('');
      setReason('');
      setEmergencyLevel('Urgent');
      setNotes('');
      setAllowNotifications(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred raising request. Review inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubmittedSuccessfully(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050816]/80 p-4 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl rounded-3xl border border-white/8 bg-[#0B1220] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Close */}
        <button
          onClick={handleClose}
          className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {isSubmittedSuccessfully ? (
          <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-black text-white">
                Request Sent!
              </h2>
              <p className="text-sm font-semibold text-emerald-400 mt-2">
                Emergency blood request submitted successfully
              </p>
              <p className="text-xs text-gray-405 text-gray-400 mt-3 max-w-md mx-auto leading-relaxed">
                The campus volunteer network has been alerted. Matching active donors in your area will receive notification instantly.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full max-w-xs rounded-xl bg-[#FF1E1E] py-3.5 font-display text-xs font-bold uppercase tracking-widest text-white shadow-md hover:bg-[#ff3c3c] hover:shadow-[0_0_12px_rgba(255,30,30,0.5)] transition-all cursor-pointer"
            >
              Back to Requests Feed
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            {/* Form Header */}
            <div className="p-6 md:p-8 pb-4 border-b border-white/5 shrink-0 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF1E1E]/15 text-[#FF1E1E] shadow-[0_0_8px_rgba(255,30,30,0.3)]">
                  <Droplet className="h-6 w-6 fill-[#FF1E1E]" />
                </div>
                <div className="text-left">
                  <h2 className="font-display text-lg font-extrabold text-white">
                    Raise Emergency Blood Appeal
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Submit patient details and hospital requirements to ping active volunteer donors
                  </p>
                </div>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="mx-6 md:mx-8 mt-4 rounded-xl border border-red-900/40 bg-red-950/45 text-xs text-red-405 text-red-450 text-red-400 font-bold p-3.5 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Form Content - Scrollable area */}
            <div className="p-6 md:p-8 pt-4 space-y-5 overflow-y-auto flex-1 text-left custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              
              {/* Section 1: Patient Details */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#FF1E1E] mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  <span>1. Patient & Medical Details</span>
                </h3>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Patient Full Name <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shakil Akhter (Student's Mother)"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Required Blood Group <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg} className="bg-[#0B1220]">Blood Group: {bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      How Many Bags Needed <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={20}
                      value={unitsRequired}
                      onChange={(e) => setUnitsRequired(Math.max(1, Number(e.target.value)))}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Patient Problem / Reason for Blood <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g. Platelet count critical, patient undergoing urgent bypass open-heart surgery..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-xl border border-white/8 bg-[#111827] p-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Hospital & Schedule */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#FF1E1E] mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <Navigation className="h-3.5 w-3.5" />
                  <span>2. Hospital Location & Schedule</span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Hospital Name <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Crescent General Hospital"
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Hospital Address / Campus Area <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Campus Medical Wing / Central Clinic Road"
                      value={hospitalAddress}
                      onChange={(e) => setHospitalAddress(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Required Date <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={dateNeeded}
                      onChange={(e) => setDateNeeded(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Required Time <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <input
                      type="time"
                      required
                      value={requiredTime}
                      onChange={(e) => setRequiredTime(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Priority & Contact */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#FF1E1E] mb-3 border-b border-white/5 pb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>3. Priority & Contact Details</span>
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Contact Phone Number <span className="text-[#FF1E1E]">*</span>
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

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Emergency Level <span className="text-[#FF1E1E]">*</span>
                    </label>
                    <select
                      value={emergencyLevel}
                      onChange={(e) => setEmergencyLevel(e.target.value as 'Normal' | 'Urgent' | 'Critical')}
                      className="h-10 w-full rounded-xl border border-white/8 bg-[#111827] px-3 text-xs font-bold text-white outline-none focus:border-[#FF1E1E]"
                    >
                      <option value="Normal" className="bg-[#0B1220]">🟢 Normal (Upcoming schedule)</option>
                      <option value="Urgent" className="bg-[#0B1220]">🟡 Urgent (Needed within 24 hours)</option>
                      <option value="Critical" className="bg-[#0B1220]">🔴 Critical (Immediate response required)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please bring registration card, transport can be arranged from campus..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-white/8 bg-[#111827] p-3 text-xs font-medium text-white outline-none focus:border-[#FF1E1E] resize-none"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-1">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowNotifications}
                        onChange={(e) => setAllowNotifications(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-white/10 bg-[#111827] text-[#FF1E1E] focus:ring-[#FF1E1E] cursor-pointer"
                      />
                      <div className="text-left select-none">
                        <span className="text-xs font-bold text-gray-350 block">
                          Allow donor network notifications
                        </span>
                        <span className="text-[10px] text-gray-500 block leading-tight">
                          Broadcast appeal dynamically alerts available active volunteers in vicinity.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

            </div>

            {/* Form Footer Action */}
            <div className="p-6 border-t border-white/5 bg-[#111827] shrink-0 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-white/10 text-gray-400 px-5 py-3 font-display text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-[#FF1E1E] px-8 py-3 font-display text-xs font-bold uppercase tracking-widest text-white shadow-lg hover:bg-[#ff3c3c] disabled:opacity-45 transition-all cursor-pointer shadow-[0_0_12px_rgba(255,30,30,0.45)]"
              >
                {isLoading ? 'Submitting Request...' : 'Submit Emergency Request'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
