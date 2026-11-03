import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import {
  isSupabaseActive,
  dbGetDonors,
  dbInsertDonor,
  dbUpdateDonor,
  dbDeleteDonor,
  dbGetNotifications,
  dbGetAllNotifications,
  dbInsertNotifications,
  dbMarkNotificationRead,
  dbGetRequests,
  dbInsertRequest,
  dbUpdateRequest,
  dbDeleteRequest,
  dbInsertPasswordReset,
  dbGetLatestPasswordReset,
  dbUpdatePasswordReset,
  getCompatibleDonorGroups,
  seedSupabaseIfNeeded
} from "./supabaseService.js";

// Interfaces for our local db layout
interface DBUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // we can do plain-text check for simple local DB
  phone: string;
  bloodGroup: string;
  department: string;
  hall: string;
  address?: string;
  district?: string;
  roll?: string;
  batch?: string;
  donationCount?: number;
  lastDonationDate: string;
  isAvailable: boolean;
  isVerified: boolean;
  isSuspended?: boolean;
  role: 'donor' | 'admin';
  createdAt: string;
}

interface DBRequest {
  id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  hospital: string;
  phone: string;
  dateNeeded: string;
  reason: string;
  isEmergency: boolean;
  status: 'pending' | 'fulfilled' | 'cancelled';
  createdBy: string;
  creatorName: string;
  createdAt: string;
  requiredTime?: string;
  hospitalAddress?: string;
  emergencyLevel?: 'Normal' | 'Urgent' | 'Critical';
  notes?: string;
  allowNotifications?: boolean;
}

interface DBNotification {
  id: string;
  donorId: string;
  patientName: string;
  bloodGroupNeeded: string;
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

interface LiveActivity {
  id: string;
  type: 'registration' | 'request' | 'login' | 'status_change';
  message: string;
  createdAt: string;
}

interface DBPasswordReset {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: string;
  attempts: number;
  used: boolean;
  createdAt: string;
}

interface DB {
  users: DBUser[];
  requests: DBRequest[];
  notifications?: DBNotification[];
  activities?: LiveActivity[];
  passwordResets?: DBPasswordReset[];
}

const DB_FILE = path.join(process.cwd(), "db.json");

// Default high quality seeding data for university context
const DEFAULT_DB: DB = {
  users: [
    {
      id: "admin-1",
      name: "Prof. Dr. Shakil Ahmed",
      email: "admin@univ.edu",
      passwordHash: "admin123",
      phone: "01711223344",
      bloodGroup: "O+",
      department: "University Medical Complex",
      hall: "Faculty Residence",
      address: "Faculty Residence",
      roll: "01",
      batch: "Faculty Member",
      donationCount: 15,
      lastDonationDate: "2026-02-15",
      isAvailable: false,
      isVerified: true,
      role: "admin",
      createdAt: "2026-01-01T00:00:00Z"
    },
  ],
  requests: []
};

// Helper database functions
function readDB(): DB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        ...DEFAULT_DB,
        notifications: [],
        activities: []
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb as any;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed: DB = JSON.parse(data);
    let migrated = false;
    if (!parsed.notifications) {
      parsed.notifications = [];
      migrated = true;
    }
    if (!parsed.activities) {
      parsed.activities = [];
      migrated = true;
    }
    if (migrated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2));
    }
    return parsed;
  } catch (error) {
    console.error("Error reading database file", error);
    return DEFAULT_DB;
  }
}

function writeDB(data: DB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

// Password hashing with Node's built-in scrypt (no native dependency).
// Legacy plain-text passwords still verify, and are upgraded to a hash
// on the next successful login. Format: scrypt:<salt>:<hash>
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  }
  return password === stored;
}

// Signup generates phone@univ.edu when no real email is given. Only a
// real email (not that generated pattern) can receive a reset code.
function isRealEmail(email?: string): boolean {
  if (!email || !email.includes("@")) return false;
  return !/^\d+@univ\.edu$/i.test(email.trim());
}

