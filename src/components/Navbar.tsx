/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Home, Search, PlusCircle, User, BarChart2, Heart, LogOut, ShieldAlert } from "lucide-react";

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  currentUser: any;
  onLogout: () => void;
}

export default function Navbar({ currentView, setView, currentUser, onLogout }: NavbarProps) {
  return (
    <>
      {/* DESKTOP TOP HEADER (Hidden on mobile) */}
      <header className="hidden md:block w-full sticky top-0 z-40 bg-transparent px-4 pt-4 pb-2">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between bg-white border-2 border-black rounded-full shadow-[4px_4px_0px_rgba(0,0,0,1)]">
          
          {/* Logo */}
          <div 
            onClick={() => setView('home')} 
            className="flex items-center gap-2 cursor-pointer group"
            id="logo-desktop"
          >
            <div className="w-10 h-10 bg-red-pale border-2 border-black rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 text-red-primary fill-red-light" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight text-red-primary">রক্তBD</span>
              <span className="text-[10px] block font-mono text-gray-500 font-bold -mt-1.5 tracking-wider uppercase">RaktaBD</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-2 lg:gap-4 font-heading font-bold text-gray-700">
            <button 
              onClick={() => setView('home')}
              className={`px-3 py-1.5 rounded-full hover:text-black transition-colors ${currentView === 'home' ? 'text-black bg-red-pale border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-transparent hover:bg-gray-100'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setView('search')}
              className={`px-3 py-1.5 rounded-full hover:text-black transition-colors ${currentView === 'search' ? 'text-black bg-red-pale border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-transparent hover:bg-gray-100'}`}
            >
              Find Donor
            </button>
            <button 
              onClick={() => setView('requests')}
              className={`px-3 py-1.5 rounded-full hover:text-black transition-colors ${currentView === 'requests' ? 'text-black bg-red-pale border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-transparent hover:bg-gray-100'}`}
            >
              Request Board
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className={`px-3 py-1.5 rounded-full hover:text-black transition-colors ${currentView === 'dashboard' ? 'text-black bg-red-pale border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-transparent hover:bg-gray-100'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setView('hospitals')}
              className={`px-3 py-1.5 rounded-full hover:text-black transition-colors ${currentView === 'hospitals' ? 'text-black bg-red-pale border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border border-transparent hover:bg-gray-100'}`}
            >
              Hospitals
            </button>
          </nav>

          {/* User Section */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setView('profile')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-gray-800 hover:bg-rose-50 transition-colors font-bold ${currentView === 'profile' ? 'bg-rose-100 text-red-primary border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'border-2 border-black bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)]'}`}
                >
                  <User className="w-4 h-4 text-red-light" />
                  <span>{currentUser.name.split(' ')[0]}</span>
                  {currentUser.isDonor && (
                    <span className="text-[10px] bg-red-primary text-white border border-black font-mono px-1.5 py-0.5 rounded-full uppercase">Donor</span>
                  )}
                </button>
                <button 
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 border-2 border-black bg-white hover:bg-red-pale rounded-full shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all text-gray-700 hover:text-black"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setView('auth')}
                className="bg-red-primary hover:bg-red-light text-white font-heading font-bold px-5 py-1.5 rounded-full border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
              >
                Sign In / Join
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MOBILE STICKY BOTTOM NAV BAR (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white border-2 border-black rounded-[24px] shadow-[4px_4px_0px_rgba(0,0,0,1)] z-40 h-[64px] flex items-center justify-around px-2 pb-safe-bottom">
        <button 
          onClick={() => setView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${currentView === 'home' ? 'text-red-primary font-bold' : 'text-gray-500'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button 
          onClick={() => setView('search')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${currentView === 'search' ? 'text-red-primary font-bold' : 'text-gray-500'}`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] mt-1">Search</span>
        </button>

        {/* Floating prominent "+" request button */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative -top-3">
          <button 
            onClick={() => setView('post-request')}
            className={`w-[50px] h-[50px] bg-red-primary rounded-full flex items-center justify-center text-white border-2 border-black hover:bg-red-light shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all outline-none`}
            id="mobile-request-fab"
          >
            <PlusCircle className="w-6 h-6 fill-red-pale text-red-primary" />
          </button>
          <span className="text-[10px] text-gray-500 font-bold mt-1 absolute -bottom-1">Request</span>
        </div>

        <button 
          onClick={() => {
            if (currentUser) {
              setView('profile');
            } else {
              setView('auth');
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${currentView === 'profile' || currentView === 'auth' ? 'text-red-primary font-bold' : 'text-gray-500'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-1">{currentUser ? 'Profile' : 'Sign In'}</span>
        </button>

        {/* Dashboard / More tab */}
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${currentView === 'dashboard' || currentView === 'hospitals' ? 'text-red-primary font-bold' : 'text-gray-500'}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">Dashboard</span>
        </button>
      </nav>
      
      {/* Mobile mini top header banner for context */}
      <div className="md:hidden w-full sticky top-0 z-30 bg-transparent px-4 pt-3 pb-1">
        <div className="w-full bg-white border-2 border-black rounded-full shadow-[3px_3px_0px_rgba(0,0,0,1)] px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => setView('home')}>
            <Heart className="w-5 h-5 text-red-primary fill-red-light" />
            <span className="font-heading font-extrabold text-lg text-red-primary">রক্তBD</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {currentUser && (
              <button 
                onClick={() => setView('profile')}
                className="bg-rose-50 text-red-primary border-2 border-black font-bold px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)]"
              >
                Hi, {currentUser.name.split(' ')[0]}
              </button>
            )}
            {!currentUser && (
              <button 
                onClick={() => setView('auth')}
                className="bg-red-primary text-white border-2 border-black font-bold px-3 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] hover:translate-y-[-1px] transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
