/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { 
  readDb, 
  writeDb, 
  seedDbIfNeeded, 
  hashPassword 
} from "./server/db";
import { 
  User, 
  Donor, 
  DonationHistory, 
  BloodRequest, 
  Hospital, 
  BLOOD_COMPATIBILITY,
  canDonate 
} from "./src/types";

// Custom interface for authenticated Request
interface AuthRequest extends Request {
  user?: User;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Initialize and Seed Database on startup
  seedDbIfNeeded();

  // AUTH MIDDLEWARE Helper
  const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. Token missing." });
    }
    const token = authHeader.split(" ")[1];
    
    // Token structure: rbd_uid_{userId}_{timestamp}
    const parts = token.split("_");
    if (parts.length < 4 || parts[0] !== "rbd" || parts[1] !== "uid") {
      return res.status(401).json({ error: "Invalid token format." });
    }
    
    const userId = parseInt(parts[2], 10);
    const db = readDb();
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    req.user = user;
    next();
  };

  // ==========================================
  // AUTH ROUTING
  // ==========================================

  // Signup
  app.post("/api/auth/signup", (req: Request, res: Response) => {
    const { name, email, password, bloodGroup, phone, division, district, thana } = req.body;
    
    if (!name || !email || !password || !phone || !division || !district || !thana) {
      return res.status(400).json({ error: "Please enter all required fields." });
    }

    const db = readDb();
    
    // Check duplication
    const exists = db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newUser: User = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      bloodGroup: bloodGroup || null,
      phone,
      division,
      district,
      thana,
      isDonor: false,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = `rbd_uid_${newUser.id}_${Date.now()}`;
    // Exclude passwordHash before transmitting
    const { passwordHash, ...clientUser } = newUser;

    res.status(201).json({
      message: "Registration successful!",
      token,
      user: clientUser
    });
  });

  // Login
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(400).json({ error: "Invalid credentials. Please attempt again." });
    }

    const token = `rbd_uid_${user.id}_${Date.now()}`;
    const { passwordHash, ...clientUser } = user;

    res.json({
      message: "Log in successful!",
      token,
      user: clientUser
    });
  });

  // Get current user details
  app.get("/api/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });
    
    const db = readDb();
    const donor = db.donors.find(d => d.userId === req.user!.id);
    const timeline = donor ? db.donationHistory.filter(h => h.donorId === donor.id) : [];
    
    const { passwordHash, ...clientUser } = req.user;
    res.json({
      user: clientUser,
      donor: donor || null,
      history: timeline
    });
  });

  // Update Profile
  app.post("/api/profile/edit", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });
    
    const { name, bloodGroup, phone, division, district, thana } = req.body;
    
    if (!name || !phone || !division || !district || !thana) {
      return res.status(400).json({ error: "Please fill out all required profile details." });
    }

    const db = readDb();
    const userIdx = db.users.findIndex(u => u.id === req.user!.id);
    if (userIdx === -1) return res.status(404).json({ error: "User not found." });

    // Update user
    db.users[userIdx].name = name;
    db.users[userIdx].bloodGroup = bloodGroup || null;
    db.users[userIdx].phone = phone;
    db.users[userIdx].division = division;
    db.users[userIdx].district = district;
    db.users[userIdx].thana = thana;

    // Synchronize into donors table too, if existing
    const donorIdx = db.donors.findIndex(d => d.userId === req.user!.id);
    if (donorIdx !== -1) {
      db.donors[donorIdx].name = name;
      db.donors[donorIdx].phone = phone;
      if (bloodGroup) {
        db.donors[donorIdx].bloodGroup = bloodGroup;
      }
      db.donors[donorIdx].division = division;
      db.donors[donorIdx].district = district;
      db.donors[donorIdx].thana = thana;
    }

    writeDb(db);
    
    const { passwordHash, ...clientUser } = db.users[userIdx];
    res.json({
      message: "Profile updated successfully!",
      user: clientUser,
      donor: donorIdx !== -1 ? db.donors[donorIdx] : null
    });
  });


  // ==========================================
  // DONOR ROUTING
  // ==========================================

  // Register as Donor
  app.post("/api/donor/register", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });

    const { bloodGroup, division, district, thana, lastDonation, isAvailable } = req.body;
    
    if (!bloodGroup || !division || !district || !thana) {
      return res.status(400).json({ error: "All donor info fields are required." });
    }

    const db = readDb();
    
    // Check if user is already a donor
    const existing = db.donors.find(d => d.userId === req.user!.id);
    if (existing) {
      return res.status(400).json({ error: "You are already registered as a blood donor." });
    }

    // Set user donor state
    const userIdx = db.users.findIndex(u => u.id === req.user!.id);
    db.users[userIdx].isDonor = true;
    db.users[userIdx].bloodGroup = bloodGroup; // ensure synched

    // Evaluate eligibility if past donation is supplied
    let eligibleDateStr: string | null = null;
    let computedAvailableState = isAvailable !== undefined ? isAvailable : true;

    if (lastDonation) {
      const lastDon = new Date(lastDonation);
      const eligible = new Date(lastDon.getTime() + 90 * 24 * 3600 * 1000);
      eligibleDateStr = eligible.toISOString().split("T")[0];
      
      const now = new Date();
      if (now.getTime() < eligible.getTime()) {
        computedAvailableState = false; // forced cooldown
      }
    }

    const newDonor: Donor = {
      id: db.donors.length > 0 ? Math.max(...db.donors.map(d => d.id)) + 1 : 1,
      userId: req.user.id,
      name: req.user.name,
      bloodGroup,
      division,
      district,
      thana,
      phone: req.user.phone,
      isAvailable: computedAvailableState,
      lastDonation: lastDonation || null,
      eligibleDate: eligibleDateStr,
      donationCount: lastDonation ? 1 : 0,
      createdAt: new Date().toISOString()
    };

    db.donors.push(newDonor);

    // If logged past donation, record it into history
    if (lastDonation) {
      db.donationHistory.push({
        id: db.donationHistory.length > 0 ? Math.max(...db.donationHistory.map(h => h.id)) + 1 : 1,
        donorId: newDonor.id,
        donatedOn: lastDonation,
        location: "Logged during donor onboarding",
        note: "Transferred from historical donation",
        createdAt: new Date(lastDonation).toISOString()
      });
    }

    writeDb(db);

    res.status(201).json({
      message: "Donor registration finished! Thank you for choosing to save lives.",
      donor: newDonor
    });
  });

  // Toggle donor availability
  app.post("/api/donor/toggle-availability", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });

    const db = readDb();
    const donorIdx = db.donors.findIndex(d => d.userId === req.user!.id);
    if (donorIdx === -1) {
      return res.status(404).json({ error: "You must be registered as a donor to toggle availability." });
    }

    const donor = db.donors[donorIdx];
    
    // Check if donor is in active cooldown
    const nowStamp = Date.now();
    if (donor.eligibleDate) {
      const eligStamp = new Date(donor.eligibleDate).getTime();
      if (nowStamp < eligStamp) {
        return res.status(400).json({ 
          error: `You cannot toggle availability during the 90-day donation cooldown period. Next eligibility: ${donor.eligibleDate}` 
        });
      }
    }

    db.donors[donorIdx].isAvailable = !donor.isAvailable;
    writeDb(db);

    res.json({
      message: `Availability changed to ${db.donors[donorIdx].isAvailable ? "Available" : "Unavailable"}.`,
      donor: db.donors[donorIdx]
    });
  });

  // Log donation (I Just Donated)
  app.post("/api/donor/log-donation", authenticateToken, (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });

    const { donatedOn, location, note } = req.body;
    if (!donatedOn || !location) {
      return res.status(400).json({ error: "Please insert both the date and the hospital/venue." });
    }

    const db = readDb();
    const donorIdx = db.donors.findIndex(d => d.userId === req.user!.id);
    if (donorIdx === -1) {
      return res.status(404).json({ error: "Donor profile not found." });
    }

    const donor = db.donors[donorIdx];
    
    // Keep track of the date constraint (cannot be in the future)
    const logDate = new Date(donatedOn);
    const today = new Date();
    if (logDate.getTime() > today.getTime()) {
      return res.status(400).json({ error: "Donation date cannot be in the future." });
    }

    // Set 90 days cooldown
    const eligDate = new Date(logDate.getTime() + 90 * 24 * 3600 * 1000);
    const eligibleDateStr = eligDate.toISOString().split("T")[0];

    db.donors[donorIdx].lastDonation = donatedOn;
    db.donors[donorIdx].eligibleDate = eligibleDateStr;
    db.donors[donorIdx].isAvailable = false; // Locked in cooldown
    db.donors[donorIdx].donationCount += 1;

    // Create history entry
    const newHistory: DonationHistory = {
      id: db.donationHistory.length > 0 ? Math.max(...db.donationHistory.map(h => h.id)) + 1 : 1,
      donorId: donor.id,
      donatedOn,
      location,
      note: note || "Independently logged via mobile log portal",
      createdAt: new Date().toISOString()
    };

    db.donationHistory.push(newHistory);
    writeDb(db);

    res.json({
      message: `Donation logged! Next eligible donation date is: ${eligibleDateStr}`,
      donor: db.donors[donorIdx],
      history: db.donationHistory.filter(h => h.donorId === donor.id)
    });
  });


  // ==========================================
  // BLOOD DONORS QUERY API
  // ==========================================

  app.get("/api/donors", (req: Request, res: Response) => {
    const { blood_group, division, district, compatible, available_only, sort } = req.query;
    const db = readDb();
    
    let list = [...db.donors];

    // Filter by available only
    if (available_only === "true") {
      list = list.filter(d => d.isAvailable);
    }

    // Filter by Division & District
    if (division) {
      list = list.filter(d => d.division.toLowerCase() === (division as string).toLowerCase());
    }
    if (district) {
      list = list.filter(d => d.district.toLowerCase() === (district as string).toLowerCase());
    }

    // Filter by Blood Group and compatibility
    if (blood_group) {
      const bgQuery = blood_group as string;
      if (compatible === "true") {
        // Can donation happen? 
        // Note: query parameter means patient's need, or donor's group?
        // Let's check prompt: "When 'Show compatible donors' checkbox is checked, query donors whose blood_group is compatible with the searched group."
        // Meaning, can this donor give blood to the group searched?
        // Let's apply our function canDonate(donorBG, searchedBloodGroup) => true
        list = list.filter(d => canDonate(d.bloodGroup, bgQuery));
      } else {
        // Exact match
        list = list.filter(d => d.bloodGroup === bgQuery);
      }
    }

    // Sorting
    if (sort === "most_donations") {
      list.sort((a, b) => b.donationCount - a.donationCount);
    } else if (sort === "recently_available") {
      // Available first, then newest first
      list.sort((a, b) => {
        if (a.isAvailable === b.isAvailable) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isAvailable ? -1 : 1;
      });
    } else {
      // Default chronological
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(list);
  });


  // ==========================================
  // REQUEST BOARD API
  // ==========================================

  // Get active and pin critical requests (expired are excluded automatically)
  app.get("/api/requests", (req: Request, res: Response) => {
    const { blood_group, district, urgency, division } = req.query;
    const db = readDb();
    const now = new Date();

    // Filter out expired items (> 7 days)
    let list = db.requests.filter(r => {
      const expr = new Date(r.expiresAt);
      return expr.getTime() > now.getTime();
    });

    // Filters
    if (blood_group) {
      list = list.filter(r => r.bloodGroup === blood_group);
    }
    if (division) {
      list = list.filter(r => r.division.toLowerCase() === (division as string).toLowerCase());
    }
    if (district) {
      list = list.filter(r => r.district.toLowerCase() === (district as string).toLowerCase());
    }
    if (urgency) {
      list = list.filter(r => r.urgency === urgency);
    }

    // Return list in proper sorting:
    // Unfulfilled first, Critical first, then Urgent, then Normal, then newest
    list.sort((a, b) => {
      // Fulfilled on bottom
      if (a.isFulfilled !== b.isFulfilled) {
        return a.isFulfilled ? 1 : -1;
      }
      
      const urgencyScore = (urg: string) => {
        if (urg === 'critical') return 3;
        if (urg === 'urgent') return 2;
        return 1;
      };

      const scoreA = urgencyScore(a.urgency);
      const scoreB = urgencyScore(b.urgency);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json(list);
  });

  // Post blood request (anonymous allowed)
  app.post("/api/request/new", (req: Request, res: Response) => {
    const { patientName, bloodGroup, hospital, division, district, thana, contact, urgency, unitsNeeded, userId } = req.body;
    
    if (!patientName || !bloodGroup || !hospital || !division || !district || !thana || !contact || !urgency) {
      return res.status(400).json({ error: "Please enter all required blood request fields." });
    }

    const db = readDb();
    const now = new Date();
    const expiry = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // Expiry = 7 days

    const newRequest: BloodRequest = {
      id: db.requests.length > 0 ? Math.max(...db.requests.map(r => r.id)) + 1 : 1,
      userId: userId ? parseInt(userId, 10) : null,
      patientName,
      bloodGroup,
      hospital,
      division,
      district,
      thana,
      contact,
      urgency,
      unitsNeeded: parseInt(unitsNeeded, 10) || 1,
      isFulfilled: false,
      createdAt: now.toISOString(),
      expiresAt: expiry.toISOString()
    };

    db.requests.push(newRequest);
    writeDb(db);

    // Calculate matching / compatible available donors in targeted district as helper response
    const matchingDonors = db.donors.filter(d => 
      d.isAvailable && 
      d.district.toLowerCase() === district.toLowerCase() && 
      canDonate(d.bloodGroup, bloodGroup)
    );

    res.status(201).json({
      message: "Blood request posted successfully to the live bulletin!",
      request: newRequest,
      matchingDonorsCount: matchingDonors.length
    });
  });

  // Mark blood request fulfilled
  app.post("/api/requests/:id/fulfill", (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const db = readDb();
    
    const idx = db.requests.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: "Blood request not found." });
    }

    db.requests[idx].isFulfilled = true;
    writeDb(db);

    res.json({
      message: "Blood request has been successfully marked as satisfied!",
      request: db.requests[idx]
    });
  });


  // ==========================================
  // CORE STATISTICS & ANALYTICS
  // ==========================================

  // Live counters stats summary
  app.get("/api/stats", (req: Request, res: Response) => {
    const db = readDb();
    const now = new Date();

    const donorsCount = db.donors.length;
    const activeRequests = db.requests.filter(r => !r.isFulfilled && new Date(r.expiresAt).getTime() > now.getTime()).length;
    
    const uniqueDistricts = new Set(db.donors.map(d => d.district.toLowerCase()));
    const districtsCovered = uniqueDistricts.size || 1; // Safeguard non-zero
    
    // Sum of all individual donor logged donations + manual donation histories count
    const historyCount = db.donationHistory.length;

    res.json({
      total_donors: donorsCount,
      available: db.donors.filter(d => d.isAvailable).length,
      requests_week: activeRequests,
      fulfilled: db.requests.filter(r => r.isFulfilled).length || historyCount,
      districts_covered: districtsCovered
    });
  });

  // Donut chart counts: Donor distribution by group
  app.get("/api/donor-count", (req: Request, res: Response) => {
    const db = readDb();
    const groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    
    const data = groups.map(g => {
      const count = db.donors.filter(d => d.bloodGroup === g).length;
      return { group: g, count };
    });

    res.json(data);
  });

  // Bar chart counts: Top 10 districts with donor count
  app.get("/api/district-donors", (req: Request, res: Response) => {
    const db = readDb();
    const distMap: { [key: string]: number } = {};
    
    db.donors.forEach(d => {
      distMap[d.district] = (distMap[d.district] || 0) + 1;
    });

    const sortedData = Object.keys(distMap).map(dIdx => ({
      district: dIdx,
      count: distMap[dIdx]
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    res.json(sortedData);
  });

  // Line chart counts: Request bulletin activity over last 30 days
  app.get("/api/requests-timeline", (req: Request, res: Response) => {
    const db = readDb();
    const timelineMap: { [key: string]: number } = {};
    
    // Populate last 30 days default values as 0 to ensure cohesive chart visual
    const today = new Date();
    for (let c = 29; c >= 0; c--) {
      const prevDate = new Date(today.getTime() - c * 24 * 3600 * 1000);
      const prevDateStr = prevDate.toISOString().split("T")[0];
      timelineMap[prevDateStr] = 0;
    }

    db.requests.forEach(r => {
      const rDateStr = r.createdAt.split("T")[0];
      if (timelineMap[rDateStr] !== undefined) {
        timelineMap[rDateStr]++;
      }
    });

    const timelineData = Object.keys(timelineMap).map(date => ({
      date,
      count: timelineMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    res.json(timelineData);
  });


  // ==========================================
  // HOSPITALS DIRECTORY API
  // ==========================================

  app.get("/api/hospitals", (req: Request, res: Response) => {
    const { search, district } = req.query;
    const db = readDb();

    let list = [...db.hospitals];

    if (district) {
      list = list.filter(h => h.district.toLowerCase() === (district as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      list = list.filter(h => 
        h.name.toLowerCase().includes(q) || 
        h.address.toLowerCase().includes(q) ||
        h.thana.toLowerCase().includes(q)
      );
    }

    res.json(list);
  });


  // ==========================================
  // VITE GRAPHICAL MIDDLEWARES INFRASTRUCTURE
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
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
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`🩸 RaktaBD is running at http://localhost:${PORT}`);
  });
}

startServer();
