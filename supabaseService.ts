import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

let supabaseClientCache: any = null;
let isConfigured = false;

// Check if Supabase keys exist and flag active status
if (SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL !== "URL_PLACEHOLDER" && SUPABASE_ANON_KEY !== "KEY_PLACEHOLDER") {
  isConfigured = true;
  console.log("Supabase config loaded successfully!");
} else {
  console.warn("⚠️ Supabase credentials are not fully configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your settings to store data permanently in Supabase. Running in JSON-backup hybrid fallback mode.");
}

// Lazy initialization pattern to avoid crashing on start-up
export function getSupabase() {
  if (!isConfigured) return null;
  if (!supabaseClientCache) {
    try {
      supabaseClientCache = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: false
        }
      });
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
      return null;
    }
  }
  return supabaseClientCache;
}

export function isSupabaseActive(): boolean {
  return isConfigured && getSupabase() !== null;
}

// Map database definitions back & forth
export interface SupabaseDonor {
  id: string;
  full_name: string;
  phone: string;
  blood_group: string;
  district: string;
  department: string;
  batch: string;
  last_donation_date: string;
  donation_count: number;
  availability_status: boolean;
  password?: string;
  created_at?: string;
  // Additional system fallback alignment fields
  email?: string;
  hall?: string;
  address?: string;
  roll?: string;
  is_verified?: boolean;
  is_suspended?: boolean;
  role?: string;
}

function mapToAppUser(s: SupabaseDonor): any {
  return {
    id: s.id,
    name: s.full_name,
    email: s.email || `${s.id}@univ.edu`,
    passwordHash: s.password || "donor123",
    phone: s.phone,
    bloodGroup: s.blood_group,
    department: s.department,
    hall: s.hall || s.department || "Main Hall",
    address: s.address || s.hall || s.department || "",
    district: s.district,
    roll: s.roll || "",
    batch: s.batch,
    donationCount: Number(s.donation_count || 0),
    lastDonationDate: s.last_donation_date || "",
    isAvailable: s.availability_status,
    isVerified: s.is_verified ?? true,
    isSuspended: s.is_suspended ?? false,
    role: s.role || "donor",
    createdAt: s.created_at || new Date().toISOString()
  };
}

function mapToSupabaseDonor(u: any): SupabaseDonor {
  return {
    id: u.id,
    full_name: u.name,
    phone: u.phone,
    blood_group: u.bloodGroup,
    district: u.district || "Barishal",
    department: u.department,
    batch: u.batch || "",
    last_donation_date: u.lastDonationDate || "",
    donation_count: u.donationCount !== undefined ? Number(u.donationCount) : 0,
    availability_status: u.isAvailable !== undefined ? u.isAvailable : true,
    password: u.passwordHash || u.password || "donor123",
    created_at: u.createdAt || new Date().toISOString(),
    // Standard properties aligned securely
    email: u.email,
    hall: u.hall,
    address: u.address,
    roll: u.roll,
    is_verified: u.isVerified !== undefined ? u.isVerified : true,
    is_suspended: u.isSuspended !== undefined ? u.isSuspended : false,
    role: u.role || "donor"
  };
}

// --------------------------------------------------------
// CORE DATABASE ACTIONS
// --------------------------------------------------------

/**
 * Fetch all registered donors dynamically from Supabase
 */
export async function dbGetDonors(): Promise<any[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("donors")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error getting donors:", error.message);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapToAppUser);
  } catch (error) {
    console.error("Exception fetching donors from Supabase:", error);
    throw error;
  }
}

/**
 * Register a new donor in permanent Supabase storage
 */
export async function dbInsertDonor(user: any): Promise<any> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const dbPayload = mapToSupabaseDonor(user);
    console.log("Inserting donor to Supabase:", dbPayload.full_name);

    const { data, error } = await supabase
      .from("donors")
      .insert([dbPayload])
      .select();

    if (error) {
      console.error("Supabase Error inserting donor:", error.message);
      throw error;
    }

    const insertedRow = data && data[0] ? mapToAppUser(data[0]) : user;
    return insertedRow;
  } catch (error) {
    console.error("Exception inserting donor into Supabase:", error);
    throw error;
  }
}

/**
 * Update an existing donor profile dynamically
 */
export async function dbUpdateDonor(userId: string, updates: any): Promise<any> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // Read current first so we don't accidentally wipe values on update
    const { data: currentRows } = await supabase
      .from("donors")
      .select("*")
      .eq("id", userId);
      
    const current = currentRows && currentRows[0] ? currentRows[0] : null;
    
    const mappedUpdates: Partial<SupabaseDonor> = {};
    if (updates.name !== undefined) mappedUpdates.full_name = updates.name;
    if (updates.phone !== undefined) mappedUpdates.phone = updates.phone;
    if (updates.bloodGroup !== undefined) mappedUpdates.blood_group = updates.bloodGroup;
    if (updates.district !== undefined) mappedUpdates.district = updates.district;
    if (updates.department !== undefined) mappedUpdates.department = updates.department;
    if (updates.batch !== undefined) mappedUpdates.batch = updates.batch;
    if (updates.lastDonationDate !== undefined) mappedUpdates.last_donation_date = updates.lastDonationDate;
    if (updates.donationCount !== undefined) mappedUpdates.donation_count = Number(updates.donationCount);
    if (updates.isAvailable !== undefined) mappedUpdates.availability_status = updates.isAvailable;
    if (updates.passwordHash !== undefined) mappedUpdates.password = updates.passwordHash;
    if (updates.password !== undefined) mappedUpdates.password = updates.password;
    if (updates.email !== undefined) mappedUpdates.email = updates.email;
    if (updates.hall !== undefined) mappedUpdates.hall = updates.hall;
    if (updates.address !== undefined) mappedUpdates.address = updates.address;
    if (updates.roll !== undefined) mappedUpdates.roll = updates.roll;
    if (updates.isVerified !== undefined) mappedUpdates.is_verified = updates.isVerified;
    if (updates.isSuspended !== undefined) mappedUpdates.is_suspended = updates.isSuspended;
    if (updates.role !== undefined) mappedUpdates.role = updates.role;

    console.log(`Updating donor ${userId} in Supabase:`, mappedUpdates);

    const { data, error } = await supabase
      .from("donors")
      .update(mappedUpdates)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Supabase Error updating donor:", error.message);
      throw error;
    }

    return data && data[0] ? mapToAppUser(data[0]) : null;
  } catch (error) {
    console.error(`Exception updating donor ${userId} in Supabase:`, error);
    throw error;
  }
}