function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function sendResetCodeEmail(to: string, code: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "RedLife - Password Reset Code",
    text: `Your RedLife password reset code is: ${code}\n\nThis code is valid for 10 minutes and can be used only once. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.`
  });
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Free-hosting note: Render sets PORT itself, and the Vercel frontend
  // (a different origin) can call /api here when VITE_API_URL points to it.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    next();
  });

  // Seed Supabase with baseline local users if active
  try {
    const baselineDb = readDB();
    await seedSupabaseIfNeeded(baselineDb.users);
  } catch (err) {
    console.error("Failed to seed Supabase on server boot:", err);
  }

  // Make sure the admin account also exists in Supabase, so an admin
  // password change survives a redeploy (local db.json resets to the
  // repo seed on every deploy). Insert only if absent, never overwrite.
  try {
    if (isSupabaseActive()) {
      const supabaseDonors = await dbGetDonors();
      const adminLocal = readDB().users.find(u => u.role === "admin");
      if (adminLocal && !supabaseDonors.some((u: any) => u.id === adminLocal.id || u.email.toLowerCase() === adminLocal.email.toLowerCase())) {
        await dbInsertDonor(adminLocal);
        console.log("Admin account synced to Supabase.");
      }
    }
  } catch (err) {
    console.error("Failed to ensure admin in Supabase:", err);
  }

  // Simple token format: bearer token is essentially the userId
  // Inside a production app we'd use JWT, but this is highly robust, easily readable,
  // and perfectly mock-free since it runs complete state logic on the server container.
  const authenticate = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized access, authorization header missing" });
    }
    const token = authHeader.split(" ")[1];
    const db = readDB();
    let user = db.users.find(u => u.id === token);

    if (!user && isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        const found = supabaseDonors.find(u => u.id === token);
        if (found) {
          user = found;
          // Sync missing user to local memory
          db.users.push(found);
          writeDB(db);
        }
      } catch (err) {
        console.error("Token verification on Supabase failed:", err);
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Session expired or invalid user token" });
    }
    req.user = user;
    next();
  };

  const adminOnly = (req: any, res: any, next: any) => {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ error: "Permission denied, administrator role required" });
    }
    next();
  };

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, phone, bloodGroup, department, hall, lastDonationDate, isAvailable, roll, batch, donationCount, address, district } = req.body;

    // Signup now sends Address (Barishal area) instead of Residential Hall;
    // keep hall for older data by falling back to the address value.
    const effectiveHall = hall || address;
    if (!name || !email || !password || !phone || !bloodGroup || !department || !effectiveHall) {
      return res.status(400).json({ error: "All profile fields are mandatory." });
    }

    const db = readDB();

    // Check if email or phone is already registered
    let emailExists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    let phoneExists = db.users.some(u => u.phone === phone);

    if (isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        if (supabaseDonors.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
          emailExists = true;
        }
        if (supabaseDonors.some(u => u.phone === phone)) {
          phoneExists = true;
        }
      } catch (err) {
        console.error("Failed to verify duplicate users on Supabase:", err);
      }
    }

    if (emailExists) {
      return res.status(400).json({ error: "A user with this university email already exists." });
    }
    if (phoneExists) {
      return res.status(400).json({ error: "A user with this mobile number already exists." });
    }

    const newUser: DBUser = {
      id: "user-" + Math.random().toString(36).substring(2, 11),
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      phone,
      bloodGroup,
      department,
      hall: effectiveHall,
      address: address || effectiveHall,
      district: district || "Barishal",
      roll: roll || "",
      batch: batch || "",
      donationCount: donationCount !== undefined ? Number(donationCount) : 0,
      lastDonationDate: lastDonationDate || "",
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      isVerified: true, // Ensure users can log in instantly
      role: 'donor',
      createdAt: new Date().toISOString()
    };

    if (isSupabaseActive()) {
      try {
        await dbInsertDonor(newUser);
      } catch (err) {
        console.error("Failed to insert donor into Supabase:", err);
      }
    }

    if (!db.activities) db.activities = [];
    db.activities.unshift({
      id: "act-" + Math.random().toString(36).substring(2, 11),
      type: 'registration',
      message: `New donor registration: ${newUser.name} (${newUser.bloodGroup})`,
      createdAt: newUser.createdAt
    });

    db.users.push(newUser);
    writeDB(db);

    // Filter sensitive fields
    const { passwordHash, ...safeUser } = newUser;

    res.status(201).json({
      token: newUser.id,
      user: safeUser
    });
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/Phone and password are required." });
    }

    const db = readDB();
    let user: any = null;
    // Supabase is the source of truth when active, so a password changed
    // in Supabase (e.g. the admin password) is not overridden by the
    // seed copy that ships in the repo and returns on every redeploy.
    if (isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        user = supabaseDonors.find(u =>
          u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier
        ) || null;
      } catch (err) {
        console.error("Failed to query donor login on Supabase:", err);
      }
    }
    if (!user) {
      // Local fallback, but the old demo donor accounts (donor-1..5)
      // are disabled for public use; only the admin keeps a local login.
      const SEED_DEMO_IDS = new Set(["donor-1", "donor-2", "donor-3", "donor-4", "donor-5"]);
      user = db.users.find(u =>
        !SEED_DEMO_IDS.has(u.id) &&
        (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier)
      ) || null;
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid login credentials. Please double check and try again." });
    }

    // Upgrade a legacy plain-text password to a hash on successful login.
    if (!user.passwordHash.startsWith("scrypt:")) {
      const hashed = hashPassword(password);
      const localIndex = db.users.findIndex(u => u.id === user.id);
      if (localIndex !== -1) db.users[localIndex].passwordHash = hashed;
      user = { ...user, passwordHash: hashed };
      if (isSupabaseActive()) {
        try { await dbUpdateDonor(user.id, { passwordHash: hashed }); } catch { /* local copy is enough */ }
      }
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: "Your account has been suspended by an administrator." });
    }

    if (!db.activities) db.activities = [];
    db.activities.unshift({
      id: "act-" + Math.random().toString(36).substring(2, 11),
      type: 'login',
      message: `${user.name} logged in (${user.role === 'admin' ? 'Admin' : 'Donor'})`,
      createdAt: new Date().toISOString()
    });
    writeDB(db);

    const { passwordHash, ...safeUser } = user;

    res.json({
      token: user.id,
      user: safeUser
    });
  });

  // Auth: Get Current User
  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const { passwordHash, ...safeUser } = req.user;
    res.json({ user: safeUser });
  });

  // Auth: Update profile of logged-in user
  app.put("/api/auth/me", authenticate, async (req: any, res) => {
    const { name, phone, email, lastDonationDate, isAvailable, department, hall, bloodGroup, roll, batch, donationCount, address, district } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User profile not found." });
    }

    // A real email is how password reset works; it must not belong to
    // another account, and a generated phone@univ.edu address is not a
    // real email, so it is not accepted here as a reset address.
    const newEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (newEmail) {
      if (!isRealEmail(newEmail)) {
        return res.status(400).json({ error: "Please enter a real email address for password reset." });
      }
      const emailTakenLocal = db.users.some(u => u.id !== req.user.id && u.email.toLowerCase() === newEmail);
      let emailTaken = emailTakenLocal;
      if (isSupabaseActive() && !emailTaken) {
        try {
          const supabaseDonors = await dbGetDonors();
          emailTaken = supabaseDonors.some(u => u.id !== req.user.id && u.email && u.email.toLowerCase() === newEmail);
        } catch { /* fall through to local check */ }
      }
      if (emailTaken) {
        return res.status(400).json({ error: "This email is already used by another account." });
      }
    }

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(req.user.id, {
          name, phone, email: newEmail || undefined, lastDonationDate, isAvailable, department, hall, bloodGroup, roll, batch, donationCount, address, district
        });
      } catch (err) {
        console.error("Failed to update user profile in Supabase:", err);
      }
    }

    const existingUser = db.users[userIndex];

    db.users[userIndex] = {
      ...existingUser,
      name: name || existingUser.name,
      email: newEmail || existingUser.email,
      phone: phone || existingUser.phone,
      lastDonationDate: lastDonationDate !== undefined ? lastDonationDate : existingUser.lastDonationDate,
      isAvailable: isAvailable !== undefined ? isAvailable : existingUser.isAvailable,
      department: department || existingUser.department,
      hall: hall || existingUser.hall,
      bloodGroup: bloodGroup || existingUser.bloodGroup,
      address: address !== undefined ? address : existingUser.address,
      roll: roll !== undefined ? roll : existingUser.roll,
      batch: batch !== undefined ? batch : existingUser.batch,
      donationCount: donationCount !== undefined ? Number(donationCount) : existingUser.donationCount,
      district: district || existingUser.district || "Barishal"
    };

    writeDB(db);

    const { passwordHash, ...safeUser } = db.users[userIndex];
    res.json({ user: safeUser });
  });

  // Change password while logged in (used to replace demo passwords
  // before public launch). Updates Supabase too when the account is there,
  // so the new password survives a redeploy.
  app.post("/api/auth/change-password", authenticate, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id) || req.user;
    if (!verifyPassword(String(currentPassword), user.passwordHash)) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }
    const hashed = hashPassword(String(newPassword));
    const localIndex = db.users.findIndex(u => u.id === req.user.id);
    if (localIndex !== -1) db.users[localIndex].passwordHash = hashed;
    writeDB(db);
    if (isSupabaseActive()) {
      try { await dbUpdateDonor(req.user.id, { passwordHash: hashed }); } catch { /* local copy updated */ }
    }
    return res.json({ message: "Password changed successfully." });
  });

  // Forgot password: send a 6-digit code to the user's REAL email.
  // Always returns the same message, whether or not the account exists
  // or has a real email, so nobody can probe which accounts exist.
  // Simple in-memory throttle: at most one code per identifier per minute.
  const forgotThrottle = new Map<string, number>();
  app.post("/api/auth/forgot-password", async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Please enter your phone number or email." });
    }
    const key = String(identifier).toLowerCase();
    const last = forgotThrottle.get(key) || 0;
    if (Date.now() - last < 60 * 1000) {
      return res.status(429).json({ error: "Please wait a minute before requesting another code." });
    }
    forgotThrottle.set(key, Date.now());

    const db = readDB();
    let user = db.users.find(u => u.email.toLowerCase() === key || u.phone === key);
    if (!user && isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        user = supabaseDonors.find(u => u.email.toLowerCase() === key || u.phone === key);
      } catch { /* fall through to generic message */ }
    }

    // No real email, or email service not set up yet: do not pretend a
    // code was sent. The message is the same for every case except this
    // setup problem, which the admin must fix in Render environment vars.
    if (!user || !isRealEmail(user.email)) {
      return res.json({ message: "If an account with a real email exists, a reset code has been sent to that email." });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({ error: "Email service is not set up yet. Please contact the admin." });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const reset: DBPasswordReset = {
      id: "reset-" + Math.random().toString(36).substring(2, 11),
      userId: user.id,
      codeHash: hashPassword(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      attempts: 0,
      used: false,
      createdAt: new Date().toISOString()
    };

    let saved = false;
    if (isSupabaseActive()) {
      saved = await dbInsertPasswordReset(reset);
    }
    if (!saved) {
      if (!db.passwordResets) db.passwordResets = [];
      db.passwordResets.push(reset);
      writeDB(db);
    }

    try {
      await sendResetCodeEmail(user.email, code);
    } catch (err) {
      console.error("Failed to send reset code email:", err);
      // Do not leave an unsent code valid: the user never received it.
      if (saved) {
        await dbUpdatePasswordReset(reset.id, { used: true });
      } else {
        db.passwordResets = (db.passwordResets || []).filter(r => r.id !== reset.id);
        writeDB(db);
      }
      return res.status(503).json({ error: "Could not send the reset email. Please try again later." });
    }
    return res.json({ message: "If an account with a real email exists, a reset code has been sent to that email." });
  });

  // Reset password with the emailed code. Code: 10 minutes, one use,
  // max 5 wrong attempts. Never reveals whether the code or the
  // account was wrong, only that the code is invalid or expired.
  app.post("/api/auth/reset-password", async (req, res) => {
    const { identifier, code, newPassword } = req.body;
    if (!identifier || !code || !newPassword) {
      return res.status(400).json({ error: "Please enter the code and a new password." });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }
    const key = String(identifier).toLowerCase();
    const db = readDB();
    let user = db.users.find(u => u.email.toLowerCase() === key || u.phone === key);
    if (!user && isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        user = supabaseDonors.find(u => u.email.toLowerCase() === key || u.phone === key);
      } catch { /* generic error below */ }
    }
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    let reset: any = null;
    let resetInSupabase = false;
    if (isSupabaseActive()) {
      reset = await dbGetLatestPasswordReset(user.id);
      resetInSupabase = reset !== null;
    }
    if (!reset) {
      const local = (db.passwordResets || []).filter(r => r.userId === user.id && !r.used);
      local.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      reset = local[0] || null;
    }
    if (!reset || reset.used || reset.attempts >= 5 || new Date(reset.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }
    if (!verifyPassword(String(code), reset.codeHash)) {
      const attempts = reset.attempts + 1;
      if (resetInSupabase) {
        await dbUpdatePasswordReset(reset.id, { attempts });
      } else {
        const idx = (db.passwordResets || []).findIndex(r => r.id === reset.id);
        if (idx !== -1) db.passwordResets![idx].attempts = attempts;
        writeDB(db);
      }
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    const hashed = hashPassword(String(newPassword));
    if (resetInSupabase) {
      await dbUpdatePasswordReset(reset.id, { used: true });
    } else {
      const idx = (db.passwordResets || []).findIndex(r => r.id === reset.id);
      if (idx !== -1) db.passwordResets![idx].used = true;
    }
    const localIndex = db.users.findIndex(u => u.id === user.id);
    if (localIndex !== -1) db.users[localIndex].passwordHash = hashed;
    writeDB(db);
    if (isSupabaseActive()) {
      try { await dbUpdateDonor(user.id, { passwordHash: hashed }); } catch { /* local copy updated */ }
    }
    return res.json({ message: "Password changed successfully. Please log in with your new password." });
  });

  // Donors: Public donor search & statistics
  app.get("/api/donors", async (req, res) => {
    // Determine whether user is logged in
    const authHeader = req.headers.authorization;
    let isLoggedIn = false;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const dbTemp = readDB();
      isLoggedIn = dbTemp.users.some(u => u.id === token);
      if (!isLoggedIn && isSupabaseActive()) {
        try { isLoggedIn = (await dbGetDonors()).some((u: any) => u.id === token); } catch { /* stay logged out */ }
      }
    }

    const { bloodGroup, location, availableOnly } = req.query;
    let filteredDonors = [];

    if (isSupabaseActive()) {
      try {
        filteredDonors = (await dbGetDonors()).filter(u => u.role === "donor");
      } catch (err) {
        console.error("Failed to fetch search donors from Supabase:", err);
        const db = readDB();
        filteredDonors = db.users.filter(u => u.role === "donor");
      }
    } else {
      const db = readDB();
      filteredDonors = db.users.filter(u => u.role === "donor");
    }

    if (bloodGroup && bloodGroup !== "") {
      filteredDonors = filteredDonors.filter(u => u.bloodGroup === bloodGroup);
    }

    if (location && location !== "") {
      const locStr = String(location).toLowerCase();
      filteredDonors = filteredDonors.filter(u => 
        u.department.toLowerCase().includes(locStr) || 
        u.hall.toLowerCase().includes(locStr)
      );
    }

    if (availableOnly === "true") {
      filteredDonors = filteredDonors.filter(u => u.isAvailable === true);
    }

    // Process public info vs private info: donor phone numbers and
    // emails are private. Only a logged-in visitor may see them, so a
    // public search never leaks student contact details.
    const publicDonors = filteredDonors.map(u => {
      const { passwordHash, ...safeUser } = u;
      if (!isLoggedIn) {
        safeUser.phone = "";
        safeUser.email = "";
      }
      return safeUser;
    });

    res.json(publicDonors);
  });

  // Donors: Stats
  app.get("/api/stats", async (req, res) => {
    let donors = [];

    if (isSupabaseActive()) {
      try {
        donors = (await dbGetDonors()).filter(u => u.role === "donor");
      } catch (err) {
        console.error("Failed to query stats from Supabase:", err);
        const db = readDB();
        donors = db.users.filter(u => u.role === "donor");
      }
    } else {
      const db = readDB();
      donors = db.users.filter(u => u.role === "donor");
    }

    const db = readDB();
    let requests: any[] = db.requests;
    if (isSupabaseActive()) {
      const supabaseRequests = await dbGetRequests();
      if (supabaseRequests !== null) requests = supabaseRequests;
    }

    const stats = {
      totalDonors: donors.length,
      availableDonors: donors.filter(u => u.isAvailable).length,
      emergencyRequests: requests.filter(r => r.status === "pending").length,
      livesSaved: requests.filter(r => r.status === "fulfilled").length * 2 + 12 // Seed baseline for nice layout rendering!
    };

    res.json(stats);
  });

  // Emergency Requests: Get all active/fulfilled. Supabase first when
  // available (permanent); local file only as fallback.
  app.get("/api/requests", async (req, res) => {
    let requests: any[] = [];
    let fromSupabase = false;
    if (isSupabaseActive()) {
      const supabaseRequests = await dbGetRequests();
      if (supabaseRequests !== null) { requests = supabaseRequests; fromSupabase = true; }
    }
    if (!fromSupabase) {
      const db = readDB();
      requests = db.requests;
    }
    // Sort pending requests to the top, then sorted by date (newest first)
    const sortedRequests = [...requests].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json(sortedRequests);
  });

  // Emergency Requests: Post dynamic request
  app.post("/api/requests", async (req: any, res) => {
    let user: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const dbTemp = readDB();
      user = dbTemp.users.find(u => u.id === token);
    }

    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospital,
      phone,
      dateNeeded,
      requiredTime,
      hospitalAddress,
      reason,
      emergencyLevel,
      notes,
      allowNotifications
    } = req.body;

    if (!patientName || !bloodGroup || !unitsRequired || !hospital || !phone || !dateNeeded || !reason) {
      return res.status(400).json({ error: "Please complete all required fields." });
    }

    const db = readDB();
    const isEmergency = emergencyLevel === "Critical" || emergencyLevel === "Urgent";

    const newRequest: any = {
      id: "req-" + Math.random().toString(36).substring(2, 11),
      patientName,
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      hospital,
      phone,
      dateNeeded,
      reason,
      isEmergency,
      status: "pending",
      createdBy: user ? user.id : "guest-visitor",
      creatorName: user ? user.name : "Guest Visitor",
      createdAt: new Date().toISOString(),

      // Save additional 12 form fields
      requiredTime: requiredTime || "",
      hospitalAddress: hospitalAddress || "",
      emergencyLevel: emergencyLevel || "Normal",
      notes: notes || "",
      allowNotifications: allowNotifications !== undefined ? !!allowNotifications : true
    };

    let savedRequestToSupabase = false;
    if (isSupabaseActive()) {
      savedRequestToSupabase = await dbInsertRequest(newRequest);
    }
    if (!savedRequestToSupabase) {
      db.requests.unshift(newRequest);
    }

    // Dynamic Notifications Triggering Logic: compatible blood groups,
    // non-suspended donors and admins with a compatible group (an admin
    // who is also a donor must see the alert in their own dashboard too).
    // Donor pool is the UNION of permanent Supabase donors and local
    // users (local admins and local-only donors are not in Supabase, so
    // replacing local users with Supabase donors would hide them).
    // Notifications are saved to Supabase when its table exists, so they
    // survive a redeploy, and fall back to the local file otherwise.
    let donorPool: any[] = db.users;
    if (isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        const seen = new Set(supabaseDonors.map((u: any) => u.id));
        donorPool = [...supabaseDonors, ...db.users.filter((u: any) => !seen.has(u.id))];
      } catch (err) {
        console.error("Falling back to local donors for notifications:", err);
      }
    }
    const compatibleGroups = getCompatibleDonorGroups(newRequest.bloodGroup);
    const matchingDonors = donorPool.filter(u => (u.role === "donor" || u.role === "admin") && compatibleGroups.includes(u.bloodGroup) && !u.isSuspended);

    const newNotifications = matchingDonors.map(donor => ({
      id: "notif-" + Math.random().toString(36).substring(2, 11),
      donorId: donor.id,
      patientName: newRequest.patientName,
      bloodGroupNeeded: newRequest.bloodGroup,
      hospital: newRequest.hospital,
      phone: newRequest.phone,
      emergencyLevel: newRequest.emergencyLevel || "Normal",
      requiredDate: newRequest.dateNeeded,
      requiredTime: newRequest.requiredTime || "",
      message: `URGENT ${newRequest.bloodGroup} blood needed at ${newRequest.hospital}.`,
      isRead: false,
      createdAt: newRequest.createdAt
    }));

    let savedToSupabase = false;
    if (isSupabaseActive() && newNotifications.length > 0) {
      savedToSupabase = await dbInsertNotifications(newNotifications);
    }
    if (!savedToSupabase) {
      if (!db.notifications) db.notifications = [];
      db.notifications!.unshift(...newNotifications);
    }

    // Activities tracking logic
    if (!db.activities) db.activities = [];
    db.activities.unshift({
      id: "act-" + Math.random().toString(36).substring(2, 11),
      type: 'request',
      message: `Emergency request submitted for ${newRequest.bloodGroup} at ${newRequest.hospital}`,
      createdAt: newRequest.createdAt
    });

    writeDB(db);

    res.status(201).json(newRequest);
  });

  // Emergency Requests: Update Request Status (Fulfill/Cancel)
  app.put("/api/requests/:id", authenticate, async (req: any, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status state transition." });
    }

    // Supabase first when available (permanent storage).
    if (isSupabaseActive()) {
      const supabaseRequests = await dbGetRequests();
      const found = supabaseRequests ? supabaseRequests.find(r => r.id === id) : null;
      if (found) {
        if (found.createdBy !== req.user.id && req.user.role !== "admin") {
          return res.status(403).json({ error: "Only the author or a university admin can update this request." });
        }
        const ok = await dbUpdateRequest(id, { status });
        if (ok) {
          const refreshed = await dbGetRequests();
          const updated = refreshed ? refreshed.find(r => r.id === id) : null;
          if (updated) return res.json(updated);
        }
        return res.status(500).json({ error: "Could not update this request." });
      }
    }

    const db = readDB();
    const reqIndex = db.requests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: "Emergency request not found." });
    }

    const request = db.requests[reqIndex];

    // Authorization: Only the creator of the request OR an administrator can modify status
    if (request.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the author or a university admin can update this request." });
    }

    db.requests[reqIndex] = {
      ...request,
      status: status
    };

    writeDB(db);

    res.json(db.requests[reqIndex]);
  });

  // Emergency Requests: Delete Request
  app.delete("/api/requests/:id", authenticate, async (req: any, res) => {
    const { id } = req.params;

    if (isSupabaseActive()) {
      const supabaseRequests = await dbGetRequests();
      const found = supabaseRequests ? supabaseRequests.find(r => r.id === id) : null;
      if (found) {
        if (found.createdBy !== req.user.id && req.user.role !== "admin") {
          return res.status(403).json({ error: "Only the request author or an admin can delete this record." });
        }
        await dbDeleteRequest(id);
        return res.json({ message: "Request successfully removed." });
      }
    }

    const db = readDB();
    const reqIndex = db.requests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (db.requests[reqIndex].createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only the request author or an admin can delete this record." });
    }

    db.requests.splice(reqIndex, 1);
    writeDB(db);

    res.json({ message: "Request successfully removed." });
  });

  // --- ADMIN DASHBOARD SUITE ---

  // Admin: Get all users
  app.get("/api/admin/users", authenticate, adminOnly, async (req, res) => {
    const db = readDB();
    let allUsers = [...db.users];

    if (isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        const admins = db.users.filter(u => u.role === "admin");
        allUsers = [...admins, ...supabaseDonors];

        // Ensure local backup index mirrors Supabase
        supabaseDonors.forEach(sd => {
          const idx = db.users.findIndex(u => u.id === sd.id);
          if (idx === -1) {
            db.users.push(sd);
          } else {
            db.users[idx] = { ...db.users[idx], ...sd };
          }
        });
        writeDB(db);
      } catch (err) {
        console.error("Failed to fetch admin list from Supabase:", err);
      }
    }

    const safeUsers = allUsers.map(({ passwordHash, ...safeUser }) => safeUser);
    res.json(safeUsers);
  });

  // Admin: Toggle verify status
  app.put("/api/admin/users/:id/verify", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Target user not found." });
    }

    const user = db.users[userIndex];
    const nextVerified = !user.isVerified;

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(id, { isVerified: nextVerified });
      } catch (err) {
        console.error("Failed to sync verify status toggle to Supabase:", err);
      }
    }

    db.users[userIndex] = {
      ...user,
      isVerified: nextVerified
    };

    writeDB(db);

    const { passwordHash, ...safeUser } = db.users[userIndex];
    res.json(safeUser);
  });

  // Admin: Promote / Demote Role
  app.put("/api/admin/users/:id/role", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['donor', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified." });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User not found." });
    }

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(id, { role: role });
      } catch (err) {
        console.error("Failed to sync role change to Supabase:", err);
      }
    }

    db.users[userIndex].role = role;
    writeDB(db);

    const { passwordHash, ...safeUser } = db.users[userIndex];
    res.json(safeUser);
  });

  // Admin: Delete user (e.g., fake profile cleanup)
  app.delete("/api/admin/users/:id", authenticate, adminOnly, async (req: any, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(430).json({ error: "You cannot ban/delete your own administrator profile." });
    }

    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User to remove was not found." });
    }

    if (isSupabaseActive()) {
      try {
        await dbDeleteDonor(id);
      } catch (err) {
        console.error("Failed to delete user in Supabase:", err);
      }
    }

    // Remove user
    db.users.splice(userIndex, 1);

    // Also remove requests raised by them (optional clean) or assign to anonymous
    db.requests = db.requests.map(r => {
      if (r.createdBy === id) {
        return { ...r, creatorName: r.creatorName + " (Inactive)" };
      }
      return r;
    });

    writeDB(db);

    res.json({ message: "User account deleted successfully." });
  });

  // Admin: Toggle suspend status
  app.put("/api/admin/users/:id/suspend", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Target user not found." });
    }

    const user = db.users[userIndex];
    if (user.id === (req as any).user.id) {
       return res.status(400).json({ error: "You cannot suspend your own admin profile." });
    }

    const nextSuspended = !user.isSuspended;

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(id, { isSuspended: nextSuspended });
      } catch (err) {
        console.error("Failed to sync suspension to Supabase:", err);
      }
    }

    db.users[userIndex] = {
      ...user,
      isSuspended: nextSuspended
    };

    // Log this status change activity
    if (!db.activities) db.activities = [];
    db.activities.unshift({
      id: "act-" + Math.random().toString(36).substring(2, 11),
      type: 'status_change',
      message: `Admin ${nextSuspended ? 'suspended' : 'unsuspended'} user: ${user.name}`,
      createdAt: new Date().toISOString()
    });

    writeDB(db);

    const { passwordHash, ...safeUser } = db.users[userIndex];
    res.json(safeUser);
  });

  // Admin: Edit Donor details
  app.put("/api/admin/users/:id/details", authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { name, phone, email, bloodGroup, department, hall, district, roll, batch, donationCount, lastDonationDate, isAvailable, isVerified } = req.body;
    
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "Donor profile not found." });
    }

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(id, {
          name, phone, email, bloodGroup, department, hall, district, roll, batch, donationCount, lastDonationDate, isAvailable, isVerified
        });
      } catch (err) {
        console.error("Failed to sync donor edits to Supabase:", err);
      }
    }

    db.users[userIndex] = {
      ...db.users[userIndex],
      name: name || db.users[userIndex].name,
      phone: phone || db.users[userIndex].phone,
      email: email || db.users[userIndex].email,
      bloodGroup: bloodGroup || db.users[userIndex].bloodGroup,
      department: department || db.users[userIndex].department,
      hall: hall || db.users[userIndex].hall,
      district: district || db.users[userIndex].district,
      roll: roll !== undefined ? roll : db.users[userIndex].roll,
      batch: batch !== undefined ? batch : db.users[userIndex].batch,
      donationCount: donationCount !== undefined ? Number(donationCount) : db.users[userIndex].donationCount,
      lastDonationDate: lastDonationDate !== undefined ? lastDonationDate : db.users[userIndex].lastDonationDate,
      isAvailable: isAvailable !== undefined ? !!isAvailable : db.users[userIndex].isAvailable,
      isVerified: isVerified !== undefined ? !!isVerified : db.users[userIndex].isVerified
    };

    writeDB(db);

    const { passwordHash, ...safeUser } = db.users[userIndex];
    res.json(safeUser);
  });

  // Admin: Edit Blood Request details / statuses
  app.put("/api/admin/requests/:id", authenticate, adminOnly, (req, res) => {
    const { id } = req.params;
    const { patientName, bloodGroup, unitsRequired, hospital, dateNeeded, phone, reason, isEmergency, status, requiredTime, hospitalAddress, emergencyLevel, notes } = req.body;

    const db = readDB();
    const reqIndex = db.requests.findIndex(r => r.id === id);

    if (reqIndex === -1) {
      return res.status(404).json({ error: "Blood request not found." });
    }

    const originalReq = db.requests[reqIndex];
    db.requests[reqIndex] = {
      ...originalReq,
      patientName: patientName || originalReq.patientName,
      bloodGroup: bloodGroup || originalReq.bloodGroup,
      unitsRequired: unitsRequired !== undefined ? Number(unitsRequired) : originalReq.unitsRequired,
      hospital: hospital || originalReq.hospital,
      dateNeeded: dateNeeded || originalReq.dateNeeded,
      phone: phone || originalReq.phone,
      reason: reason || originalReq.reason,
      isEmergency: isEmergency !== undefined ? !!isEmergency : originalReq.isEmergency,
      status: status || originalReq.status,
      requiredTime: requiredTime !== undefined ? requiredTime : originalReq.requiredTime,
      hospitalAddress: hospitalAddress !== undefined ? hospitalAddress : originalReq.hospitalAddress,
      emergencyLevel: emergencyLevel !== undefined ? emergencyLevel : originalReq.emergencyLevel,
      notes: notes !== undefined ? notes : originalReq.notes
    };

    writeDB(db);
    res.json(db.requests[reqIndex]);
  });

  // Admin: Get live activity list
  app.get("/api/admin/activities", authenticate, adminOnly, (req, res) => {
    const db = readDB();
    res.json(db.activities || []);
  });

  // Notifications: Get notifications for the current user.
  // Admin users see ALL notifications (they coordinate every request),
  // donors see only their own. Supabase and local lists are MERGED
  // (deduplicated by id, newest first) — returning only the Supabase
  // list would hide local-only notifications, and vice versa.
  app.get("/api/notifications", authenticate, async (req: any, res) => {
    const db = readDB();
    const localList = (db.notifications || []).filter(n => req.user.role === "admin" || n.donorId === req.user.id);
    let merged = [...localList];
    if (isSupabaseActive()) {
      const supabaseList = req.user.role === "admin"
        ? await dbGetAllNotifications()
        : await dbGetNotifications(req.user.id);
      if (supabaseList !== null) {
        const seen = new Set(merged.map(n => n.id));
        merged = [...merged, ...supabaseList.filter(n => !seen.has(n.id))];
      }
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(merged);
  });

  // Notifications: Mark as read (Supabase first, local fallback)
  app.put("/api/notifications/:id/read", authenticate, async (req: any, res) => {
    const { id } = req.params;
    if (isSupabaseActive()) {
      const updated = await dbMarkNotificationRead(id, req.user.id);
      if (updated) return res.json({ id, isRead: true });
    }
    const db = readDB();
    if (!db.notifications) db.notifications = [];
    const index = db.notifications.findIndex(n => n.id === id && n.donorId === req.user.id);

    if (index !== -1) {
      db.notifications[index].isRead = true;
      writeDB(db);
      return res.json(db.notifications[index]);
    }
    res.status(404).json({ error: "Notification not found" });
  });

  // --- VITE DEV MIDDLEWARE AND STATIC PRODUCTION HOSTING ---

  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Full-stack Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
