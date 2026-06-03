/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ShieldCheck, HeartPulse, MapPin, Calendar, Clock, Loader2, ArrowLeft } from "lucide-react";
import { GEOGRAPHY } from "../types";

interface DonorRegisterPageProps {
  setView: (v: string) => void;
  currentUser: any;
  token: string | null;
  onSuccess: (updatedUser: any, updatedDonor: any) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function DonorRegisterPage({ setView, currentUser, token, onSuccess, showToast }: DonorRegisterPageProps) {
  const [bloodGroup, setBloodGroup] = useState(currentUser?.bloodGroup || "A+");
  const [division, setDivision] = useState(currentUser?.division || "");
  const [district, setDistrict] = useState(currentUser?.district || "");
  const [thana, setThana] = useState(currentUser?.thana || "");
  const [lastDonation, setLastDonation] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  const districtsList = division ? GEOGRAPHY[division] : [];

  // Reset district if division changes
  useEffect(() => {
    if (division !== currentUser?.division) {
      setDistrict("");
    }
  }, [division]);

  // Compute 90-day cooldown warning message dynamically
  useEffect(() => {
    if (!lastDonation) {
      setCooldownMessage(null);
      return;
    }

    const logDate = new Date(lastDonation);
    const today = new Date();
    
    if (logDate.getTime() > today.getTime()) {
      setCooldownMessage("Donation date cannot be in the future.");
      return;
    }

    const eligTime = logDate.getTime() + 90 * 24 * 3600 * 1000;
    const eligDate = new Date(eligTime);
    const formattedElig = eligDate.toISOString().split("T")[0];

    if (eligTime > today.getTime()) {
      setCooldownMessage(`You donated recently on ${lastDonation}. This will place you in safety cooldown. You will become eligible for public listings search on ${formattedElig}. Your status will be set to unavailable.`);
      setIsAvailable(false);
    } else {
      setCooldownMessage(null);
    }
  }, [lastDonation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!division || !district || !thana.trim()) {
      setError("Please complete all required geographic location details.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/donor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          bloodGroup,
          division,
          district,
          thana,
          lastDonation: lastDonation || null,
          isAvailable: cooldownMessage ? false : isAvailable
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Donor registration failed.");
      }

      showToast("Thank you for registering as a blood donor! You are now set to save lives.", "success");
      
      // Update global context
      const updatedUser = { ...currentUser, isDonor: true, bloodGroup };
      onSuccess(updatedUser, data.donor);
      
      // Redirect to profile
      setView('profile');
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      
      {/* Back button */}
      <button 
        onClick={() => setView('profile')}
        className="inline-flex items-center gap-1.5 text-xs font-black text-black hover:text-red-primary transition-colors font-mono uppercase tracking-widest cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Cancel Registration
      </button>

      {/* Intro */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-red-pale border-2 border-black rounded-full flex items-center justify-center text-red-primary mx-auto shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
          <HeartPulse className="w-7 h-7 shrink-0 fill-red-light animate-pulse" />
        </div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-gray-955 leading-tight">
          Register as Volunteer Blood Donor
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm max-w-sm mx-auto font-bold font-heading">
          Joining as a donor connects you to urgent requests, bypass calls, and localized safety directories.
        </p>
      </div>

      <div className="bento-card bg-white p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-pale text-red-primary rounded-lg text-xs font-bold border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              {error}
            </div>
          )}

          {/* Blood group */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Confirmed Blood Group *</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Cascading Geographic Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Home Division *</label>
              <select
                value={division}
                required
                onChange={(e) => setDivision(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              >
                <option value="">-- Choose Division --</option>
                {Object.keys(GEOGRAPHY).map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Home District *</label>
              <select
                value={district}
                required
                disabled={!division}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955 disabled:opacity-50"
              >
                <option value="">-- Choose District --</option>
                {districtsList.map(dist => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Area / Thana */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Area / Thana / Sub-district *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mirpur, Sadar, Dhanmondi..."
              value={thana}
              onChange={(e) => setThana(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
            />
          </div>

          {/* Last donation date (optional) */}
          <div className="bg-red-pale border-2 border-black p-5 rounded-xl space-y-4 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-red-primary shrink-0" />
                Last Donation Date (Optional)
              </label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={lastDonation}
                onChange={(e) => setLastDonation(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            {/* Dynamic 90-day cooldown alert warning details */}
            {cooldownMessage && (
              <div className="p-3 bg-amber-50 border-2 border-black rounded-lg text-[11px] leading-relaxed text-amber-950 font-bold flex gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-fade-in">
                <Clock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5 animate-spin-slow" />
                <div>
                  <span className="font-extrabold block uppercase tracking-wider text-amber-800 font-mono text-[10px]">Safety Cooldown Active:</span>
                  {cooldownMessage}
                </div>
              </div>
            )}
          </div>

          {/* Availability switch logic (only visible if NOT in cooldown warning) */}
          {!cooldownMessage && (
            <div className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <div className="max-w-[75%]">
                <span className="text-xs font-black text-black uppercase block tracking-widest font-mono">Available Immediately</span>
                <span className="text-[10px] text-gray-600 font-bold leading-tight block mt-0.5">
                  Toggling to "ON" allows desperate seekers to locate you on the map immediately.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAvailable(!isAvailable)}
                className={`w-12 h-7 rounded-full border-2 border-black transition-colors flex items-center p-0.5 outline-hidden relative cursor-pointer ${isAvailable ? "bg-red-primary" : "bg-gray-300"}`}
              >
                <span className={`w-5 h-5 bg-white border-2 border-black rounded-full shadow-xs transform duration-200 ${isAvailable ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          )}

          {/* Actions panel */}
          <div className="pt-4 border-t-2 border-black">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-primary hover:bg-rose-600 disabled:bg-gray-300 text-white font-heading font-black px-8 py-4 border-2 border-black rounded-full shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform flex items-center justify-center gap-2 text-sm w-full cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Donor Registration...
                </>
              ) : (
                "Finish Registration & Join Live Registry ✓"
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
