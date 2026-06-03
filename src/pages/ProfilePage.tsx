/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  User, 
  MapPin, 
  Phone, 
  Heart, 
  Award, 
  Calendar, 
  Plus, 
  Settings, 
  Save, 
  X, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  HeartPulse, 
  Lock,
  ChevronRight,
  ShieldCheck,
  Building,
  Loader2
} from "lucide-react";
import HistoryTimeline from "../components/HistoryTimeline";
import DonationModal from "../components/DonationModal";
import { User as UserType, Donor, DonationHistory, BloodRequest, GEOGRAPHY } from "../types";

interface ProfilePageProps {
  setView: (v: string) => void;
  currentUser: UserType;
  token: string | null;
  onUpdateUser: (updatedUser: any) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function ProfilePage({ setView, currentUser, token, onUpdateUser, showToast }: ProfilePageProps) {
  // Sync states
  const [donor, setDonor] = useState<Donor | null>(null);
  const [history, setHistory] = useState<DonationHistory[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit profile screen options
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editBloodGroup, setEditBloodGroup] = useState(currentUser.bloodGroup || "");
  const [editPhone, setEditPhone] = useState(currentUser.phone);
  const [editDivision, setEditDivision] = useState(currentUser.division);
  const [editDistrict, setEditDistrict] = useState(currentUser.district);
  const [editThana, setEditThana] = useState(currentUser.thana);
  const [editLoading, setEditLoading] = useState(false);

  // Cascades list
  const editDistList = editDivision ? GEOGRAPHY[editDivision] : [];

  // Submit modal controllers
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // Local active cooldown indicator
  const [inCooldown, setInCooldown] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  // Action toggle loading states
  const [toggleLoading, setToggleLoading] = useState(false);
  const [fulfillLoadingId, setFulfillLoadingId] = useState<number | null>(null);

  // Fetch full profile parameters
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setDonor(data.donor);
        setHistory(data.history || []);
        
        // Evaluate active cooldown dates
        if (data.donor && data.donor.eligibleDate) {
          const eligibleTime = new Date(data.donor.eligibleDate).getTime();
          const todayTime = Date.now();
          if (todayTime < eligibleTime) {
            setInCooldown(true);
            const remainingSec = (eligibleTime - todayTime) / 1000;
            const remainingDays = Math.ceil(remainingSec / (24 * 3600));
            setDaysRemaining(remainingDays);
          } else {
            setInCooldown(false);
            setDaysRemaining(0);
          }
        }
      }

