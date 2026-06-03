/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  HeartHandshake, 
  Plus, 
  MapPin, 
  User, 
  Calendar, 
  Check, 
  Phone, 
  Activity, 
  HeartCrack, 
  ShieldAlert, 
  Loader2, 
  RotateCcw,
  Building,
  CheckCircle2,
  Lock
} from "lucide-react";
import { BloodRequest, GEOGRAPHY } from "../types";

interface RequestBoardProps {
  setView: (v: string) => void;
  currentUser: any;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function RequestBoard({ setView, currentUser, showToast }: RequestBoardProps) {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [bloodGroup, setBloodGroup] = useState("");
  const [urgency, setUrgency] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");

  // Contacts local reveal state
  const [revealedPhones, setRevealedPhones] = useState<{ [id: number]: boolean }>({});
  
  // Submit state
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Districts cascaded map
  const districtsList = division ? GEOGRAPHY[division] : [];

  // Fetch active bulletin board requests
  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams();
      if (bloodGroup) q.append("blood_group", bloodGroup);
      if (urgency) q.append("urgency", urgency);
      if (division) q.append("division", division);
      if (district) q.append("district", district);

      const res = await fetch(`/api/requests?${q.toString()}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve active emergency records.");
      }
      const data = await res.json();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load requests board.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [bloodGroup, urgency, division, district]);

  // Handle Mark Request Fulfilled
  const handleFulfill = async (reqId: number) => {
    setActionLoadingId(reqId);
    try {
      const res = await fetch(`/api/requests/${reqId}/fulfill`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fulfillment update failed.");
      }
      showToast("Emergency appeal marked as successfully satisfied. Thank you!", "success");
      
      // Update local state without fully reloading page if possible
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, isFulfilled: true } : r));
    } catch (err: any) {
      showToast(err.message || "Unable to fulfill request.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Turn off district if division resets
  useEffect(() => {
    setDistrict("");
  }, [division]);

  // Helper date formatter
  const getRelativeTime = (isoString: string) => {
    const posted = new Date(isoString);
    const diffMs = Date.now() - posted.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) return `${diffDays} d${diffDays > 1 ? "s" : ""} ago`;
    if (diffHr > 0) return `${diffHr} h${diffHr > 1 ? "s" : ""} ago`;
    if (diffMin > 0) return `${diffMin} m${diffMin > 1 ? "s" : ""} ago`;
    return "just now";
  };

  // Categorize requests
  // Critical Pinned requests: active (not fulfilled) and marked 'critical'
  const pinnedRequests = requests.filter(r => r.urgency === 'critical' && !r.isFulfilled);
  const regularRequests = requests.filter(r => r.urgency !== 'critical' || r.isFulfilled);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      
      {/* Header Panel */}
      <div className="bento-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 flex items-center gap-2">
            <HeartHandshake className="w-8 h-8 text-red-primary shrink-0" />
            Emergent Blood Bulletin
          </h1>
          <p className="text-xs sm:text-sm text-gray-650 font-bold mt-1">
            Real-time emergency appeals in Bangladesh. Search needs, connect with callouts, or log fulfilled requests safely.
          </p>
        </div>
        
        <button
          onClick={() => setView('post-request')}
          className="bento-button bg-red-primary hover:bg-rose-600 text-white font-heading font-black px-6 py-3 rounded-full flex items-center justify-center gap-2 text-sm self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-5 h-5" /> Post Blood Request
        </button>
      </div>

      {/* Responsive Filters Row */}
      <div className="bento-card bg-white p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Blood Group</label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-gray-50 border-2 border-black focus:border-red-primary outline-none font-bold rounded-lg text-gray-750"
          >
            <option value="">-- All Groups --</option>
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Division</label>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-gray-50 border-2 border-black focus:border-red-primary outline-none font-bold rounded-lg text-gray-750"
          >
            <option value="">-- All Divisions --</option>
            {Object.keys(GEOGRAPHY).map(div => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">District</label>
          <select
            value={district}
            disabled={!division}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-gray-50 border-2 border-black focus:border-red-primary outline-none font-bold rounded-lg text-gray-750 disabled:opacity-50"
          >
            <option value="">-- Select District --</option>
            {districtsList.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-black uppercase tracking-widest mb-1.5 font-mono">Urgency Level</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full text-sm px-3 py-2 bg-gray-50 border-2 border-black focus:border-red-primary outline-none font-bold rounded-lg text-gray-750"
          >
            <option value="">-- Any Urgency --</option>
            <option value="critical">Critical (Only)</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal / Plan</option>
          </select>
        </div>
      </div>

      {/* Main Results area */}
      {error && (
        <div className="p-4 bg-red-pale text-red-primary font-bold text-sm rounded-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bento-card bg-white">
          <Loader2 className="w-8 h-8 text-red-primary animate-spin mb-3 animate-spin" />
          <p className="text-gray-500 font-bold">Gathering real-time bulletin list...</p>
        </div>
      ) : requests.length === 0 ? (
        /* Empty states template */
        <div className="bento-card bg-white p-12 text-center max-w-lg mx-auto space-y-4">
          <RotateCcw className="w-12 h-12 text-rose-300 mx-auto" />
          <h3 className="font-heading font-extrabold text-xl text-gray-800">No Active Emergency Calls Found</h3>
          <p className="text-gray-600 text-sm leading-relaxed font-semibold">
            There are currently no unfulfilled requests logged matching those filters. Consider removing search criteria, widening the district range, or creating a new appeal.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <button
              onClick={() => {
                setBloodGroup("");
                setUrgency("");
                setDivision("");
                setDistrict("");
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-black font-extrabold rounded-lg text-xs transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setView('post-request')}
              className="px-4 py-2 bg-red-primary hover:bg-rose-600 text-white border-2 border-black font-extrabold rounded-lg text-xs shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform cursor-pointer"
            >
              Add New Appeal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Pinned critical appeals */}
          {pinnedRequests.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-heading font-black text-red-primary text-sm tracking-widest uppercase flex items-center gap-2">
                <HeartCrack className="w-5 h-5 animate-pulse text-red-primary" />
                • Pinned Critical Support Appeals ({pinnedRequests.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pinnedRequests.map(req => {
                  const revealed = revealedPhones[req.id];
                  return (
                    <div 
                      key={req.id} 
                      className="bento-card bg-white border-l-[6px] border-l-red-critical p-6 space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-red-pale border-2 border-black text-red-primary font-black px-2.5 py-1 rounded uppercase tracking-wider font-mono shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                            CRITICAL EMERGENCY
                          </span>
                          <span className="text-black font-extrabold text-xs font-mono flex items-center gap-0.5">
                            <Activity className="w-3.5 h-3.5 text-red-light shrink-0" />
                            {getRelativeTime(req.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center text-white bg-red-critical shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] font-heading font-black text-2xl shrink-0">
                            {req.bloodGroup}
                          </div>
                          <div>
                            <h4 className="font-heading font-extrabold text-lg text-gray-950 leading-tight">Patient: {req.patientName}</h4>
                            <p className="text-xs text-red-primary font-extrabold font-heading">{req.unitsNeeded} matching unit{req.unitsNeeded > 1 ? 's' : ''} needed</p>
                          </div>
                        </div>

                        <div className="text-xs space-y-1.5 p-3 bg-red-pale/15 border-2 border-black rounded-xl leading-snug shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                          <p className="truncate font-black flex items-center gap-1.5 text-gray-800">
                            <Building className="w-4 h-4 text-red-light shrink-0" />
                            <span>{req.hospital}</span>
                          </p>
                          <p className="truncate font-black text-gray-600 pl-5.5 text-[11px]">
                            <MapPin className="w-3.5 h-3.5 inline text-gray-400 mr-1 shrink-0 -mt-0.5" />
                            {req.district}, {req.thana}
                          </p>
                        </div>
                      </div>

                      {/* Reveal contact parameters */}
                      <div className="space-y-2 pt-2 border-t-2 border-black">
                        {revealed ? (
                          <div className="p-2 py-2.5 bg-gray-50 border-2 border-black text-center rounded-xl text-sm font-mono font-black text-gray-950 flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-fade-in">
                            <Phone className="w-4 h-4 text-red-light shrink-0" />
                            <span>{req.contact}</span>
                          </div>
                        ) : null}

                        <div className="flex gap-2 font-heading">
                          <button
                            onClick={() => setRevealedPhones(p => ({ ...p, [req.id]: !p[req.id] }))}
                            className={`flex-[3] py-2 border-2 border-black rounded-lg font-extrabold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] ${revealed ? 'bg-white hover:bg-gray-50 text-black' : 'bg-red-critical text-white'}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {revealed ? "Hide Contact" : "Connect 📞"}
                          </button>
                          
                          <button
                            onClick={() => handleFulfill(req.id)}
                            disabled={actionLoadingId === req.id}
                            title="Mark as fulfilled"
                            className="flex-[2] py-2 border-2 border-black rounded-lg hover:bg-green-50 text-green-safe font-black text-xs flex items-center justify-center gap-1 transition-colors bg-white disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px]"
                          >
                            {actionLoadingId === req.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 shrink-0" /> Mark Saved
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard active/fulfilled appeals board */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-gray-500 text-sm tracking-widest uppercase">
              • Active Appeals Feed ({regularRequests.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularRequests.map(req => {
                const isUrgent = req.urgency === 'urgent';
                const isFulfilled = req.isFulfilled;
                const revealed = revealedPhones[req.id];

                // Badges decoration
                let headerBarColor = "border-l-4 border-green-safe";
                if (isUrgent) headerBarColor = "border-l-4 border-orange-urgent";
                if (isFulfilled) headerBarColor = "border-l-4 border-gray-300 opacity-60";

                let reqBadgeColor = "bg-green-50 text-green-safe border border-green-100";
                if (isUrgent) reqBadgeColor = "bg-orange-50 text-orange-urgent border border-orange-100";
                if (isFulfilled) reqBadgeColor = "bg-gray-100 text-gray-500 border border-transparent";

                // Group badge color
                let bgBadgeColor = "bg-red-primary";
                if (req.bloodGroup.includes("AB")) bgBadgeColor = "bg-purple-600";
                else if (req.bloodGroup.includes("B")) bgBadgeColor = "bg-amber-600";
                else if (req.bloodGroup.includes("O")) bgBadgeColor = "bg-rose-700";
                if (isFulfilled) bgBadgeColor = "bg-gray-400";

                return (
                  <div 
                    key={req.id} 
                    className={`bento-card bg-white border-l-[6px] p-6 space-y-4 flex flex-col justify-between ${headerBarColor}`}
                  >
                    
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-wider font-mono shadow-[1px_1px_0px_rgba(0,0,0,1)] ${reqBadgeColor}`}>
                          {isFulfilled ? "FULFILLED ✓" : isUrgent ? "URGENT QUERY" : "REGULAR APPEAL"}
                        </span>
                        <span className="text-black font-extrabold text-xs font-mono">
                          {getRelativeTime(req.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] font-heading font-black text-2xl shrink-0 ${bgBadgeColor}`}>
                          {req.bloodGroup}
                        </div>
                        <div>
                          <h4 className={`font-heading font-extrabold text-base leading-tight ${isFulfilled ? 'text-gray-400 line-through' : 'text-gray-950'}`}>
                            Patient: {req.patientName}
                          </h4>
                          <p className={`text-xs font-heading font-extrabold mt-0.5 ${isFulfilled ? 'text-gray-400' : 'text-gray-500'}`}>Units required: {req.unitsNeeded}</p>
                        </div>
                      </div>

                      <div className="text-xs space-y-1.5 p-3 bg-gray-50 border-2 border-black rounded-xl leading-relaxed shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <p className="truncate font-black text-gray-700 font-heading">
                          <Building className="w-3.5 h-3.5 inline mr-1 text-gray-400 -mt-0.5" />
                          {req.hospital}
                        </p>
                        <p className="truncate text-gray-650 pl-5 text-[11px] font-bold">
                          {req.district}, {req.thana}
                        </p>
                      </div>
                    </div>

                    {/* Reveal controls */}
                    <div className="space-y-2 pt-2 border-t-2 border-black flex flex-col justify-end">
                      {revealed && !isFulfilled ? (
                        <div className="p-2 py-2.5 bg-gray-50 border-2 border-black text-center rounded-xl text-xs font-mono font-black text-gray-950 flex items-center justify-center gap-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] animate-fade-in animate-bounce">
                          <Phone className="w-3.5 h-3.5 text-red-light shrink-0" />
                          <span>{req.contact}</span>
                        </div>
                      ) : null}

                      {!isFulfilled ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setRevealedPhones(p => ({ ...p, [req.id]: !p[req.id] }))}
                            className={`flex-[3] py-2 border-2 border-black rounded-lg font-bold font-heading text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] ${revealed ? 'bg-white hover:bg-gray-50 text-black' : 'bg-red-primary text-white'}`}
                          >
                            <Phone className="w-3 h-3" />
                            {revealed ? "Hide Contact" : "Connect 📞"}
                          </button>
                          
                          <button
                            onClick={() => handleFulfill(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="flex-[2] py-2 border-2 border-black rounded-lg hover:bg-green-50 text-green-safe font-black text-xs flex items-center justify-center gap-1 transition-all bg-white disabled:opacity-50 cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px]"
                          >
                            {actionLoadingId === req.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-3 h-3 text-green-safe" /> Mark Saved
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 text-green-safe py-2 bg-white border-2 border-green-safe rounded-xl font-heading font-black text-xs shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Fulfilled and Saved
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
