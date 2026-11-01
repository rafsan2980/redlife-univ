export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  department: string;
  hall: string; // University Hall/Dormitory (maps to Address)
  address?: string; // Additional address details
  district?: string; // Home / Current residency district
  roll?: string; // Roll number (last 2 digits)
  batch?: string; // Batch identifier
  donationCount?: number; // Times donated blood
  lastDonationDate: string; // YYYY-MM-DD format (empty if never)
  isAvailable: boolean;
  isVerified: boolean; // Verified by university admin
  isSuspended?: boolean; // Admin can suspend accounts
  role: 'donor' | 'admin';
  createdAt: string;
}

export interface Notification {
  id: string;
  donorId: string;
  patientName: string;
  bloodGroupNeeded: BloodGroup;
  hospital: string;
  phone: string;
  emergencyLevel: string;
  requiredDate: string;
  requiredTime?: string;
  district?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface LiveActivity {
  id: string;
  type: 'registration' | 'request' | 'login' | 'status_change';
  message: string;
  createdAt: string;
}

export interface BloodRequest {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  hospital: string;
  phone: string;
  dateNeeded: string;
  reason: string;
  isEmergency: boolean;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdBy: string; // User ID of creator
  creatorName: string;
  createdAt: string;
  // Optional and extended fields
  requiredTime?: string;
  hospitalAddress?: string;
  emergencyLevel?: 'Normal' | 'Urgent' | 'Critical';
  notes?: string;
  allowNotifications?: boolean;
}

export interface DonorStats {
  totalDonors: number;
  availableDonors: number;
  emergencyRequests: number;
  livesSaved: number; // calculated from fulfilled requests
}

