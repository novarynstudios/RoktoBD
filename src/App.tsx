/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, CheckCircle2, Heart, X, Sparkles } from "lucide-react";

// Components
import Navbar from "./components/Navbar";

// Pages
import LandingPage from "./pages/LandingPage";
import SearchPage from "./pages/SearchPage";
import RequestBoard from "./pages/RequestBoard";
import PostRequestPage from "./pages/PostRequestPage";
import DonorRegisterPage from "./pages/DonorRegisterPage";
import DashboardPage from "./pages/DashboardPage";
import HospitalPage from "./pages/HospitalPage";
import ProfilePage from "./pages/ProfilePage";
import AuthPage from "./pages/AuthPage";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function App() {
  // Global routing view state
  const [currentView, setViewState] = useState<string>("home");
  
  // Auth states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  // Active toast collection
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load session from storage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("rbd_token");
      const storedUser = localStorage.getItem("rbd_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Local session retrieval rejected:", err);
    }
  }, []);

  // Sync state helpers on Login
  const handleLogin = (user: any, userToken: string) => {
    setCurrentUser(user);
    setToken(userToken);
    try {
      localStorage.setItem("rbd_token", userToken);
      localStorage.setItem("rbd_user", JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
  };

  // Sync state helpers on Logout
  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    try {
      localStorage.removeItem("rbd_token");
      localStorage.removeItem("rbd_user");
    } catch (err) {
      console.error(err);
    }
    showToast("Logged out successfully! Come back soon.", "success");
    setViewState("home");
  };

  // Synchronous User state updates
  const handleUpdateUser = (updatedUser: any) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem("rbd_user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
    }
  };

  // Dispatch global animated Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto erase toast
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Safe router sets view, checking authentication constraints
  const setView = (view: string) => {
    const protectedViews = ["profile", "register-donor"];
    if (protectedViews.includes(view) && !currentUser) {
      showToast("Access Restricted. Please register or sign in to proceed.", "error");
      setViewState("auth");
      return;
    }
    setViewState(view);
    // Smooth window scroll to top on routing changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render view controller
  const renderCurrentView = () => {
    switch (currentView) {
      case "home":
        return <LandingPage setView={setView} currentUser={currentUser} />;
      case "search":
        return <SearchPage />;
      case "requests":
        return <RequestBoard setView={setView} currentUser={currentUser} showToast={showToast} />;
      case "post-request":
        return <PostRequestPage setView={setView} currentUser={currentUser} showToast={showToast} />;
      case "register-donor":
        return (
          <DonorRegisterPage 
            setView={setView} 
            currentUser={currentUser} 
            token={token} 
            onSuccess={handleUpdateUser} 
            showToast={showToast} 
          />
        );
      case "dashboard":
        return <DashboardPage />;
      case "hospitals":
        return <HospitalPage />;
      case "profile":
        return (
          <ProfilePage 
            setView={setView} 
            currentUser={currentUser} 
            token={token} 
            onUpdateUser={handleUpdateUser} 
            showToast={showToast} 
          />
        );
      case "auth":
        return <AuthPage setView={setView} onLogin={handleLogin} showToast={showToast} />;
      default:
        return <LandingPage setView={setView} currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-off-white flex flex-col justify-between font-sans">
      
      {/* Global Toast Overlay Notifications */}
      <div 
        className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        id="toast-overlay"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", damping: 18, stiffness: 220 }}
              className={`p-4 rounded-[16px] border-2 border-black w-full flex items-start gap-3 pointer-events-auto shadow-[4px_4px_0px_rgba(0,0,0,1)] ${
                toast.type === "success" 
                  ? "bg-emerald-50 text-emerald-950" 
                  : "bg-rose-50 text-rose-950"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-green-safe shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-primary shrink-0 mt-0.5" />
              )}
              
              <div className="flex-1 text-xs sm:text-sm font-bold leading-relaxed">
                {toast.message}
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-gray-500 hover:text-black transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Core Elements */}
      <div>
        {/* Navigation blocks */}
        <Navbar 
          currentView={currentView} 
          setView={setView} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />

        {/* Content Layout Frame */}
        <main className="pb-24 md:pb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {renderCurrentView()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modern, Aesthetic Footers Layout (Hidden on Mobile bottom tab context) */}
      <footer className="hidden md:block w-full px-4 pb-8 pt-4 mt-auto text-sm text-gray-600 bg-transparent">
        <div className="max-w-7xl mx-auto bg-white border-2 border-black rounded-[24px] shadow-[4px_4px_0px_rgba(0,0,0,1)] p-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b-2 border-black pb-6">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-pale border-2 border-black rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-primary fill-red-light shrink-0" />
              </div>
              <span className="font-heading font-extrabold text-xl text-red-primary">রক্তBD</span>
            </div>

            {/* Links directory */}
            <div className="flex flex-wrap justify-center gap-6 font-bold text-black font-heading">
              <button onClick={() => setView('home')} className="hover:text-red-primary hover:underline transition-colors cursor-pointer">Home</button>
              <button onClick={() => setView('search')} className="hover:text-red-primary hover:underline transition-colors cursor-pointer">Search Donors</button>
              <button onClick={() => setView('requests')} className="hover:text-red-primary hover:underline transition-colors cursor-pointer">Request board</button>
              <button onClick={() => setView('dashboard')} className="hover:text-red-primary hover:underline transition-colors cursor-pointer">Dashboard</button>
              <button onClick={() => setView('hospitals')} className="hover:text-red-primary hover:underline transition-colors cursor-pointer">Hospitals</button>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
            <p>© {new Date().getFullYear()} RaktaBD Bangladesh Local Network. 100% Free & Open-source.</p>
            <p className="flex items-center gap-1.5 text-black">
              Saving lives with
              <Heart className="w-3.5 h-3.5 text-red-primary fill-red-light shrink-0 animate-pulse" />
              across Bangladesh
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
