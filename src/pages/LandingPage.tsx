/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Heart, Search, PlusCircle, Volume2, ShieldCheck, HeartCrack, ChevronRight, Activity, Users, Map, HeartHandshake } from "lucide-react";
import { BloodRequest } from "../types";

interface LandingPageProps {
  setView: (v: string) => void;
  currentUser: any;
}

export default function LandingPage({ setView, currentUser }: LandingPageProps) {
  const [stats, setStats] = useState({
    total_donors: 0,
    available: 0,
    requests_week: 0,
    fulfilled: 0,
    districts_covered: 1
  });
  const [criticalRequests, setCriticalRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Stats fetch error", err));

    // Fetch critical requests
    fetch("/api/requests?urgency=critical")
      .then(res => res.json())
      .then(data => {
        // filter unfulfilled and maximum of 3
        const unfulfilled = data.filter((r: BloodRequest) => !r.isFulfilled).slice(0, 3);
        setCriticalRequests(unfulfilled);
        setLoading(false);
      })
      .catch(err => {
        console.error("Requests fetch error", err);
        setLoading(false);
      });
  }, []);

  // Helper function to format relative times
  const getRelativeTime = (isoString: string) => {
    const posted = new Date(isoString);
    const diffMs = Date.now() - posted.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHr > 0) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? "s" : ""} ago`;
    return "just now";
  };

  return (
    <div className="space-y-12 pb-16 px-4">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bento-card bg-white p-6 sm:p-12 md:p-16 text-center max-w-7xl mx-auto mt-4 sm:mt-6">
        {/* Soft background shape */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-pale/25 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-50 rounded-full blur-3xl -z-10" />

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 bg-red-pale border-2 border-black text-red-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider font-mono shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
            <Activity className="w-3.5 h-3.5 animate-pulse text-red-primary animate-pulse" />
            Empowering Volunteers — Serving Bangladesh
          </div>
          
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl md:text-6xl text-gray-900 leading-tight">
            রক্ত দিন, <span className="text-red-primary relative">জীবন বাঁচান<span className="absolute left-0 bottom-1 w-full h-[6px] bg-red-pale -z-10 rounded" /></span>
          </h1>
          
          <p className="font-heading font-extrabold text-lg sm:text-2xl text-black">
            Find blood donors across Bangladesh — fast.
          </p>
          
          <p className="text-gray-750 text-sm max-w-lg mx-auto font-medium">
            RaktaBD is a transparent local network bridging blood donors and desperate patients. 
            No fees, no brokerages, and no late-night panic posts. Search, click, and contact directly.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => setView('search')}
              className="w-full sm:w-auto bento-button bg-red-primary hover:bg-rose-600 text-white font-heading font-black px-8 py-3.5 rounded-full flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <Search className="w-5 h-5 text-white" />
              Find a Donor
            </button>
            <button 
              onClick={() => setView('post-request')}
              className="w-full sm:w-auto bento-button bg-white hover:bg-rose-50 text-black font-heading font-black px-8 py-3.5 rounded-full flex items-center justify-center gap-2 text-base cursor-pointer"
            >
              <PlusCircle className="w-5 h-5 text-red-primary" />
              I Need Blood
            </button>
          </div>

          {currentUser && currentUser.isDonor && (
            <div className="pt-2">
              <button 
                onClick={() => setView('profile')}
                className="inline-flex items-center gap-1.5 text-xs font-black text-red-primary hover:underline cursor-pointer"
              >
                Update My Available Status in Profile
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. LIVE COUTNERS COUNTS */}
      <section className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bento-card p-6 flex items-center gap-4 bg-rose-50">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center text-red-primary shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">{stats.total_donors}</div>
              <div className="text-xs text-gray-650 font-black font-heading mt-1">Total Donors</div>
            </div>
          </div>

          <div className="bento-card p-6 flex items-center gap-4 bg-emerald-50">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center text-green-safe shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">{stats.available}</div>
              <div className="text-xs text-gray-655 font-black font-heading mt-1">Available Now</div>
            </div>
          </div>

          <div className="bento-card p-6 flex items-center gap-4 bg-amber-50">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center text-amber-600 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] shrink-0">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">{stats.requests_week}</div>
              <div className="text-xs text-gray-650 font-black font-heading mt-1">Active Requests</div>
            </div>
          </div>

          <div className="bento-card p-6 flex items-center gap-4 bg-sky-50">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center text-sky-600 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] shrink-0">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono tracking-tight leading-none">{stats.districts_covered}</div>
              <div className="text-xs text-gray-650 font-black font-heading mt-1">Counties Covered</div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. RECENT CRITICAL REQUESTS CONTAINER */}
      <section className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div>
            <h2 className="font-heading font-extrabold text-3xl text-gray-900 flex items-center gap-2">
              <HeartCrack className="w-7 h-7 text-red-primary shrink-0 animate-bounce" />
              Critical Blood Requests Bulletin
            </h2>
            <p className="text-xs sm:text-sm text-gray-655 font-bold">Urgent requests in desperate need of immediate donors</p>
          </div>
          <button 
            onClick={() => setView('requests')}
            className="text-red-primary font-heading font-black hover:text-red-light flex items-center gap-1.5 transition-colors text-sm shrink-0 hover:underline cursor-pointer"
          >
            View Live Bulletin Board
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="h-44 bento-card bg-white flex items-center justify-center">
            <div className="text-center text-gray-550 font-bold">
              <Activity className="w-8 h-8 text-red-primary animate-spin mx-auto mb-2" />
              Querying vital request feeds...
            </div>
          </div>
        ) : criticalRequests.length === 0 ? (
          <div className="bento-card p-10 text-center space-y-4 bg-white">
            <ShieldCheck className="w-12 h-12 text-green-safe mx-auto" />
            <h4 className="font-heading font-extrabold text-xl text-gray-800">No Critical Appeals Registered</h4>
            <p className="text-gray-600 text-sm max-w-md mx-auto font-medium">
              There are currently no active critical, unfulfilled blood requests registered. The bulletin board lists general emergencies needing blood support.
            </p>
            <button 
              onClick={() => setView('requests')}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-red-pale border-2 border-black font-heading font-extrabold rounded-full text-sm hover:bg-rose-100 transition-all cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            >
              Browse All Active Appeals
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {criticalRequests.map(req => {
              // Custom blood badge BG color
              let badgeColor = "bg-red-primary";
              if (req.bloodGroup.includes("AB")) badgeColor = "bg-purple-600";
              else if (req.bloodGroup.includes("B")) badgeColor = "bg-amber-600";
              else if (req.bloodGroup.includes("O")) badgeColor = "bg-rose-700";

              return (
                <div 
                  key={req.id} 
                  className="bento-card bg-white overflow-hidden animate-pulse-border flex flex-col justify-between"
                >
                  <div className="p-6 space-y-4">
                    {/* Urgency Badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-red-pale border-2 border-black text-red-primary font-black px-2 py-0.5 rounded font-mono tracking-wider shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] animate-pulse">
                        CRITICAL EMERGENCY
                      </span>
                      <span className="text-gray-500 text-xs font-mono font-bold">
                        {getRelativeTime(req.createdAt)}
                      </span>
                    </div>

                    {/* Patient & Group */}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center text-white ${badgeColor} shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] shrink-0`}>
                        <span className="font-heading font-black text-2xl tracking-tighter">{req.bloodGroup}</span>
                      </div>
                      <div>
                        <h4 className="font-heading font-extrabold text-lg text-gray-900 leading-tight">
                          {req.patientName}
                        </h4>
                        <p className="text-xs text-gray-500 font-extrabold">Needs {req.unitsNeeded} unit{req.unitsNeeded > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="text-sm text-gray-700 space-y-2 pt-1 font-heading font-extrabold">
                      <div>
                        <span className="text-gray-400 font-bold block text-[10px] uppercase font-mono tracking-widest leading-none mb-1">Hospital</span>
                        <p className="truncate text-black font-bold">{req.hospital}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 font-bold block text-[10px] uppercase font-mono tracking-widest leading-none mb-1">District</span>
                        <p className="text-xs text-black font-extrabold">{req.district}, {req.thana}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact panel */}
                  <div className="bg-red-pale border-t-2 border-black px-6 py-3.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-red-primary font-black font-heading">Urgent Donor Required</span>
                    <button 
                      onClick={() => setView('requests')}
                      className="text-xs bg-red-primary border-2 border-black hover:bg-rose-600 text-white font-black px-3 py-1.5 rounded-full shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all cursor-pointer"
                    >
                      Connect 📞
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="bg-sky-50 border-2 border-black p-8 sm:p-12 md:p-16 rounded-[32px] max-w-7xl mx-auto space-y-10 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
        <div className="text-center space-y-2">
          <h2 className="font-heading font-extrabold text-3xl text-gray-900">How RaktaBD Works</h2>
          <p className="text-xs sm:text-sm text-gray-650 font-black max-w-sm mx-auto">Three simple, clear, life-saving steps to mutual aid</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          
          <div className="bg-white p-8 border-2 border-black rounded-[24px] shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="w-14 h-14 bg-red-pale text-red-primary border-2 border-black rounded-full flex items-center justify-center mx-auto text-xl font-black font-mono shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
              1
            </div>
            <h3 className="font-heading font-extrabold text-lg text-gray-900">Create Free Account</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              Sign up securely with your details. Verification is transparent, immediate, and 100% free. 
            </p>
          </div>

          <div className="bg-white p-8 border-2 border-black rounded-[24px] shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="w-14 h-14 bg-red-pale text-red-primary border-2 border-black rounded-full flex items-center justify-center mx-auto text-xl font-black font-mono shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
              2
            </div>
            <h3 className="font-heading font-extrabold text-lg text-gray-900">Register as Donor / Post Request</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              Declare your donor volunteer profile, or list active blood needs immediately with comprehensive details. Non-members can browse freely.
            </p>
          </div>

          <div className="bg-white p-8 border-2 border-black rounded-[24px] shadow-[3.5px_3.5px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="w-14 h-14 bg-red-pale text-red-primary border-2 border-black rounded-full flex items-center justify-center mx-auto text-xl font-black font-mono shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
              3
            </div>
            <h3 className="font-heading font-extrabold text-lg text-gray-900">Connect & Save Lives</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              Match compatible donors locally using instant cascading search results. Reach out immediately, request bypasses, or log logs cleanly.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}
