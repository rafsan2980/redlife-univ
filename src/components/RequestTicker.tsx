import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { BloodRequest } from '../types';

interface RequestTickerProps {
  requests: BloodRequest[];
  onViewRequests: () => void;
}

export default function RequestTicker({ requests, onViewRequests }: RequestTickerProps) {
  const active = requests.filter((r) => r.status === 'pending');
  const urgent = active.filter((r) => r.emergencyLevel === 'Urgent' || r.emergencyLevel === 'Critical' || r.isEmergency);
  const shown = urgent.length > 0 ? urgent : active;

  const items: string[] =
    shown.length > 0
      ? shown.map(
          (r) =>
            `${r.emergencyLevel === 'Critical' ? 'CRITICAL' : 'URGENT'}: ${r.bloodGroup} blood needed for ${r.patientName} at ${r.hospital} (${r.unitsRequired} bag${r.unitsRequired > 1 ? 's' : ''})`
        )
      : ['রক্ত দিন, জীবন বাঁচান • Become a donor today • Every Drop Saves a Life'];

  // Duplicate the list so the scroll loops seamlessly.
  const loop = [...items, ...items];

  return (
    <button
      onClick={onViewRequests}
      className="flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-[#FF1E1E]/30 bg-[#FF1E1E]/10 px-4 py-3 text-left hover:bg-[#FF1E1E]/20 transition-colors cursor-pointer"
      title="View emergency requests"
    >
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#FF1E1E] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
        <AlertTriangle className="h-3.5 w-3.5" />
        {shown.length > 0 ? 'Urgent' : 'Notice'}
      </span>
      <span className="relative flex-1 overflow-hidden">
        <span className="animate-ticker inline-flex whitespace-nowrap text-sm font-semibold text-white">
          {loop.map((text, i) => (
            <span key={i} className="mx-6">
              {text} •
            </span>
          ))}
        </span>
      </span>
      <span className="hidden shrink-0 text-xs font-bold text-[#FBBF24] sm:block">View all →</span>
    </button>
  );
}
