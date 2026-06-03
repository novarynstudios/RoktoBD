/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash?: string; // Hidden on client
  bloodGroup: string | null;
  phone: string;
  division: string;
  district: string;
  thana: string;
  isDonor: boolean;
  createdAt: string;
}

export interface Donor {
  id: number;
  userId: number;
  name: string; // denormalized for search convenience
  bloodGroup: string;
  division: string;
  district: string;
  thana: string;
  phone: string; // denormalized
  isAvailable: boolean;
  lastDonation: string | null; // YYYY-MM-DD
  eligibleDate: string | null; // YYYY-MM-DD
  donationCount: number;
  createdAt: string;
}

export interface DonationHistory {
  id: number;
  donorId: number;
  donatedOn: string; // YYYY-MM-DD
  location: string;
  note: string;
  createdAt: string;
}

export interface BloodRequest {
  id: number;
  userId: number | null; // Null if anonymous
  patientName: string;
  bloodGroup: string;
  hospital: string;
  division: string;
  district: string;
  thana: string;
  contact: string;
  urgency: 'critical' | 'urgent' | 'normal';
  unitsNeeded: number;
  isFulfilled: boolean;
  createdAt: string;
  expiresAt: string; // createdAt + 7 days
}

export interface Hospital {
  id: number;
  name: string;
  division: string;
  district: string;
  thana: string;
  phone: string;
  hasBloodBank: boolean;
  address: string;
}

export const BLOOD_COMPATIBILITY: { [key: string]: string[] } = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

// Check if donor blood group can donate to patient blood group
export function canDonate(donorBG: string, patientBG: string): boolean {
  const targets = BLOOD_COMPATIBILITY[donorBG];
  return targets ? targets.includes(patientBG) : false;
}

export const GEOGRAPHY: { [division: string]: string[] } = {
  "Dhaka": [
    "Dhaka", "Gazipur", "Narayanganj", "Manikganj", "Munshiganj",
    "Narsingdi", "Faridpur", "Gopalganj", "Madaripur", "Rajbari", "Shariatpur"
  ],
  "Chittagong": [
    "Chittagong", "Cox's Bazar", "Rangamati", "Bandarban", "Khagrachhari",
    "Feni", "Lakshmipur", "Noakhali", "Comilla", "Chandpur", "Brahmanbaria"
  ],
  "Rajshahi": [
    "Rajshahi", "Bogra", "Pabna", "Sirajganj", "Natore",
    "Naogaon", "Chapai Nawabganj", "Joypurhat"
  ],
  "Khulna": [
    "Khulna", "Bagerhat", "Satkhira", "Jessore", "Narail",
    "Magura", "Jhenaidah", "Kushtia", "Meherpur", "Chuadanga"
  ],
  "Sylhet": ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  "Barisal": [
    "Barisal", "Bhola", "Patuakhali", "Pirojpur", "Jhalokathi", "Barguna"
  ],
  "Rangpur": [
    "Rangpur", "Dinajpur", "Thakurgaon", "Panchagarh",
    "Nilphamari", "Lalmonirhat", "Kurigram", "Gaibandha"
  ],
  "Mymensingh": ["Mymensingh", "Jamalpur", "Sherpur", "Netrokona"]
};
