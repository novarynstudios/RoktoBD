/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { X, Heart, Calendar, Building, BookOpen, Clock, Loader2 } from "lucide-react";

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedDonor: any, updatedHistory: any[]) => void;
  token: string | null;
}

export default function DonationModal({ isOpen, onClose, onSuccess, token }: DonationModalProps) {
  const [donatedOn, setDonatedOn] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Please insert the hospital name or donation center.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/donor/log-donation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ donatedOn, location, note })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not log standard donation.");
      }

      onSuccess(data.donor, data.history);
      setLocation("");
      setNote("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden card-shadow border border-rose-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-primary to-red-light p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-white text-transparent animate-pulse" />
            <span className="font-heading font-bold text-lg">Log New Blood Donation</span>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-white/20 transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-pale text-red-primary text-xs rounded-lg font-bold border border-red-200">
              {error}
            </div>
          )}

          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex gap-2.5 text-xs text-red-primary leading-snug">
            <Clock className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Important Notice:</p>
              <p className="text-gray-600 mt-0.5">
                Saving a life is sacred. Logging a donation will automatically place your account into a **90-day cooldown** (safety period) before your search status becomes eligible/available again.
              </p>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-red-primary" /> Donation Date *
            </label>
            <input
              type="date"
              required
              max={new Date().toISOString().split("T")[0]}
              value={donatedOn}
              onChange={(e) => setDonatedOn(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-red-primary outline-hidden font-medium bg-white"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-red-primary" /> Hospital / Venue *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dhaka Medical College, Square Hospital..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 focus:border-red-primary outline-hidden font-medium bg-white text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-red-primary" /> Brief Note (Optional)
            </label>
            <textarea
              placeholder="e.g. Regular donation, urgent bypass request caller..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 py-2.5 rounded-lg border border-gray-300 focus:border-red-primary outline-hidden bg-white text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-rose-50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-red-primary hover:bg-red-light text-white font-bold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Log Donation ✓"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
