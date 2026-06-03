/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line,
  Legend 
} from "recharts";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ChartDataDonor {
  group: string;
  count: number;
}

interface ChartDataDistrict {
  district: string;
  count: number;
}

interface ChartDataTimeline {
  date: string;
  count: number;
}

const COLORS = [
  "#C0392B", // O- O+ (Universal)
  "#E74C3C", // A+ A-
  "#8E44AD", // AB+ AB- (Universal recipient)
  "#D35400", // B+ B-
  "#F39C12", 
  "#16A085", 
  "#2C3E50", 
  "#34495E"
];

export default function DashboardCharts() {
  const [donorData, setDonorData] = useState<ChartDataDonor[]>([]);
  const [districtData, setDistrictData] = useState<ChartDataDistrict[]>([]);
  const [timelineData, setTimelineData] = useState<ChartDataTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [donorsRes, districtsRes, timelineRes] = await Promise.all([
        fetch("/api/donor-count"),
        fetch("/api/district-donors"),
        fetch("/api/requests-timeline")
      ]);

      if (!donorsRes.ok || !districtsRes.ok || !timelineRes.ok) {
        throw new Error("Unable to load latest analytics statistics from server.");
      }

      const dData = await donorsRes.json();
      const distData = await districtsRes.json();
      const tData = await timelineRes.json();

      setDonorData(dData);
      setDistrictData(distData);
      setTimelineData(tData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to fetch dashboard graph records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-rose-100 shadow-sm">
        <RefreshCw className="w-8 h-8 text-red-primary animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Assembling live charts data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 bg-rose-50 border border-rose-100 rounded-xl">
        <AlertCircle className="w-10 h-10 text-red-primary mb-3" />
        <p className="text-red-primary font-bold">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-primary hover:bg-red-light text-white rounded font-medium text-sm flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Try Reloading
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* DONUT: DONOR DISTRIBUTION */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-rose-100 shadow-sm flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-bold text-lg text-gray-800">Donor Distribution by Blood Group</h3>
          <p className="text-xs text-gray-500">Live breakdown of registered volunteers per group type</p>
        </div>
        
        <div className="h-64 sm:h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="count"
                nameKey="group"
              >
                {donorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`${value} volunteers`, 'Registered']}
                contentStyle={{ borderRadius: "8px", border: "1px solid #fadbd8" }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BAR: DISTRICT LEADERS */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-rose-100 shadow-sm flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-bold text-lg text-gray-800">Top Districts by Donor Volume</h3>
          <p className="text-xs text-gray-500">Districts across Bangladesh with the most registered helpers</p>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={districtData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="district" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: any) => [`${value} donors`, 'Donors count']}
                contentStyle={{ borderRadius: "8px", border: "1px solid #fadbd8" }}
              />
              <Bar dataKey="count" fill="#E74C3C" radius={[4, 4, 0, 0]}>
                {districtData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? "#C0392B" : "#E74C3C"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LINE: ACTIVITY OVERTIME */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-rose-100 shadow-sm lg:col-span-2 flex flex-col">
        <div className="mb-4">
          <h3 className="font-heading font-bold text-lg text-gray-800">Blood Requests Flow — Last 30 Days</h3>
          <p className="text-xs text-gray-500">Live timeline view representing urgency queries posted through our portal</p>
        </div>

        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                tickFormatter={(str) => {
                  if (!str) return '';
                  const d = new Date(str);
                  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value: any) => [`${value} requests`, 'Requests Posted']}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return d.toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
                }}
                contentStyle={{ borderRadius: "8px", border: "1px solid #fadbd8" }}
              />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#C0392B" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1, fill: "#FFFFFF" }}
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