/**
 * Delete a user from permanent Supabase database
 */
export async function dbDeleteDonor(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    console.log(`Deleting donor ${userId} from Supabase...`);
    const { error } = await supabase
      .from("donors")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Supabase Error deleting donor:", error.message);
      throw error;
    }
    return true;
  } catch (error) {
    console.error(`Exception deleting donor ${userId} from Supabase:`, error);
    throw error;
  }
}

/**
 * Compatible donor groups for each recipient blood group.
 * A donor can give to a recipient when the donor's group is in this list.
 * (O- gives to everyone; AB+ receives from everyone.)
 */
export const COMPATIBLE_DONOR_GROUPS: Record<string, string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
  "AB+": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
  "AB-": ["AB-", "A-", "B-", "O-"]
};

export function getCompatibleDonorGroups(recipientGroup: string): string[] {
  return COMPATIBLE_DONOR_GROUPS[recipientGroup] || [recipientGroup];
}

function mapToAppNotification(row: any): any {
  return {
    id: row.id,
    donorId: row.donor_id,
    patientName: row.patient_name,
    bloodGroupNeeded: row.blood_group_needed,
    hospital: row.hospital,
    phone: row.phone,
    emergencyLevel: row.emergency_level || "Normal",
    requiredDate: row.required_date,
    requiredTime: row.required_time || "",
    message: row.message,
    isRead: !!row.is_read,
    createdAt: row.created_at || new Date().toISOString()
  };
}

function mapToSupabaseNotification(n: any): any {
  return {
    id: n.id,
    donor_id: n.donorId,
    patient_name: n.patientName,
    blood_group_needed: n.bloodGroupNeeded,
    hospital: n.hospital,
    phone: n.phone,
    emergency_level: n.emergencyLevel || "Normal",
    required_date: n.requiredDate,
    required_time: n.requiredTime || "",
    message: n.message,
    is_read: !!n.isRead,
    created_at: n.createdAt || new Date().toISOString()
  };
}

/**
 * Fetch a donor's notifications from permanent Supabase storage.
 * Returns null when Supabase is unavailable or the notifications table
 * has not been created yet, so the caller can fall back to local storage.
 */
export async function dbGetNotifications(donorId: string): Promise<any[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("donor_id", donorId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Supabase Error getting notifications:", error.message);
      return null;
    }
    return (data || []).map(mapToAppNotification);
  } catch (error) {
    console.error("Exception getting notifications from Supabase:", error);
    return null;
  }
}

/** Insert notifications into Supabase. Returns false when it could not save. */
export async function dbInsertNotifications(notifications: any[]): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase || notifications.length === 0) return false;
  try {
    const { error } = await supabase
      .from("notifications")
      .insert(notifications.map(mapToSupabaseNotification));
    if (error) {
      console.error("Supabase Error inserting notifications:", error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Exception inserting notifications into Supabase:", error);
    return false;
  }
}

/** Mark one notification read in Supabase. Returns false when it could not save. */
export async function dbMarkNotificationRead(id: string, donorId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("donor_id", donorId)
      .select();
    if (error) {
      console.error("Supabase Error marking notification read:", error.message);
      return false;
    }
    return !!(data && data.length > 0);
  } catch (error) {
    console.error("Exception marking notification read in Supabase:", error);
    return false;
  }
}

/**
 * Seeds initial baseline users into Supabase on first startup if empty
 */
export async function seedSupabaseIfNeeded(initialLocalUsers: any[]): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Only query if the table has rows
    const { count, error } = await supabase
      .from("donors")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.warn("Table 'donors' may not be created in Supabase yet. Please execute SQL in Supabase query editor.", error.message);
      return;
    }

    if (count === 0) {
      console.log("Supabase 'donors' table is empty. Seeding local baseline users...");
      const donorsToSeed = initialLocalUsers
        .filter(u => u.role === "donor")
        .map(mapToSupabaseDonor);

      if (donorsToSeed.length > 0) {
        const { error: seedError } = await supabase
          .from("donors")
          .insert(donorsToSeed);

        if (seedError) {
          console.error("Error seeding baseline users to Supabase:", seedError.message);
        } else {
          console.log(`Successfully seeded ${donorsToSeed.length} baseline donors to Supabase.`);
        }
      }
    }
  } catch (err) {
    console.error("Exception seeding Supabase database:", err);
  }
}
