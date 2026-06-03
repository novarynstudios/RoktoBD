/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Calendar, MapPin, Tag } from "lucide-react";
import { DonationHistory } from "../types";

interface HistoryTimelineProps {
  history: DonationHistory[];
}

export default function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-rose-100 shadow-sm text-center">
        <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h4 className="font-heading font-semibold text-gray-700">No Donation History Logged Yet</h4>
        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
          Whenever you log a donation using the "I Just Donated" quick utility, your saved lives history timeline will populate here!
        </p>
      </div>
    );
  }

  // Sort chrono descending
  const sortedHistory = [...history].sort((a, b) => new Date(b.donatedOn).getTime() - new Date(a.donatedOn).getTime());

  return (
    <div className="relative border-l-2 border-red-pale ml-4 md:ml-6 pl-6 space-y-8 py-2">
      {sortedHistory.map((item, idx) => {
        const donationDate = new Date(item.donatedOn);
        const formattedDate = donationDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });

        return (
          <div key={item.id} className="relative group">
            {/* Pulsing visual red dot on timeline node */}
            <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white border-2 border-red-primary">
              <span className="h-2 w-2 rounded-full bg-red-light group-hover:scale-125 transition-transform" />
            </span>

            <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm hover:shadow transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-primary bg-red-pale/45 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Log ID: #{item.id}</span>
              </div>

              <h4 className="font-heading font-bold text-gray-800 flex items-center gap-1 text-sm sm:text-base">
                <MapPin className="text-red-light w-4 h-4 shrink-0" />
                {item.location}
              </h4>

              {item.note && (
                <p className="text-gray-600 text-xs sm:text-sm mt-2 pt-2 border-t border-rose-50 italic flex items-start gap-1">
                  <Tag className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                  <span>"{item.note}"</span>
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