      // Fetch unfulfilled or self-posted requests
      const reqRes = await fetch("/api/requests");
      const reqData = await reqRes.json();
      if (reqRes.ok) {
        // filter user specific requests
        const selfRequests = reqData.filter((r: BloodRequest) => r.userId === currentUser.id);
        setMyRequests(selfRequests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [currentUser]);

  // Handle Edit Profile submission
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim() || !editDivision || !editDistrict || !editThana.trim()) {
      showToast("Please fill out all the profile fields.", "error");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch("/api/profile/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          bloodGroup: editBloodGroup || null,
          phone: editPhone,
          division: editDivision,
          district: editDistrict,
          thana: editThana
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile edit request failed.");
      }

      showToast("Your profile records have been updated!", "success");
      onUpdateUser(data.user);
      if (data.donor) {
        setDonor(data.donor);
      }
      setIsEditing(false);
    } catch (err: any) {
      showToast(err.message || "Unable to update profile parameters.", "error");
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Availability status toggle
  const handleToggleAvailability = async () => {
    if (inCooldown) {
      showToast(`You cannot toggle status during active safety cooldown! Next eligible: ${donor?.eligibleDate}`, "error");
      return;
    }

    setToggleLoading(true);
    try {
      const res = await fetch("/api/donor/toggle-availability", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Toggle failed.");
      }

      setDonor(data.donor);
      showToast(`Availability changed to ${data.donor.isAvailable ? "Available Now" : "Unavailable"}.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed.", "error");
    } finally {
      setToggleLoading(false);
    }
  };

  // Mark personal self request as Fulfilled
  const handleFulfillMyRequest = async (reqId: number) => {
    setFulfillLoadingId(reqId);
    try {
      const res = await fetch(`/api/requests/${reqId}/fulfill`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
         throw new Error(data.error || "Failed updates.");
      }
      showToast("Fulfillment registered dynamically!", "success");
      
      // Local sync
      setMyRequests(prev => prev.map(r => r.id === reqId ? { ...r, isFulfilled: true } : r));
    } catch (err: any) {
      showToast(err.message || "Unable to fulfill request.", "error");
    } finally {
      setFulfillLoadingId(null);
    }
  };

  // Success handler for logging donation within overlay modal
  const handleDonationLogSuccess = (updatedDonor: any, updatedHistory: any[]) => {
    setDonor(updatedDonor);
    setHistory(updatedHistory);
    
    // Recalculate properties
    if (updatedDonor.eligibleDate) {
      setInCooldown(true);
      const remainingSec = (new Date(updatedDonor.eligibleDate).getTime() - Date.now()) / 1000;
      setDaysRemaining(Math.ceil(remainingSec / (24 * 3600)));
    }

    showToast("Special support registered! Donation successfully recorded.", "success");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center">
        <Loader2 className="w-10 h-10 text-red-primary animate-spin mx-auto mb-4" />
        <p className="text-gray-950 font-black font-heading text-lg">Consulting RaktaBD profiles...</p>
        <p className="text-gray-500 font-bold text-xs mt-1">Downloading live history, safety locks, and logged requests.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-16">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-5">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-gray-950 flex items-center gap-1.5">
            <User className="w-8 h-8 text-red-primary shrink-0" />
            My RaktaBD Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">Edit credentials, manage donor statuses, and track timeline logs and emergencies</p>
        </div>

        {/* Edit profile toggle btn */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-black bg-white border-2 border-black hover:bg-gray-100 px-4 py-2.5 rounded-lg transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] shrink-0 cursor-pointer font-heading"
          >
            <Settings className="w-4 h-4 shrink-0" /> Edit Profile Details
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: USER DETAILS & COOLDOWNS */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bento-card bg-white p-6 space-y-4">
            
            {isEditing ? (
              /* Inline Editable Form fields */
              <form onSubmit={handleEditProfile} className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <span className="font-heading font-black text-gray-950">Edit Credentials</span>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(currentUser.name);
                      setEditBloodGroup(currentUser.bloodGroup || "");
                      setEditPhone(currentUser.phone);
                    }}
                    className="p-1 border-2 border-black rounded-full text-black hover:bg-gray-50 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
                  />
                </div>

                {/* Blood group */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">Blood Group</label>
                  <select
                    value={editBloodGroup}
                    onChange={(e) => setEditBloodGroup(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
                  >
                    <option value="">-- Specify Blood Group --</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">Phone Helpline *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-mono font-black text-gray-950"
                  />
                </div>

                {/* Division cascading */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">Division *</label>
                  <select
                    value={editDivision}
                    onChange={(e) => {
                      setEditDivision(e.target.value);
                      setEditDistrict("");
                    }}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
                  >
                    <option value="">-- Choose Division --</option>
                    {Object.keys(GEOGRAPHY).map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                {/* Districts cascade */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">District *</label>
                  <select
                    value={editDistrict}
                    disabled={!editDivision}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955 disabled:opacity-50"
                  >
                    <option value="">-- Choose District --</option>
                    {editDistList.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Thana */}
                <div>
                  <label className="block text-[10px] font-black text-black uppercase font-mono mb-1.5">Thana / Sub-district *</label>
                  <input
                    type="text"
                    required
                    value={editThana}
                    onChange={(e) => setEditThana(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
                  />
                </div>

                {/* CTAs */}
                <div className="flex gap-2 pt-3 border-t-2 border-black font-heading">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 text-xs border-2 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-extrabold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2 text-xs bg-red-primary hover:bg-rose-600 border-2 border-black text-white rounded-lg font-black flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform cursor-pointer"
                  >
                    {editLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save ✓
                  </button>
                </div>

              </form>
            ) : (
              /* Non-editable metadata block cards */
              <div className="space-y-4">
                
                {/* User Avatar & Name */}
                <div className="flex items-center gap-3 border-b-2 border-black pb-3">
                  <div className="w-12 h-12 bg-red-pale border-2 border-black rounded-full flex items-center justify-center text-red-primary font-heading font-black text-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none shrink-0">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-black text-lg text-gray-955 truncate leading-tight">
                      {currentUser.name}
                    </h3>
                    <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded font-mono font-black tracking-wider uppercase inline-block mt-0.5">MEMBER</span>
                  </div>
                </div>

                {/* Details layout lists */}
                <div className="space-y-4 pt-2 text-sm text-gray-900">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-primary shrink-0 fill-red-pale" />
                    <div>
                      <span className="text-gray-550 block text-[10px] font-black uppercase font-mono">Blood Group</span>
                      <strong className="text-gray-950 text-base font-heading font-black">{currentUser.bloodGroup || "Not declared"}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-red-primary shrink-0" />
                    <div>
                      <span className="text-gray-550 block text-[10px] font-black uppercase font-mono">Mobile Lines Direct</span>
                      <strong className="text-gray-950 font-mono text-xs font-black">{currentUser.phone}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-red-primary shrink-0 animate-bounce" />
                    <div>
                      <span className="text-gray-550 block text-[10px] font-black uppercase font-mono">Geographic Address</span>
                      <strong className="text-gray-950 text-xs font-bold block leading-snug">
                        {currentUser.division} division, {currentUser.district}, {currentUser.thana}
                      </strong>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* DONOR STATUS PANEL */}
          <div className="bento-card bg-white p-6 space-y-4">
            
            <div className="flex items-center gap-2 border-b-2 border-black pb-3">
              <HeartPulse className="w-6 h-6 text-red-primary shrink-0 fill-red-pale animate-pulse" />
              <h3 className="font-heading font-black text-[15px] text-gray-950">Volunteer Donor Status</h3>
            </div>

            {donor ? (
              /* Already a registered donor profile options */
              <div className="space-y-4 text-sm">
                
                {/* Available Status Toggle bar */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50 border-2 border-black rounded-lg shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                  <div>
                    <span className="text-xs font-black text-black uppercase tracking-widest block font-mono">Instant Status</span>
                    {inCooldown ? (
                      <span className="text-[10px] text-amber-600 font-black block">IN COOLDOWN 🛑</span>
                    ) : donor.isAvailable ? (
                      <span className="text-[10px] text-green-600 font-black block">Available Now ✓</span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold block">Inactive / Busy</span>
                    )}
                  </div>

                  {toggleLoading ? (
                    <Loader2 className="w-5 h-5 text-red-primary animate-spin" />
                  ) : (
                    <button
                      type="button"
                      disabled={inCooldown}
                      onClick={handleToggleAvailability}
                      className={`w-11 h-6 rounded-full border-2 border-black transition-colors flex items-center p-0.5 outline-hidden relative ${donor.isAvailable ? "bg-red-primary" : "bg-gray-300"} ${inCooldown ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span className={`w-4 h-4 bg-white border-2 border-black rounded-full shadow-xs transform duration-200 ${donor.isAvailable ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  )}
                </div>

                {/* Cooldown Timer Alert blocks */}
                {inCooldown && (
                  <div className="p-3.5 bg-amber-50 border-2 border-black text-amber-955 text-xs rounded-xl leading-relaxed flex gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <Clock className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
                    <div className="font-bold">
                      <span className="font-extrabold block uppercase tracking-wider text-[10px] text-amber-800 font-mono mb-0.5">Donation Safety Lock:</span>
                      Resting period active following your donation on {donor.lastDonation}. 
                      Your account details are protected. Remaining cooldown: 
                      <strong> {daysRemaining} days</strong>. Next eligibility: <strong>{donor.eligibleDate}</strong>.
                    </div>
                  </div>
                )}

                {/* Vol statistics */}
                <div className="grid grid-cols-2 gap-3.5 pt-2 text-center text-xs font-heading">
                  <div className="p-3.5 bg-rose-50/20 border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <span className="text-gray-550 font-black block mb-1 uppercase text-[9px] font-mono leading-none">Lives Saved</span>
                    <strong className="text-red-primary text-xl font-mono font-black">{donor.donationCount}x</strong>
                  </div>
                  <div className="p-3.5 bg-rose-50/20 border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)] flex flex-col justify-center">
                    <span className="text-gray-550 font-black block mb-1 uppercase text-[9px] font-mono leading-none">Registry</span>
                    <strong className="text-purple-700 font-black uppercase tracking-widest text-[11px]">{donor.bloodGroup} Volunteer</strong>
                  </div>
                </div>

                {/* Log Completed Donation Button */}
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(true)}
                  className="w-full py-3 bg-red-primary hover:bg-rose-600 text-white border-2 border-black font-heading font-black text-xs uppercase tracking-widest rounded-full transition-transform shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-[-1.5px] active:translate-y-[1px] text-center cursor-pointer"
                >
                  🩸 I Just Donated / Saved Lives
                </button>

              </div>
            ) : (
              /* Non-donor register prompt card */
              <div className="text-center p-2 space-y-3">
                <p className="text-xs text-gray-600 font-bold font-heading leading-relaxed">
                  You are currently a general registered user. To volunteer as a search matching blood donor and help fellow citizens in bypass calls, register details now.
                </p>
                <button
                  onClick={() => setView('register-donor')}
                  className="w-full py-2.5 bg-red-pale hover:bg-red-pale border-2 border-black text-red-primary font-heading font-black text-xs tracking-wider uppercase rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform cursor-pointer"
                >
                  Register as Volunteer Donor
                  <ChevronRight className="w-4 h-4 inline ml-1 -mt-0.5 shrink-0" />
                </button>
              </div>
            )}

          </div>

          {/* ACTIVE HONORARY ACCREDITATION BADGES ACCORDING TO FREQUENCY */}
          {donor && (
            <div className="bento-card bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-black pb-3">
                <Award className="w-5 h-5 text-red-primary shrink-0 fill-red-pale" />
                <h3 className="font-heading font-black text-base text-gray-950">Honorary Donor Medals</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                {/* Badge 1: 1st Donation */}
                <div className={`p-3 rounded-xl border-2 border-black flex flex-col items-center justify-center space-y-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${donor.donationCount >= 1 ? 'bg-blue-50 text-blue-700 font-bold' : 'bg-gray-50 text-gray-300 grayscale opacity-45'}`}>
                  <span className="text-2xl">🩸</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-black">1st Donation</span>
                </div>

                {/* Badge 2: 3x Donor */}
                <div className={`p-3 rounded-xl border-2 border-black flex flex-col items-center justify-center space-y-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${donor.donationCount >= 3 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'bg-gray-50 text-gray-300 grayscale opacity-45'}`}>
                  <span className="text-2xl">❤️</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-black">3x Lifesaver</span>
                </div>

                {/* Badge 3: 5x Donor */}
                <div className={`p-3 rounded-xl border-2 border-black flex flex-col items-center justify-center space-y-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${donor.donationCount >= 5 ? 'bg-rose-55 text-rose-700 font-bold animate-pulse' : 'bg-gray-50 text-gray-300 grayscale opacity-45'}`}>
                  <span className="text-2xl">🏅</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-black">5x Lifesaver</span>
                </div>

                {/* Badge 4: 10x Lifesaver */}
                <div className={`p-3 rounded-xl border-2 border-black flex flex-col items-center justify-center space-y-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] ${donor.donationCount >= 10 ? 'bg-amber-100 text-amber-800 font-bold animate-bounce' : 'bg-gray-50 text-gray-300 grayscale opacity-45'}`}>
                  <span className="text-2xl">⭐</span>
                  <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold leading-tight">Master Hero</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* RIGHT COLUMN: HISTORY TIMELINE & REQUEST TRACKING */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* MY POSTED APPEALS */}
          <div className="bento-card bg-white p-6 space-y-4">
            
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-red-primary shrink-0" />
                <h3 className="font-heading font-black text-base text-gray-950">My Emergency Appeals ({myRequests.length})</h3>
              </div>
              <button
                onClick={() => setView('post-request')}
                className="text-xs bg-red-primary hover:bg-rose-600 border-2 border-black text-white font-black px-4 py-2 rounded-lg flex items-center gap-0.5 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform shrink-0 font-heading cursor-pointer"
              >
                <Plus className="w-4 h-4 shrink-0 -mt-0.5" /> Post New
              </button>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center p-8 text-xs text-gray-500 font-bold">
                You have not posted any blood appeal queries yet. Any requests you log will display here.
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(req => {
                  const completed = req.isFulfilled;
                  return (
                    <div 
                      key={req.id} 
                      className={`p-4 rounded-xl border-2 border-black flex items-center justify-between gap-4 shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform ${completed ? 'bg-gray-50 opacity-65' : 'bg-white'}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 font-heading font-black">
                          <span className={`px-2.5 py-0.5 border-2 border-black rounded text-[10px] text-white font-mono shrink-0 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${completed ? 'bg-gray-400' : 'bg-red-primary'}`}>
                            {req.bloodGroup}
                          </span>
                          <span className={`text-sm truncate max-w-44 ${completed ? 'text-gray-400 line-through font-medium' : 'text-gray-950'}`}>
                            Patient: {req.patientName}
                          </span>
                        </div>

                        <div className="text-[10px] text-gray-600 pl-9 font-extrabold space-y-0.5 mt-1 leading-normal">
                          <p className="truncate flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-red-50 inline shrink-0" />
                            {req.hospital}
                          </p>
                          <p className="truncate font-mono">District: {req.district}</p>
                        </div>
                      </div>

                      {/* Complete toggle checkbox indicators */}
                      <div className="shrink-0 flex items-center gap-2 font-heading">
                        {completed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-green-safe bg-white border-2 border-green-safe px-2.5 py-1 rounded-full uppercase tracking-widest font-mono shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] animate-pulse">
                            Satisfied ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => handleFulfillMyRequest(req.id)}
                            disabled={fulfillLoadingId === req.id}
                            className="bg-white hover:bg-green-55 text-green-safe border-2 border-green-safe rounded-lg px-3 py-1.5 font-black text-xs flex items-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-transform cursor-pointer"
                          >
                            {fulfillLoadingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                Mark Saved ✓
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* HISTORICAL RECORDS TIMELINE CHRONOLOGY */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-sm text-gray-500 uppercase tracking-widest">
              • Saved Lives Timeline Chronology
            </h3>
            <HistoryTimeline history={history} />
          </div>

        </div>

      </div>

      {/* RENDER THE MODAL EXPLICITLY */}
      <DonationModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={handleDonationLogSuccess}
        token={token}
      />

    </div>
  );
}
