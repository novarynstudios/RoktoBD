/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { LogIn, UserPlus, Heart, ShieldAlert, Check, Loader2, KeyRound, Mail, Phone, Lock, User, MapPin } from "lucide-react";
import { GEOGRAPHY } from "../types";

interface AuthPageProps {
  setView: (v: string) => void;
  onLogin: (u: any, token: string) => void;
  showToast: (m: string, t?: 'success' | 'error') => void;
}

export default function AuthPage({ setView, onLogin, showToast }: AuthPageProps) {
  // Tabs switcher: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // Loaders and errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // LOGIN DATA states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // SIGNUP DATA states
  const [signName, setSignName] = useState("");
  const [signEmail, setSignEmail] = useState("");
  const [signPassword, setSignPassword] = useState("");
  const [signConfirm, setSignConfirm] = useState("");
  const [signBloodGroup, setSignBloodGroup] = useState("");
  const [signPhone, setSignPhone] = useState("");
  const [signDivision, setSignDivision] = useState("");
  const [signDistrict, setSignDistrict] = useState("");
  const [signThana, setSignThana] = useState("");

  const districtsList = signDivision ? GEOGRAPHY[signDivision] : [];

  // Reset errors if tab switches
  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!loginEmail.trim() || !loginPassword) {
      setError("Please fill out your Email and Password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Try again.");
      }

      showToast("Safely logged in! Welcome back to RaktaBD.", "success");
      onLogin(data.user, data.token);
      setView('profile');
    } catch (err: any) {
      setError(err.message || "Login request rejected.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Checks
    if (!signName.trim() || !signEmail.trim() || !signPassword || !signPhone.trim() || !signDivision || !signDistrict || !signThana.trim()) {
      setError("Please complete all required signup credentials.");
      return;
    }

    if (signPassword !== signConfirm) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    if (signPassword.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (!/^01[3-9]\d{8}$/.test(signPhone.trim())) {
      setError("Please enter a valid 11-digit Bangladeshi phone number (starting 01...)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signName,
          email: signEmail,
          password: signPassword,
          bloodGroup: signBloodGroup || null,
          phone: signPhone,
          division: signDivision,
          district: signDistrict,
          thana: signThana
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Signup failed.");
      }

      showToast("Success! Your volunteer account is ready.", "success");
      onLogin(data.user, data.token);
      setView('profile');
    } catch (err: any) {
      setError(err.message || "Registration request rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6 animate-fade-in pb-16">
      
      {/* Intro branding visual */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-red-pale border-2 border-black rounded-full flex items-center justify-center text-red-primary mx-auto shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)]">
          <Heart className="w-7 h-7 fill-red-light text-red-primary animate-pulse" />
        </div>
        <h2 className="font-heading font-black text-2xl sm:text-3xl text-gray-955 leading-tight">
          RaktaBD Gateway Portal
        </h2>
        <p className="text-gray-600 text-xs sm:text-sm font-bold font-heading">
          Connect immediately as a donor helper or manage emergency appeals
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="bg-white p-1.5 rounded-xl border-2 border-black flex gap-1.5 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => handleTabChange('login')}
          className={`flex-1 py-3 text-sm font-heading font-black flex items-center justify-center gap-1.5 rounded-lg transition-transform cursor-pointer border-2 ${activeTab === 'login' ? 'bg-red-primary text-white border-black' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
        >
          <LogIn className="w-4 h-4" /> Sign In
        </button>
        <button
          onClick={() => handleTabChange('signup')}
          className={`flex-1 py-3 text-sm font-heading font-black flex items-center justify-center gap-1.5 rounded-lg transition-transform cursor-pointer border-2 ${activeTab === 'signup' ? 'bg-red-primary text-white border-black' : 'text-gray-500 border-transparent hover:bg-gray-100'}`}
        >
          <UserPlus className="w-4 h-4" /> Join Registry
        </button>
      </div>

      {/* Tab bodies */}
      <div className="bento-card bg-white p-6 sm:p-8">
        
        {error && (
          <div className="p-3 bg-red-pale text-red-primary rounded-lg text-xs font-bold border-2 border-black mb-6 flex gap-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-primary mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'login' ? (
          /* ================= LOGIN FORM ================= */
          <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-red-primary" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. arif@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <KeyRound className="w-3.5 h-3.5 text-red-primary" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            <div className="pt-2 font-heading">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-primary hover:bg-rose-600 border-2 border-black text-white font-black text-xs uppercase tracking-widest rounded-full transition-transform shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Sign In ✓
              </button>
            </div>
          </form>
        ) : (
          /* ================= SIGNUP FORM ================= */
          <form onSubmit={handleSignupSubmit} className="space-y-4 text-left">
            
            {/* Name */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <User className="w-3.5 h-3.5 text-red-primary" /> Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Arif Rahman"
                value={signName}
                onChange={(e) => setSignName(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-red-primary" /> Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. volunteer@example.com"
                value={signEmail}
                onChange={(e) => setSignEmail(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-red-primary" /> Phone Call-Line *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 01712345678"
                value={signPhone}
                onChange={(e) => setSignPhone(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955"
              />
            </div>

            {/* Blood group */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Blood Group (Optional Here)</label>
              <select
                value={signBloodGroup}
                onChange={(e) => setSignBloodGroup(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              >
                <option value="">-- Choose My Blood Group --</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* Division Cascades */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">Division *</label>
                <select
                  value={signDivision}
                  required
                  onChange={(e) => {
                    setSignDivision(e.target.value);
                    setSignDistrict("");
                  }}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955 animate-fade-in"
                >
                  <option value="">-- Division --</option>
                  {Object.keys(GEOGRAPHY).map(div => (
                    <option key={div} value={div}>{div}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 font-mono">District *</label>
                <select
                  value={signDistrict}
                  required
                  disabled={!signDivision}
                  onChange={(e) => setSignDistrict(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-955 disabled:opacity-50"
                >
                  <option value="">-- District --</option>
                  {districtsList.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thana */}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-red-primary" /> Thana / Police Station *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dhanmondi, Sadar..."
                value={signThana}
                onChange={(e) => setSignThana(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                  <Lock className="w-3.5 h-3.5 text-red-primary" /> Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={signPassword}
                  onChange={(e) => setSignPassword(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                  Confirm *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Retype"
                  value={signConfirm}
                  onChange={(e) => setSignConfirm(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 bg-white border-2 border-black rounded-lg focus:border-red-primary outline-hidden font-extrabold text-gray-950 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 font-heading">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-red-primary hover:bg-rose-600 border-2 border-black text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Join Live Registry ✓
              </button>
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
