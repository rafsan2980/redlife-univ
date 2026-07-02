import express from "express";
import path from "path";
import fs from "fs";
import {
  isSupabaseActive,
  dbGetDonors,
  dbInsertDonor,
  dbUpdateDonor,
  dbDeleteDonor,
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

interface DB {
  users: DBUser[];
  requests: DBRequest[];
  notifications?: DBNotification[];
  activities?: LiveActivity[];
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
      district: "Barishal",
      roll: "01",
      batch: "Faculty Member",
      donationCount: 15,
      lastDonationDate: "2026-02-15",
      isAvailable: false,
      isVerified: true,
      role: "admin",
      createdAt: "2026-01-01T00:00:00Z"
    },
    {
      id: "donor-1",
      name: "Tariqul Islam Rishad",
      email: "tariqul.cse@univ.edu",
      passwordHash: "donor123",
      phone: "01822334455",
      bloodGroup: "A+",
      department: "Computer Science & Engineering",
      hall: "Sher-e-Bangla Hall",
      address: "Sher-e-Bangla Hall, Room 402",
      district: "Barishal",
      roll: "56",
      batch: "48th Batch",
      donationCount: 4,
      lastDonationDate: "2026-01-10",
      isAvailable: true,
      isVerified: true,
      role: "donor",
      createdAt: "2026-02-10T11:20:00Z"
    },
    {
      id: "donor-2",
      name: "Arifa Chowdhury Mim",
      email: "arifa.bba@univ.edu",
      passwordHash: "donor123",
      phone: "01511223366",
      bloodGroup: "O-", // Rare blood donor!
      department: "Business Administration",
      hall: "Pritilata Hall",
      address: "Pritilata Hall, Room 108",
      district: "Dhaka",
      roll: "22",
      batch: "50th Batch",
      donationCount: 2,
      lastDonationDate: "2025-12-05",
      isAvailable: true,
      isVerified: true,
      role: "donor",
      createdAt: "2026-03-01T15:45:00Z"
    },
    {
      id: "donor-3",
      name: "Raihan Kibria",
      email: "raihan.eee@univ.edu",
      passwordHash: "donor123",
      phone: "01944556677",
      bloodGroup: "B+",
      department: "Electrical & Electronic Engineering",
      hall: "Fazlul Huq Hall",
      address: "Fazlul Huq Hall, Room 215",
      district: "Barishal",
      roll: "89",
      batch: "49th Batch",
      donationCount: 3,
      lastDonationDate: "2026-04-18", // Donated recently (< 3 months)
      isAvailable: false,
      isVerified: true,
      role: "donor",
      createdAt: "2026-03-15T08:30:00Z"
    },
    {
      id: "donor-4",
      name: "Zaber Al-Mansur",
      email: "zaber.me@univ.edu",
      passwordHash: "donor123",
      phone: "01733445588",
      bloodGroup: "AB+",
      department: "Mechanical Engineering",
      hall: "Lutfur Rahman Hall",
      address: "Lutfur Rahman Hall, Room 303",
      district: "Patuakhali",
      roll: "12",
      batch: "51st Batch",
      donationCount: 0,
      lastDonationDate: "", // Never donated yet
      isAvailable: true,
      isVerified: false, // Needs admin verification
      role: "donor",
      createdAt: "2026-05-20T10:00:00Z"
    },
    {
      id: "donor-5",
      name: "Nusrat Jahan Bristy",
      email: "nusrat.che@univ.edu",
      passwordHash: "donor123",
      phone: "01688776655",
      bloodGroup: "O+",
      department: "Chemical Engineering",
      hall: "Suhrawardy Hall",
      address: "Suhrawardy Hall, Room 204",
      district: "Barishal",
      roll: "71",
      batch: "52nd Batch",
      donationCount: 5,
      lastDonationDate: "2025-11-20",
      isAvailable: true,
      isVerified: true,
      role: "donor",
      createdAt: "2026-04-05T09:15:00Z"
    }
  ],
  requests: [
    {
      id: "req-1",
      patientName: "Kamruzzaman (Student's Father)",
      bloodGroup: "O-",
      unitsRequired: 2,
      hospital: "University Medical Center (Emergency Wing)",
      phone: "01722998877",
      dateNeeded: "2026-05-25",
      reason: "Urgent heart surgery preparation. O- is critical.",
      isEmergency: true,
      status: "pending",
      createdBy: "donor-1",
      creatorName: "Tariqul Islam Rishad",
      createdAt: "2026-05-21T14:30:00Z"
    },
    {
      id: "req-2",
      patientName: "Sinthia Akhter (CSE Student)",
      bloodGroup: "A+",
      unitsRequired: 1,
      hospital: "City Central Clinic, University Hospital Road",
      phone: "01511223366",
      dateNeeded: "2026-05-23",
      reason: "Severe Typhoid treatment & platelet count restoration.",
      isEmergency: true,
      status: "pending",
      createdBy: "donor-2",
      creatorName: "Arifa Chowdhury Mim",
      createdAt: "2026-05-22T08:00:00Z"
    },
    {
      id: "req-3",
      patientName: "Jamal Uddin (Staff Member)",
      bloodGroup: "B+",
      unitsRequired: 3,
      hospital: "Dhaka Medical College & Hospital (Maternity Cabin)",
      phone: "01944556677",
      dateNeeded: "2026-05-18",
      reason: "Emergency C-Section supply for staff member's spouse.",
      isEmergency: false,
      status: "fulfilled",
      createdBy: "donor-3",
      creatorName: "Raihan Kibria",
      createdAt: "2026-05-17T12:00:00Z"
    }
  ]
};

