/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Donor, DonationHistory, BloodRequest, Hospital, GEOGRAPHY } from '../src/types';

const DB_PATH = path.join(process.cwd(), 'database.json');

export interface DatabaseSchema {
  users: User[];
  donors: Donor[];
  donationHistory: DonationHistory[];
  requests: BloodRequest[];
  hospitals: Hospital[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Default/Initial DB Structure
const initialDb: DatabaseSchema = {
  users: [],
  donors: [],
  donationHistory: [],
  requests: [],
  hospitals: []
};

// Read database
export function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(initialDb);
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data) as DatabaseSchema;
  } catch (error) {
    console.error("Error reading database", error);
    return initialDb;
  }
}

// Write database
export function writeDb(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing database", error);
  }
}

// Core seeding function
export function seedDbIfNeeded() {
  const db = readDb();
  
  if (db.users.length > 0 || db.hospitals.length > 0) {
    console.log("Database already has data. Skipping seed.");
    return;
  }

  console.log("Seeding Database...");

  const now = new Date();
  
  // 1. Seed 10 Users
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const userNames = [
    "Arif Rahman", "Sajid Hasan", "Anika Tahsin", "Tamim Iqbal", "Fahmida Akter",
    "Taskin Ahmed", "Nusrat Jahan", "Kamrul Islam", "Sultana Razia", "Zubayer Al-Mahmud"
  ];

  const divisions = Object.keys(GEOGRAPHY);

  const users: User[] = userNames.map((name, idx) => {
    const isDonor = idx < 7; // First 7 users are donors
    const bg = BLOOD_GROUPS[idx % BLOOD_GROUPS.length];
    const division = divisions[idx % divisions.length];
    const districts = GEOGRAPHY[division];
    const district = districts[0];
    
    return {
      id: idx + 1,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      passwordHash: hashPassword("password123"),
      bloodGroup: bg,
      phone: `017123456${idx.toString().padStart(2, '0')}`,
      division,
      district,
      thana: "Sadar",
      isDonor,
      createdAt: new Date(now.getTime() - idx * 24 * 3600 * 1000).toISOString()
    };
  });

  // 2. Seed 50 Donors (including user donors)
  // Let's generate 43 additional donors to make exactly 50 donors!
  const donors: Donor[] = [];
  
  // First, map the first 7 users to donors
  for (let idx = 0; idx < 7; idx++) {
    const user = users[idx];
    const lastDonOffset = idx % 2 === 0 ? 100 * 24 * 3600 * 1000 : 45 * 24 * 3600 * 1000;
    const lastDonDateStr = idx % 3 === 0 ? null : new Date(now.getTime() - lastDonOffset).toISOString().split('T')[0];
    
    let eligibleDateStr: string | null = null;
    let isAvailable = true;
    if (lastDonDateStr) {
      const lastDon = new Date(lastDonDateStr);
      const eligible = new Date(lastDon.getTime() + 90 * 24 * 3600 * 1000);
      eligibleDateStr = eligible.toISOString().split('T')[0];
      isAvailable = now.getTime() >= eligible.getTime();
    }

    donors.push({
      id: idx + 1,
      userId: user.id,
      name: user.name,
      bloodGroup: user.bloodGroup!,
      division: user.division,
      district: user.district,
      thana: user.thana,
      phone: user.phone,
      isAvailable: isAvailable,
      lastDonation: lastDonDateStr,
      eligibleDate: eligibleDateStr,
      donationCount: idx % 3 === 0 ? 0 : (idx % 3),
      createdAt: user.createdAt
    });
  }

  // Generate 43 synthetic donors
  const seedFirstNames = ["Abdur", "Mofiz", "Nazrul", "Kazi", "Hasina", "Khaleda", "Sheikh", "Mustafiz", "Liton", "Mushfiq", "Soumya", "Imrul", "Shakib", "Mashrafe", "Rubel", "Taskin", "Taijul", "Bijoy", "Mehedi", "Sabbir", "Nasir", "Al-Amin", "Shoriful", "Afif", "Naim", "Mahedi", "Nasum", "Ebadot", "Khaled", "Zakir", "Yasir", "Towhid", "Shamim", "Rishad", "Tanzim", "Jaker", "Munim", "Hasan", "Zaker", "Mahmudullah", "Riad", "Saif", "Jamil"];
  const seedLastNames = ["Khan", "Chowdhury", "Mia", "Ahmed", "Islam", "Ali", "Hasan", "Sarkar", "Raza", "Haque", "Bhuiyan", "Patwary", "Akter", "Begum", "Talukder", "Uddin", "Gazi", "Zaman", "Shekh", "Alam", "Miah", "Rahman", "Mridha"];

  for (let i = 0; i < 43; i++) {
    const fName = seedFirstNames[i % seedFirstNames.length];
    const lName = seedLastNames[(i * 3) % seedLastNames.length];
    const name = `${fName} ${lName}`;
    const bg = BLOOD_GROUPS[i % BLOOD_GROUPS.length];
    
    // Distribute across all divisions/districts
    const div = divisions[i % divisions.length];
    const distList = GEOGRAPHY[div];
    const dist = distList[(i + 1) % distList.length];
    const thana = `${dist} Sadar`;
    
    const count = i % 5;
    const lastDonOffset = i % 2 === 0 ? 120 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
    const lastDonDateStr = count === 0 ? null : new Date(now.getTime() - lastDonOffset).toISOString().split('T')[0];
    
    let eligibleDateStr: string | null = null;
    let isAvailable = true;
    if (lastDonDateStr) {
      const lastDon = new Date(lastDonDateStr);
      const eligible = new Date(lastDon.getTime() + 90 * 24 * 3600 * 1000);
      eligibleDateStr = eligible.toISOString().split('T')[0];
      isAvailable = now.getTime() >= eligible.getTime();
    }

    // Give a dummy userId (using out-of-bounds user index so there's no conflict)
    donors.push({
      id: donors.length + 1,
      userId: 100 + i,
      name,
      bloodGroup: bg,
      division: div,
      district: dist,
      thana,
      phone: `018${(32100000 + i * 23145).toString().substring(0, 8)}`,
      isAvailable,
      lastDonation: lastDonDateStr,
      eligibleDate: eligibleDateStr,
      donationCount: count,
      createdAt: new Date(now.getTime() - (i + 10) * 24 * 3600 * 1000).toISOString()
    });
  }

  // 3. Seed Donation History
  const donationHistory: DonationHistory[] = [];
  donors.forEach(donor => {
    if (donor.donationCount > 0 && donor.lastDonation) {
      // Create entries
      const count = donor.donationCount;
      for (let c = 0; c < count; c++) {
        const offset = c === 0 
          ? 0 
          : (c * 100) * 24 * 3600 * 1000;
        
        const originalDonationTime = new Date(donor.lastDonation).getTime() - offset;
        const donatedOn = new Date(originalDonationTime).toISOString().split('T')[0];
        
        donationHistory.push({
          id: donationHistory.length + 1,
          donorId: donor.id,
          donatedOn,
          location: c % 2 === 0 ? "Dhaka Medical College Hospital" : "Sadar General Hospital",
          note: c === 0 ? "Regular blood donation." : "Urgent critical call donor",
          createdAt: new Date(originalDonationTime).toISOString()
        });
      }
    }
  });

  // 4. Seed 15 Requests
  const patientFirstNames = ["Fatema", "Rhim", "Jesmin", "Kabir", "Monir", "Nasrin", "Selim", "Tariq", "Zia", "Kalam", "Shirin", "Suman", "Keya", "Jewel", "Laila"];
  const patientLastNames = ["Begum", "Mia", "Akter", "Uddin", "Ahmed", "Hossain", "Khatun", "Islam", "Rahman", "Parveen"];
  
  const requests: BloodRequest[] = [];
  for (let i = 0; i < 15; i++) {
    const fName = patientFirstNames[i % patientFirstNames.length];
    const lName = patientLastNames[i % patientLastNames.length];
    const patientName = `${fName} ${lName}`;
    const bg = BLOOD_GROUPS[(i + 2) % BLOOD_GROUPS.length];
    
    // Mix divisions and districts
    const div = divisions[i % divisions.length];
    const distList = GEOGRAPHY[div];
    const dist = distList[i % distList.length];
    
    const hospitalsList = [
      "Medical College Hospital",
      "General Sadar Hospital",
      "Ibn Sina Clinic",
      "Popular Medical Care"
    ];
    const hospitalName = `${dist} ${hospitalsList[i % hospitalsList.length]}`;
    
    // Timestamps
    let requestTimeOffset = 0;
    if (i < 4) {
      // Critical (pulsing) - posted very recently
      requestTimeOffset = i * 2 * 3600 * 1000; // a few hours ago
    } else if (i < 10) {
      // Urgent - posted 1-3 days ago
      requestTimeOffset = (i - 3) * 24 * 3600 * 1000;
    } else {
      // Expired or Normal - some posted > 8 days ago
      requestTimeOffset = (i - 7) * 4 * 24 * 3600 * 1000; 
    }

    const createdAtDate = new Date(now.getTime() - requestTimeOffset);
    const expiresAtDate = new Date(createdAtDate.getTime() + 7 * 24 * 3600 * 1000);
    
    const urgency = i < 4 ? 'critical' : (i < 10 ? 'urgent' : 'normal');
    const isFulfilled = i % 5 === 0; // Some are fulfilled

    requests.push({
      id: i + 1,
      userId: i < 5 ? (i + 1) : null, // mix of anonymous and logged-in user requests
      patientName,
      bloodGroup: bg,
      hospital: hospitalName,
      division: div,
      district: dist,
      thana: "Sadar",
      contact: `019${(45600000 + i * 1423).toString().substring(0, 8)}`,
      urgency,
      unitsNeeded: (i % 2) + 1,
      isFulfilled,
      createdAt: createdAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString()
    });
  }

  // 5. Seed 30 Hospitals
  const hospitals: Hospital[] = [
    {
      id: 1,
      name: "Dhaka Medical College Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Shahbagh",
      phone: "01711223344",
      hasBloodBank: true,
      address: "Ramna, Dhaka-1000"
    },
    {
      id: 2,
      name: "Chittagong Medical College Hospital",
      division: "Chittagong",
      district: "Chittagong",
      thana: "Panchlaish",
      phone: "01811223344",
      hasBloodBank: true,
      address: "KB Fazlul Kader Road, Panchlaish, Chittagong"
    },
    {
      id: 3,
      name: "Shaheed Suhrawardy Medical College Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Sher-e-Bangla Nagar",
      phone: "01755667788",
      hasBloodBank: true,
      address: "Sher-e-Bangla Nagar, Dhaka-1207"
    },
    {
      id: 4,
      name: "Sir Salimullah Medical College Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Mitford",
      phone: "01711556677",
      hasBloodBank: true,
      address: "Mitford Road, Babubazar, Dhaka"
    },
    {
      id: 5,
      name: "Rajshahi Medical College Hospital",
      division: "Rajshahi",
      district: "Rajshahi",
      thana: "Rajshahi Sadar",
      phone: "01733224455",
      hasBloodBank: true,
      address: "Sipahipara, Rajshahi"
    },
    {
      id: 6,
      name: "Sylhet MAG Osmani Medical College Hospital",
      division: "Sylhet",
      district: "Sylhet",
      thana: "Sylhet Sadar",
      phone: "01722889900",
      hasBloodBank: true,
      address: "Kajolshah, Sylhet-3100"
    },
    {
      id: 7,
      name: "Khulna Medical College Hospital",
      division: "Khulna",
      district: "Khulna",
      thana: "Boyra",
      phone: "01744556633",
      hasBloodBank: true,
      address: "Boyra, Khulna"
    },
    {
      id: 8,
      name: "Rangpur Medical College Hospital",
      division: "Rangpur",
      district: "Rangpur",
      thana: "Rangpur Sadar",
      phone: "01755112244",
      hasBloodBank: true,
      address: "Rangpur Sadar, Rangpur"
    },
    {
      id: 9,
      name: "Mymensingh Medical College Hospital",
      division: "Mymensingh",
      district: "Mymensingh",
      thana: "Charpara",
      phone: "01712445566",
      hasBloodBank: true,
      address: "Charpara, Mymensingh"
    },
    {
      id: 10,
      name: "Square Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Panthapath",
      phone: "01713377777",
      hasBloodBank: true,
      address: "18F, West Panthapath, Dhaka-1205"
    },
    {
      id: 11,
      name: "United Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Gulshan",
      phone: "01914001234",
      hasBloodBank: true,
      address: "Plot 15, Road 71, Gulshan 2, Dhaka"
    },
    {
      id: 12,
      name: "Labaid Specialized Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Dhanmondi",
      phone: "01713333333",
      hasBloodBank: true,
      address: "House 1, Road 4, Dhanmondi, Dhaka"
    },
    {
      id: 13,
      name: "Ibn Sina Hospital",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Dhanmondi",
      phone: "01711663344",
      hasBloodBank: true,
      address: "House 68, Road 15/A, Dhanmondi, Dhaka"
    },
    {
      id: 14,
      name: "Popular Medical Centre",
      division: "Dhaka",
      district: "Dhaka",
      thana: "Dhanmondi",
      phone: "01711998877",
      hasBloodBank: false,
      address: "House 16, Road 2, Dhanmondi, Dhaka"
    },
    {
      id: 15,
      name: "Barisal Sher-e-Bangla Medical College Hospital",
      division: "Barisal",
      district: "Barisal",
      thana: "Band Road",
      phone: "01711559900",
      hasBloodBank: true,
      address: "Band Road, Barisal"
    },
    {
      id: 16,
      name: "Comilla Medical College Hospital",
      division: "Chittagong",
      district: "Comilla",
      thana: "Kuchaitali",
      phone: "01711442299",
      hasBloodBank: true,
      address: "Kuchaitali, Comilla"
    },
    {
      id: 17,
      name: "Feni Sadar General Hospital",
      division: "Chittagong",
      district: "Feni",
      thana: "Sadar",
      phone: "01711776633",
      hasBloodBank: true,
      address: "Sadar Hospital Road, Feni"
    },
    {
      id: 18,
      name: "Bogra Mohammad Ali Hospital",
      division: "Rajshahi",
      district: "Bogra",
      thana: "Bogra Sadar",
      phone: "01711445588",
      hasBloodBank: true,
      address: "Mofizuddin Road, Bogra"
    },
    {
      id: 19,
      name: "Pabna General Hospital",
      division: "Rajshahi",
      district: "Pabna",
      thana: "Pabna Sadar",
      phone: "01711003344",
      hasBloodBank: false,
      address: "Sadar Hospital Road, Pabna"
    },
    {
      id: 20,
      name: "Jessore General Hospital",
      division: "Khulna",
      district: "Jessore",
      thana: "Jessore Sadar",
      phone: "01711993311",
      hasBloodBank: true,
      address: "Hospital Road, Jessore"
    },
    {
      id: 21,
      name: "Kushtia General Hospital",
      division: "Khulna",
      district: "Kushtia",
      thana: "Kushtia Sadar",
      phone: "01711552277",
      hasBloodBank: true,
      address: "N S Road, Kushtia"
    },
    {
      id: 22,
      name: "Moulvibazar Sadar Hospital",
      division: "Sylhet",
      district: "Moulvibazar",
      thana: "Sadar",
      phone: "01711330099",
      hasBloodBank: true,
      address: "Sadar Hospital Road, Moulvibazar"
    },
    {
      id: 23,
      name: "Cox's Bazar District Hospital",
      division: "Chittagong",
      district: "Cox's Bazar",
      thana: "Cox's Bazar Sadar",
      phone: "01711226688",
      hasBloodBank: true,
      address: "Hospital Road, Cox's Bazar"
    },
    {
      id: 24,
      name: "Gazipur Sadar Hospital",
      division: "Dhaka",
      district: "Gazipur",
      thana: "Gazipur Sadar",
      phone: "01711883344",
      hasBloodBank: false,
      address: "Sadar Hospital Road, Joydebpur, Gazipur"
    },
    {
      id: 25,
      name: "Narayanganj 300 Bed Hospital",
      division: "Dhaka",
      district: "Narayanganj",
      thana: "Khanpur",
      phone: "01711002288",
      hasBloodBank: true,
      address: "Khanpur, Narayanganj"
    },
    {
      id: 26,
      name: "Dinajpur Sadar Medical College Hospital",
      division: "Rangpur",
      district: "Dinajpur",
      thana: "Dinajpur Sadar",
      phone: "01711992255",
      hasBloodBank: true,
      address: "Ananda Sagar, Dinajpur"
    },
    {
      id: 27,
      name: "Jamalpur Sadar General Hospital",
      division: "Mymensingh",
      district: "Jamalpur",
      thana: "Jamalpur Sadar",
      phone: "01711440022",
      hasBloodBank: false,
      address: "Hospital Road, Jamalpur"
    },
    {
      id: 28,
      name: "Patuakhali Sadar Hospital",
      division: "Barisal",
      district: "Patuakhali",
      thana: "Sadar",
      phone: "01711663300",
      hasBloodBank: true,
      address: "Sadar Hospital Road, Patuakhali"
    },
    {
      id: 29,
      name: "Habiganj Sadar Hospital",
      division: "Sylhet",
      district: "Habiganj",
      thana: "Habiganj Sadar",
      phone: "01711448833",
      hasBloodBank: false,
      address: "Sadar Road, Habiganj"
    },
    {
      id: 30,
      name: "Natore District Sadar Hospital",
      division: "Rajshahi",
      district: "Natore",
      thana: "Natore Sadar",
      phone: "01711554422",
      hasBloodBank: true,
      address: "Hospital Road, Natore"
    }
  ];

  writeDb({
    users,
    donors,
    donationHistory,
    requests,
    hospitals
  });

  console.log("Database successfully seeded 10 Users, 50 Donors, histories, 15 requests, and 30 hospitals!");
}
