/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Search, MapPin, Phone, Building, CheckCircle2, ShieldAlert, Loader2, Compass } from "lucide-react";
import { Hospital, GEOGRAPHY } from "../types";

export default function HospitalPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("");

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (search.trim()) q.append("search", search);
      if (district) q.append("district", district);

      const res = await fetch(`/api/hospitals?${q.toString()}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve directory files.");
      }
      const data = await res.json();
      setHospitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [search, district]);

  // Aggregate all unique districts spread across geography to populate filtering dropdown
  const allDistricts: string[] = [];
  Object.keys(GEOGRAPHY).forEach(div => {
    GEOGRAPHY[div].forEach(dist => {
      if (!allDistricts.includes(dist)) {
        allDistricts.push(dist);
      }
    });
  });
  allDistricts.sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 pb-16 animate-fade-in">
      
      {/* Visual top banner */}
      <div className="bento-card bg-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-gray-955 flex items-center gap-2">
            <Building className="w-8 h-8 text-red-primary shrink-0" />
            Hospital Blood Banks Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-650 font-bold mt-1.5">
            Search pre-verified storage, banking, and emergency center lines in critical clinical portals
          </p>
        </div>
      </div>

      {/* Filter and query box */}
      <div className="bg-white p-4.5 rounded-xl border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] flex flex-col sm:flex-row gap-4 font-heading">
        {/* Keyword textbox */}
        <div className="flex-1 flex items-center gap-2.5 bg-white border-2 border-black px-3.5 py-2.5 rounded-lg">
          <Search className="w-4 h-4 text-black shrink-0" />
          <input
            type="text"
            placeholder="Search hospitals by name, area, thana, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm text-black font-extrabold outline-hidden placeholder-gray-500"
          />
        </div>

        {/* District select */}
        <div className="sm:w-64 flex items-center gap-2.5 bg-white border-2 border-black px-3.5 py-2.5 rounded-lg">
          <MapPin className="w-4 h-4 text-red-primary shrink-0" />
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-955 font-black outline-hidden cursor-pointer"
          >
            <option value="">-- All Districts --</option>
            {allDistricts.map(dist => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results loader and cards board */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)]">
          <Loader2 className="w-8 h-8 text-red-primary animate-spin mb-3" />
          <p className="text-gray-950 font-black font-heading">Consulting clinical directories...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="bento-card bg-white p-12 text-center space-y-4 max-w-md mx-auto">
          <Compass className="w-12 h-12 text-rose-300 mx-auto animate-spin-slow" />
          <h3 className="font-heading font-black text-lg text-gray-950">No Hospital Directory Files Found</h3>
          <p className="text-gray-650 text-sm leading-relaxed font-bold font-heading">
            There are currently no pre-seeded hospital profiles matching your search string: <strong>"{search}"</strong>. Try clearing search keywords to view standard options.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setDistrict("");
            }}
            className="px-6 py-3 bg-red-pale border-2 border-black text-red-primary font-black rounded-lg text-xs hover:bg-rose-50 transition-transform shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
          >
            Reset Query Parameters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map(h => (
            <div 
              key={h.id} 
              className="bento-card bg-white p-6 flex flex-col justify-between relative space-y-5"
            >
              <div className="space-y-4">
                {/* Banking status badge */}
                <div className="flex items-center justify-between">
                  {h.hasBloodBank ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-safe px-2.5 py-1 border-2 border-green-safe rounded-full font-black font-mono shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-safe fill-green-50" />
                      Blood Storage Facility Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-800 px-2.5 py-1 border-2 border-yellow-400 rounded-full font-black font-mono shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-600" />
                      Limited Stock / Direct Transfer Required
                    </span>
                  )}
                </div>

                {/* Info block */}
                <div className="space-y-1">
                  <h4 className="font-heading font-black text-lg text-gray-955 leading-tight">
                    {h.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 font-black font-mono uppercase tracking-widest flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-red-primary shrink-0" />
                    {h.district} district, {h.thana}
                  </p>
                </div>

                {/* Sub-addresses detail */}
                <p className="text-xs text-gray-700 leading-relaxed italic bg-gray-50 border-2 border-gray-200 p-3.5 rounded-lg font-medium">
                  "{h.address}"
                </p>
              </div>

              {/* Contact Footer */}
              <div className="pt-4 border-t-2 border-black flex items-center justify-between gap-4">
                <div className="text-xs font-heading">
                  <span className="text-gray-500 font-extrabold block uppercase font-mono text-[9px] tracking-wider">Storage Helpline</span>
                  <span className="font-mono text-gray-950 font-black text-sm">{h.phone}</span>
                </div>

                <a 
                  href={`tel:${h.phone}`}
                  className="p-2.5 bg-red-pale/80 hover:bg-red-pale text-red-primary border-2 border-black rounded-lg transition-transform hover:translate-y-[-1px] active:translate-y-[1px] shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] cursor-pointer"
                  title="Call hospital helpline"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