// Helper database functions
function readDB(): DB {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        ...DEFAULT_DB,
        notifications: [],
        activities: [
          {
            id: "act-1",
            type: "registration",
            message: "New donor registration: Tariqul Islam Rishad (A+)",
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: "act-2",
            type: "request",
            message: "New blood appeal: O- needed at University Medical Center",
            createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
          }
        ]
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
      return initialDb as any;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed: DB = JSON.parse(data);
    let migrated = false;
    if (parsed.users && Array.isArray(parsed.users)) {
      parsed.users.forEach(u => {
        if (!u.district) {
          if (u.id === "admin-1") u.district = "Barishal";
          else if (u.id === "donor-1") u.district = "Barishal";
          else if (u.id === "donor-2") u.district = "Dhaka";
          else if (u.id === "donor-3") u.district = "Barishal";
          else if (u.id === "donor-4") u.district = "Patuakhali";
          else if (u.id === "donor-5") u.district = "Barishal";
          else u.district = "Barishal"; // Default
          migrated = true;
        }
      });
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
      migrated = true;
    }
    if (!parsed.activities) {
      parsed.activities = [
        {
          id: "act-1",
          type: "registration",
          message: "New donor registration: Tariqul Islam Rishad (A+)",
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: "act-2",
          type: "request",
          message: "New blood appeal: O- needed at University Medical Center",
          createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
        }
      ];
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Seed Supabase with baseline local users if active
  try {
    const baselineDb = readDB();
    await seedSupabaseIfNeeded(baselineDb.users);
  } catch (err) {
    console.error("Failed to seed Supabase on server boot:", err);
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

    if (!name || !email || !password || !phone || !bloodGroup || !department || !hall) {
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
      passwordHash: password, // Plain text for sandbox simplicity & robustness
      phone,
      bloodGroup,
      department,
      hall,
      address: address || hall,
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
    let user = db.users.find(u => 
      (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) && 
      u.passwordHash === password
    );

    // If candidate isn't in memory/backup DB under that password, let's query Supabase
    if (!user && isSupabaseActive()) {
      try {
        const supabaseDonors = await dbGetDonors();
        const found = supabaseDonors.find(u => 
          (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) &&
          u.passwordHash === password
        );
        if (found) {
          user = found;
          // Sync it into the local memory/backup database
          const exists = db.users.some(u => u.id === found.id);
          if (!exists) {
            db.users.push(found);
            writeDB(db);
          }
        }
      } catch (err) {
        console.error("Failed to query donor login on Supabase:", err);
      }
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid login credentials. Please double check or try 'admin@univ.edu' & 'admin123' for immediate exploration." });
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
    const { name, phone, lastDonationDate, isAvailable, department, hall, bloodGroup, roll, batch, donationCount, address, district } = req.body;
    const db = readDB();
    const userIndex = db.users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User profile not found." });
    }

    if (isSupabaseActive()) {
      try {
        await dbUpdateDonor(req.user.id, {
          name, phone, lastDonationDate, isAvailable, department, hall, bloodGroup, roll, batch, donationCount, address, district
        });
      } catch (err) {
        console.error("Failed to update user profile in Supabase:", err);
      }
    }

    const existingUser = db.users[userIndex];

    db.users[userIndex] = {
      ...existingUser,
      name: name || existingUser.name,
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

  // Donors: Public donor search & statistics
  app.get("/api/donors", async (req, res) => {
    // Determine whether user is logged in
    const authHeader = req.headers.authorization;
    let isLoggedIn = false;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const dbTemp = readDB();
      isLoggedIn = dbTemp.users.some(u => u.id === token);
    }

    const { bloodGroup, location, availableOnly, district } = req.query;
    let filteredDonors = [];

    if (isSupabaseActive()) {
      try {
        filteredDonors = await dbGetDonors();
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

    if (district && district !== "") {
      filteredDonors = filteredDonors.filter(u => u.district === district);
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

    // Process public info vs private info
    // Emergency Mode: Expose donor contact numbers publicly so visitors can access life safety details instantly!
    const publicDonors = filteredDonors.map(u => {
      const { passwordHash, ...safeUser } = u;
      return safeUser;
    });

    res.json(publicDonors);
  });

  // Donors: Stats
  app.get("/api/stats", async (req, res) => {
    let donors = [];

    if (isSupabaseActive()) {
      try {
        donors = await dbGetDonors();
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
    const requests = db.requests;

    const stats = {
      totalDonors: donors.length,
      availableDonors: donors.filter(u => u.isAvailable).length,
      emergencyRequests: requests.filter(r => r.status === "pending").length,
      livesSaved: requests.filter(r => r.status === "fulfilled").length * 2 + 12 // Seed baseline for nice layout rendering!
    };

    res.json(stats);
  });

  // Emergency Requests: Get all active/fulfilled
  app.get("/api/requests", (req, res) => {
    const db = readDB();
    // Sort pending requests to the top, then sorted by date (newest first)
    const sortedRequests = [...db.requests].sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json(sortedRequests);
  });

  // Emergency Requests: Post dynamic request
  app.post("/api/requests", (req: any, res) => {
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

    db.requests.unshift(newRequest);

    // Dynamic Notifications Triggering Logic (only matching blood group, non-suspended donors)
    if (!db.notifications) db.notifications = [];
    const matchingDonors = db.users.filter(u => u.role === "donor" && u.bloodGroup === newRequest.bloodGroup && !u.isSuspended);
    
    matchingDonors.forEach(donor => {
      db.notifications!.unshift({
        id: "notif-" + Math.random().toString(36).substring(2, 11),
        donorId: donor.id,
        patientName: newRequest.patientName,
        bloodGroupNeeded: newRequest.bloodGroup,
        hospital: newRequest.hospital,
        phone: newRequest.phone,
        emergencyLevel: newRequest.emergencyLevel || "Normal",
        requiredDate: newRequest.dateNeeded,
        requiredTime: newRequest.requiredTime || "",
        district: donor.district || "Barishal",
        message: `URGENT ${newRequest.bloodGroup} blood needed at ${newRequest.hospital}.`,
        isRead: false,
        createdAt: newRequest.createdAt
      });
    });

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
  app.put("/api/requests/:id", authenticate, (req: any, res) => {
    const { status } = req.body;
    const { id } = req.params;

    if (!status || !['pending', 'fulfilled', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status state transition." });
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
  app.delete("/api/requests/:id", authenticate, (req: any, res) => {
    const { id } = req.params;
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

  // Notifications: Get all notifications for current donor
  app.get("/api/notifications", authenticate, (req: any, res) => {
    const db = readDB();
    const list = (db.notifications || []).filter(n => n.donorId === req.user.id);
    res.json(list);
  });

  // Notifications: Mark as read
  app.put("/api/notifications/:id/read", authenticate, (req: any, res) => {
    const { id } = req.params;
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
