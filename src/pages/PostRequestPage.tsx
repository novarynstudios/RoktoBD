/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PlusCircle, ShieldCheck, HeartCrack, ChevronRight, MapPin, ListFilter, Users, Loader2, ArrowLeft } from "lucide-react";
import { GEOGRAPHY } from "../types";

interface PostRequestPageProps {
  setView: (v: string) => void;
  currentUser: any;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function PostRequestPage({ setView, currentUser, showToast }: PostRequestPageProps) {
  // Form fields
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [hospital, setHospital] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [contact, setContact] = useState("");
  const [urgency, setUrgency] = useState("urgent");

  // Flow controllers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results details on successful submit
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [matchingDonorsCount, setMatchingDonorsCount] = useState(0);

  // Geographic cascade list
  const districtList = division ? GEOGRAPHY[division] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form checkers
    if (!patientName.trim() || !hospital.trim() || !division || !district || !thana.trim() || !contact.trim()) {
      setError("Please fill out all the emergency details completely.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(contact.trim())) {
      setError("Please enter a valid 11-digit Bangladeshi mobile number starting with 01...");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/request/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          patientName,
          bloodGroup,
          unitsNeeded: parseInt(unitsNeeded as any, 10) || 1,
          hospital,
          division,
          district,
          thana,
          contact,
          urgency,
          userId: currentUser ? currentUser.id : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Appeal post failed.");
      }

      showToast("Emergency blood request successfully logged!", "success");
      setMatchingDonorsCount(data.matchingDonorsCount || 0);
      setSubmitSuccess(true);
    } catch (err: any) {
      setError(err.message || "An issue occurred. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form and return to board or create another
  const resetForm = () => {
    setPatientName("");
    setBloodGroup("A+");
    setUnitsNeeded(1);
    setHospital("");
    setDivision("");
    setDistrict("");
    setThana("");
    setContact("");
    setUrgency("urgent");
    setSubmitSuccess(false);
    setMatchingDonorsCount(0);
    setError(null);
  };

  if (submitSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bento-card bg-white p-8 text-center space-y-6 animate-fade-in">
          
          <div className="w-16 h-16 bg-green-50 border-2 border-black rounded-full flex items-center justify-center text-green-safe mx-auto shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="font-heading font-black text-2xl text-gray-900">Your Appeal is Live!</h1>
            <p className="text-gray-600 font-bold text-sm">
              Your patient request has been logged and published to our real-time emergeny appeals bulletin dashboard!
            </p>
          </div>

          {/* Matches Indicator */}
          <div className="p-4 bg-red-pale border-2 border-black rounded-xl space-y-2 text-center shadow-[3px_3px_0px_rgba(0,0,0,1)]">
            <span className="text-xs font-black text-red-primary font-heading uppercase tracking-widest block">Local Volunteers Matched</span>
            <div className="flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-red-primary shrink-0 animate-bounce" />
              <span className="text-3xl font-mono font-black text-red-primary">
                {matchingDonorsCount} donor{matchingDonorsCount === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-[11px] text-gray-750 leading-normal max-w-sm mx-auto font-bold font-heading">
              We tracked {matchingDonorsCount} available blood volunteers in <strong>{district}</strong> with compatible blood types for {bloodGroup} patients!
            </p>
          </div>

          {/* Redirect links */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-black">
            <button
              onClick={() => setView('requests')}
              className="flex-1 py-3 bg-red-primary hover:bg-rose-600 text-white border-2 border-black font-heading font-black rounded-full shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1.5px] text-sm cursor-pointer"
            >
              View Requests Board
            </button>
            <button
              onClick={resetForm}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 border-2 border-black text-black font-black rounded-full shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1.5px] text-xs cursor-pointer"
            >
              Create Another Request
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => setView('requests')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-primary transition-colors font-mono uppercase tracking-widest cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Go back to Board
      </button>

      {/* Intro */}
      <div>
        <h1 className="font-heading font-black text-2xl sm:text-3xl text-gray-900 flex items-center gap-1.5">
          <PlusCircle className="w-7 h-7 text-red-primary shrink-0 animate-pulse" />
          Request Urgent Blood Group
        </h1>
        <p className="text-xs sm:text-sm text-gray-655 font-bold mt-1">
          {currentUser 
            ? "Your account details will be attached as supervisor for quick reach out callbacks." 
            : "Posting anonymously. You do not need to log in to post an emergency call out."}
        </p>
      </div>

      <div className="bento-card bg-white p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-pale text-red-primary rounded-lg text-xs font-bold border border-red-200 leading-snug">
              {error}
            </div>
          )}

          {/* Patient details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Patient Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rohima Begum, Tanvir Ahmed..."
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Blood Group Required *</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Units Needed (Bags) *</label>
              <input
                type="number"
                min="1"
                max="10"
                required
                value={unitsNeeded}
                onChange={(e) => setUnitsNeeded(parseInt(e.target.value, 15) || 1)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Urgency Level *</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "critical", label: "Critical" },
                  { value: "urgent", label: "Urgent" },
                  { value: "normal", label: "Plan" }
                ].map(item => (
                  <label 
                    key={item.value} 
                    className={`flex items-center justify-center py-2.5 rounded-lg border-2 border-black text-xs font-black cursor-pointer transition-all shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] ${urgency === item.value ? 'bg-red-pale text-red-primary border-red-primary shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-black'}`}
                  >
                    <input 
                      type="radio" 
                      name="urgency" 
                      value={item.value} 
                      className="sr-only"
                      checked={urgency === item.value}
                      onChange={() => setUrgency(item.value)} 
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Hospital */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Hospital Name / Ward *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dhaka Medical College Hospital Ward 5..."
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
            />
          </div>

          {/* Division cascade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Division *</label>
              <select
                value={division}
                required
                onChange={(e) => {
                  setDivision(e.target.value);
                  setDistrict("");
                }}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              >
                <option value="">-- Choose Division --</option>
                {Object.keys(GEOGRAPHY).map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">District *</label>
              <select
                value={district}
                required
                disabled={!division}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955 disabled:opacity-50"
              >
                <option value="">-- Choose District --</option>
                {districtList.map(dist => (
                   <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Thana & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Area / Thana *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shahbagh, Mirpur-10..."
                value={thana}
                onChange={(e) => setThana(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Contact Call Back Link *</label>
              <input
                type="text"
                required
                placeholder="Hospital/Attender, e.g. 01712345678"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              />
            </div>
          </div>

          {/* CTA Submit Button */}
          <div className="pt-4 border-t-2 border-black flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-primary hover:bg-rose-600 disabled:bg-gray-300 text-white font-heading font-black px-8 py-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting Active Bulletin Appeal...
                </>
              ) : (
                "Publish New Appeal Live ✓"
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
