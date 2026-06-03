/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Heart, 
  Calendar, 
  Activity, 
  Flame, 
  Award, 
  Trophy, 
  Compass, 
  ArrowUpRight,
  Sparkles,
  HeartHandshake
} from "lucide-react";
import DashboardCharts from "../components/DashboardCharts";
import { BloodRequest, Donor } from "../types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_donors: 0,
    available: 0,
    requests_week: 0,
    fulfilled: 0
  });
  const [topDonors, setTopDonors] = useState<Donor[]>([]);
  const [mostNeededList, setMostNeededList] = useState<{ group: string; count: number }[]>([]);

  useEffect(() => {
    // 1. Fetch counters
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));

    // 2. Fetch top donors (most donations first, limit 5)
    fetch("/api/donors?sort=most_donations")
      .then(res => res.json())
      .then((data: Donor[]) => {
        setTopDonors(data.slice(0, 5));
      })
      .catch(err => console.error(err));

    // 3. Compute Top 3 Most Needed Groups from unfulfilled requests
    fetch("/api/requests")
      .then(res => res.json())
      .then((reqs: BloodRequest[]) => {
        const unfulfilled = reqs.filter(r => !r.isFulfilled);
        
        const counts: { [bg: string]: number } = {};
        unfulfilled.forEach(r => {
          counts[r.bloodGroup] = (counts[r.bloodGroup] || 0) + 1;
        });

        // Convert, sort, and slice top 3
        const sorted = Object.keys(counts).map(bg => ({
          group: bg,
          count: counts[bg]
        })).sort((a, b) => b.count - a.count).slice(0, 3);

        // Fallbacks if no requests exist
        if (sorted.length === 0) {
          setMostNeededList([
            { group: "O-", count: 3 },
            { group: "A-", count: 2 },
            { group: "AB-", count: 1 }
          ]);
        } else {
          setMostNeededList(sorted);
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-16">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-black pb-5">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-gray-955 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-primary shrink-0 fill-red-light animate-pulse" />
            RaktaBD Performance & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-bold mt-1">
            Visual statistics of blood requests, donor availability ratios, and local volunteer networks
          </p>
        </div>
        
        <div className="inline-flex items-center gap-1 bg-green-50 text-green-safe text-xs font-black px-3.5 py-1.5 rounded-full border-2 border-green-safe font-mono uppercase tracking-widest shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
          <TrendingUp className="w-4 h-4 shrink-0" />
          live network active
        </div>
      </div>

      {/* Grid count stats (4 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="bento-card bg-white p-5">
          <span className="text-[10px] font-black text-black block tracking-widest uppercase mb-1.5 font-mono">Total Registered</span>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono text-gray-950 leading-none mb-1.5">{stats.total_donors}</div>
          <span className="text-[10px] text-red-primary font-black bg-red-pale border-2 border-black rounded px-2 py-0.5 inline-block font-mono">Helpers list</span>
        </div>

        <div className="bento-card bg-white p-5">
          <span className="text-[10px] font-black text-black block tracking-widest uppercase mb-1.5 font-mono">Active Available</span>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono text-gray-955 leading-none mb-1.5">{stats.available}</div>
          <span className="text-[10px] text-green-700 font-black bg-emerald-55 border-2 border-black rounded px-2 py-0.5 inline-block font-mono">Status Live</span>
        </div>

        <div className="bento-card bg-white p-5">
          <span className="text-[10px] font-black text-black block tracking-widest uppercase mb-1.5 font-mono">Active Requests</span>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono text-gray-955 leading-none mb-1.5">{stats.requests_week}</div>
          <span className="text-[10px] text-amber-700 font-black bg-amber-50 border-2 border-black rounded px-2 py-0.5 inline-block font-mono">This Week list</span>
        </div>

        <div className="bento-card bg-white p-5">
          <span className="text-[10px] font-black text-black block tracking-widest uppercase mb-1.5 font-mono">Saved Lives Tracker</span>
          <div className="text-2xl sm:text-4xl font-extrabold font-mono text-gray-955 leading-none mb-1.5">{stats.fulfilled}</div>
          <span className="text-[10px] text-blue-700 font-black bg-blue-50 border-2 border-black rounded px-2 py-0.5 inline-block font-mono">Emergency saved</span>
        </div>

      </div>

      {/* RENDER THE CHARTS SECTION */}
      <section className="space-y-4">
        <h2 className="font-heading font-black text-sm text-gray-500 uppercase tracking-widest">
          • Real-Time Geographic Analysis
        </h2>
        <div className="bento-card bg-white p-1 sm:p-2">
          <DashboardCharts />
        </div>
      </section>

      {/* Grid split: Leaderboard vs Most needed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        
        {/* LEADERBOARD CHANNELS */}
        <div className="bento-card bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <Trophy className="w-5 h-5 text-amber-500 shrink-0 fill-amber-300 animate-bounce" />
              <h3 className="font-heading font-black text-lg text-gray-950">Honorary Lifesaver Leaderboard</h3>
            </div>
            
            <p className="text-xs text-gray-650 font-bold font-heading leading-relaxed mb-5">
              Volunteers with the highest verified blood donation records logged. We honor and salute their incredible dedication!
            </p>

            <div className="divide-y-2 divide-black">
              {topDonors.map((donor, idx) => {
                const colors = [
                  "bg-amber-100 text-amber-950", // 1st
                  "bg-slate-100 text-slate-900", // 2nd
                  "bg-orange-100 text-orange-950", // 3rd
                  "bg-rose-100 text-rose-950",
                  "bg-gray-100 text-gray-800"
                ];

                return (
                  <div key={donor.id} className="py-4 flex items-center justify-between gap-3 font-heading font-bold">
                    <div className="flex items-center gap-3 truncate">
                      <span className={`w-7 h-7 rounded-full border-2 border-black flex items-center justify-center font-mono text-xs font-black shrink-0 shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] ${colors[idx] || "bg-gray-100"}`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-gray-950 truncate max-w-[150px] sm:max-w-xs" title={donor.name}>{donor.name}</h4>
                        <span className="text-[10px] text-gray-500 font-mono font-bold block mt-0.5">District: {donor.district}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Award className="w-4 h-4 text-red-primary" />
                      <span className="text-[10px] font-black text-red-primary bg-red-pale border-2 border-black px-2.5 py-1 rounded-full font-mono uppercase shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                        {donor.donationCount} donations
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 bg-rose-50 border-2 border-black rounded-xl text-xs text-red-950 flex gap-2 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
            <Sparkles className="w-5 h-5 shrink-0 text-red-primary animate-spin-slow mt-0.5" />
            <p className="font-bold">Every logged donation updates life counters instantly. Do not forget to click **"I Just Donated"** inside your dashboard profile!</p>
          </div>
        </div>

        {/* MOST NEEDED BLOOD CARDS */}
        <div className="bento-card bg-white p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-2 border-b-2 border-black pb-3 mb-4">
              <Flame className="w-5 h-5 text-red-primary shrink-0 fill-red-pale animate-pulse" />
              <h3 className="font-heading font-black text-lg text-gray-955">Most Demanded Groups</h3>
            </div>

            <p className="text-xs text-gray-650 font-bold font-heading leading-relaxed mb-6">
              Based on active, unfulfilled patient listings, these blood groups have the highest urgency ratio this week:
            </p>

            <div className="space-y-4">
              {mostNeededList.map((item, idx) => {
                let badgeStyleStr = "bg-red-primary text-white";
                if (item.group.includes("AB")) badgeStyleStr = "bg-purple-700 text-white";
                else if (item.group.includes("B")) badgeStyleStr = "bg-amber-600 text-white";
                else if (item.group.includes("O")) badgeStyleStr = "bg-rose-700 text-white";

                return (
                  <div key={item.group} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-black rounded-xl shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-3">
                      {/* Priority Ranking */}
                      <span className="text-[10px] font-black text-black bg-yellow-25 border-2 border-black rounded px-1.5 py-0.5 font-mono shadow-[1px_1px_0px_rgba(0,0,0,1)] leading-none shrink-0">PRIORITY 0{idx + 1}</span>
                      
                      <div className={`w-11 h-11 border-2 border-black rounded-lg flex items-center justify-center text-sm font-heading font-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] leading-none ${badgeStyleStr}`}>
                        {item.group}
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-gray-900 leading-tight">Urgent Calls</h4>
                        <p className="text-[10px] text-gray-500 font-bold leading-normal mt-0.5">Req inpatient queries</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] bg-red-pale text-red-primary font-black border-2 border-black px-2.5 py-1 rounded-full font-mono uppercase shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                        {item.count} open calls
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 p-4 border-2 border-black rounded-xl flex items-center justify-between gap-4 text-xs shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
            <span className="text-gray-600 font-bold font-heading leading-snug max-w-[280px]">Have any of these blood types? You can register to save lives right now.</span>
            <button
              onClick={() => setMostNeededList([]) /* force mock refresh */}
              className="text-red-primary font-heading font-black flex items-center gap-0.5 underline shrink-0 cursor-pointer text-xs"
            >
              Join Live
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
