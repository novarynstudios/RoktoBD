/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Award, 
  SlidersHorizontal, 
  RotateCcw, 
  Check, 
  Loader2, 
  Compass,
  AlertCircle
} from "lucide-react";
import { GEOGRAPHY, canDonate, Donor } from "../types";

export default function SearchPage() {
  // Query states
  const [bloodGroup, setBloodGroup] = useState("A+");
  const [compatible, setCompatible] = useState(false);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState("most_donations");

  // Fetch results state
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state for revealing phone contacts
  const [revealedPhones, setRevealedPhones] = useState<{ [id: number]: boolean }>({});
  
  // Mobile drawer filter toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Available districts dependent on division selector
  const availableDistricts = division ? GEOGRAPHY[division] : [];

  // Reset cascade if division is cleared
  useEffect(() => {
    setDistrict("");
  }, [division]);

  // Main search API fetch
  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (bloodGroup) params.append("blood_group", bloodGroup);
      if (compatible) params.append("compatible", "true");
      if (division) params.append("division", division);
      if (district) params.append("district", district);
      if (availableOnly) params.append("available_only", "true");
      if (sort) params.append("sort", sort);

      const res = await fetch(`/api/donors?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Unable to retrieve matching volunteer donors.");
      }
      const data = await res.json();
      
      // Perform local sanitization for Thana if user entered anything (text-input filter)
      let filtered = data;
      if (thana.trim()) {
        const qThana = thana.trim().toLowerCase();
        filtered = data.filter((d: Donor) => d.thana.toLowerCase().includes(qThana));
      }

      setDonors(filtered);
    } catch (err: any) {
      setError(err.message || "Donor search request failed.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger search on any query option update (Immediate responsiveness!)
  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, compatible, division, district, availableOnly, sort, thana]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setBloodGroup("A+");
    setCompatible(false);
    setDivision("");
    setDistrict("");
    setThana("");
    setAvailableOnly(true);
    setSort("most_donations");
    setRevealedPhones({});
  };

  // Toggle revealing phone contact details
  const togglePhone = (donorId: number) => {
    setRevealedPhones(prev => ({
      ...prev,
      [donorId]: !prev[donorId]
    }));
  };

  // Get donor medal/badge based on donation frequency
  const renderDonorMedal = (count: number) => {
    if (count >= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full font-bold">
          <Award className="w-3.5 h-3.5 fill-amber-500 text-amber-600 animate-pulse" />
          ⭐ Life Saver ({count}x)
        </span>
      );
    }
    if (count >= 5) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-bold">
          <Award className="w-3.5 h-3.5 fill-red-400 text-red-500" />
          🏅 5x Donor
        </span>
      );
    }
    if (count >= 3) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
          <Award className="w-3.5 h-3.5 fill-emerald-400 text-emerald-500" />
          ❤️ 3x Donor
        </span>
      );
    }
    if (count >= 1) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
          <Award className="w-3.5 h-3.5 fill-blue-400 text-blue-500" />
          🩸 1st Donation
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium px-2 py-1 bg-gray-50 border border-gray-100 rounded-full font-mono">
        Active Pledge
      </span>
    );
  };

  // Filter form overlay panel (shared by mobile and desktop)
  const renderFilterForm = () => {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="block text-xs font-bold text-gray-700 uppercase tracking-widest">
              Blood Group
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold font-mono">Match Exact Or Compatible</span>
          </div>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-red-primary outline-hidden font-semibold text-gray-800"
          >
            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Compatibility Checkbox */}
        <div className="flex items-start gap-2.5 p-3.5 bg-red-pale/25 border border-red-pale rounded-xl">
          <input
            id="compatible"
            type="checkbox"
            checked={compatible}
            onChange={(e) => setCompatible(e.target.checked)}
            className="mt-1 h-4.5 w-4.5 rounded-sm border-gray-300 text-red-primary focus:ring-red-primary"
          />
          <label htmlFor="compatible" className="text-xs text-red-primary font-bold leading-snug cursor-pointer select-none">
            Include Compatible Donors
            <span className="block text-gray-500 font-medium mt-0.5 text-[10px] lowercase italic">
              Shows donors who can safely donate TO {bloodGroup} recipients
            </span>
          </label>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
            Location Cascade (Division)
          </h3>
          <select
            value={division}
            onChange={(e) => setDivision(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-red-primary outline-hidden font-semibold text-gray-800 text-sm"
          >
            <option value="">-- View All Divisions --</option>
            {Object.keys(GEOGRAPHY).map(divName => (
              <option key={divName} value={divName}>{divName}</option>
            ))}
          </select>
        </div>

        {division && (
          <div>
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
              District
            </h3>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-red-primary outline-hidden font-semibold text-gray-800 text-sm animate-fade-in"
            >
              <option value="">-- Choose District --</option>
              {availableDistricts.map(distName => (
                <option key={distName} value={distName}>{distName}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
            Thana / Police Station Search
          </h3>
          <input
            type="text"
            placeholder="e.g. Mirpur, Sadar..."
            value={thana}
            onChange={(e) => setThana(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl focus:border-red-primary outline-hidden font-semibold text-gray-800 text-sm"
          />
        </div>

        {/* Available only toggle toggle */}
        <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-xl">
          <div>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest block">Available Now</span>
            <span className="text-[10px] text-gray-400 font-medium">Excludes active cooldowns</span>
          </div>
          <button
            type="button"
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 outline-hidden relative cursor-pointer ${availableOnly ? "bg-red-primary" : "bg-gray-300"}`}
          >
            <span className={`w-5 h-5 bg-white rounded-full shadow-xs transform duration-200 ${availableOnly ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleResetFilters}
          className="w-full py-2.5 border border-red-pale hover:bg-red-pale/20 text-red-primary font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Clear All Filters
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Search Header Banner */}
      <div className="bento-card bg-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-gray-900 flex items-center gap-2">
            <Compass className="w-7 h-7 text-red-primary animate-spin-slow shrink-0" />
            Find Blood Donors
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-extrabold mt-1">Connect with volunteer blood savers in your district immediately</p>
        </div>

        {/* Sort and mobile toggle options */}
        <div className="flex items-center gap-3 self-end md:self-auto w-full md:w-auto">
          {/* Mobile filter toggle menu button */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="md:hidden flex-1 py-2.5 px-4 bg-gray-100 border-2 border-black font-extrabold rounded-xl text-sm flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <div className="flex-1 md:flex-none flex items-center gap-2 min-w-44 bg-gray-50 border-2 border-black px-3 py-2 rounded-xl shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
            <span className="text-xs text-black font-black uppercase tracking-widest shrink-0 font-mono">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 outline-none w-full"
            >
              <option value="most_donations">Donation Count First</option>
              <option value="recently_available">Recently Active First</option>
              <option value="chrono_newest">Newest Joined First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        
        {/* DESKTOP SIDEBAR FILTERS (Hidden on mobile) */}
        <aside className="hidden md:block col-span-1 bento-card bg-white p-6 sticky top-24">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b-2 border-black">
            <SlidersHorizontal className="w-4 h-4 text-red-primary" />
            <h2 className="font-heading font-extrabold text-lg text-gray-900">Custom Filters</h2>
          </div>
          {renderFilterForm()}
        </aside>

        {/* RESULTS FEED COLUMN (3 cols wide on desktop) */}
        <main className="md:col-span-3 space-y-6">
          
          {/* Active Counters display */}
          <div className="flex items-center justify-between text-xs text-black font-heading font-black bg-rose-50 border-2 border-black rounded-lg px-4 py-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <span>
              Searching: <span className="text-red-primary font-black">{bloodGroup}</span> 
              {compatible && <span className="text-purple-650 block sm:inline"> (Compatible Included)</span>}
              {division && <span className="text-black block sm:inline"> in {division} {district ? `> ${district}` : ""}</span>}
            </span>
            <span className="shrink-0">
              Found <strong className="text-red-primary text-sm font-mono">{donors.length}</strong> volunteers
            </span>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-4 bg-red-pale text-red-primary font-bold text-sm rounded-xl border-2 border-black flex items-center gap-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Loader */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bento-card bg-white">
              <Loader2 className="w-10 h-10 text-red-primary animate-spin mb-4" />
              <p className="text-gray-500 font-heading font-bold">Refreshing volunteer registry feeds...</p>
            </div>
          ) : donors.length === 0 ? (
            /* EMPTY STATES BACKGROUND */
            <div className="bento-card p-12 text-center bg-white space-y-4">
              <XCircle className="w-16 h-16 text-rose-300 mx-auto" />
              <h3 className="font-heading font-extrabold text-xl text-gray-800">No Volunteer Donors Located</h3>
              <p className="text-gray-600 text-sm max-w-md mx-auto leading-relaxed font-semibold">
                We couldn't locate any active donors matching those exact filters. Try enabling <strong>"Include Compatible Donors"</strong>, expanding your geographic district coverage, or switching the "Available Now" constraint.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-red-pale border-2 border-black text-red-primary font-bold font-heading text-sm rounded-full shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all cursor-pointer"
              >
                Reset All Search Filters
              </button>
            </div>
          ) : (
            /* DONOR CARDS GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donors.map(donor => {
                const isExact = donor.bloodGroup === bloodGroup;
                
                // Color configuration of blood group badge
                let badgeColorStyle = "bg-red-primary text-white";
                if (donor.bloodGroup.includes("AB")) badgeColorStyle = "bg-purple-600 text-white";
                else if (donor.bloodGroup.includes("B")) badgeColorStyle = "bg-amber-600 text-white";
                else if (donor.bloodGroup.includes("O")) badgeColorStyle = "bg-rose-700 text-white";

                return (
                  <div 
                    key={donor.id} 
                    className={`bento-card bg-white overflow-hidden flex flex-col justify-between transition-shadow ${!donor.isAvailable ? 'opacity-85' : ''}`}
                  >
                    
                    {/* Top Body */}
                    <div className="p-5 space-y-4">
                      
                      {/* Badge representation row */}
                      <div className="flex items-center justify-between font-heading font-black">
                        {donor.isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-white border-2 border-green-safe text-green-safe px-2.5 py-1 rounded-full shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">
                            <span className="w-1.5 h-1.5 bg-green-safe rounded-full animate-pulse" />
                            AVAILABLE NOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[10px] bg-gray-100 text-gray-500 border-2 border-gray-300 px-2.5 py-1 rounded-full font-mono">
                            cooldown phase
                          </span>
                        )}

                        {/* Exact match or compatible check */}
                        {isExact ? (
                          <span className="text-[10px] bg-red-pale border-2 border-black text-red-primary font-black px-2.5 py-1 rounded uppercase shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">Exact Match</span>
                        ) : (
                          <span className="text-[10px] bg-purple-50 border-2 border-black text-purple-600 font-black px-2.5 py-1 rounded uppercase shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]">Compatible ✓</span>
                        )}
                      </div>

                      {/* Header containing Name and Group */}
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl border-2 border-black flex items-center justify-center text-white ${badgeColorStyle} shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] font-heading font-black text-2xl shrink-0`}>
                          {donor.bloodGroup}
                        </div>
                        <div>
                          <h4 className="font-heading font-extrabold text-lg text-gray-900 leading-tight">
                            {donor.name}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-extrabold font-mono uppercase tracking-widest mt-0.5 block">VOLUNTEER</span>
                        </div>
                      </div>

                      {/* Location text details */}
                      <div className="text-xs text-gray-650 space-y-1.5 bg-gray-50 p-3 border-2 border-black rounded-xl shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-center gap-1.5 font-heading font-black text-black">
                          <MapPin className="w-4 h-4 text-red-light shrink-0" />
                          <span>{donor.district}, {donor.thana}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 pl-5 font-bold font-mono uppercase leading-none">
                          {donor.division} Division
                        </div>
                      </div>

                      {/* Medals and badges */}
                      <div className="pt-1 flex flex-wrap gap-2 items-center">
                        {renderDonorMedal(donor.donationCount)}
                      </div>

                    </div>

                    {/* Bottom Action Footer */}
                    <div className="bg-rose-50/50 border-t-2 border-black p-4 space-y-3">
                      {revealedPhones[donor.id] ? (
                        <div className="bg-white px-3.5 py-2.5 rounded-xl text-center border-2 border-black text-gray-900 font-mono font-black text-sm flex items-center justify-center gap-2 animate-fade-in shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                          <Phone className="w-4 h-4 text-red-light shrink-0 animate-bounce" />
                          <span>{donor.phone}</span>
                        </div>
                      ) : null}

                      <button
                        onClick={() => togglePhone(donor.id)}
                        className={`w-full py-2.5 border-2 border-black rounded-xl font-heading font-extrabold text-sm transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1.5px] active:translate-y-[1px] ${revealedPhones[donor.id] ? 'bg-white hover:bg-gray-50 text-black' : 'bg-red-primary hover:bg-rose-600 text-white'}`}
                      >
                        <Phone className="w-4 h-4" />
                        {revealedPhones[donor.id] ? "Hide Donor Phone" : "Show Contact Phone 📞"}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>

      </div>

      {/* MOBILE COLLAPSIBLE DRAWER FILTER PANEL */}
      {showMobileFilters && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end justify-center animate-fade-in md:hidden">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-xl border-t border-rose-100 flex flex-col">
            <div className="flex items-center justify-between border-b border-rose-50 pb-3">
              <span className="font-heading font-extrabold text-lg text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-5 h-5 text-red-primary" /> Filter Volunteers
              </span>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-xs bg-gray-100 font-black px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-200"
              >
                Close ✓
              </button>
            </div>
            
            <div className="overflow-y-auto py-2">
              {renderFilterForm()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
