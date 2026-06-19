"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  MessageSquare, 
  Play, 
  ChevronRight,
  ArrowRight,
  Code,
  Sparkles,
  Zap,
  Globe,
  GitBranch,
  Activity
} from "lucide-react";
import InteractiveEditor from "@/components/InteractiveEditor";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";

export default function Home() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Simulated Global Activity Ticker
  const [activities, setActivities] = useState([
    "Mahamantra created a new workspace",
    "Alex joined room #maha-ui",
    "Sarah deployed clock-widget",
    "Code synced across 4 regions",
  ]);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      const newActivities = [
        "New user registered from India",
        "React hook updated in #frontend-room",
        "Pusher socket reconnected globally",
        "Mahamantra optimized the Redis store",
        "Global commit successful",
      ];
      setActivities(prev => {
        const next = [...prev];
        next.unshift(newActivities[Math.floor(Math.random() * newActivities.length)]);
        if (next.length > 5) next.pop();
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen text-slate-800 selection:bg-pink-500/30 selection:text-pink-900 font-sans">
      
      {/* Live Global Ticker Banner */}
      <div className="w-full bg-white/20 backdrop-blur-lg border-b border-white/30 py-2.5 text-center text-[11px] sm:text-xs font-mono tracking-wide flex items-center justify-center gap-2 px-4 select-none text-slate-800 shadow-sm">
        <Activity className="w-3.5 h-3.5 text-pink-600 animate-pulse" />
        <span className="font-bold">Live Network:</span>
        <span className="truncate max-w-[200px] sm:max-w-none transition-all duration-500">{activities[0]}</span>
      </div>

      {/* Glass Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/30 bg-white/30 backdrop-blur-xl transition-all shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/50 border border-white/60 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-pink-600" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-pink-700 transition-colors drop-shadow-sm">
              Mantra<span className="text-pink-600">Code</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-700">
            <Link href="#features" className="hover:text-pink-600 transition-colors py-1 drop-shadow-sm">Features</Link>
            <Link href="#vision" className="hover:text-pink-600 transition-colors py-1 drop-shadow-sm">Vision</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 ml-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-400 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-pink-500/20">
                  {user.username.slice(0, 2).toUpperCase()}
                </div>
                <Link
                  href="/dashboard"
                  className="h-9 inline-flex items-center rounded-xl bg-pink-500/90 backdrop-blur-md hover:bg-pink-600 px-5 text-sm font-bold text-white transition-all shadow-md shadow-pink-500/30 border border-pink-400/50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="h-9 border border-white/50 bg-white/40 backdrop-blur-md px-4 rounded-xl text-sm font-bold text-slate-700 hover:bg-white/60 hover:text-pink-600 transition-colors cursor-pointer shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="h-9 inline-flex items-center rounded-xl border border-white/50 bg-white/40 backdrop-blur-md px-5 text-sm font-bold text-slate-800 hover:bg-white/60 hover:text-pink-700 transition-all shadow-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="h-9 inline-flex items-center rounded-xl bg-pink-500/90 backdrop-blur-md hover:bg-pink-600 px-5 text-sm font-bold text-white transition-all shadow-lg shadow-pink-500/30 border border-pink-400/50"
                >
                  Start Coding
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center">

        {/* Hero Section */}
        <section className="w-full py-20 lg:py-32 flex flex-col items-center justify-center text-center px-4 md:px-6 relative z-10">
          <div className="w-full min-w-0 max-w-[1000px] space-y-8">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/40 bg-white/30 backdrop-blur-md shadow-md text-sm font-bold text-slate-800 mx-auto select-none">
              <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>Engineered by Mahamantra Ghosh</span>
              <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping ml-1"></div>
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl text-slate-900 leading-[1.1] max-w-5xl mx-auto drop-shadow-md">
                Ethereal Coding. <br className="hidden md:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-yellow-500 drop-shadow-sm">
                  Flawless Sync.
                </span>
              </h1>
              <p className="mx-auto max-w-[750px] text-lg sm:text-xl text-slate-700 leading-relaxed px-4 font-bold drop-shadow-sm">
                A divine collaborative workspace where your ideas flow seamlessly. Experience real-time compilation, integrated chat, and an editor built for the modern creator.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-4">
              <Link 
                href="/signup"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 px-10 text-base font-black text-white shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 transition-all w-full sm:w-auto cursor-pointer border border-pink-400/50"
              >
                Create Workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            {/* Interactive Demo */}
            <div className="pt-24 pb-8 w-full max-w-6xl mx-auto relative z-20">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-sm font-mono text-pink-700 font-bold bg-white/40 backdrop-blur-lg px-6 py-2 rounded-full border border-white/50 shadow-md inline-flex items-center gap-2">
                <Globe className="w-4 h-4 animate-spin-slow" />
                INTERACTIVE PREVIEW
              </div>
              <InteractiveEditor />
            </div>

          </div>
        </section>

        {/* Features Grid - Glassmorphic */}
        <section id="features" className="w-full py-24 relative z-10">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              
              <div className="group rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 hover:bg-white/30 transition-all duration-300 shadow-xl shadow-pink-500/5">
                <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Code className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 drop-shadow-sm">Synchronous Engine</h3>
                <p className="text-slate-700 text-base font-medium leading-relaxed drop-shadow-sm">
                  Operational Transformation ensures that every keystroke is synced globally in milliseconds, preventing conflicts and maintaining perfect state.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 hover:bg-white/30 transition-all duration-300 shadow-xl shadow-pink-500/5">
                <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Play className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 drop-shadow-sm">Sandboxed Compilation</h3>
                <p className="text-slate-700 text-base font-medium leading-relaxed drop-shadow-sm">
                  Execute HTML, CSS, and JS in a secure iframe. Intercept console logs instantly via our built-in terminal UI without leaving the editor.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 hover:bg-white/30 transition-all duration-300 shadow-xl shadow-pink-500/5">
                <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <MessageSquare className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 drop-shadow-sm">Integrated Presence</h3>
                <p className="text-slate-700 text-base font-medium leading-relaxed drop-shadow-sm">
                  See exactly who is online, who is typing, and chat seamlessly in the sidebar without breaking your coding flow.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/40 bg-white/20 backdrop-blur-xl p-8 hover:bg-white/30 transition-all duration-300 shadow-xl shadow-pink-500/5">
                <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Users className="w-7 h-7 text-pink-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 drop-shadow-sm">Redis Powered</h3>
                <p className="text-slate-700 text-base font-medium leading-relaxed drop-shadow-sm">
                  Leveraging Vercel KV for robust, serverless session persistence. Your workspaces and identities are instantly available anywhere.
                </p>
              </div>

            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/30 bg-white/20 backdrop-blur-md py-8 mt-auto z-10 relative">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-600" />
            <span className="font-bold text-lg text-slate-800">MantraCode</span>
          </div>
          <div className="text-slate-700 font-bold text-sm bg-white/40 px-4 py-2 rounded-xl border border-white/50 shadow-sm">
            Created with passion by <span className="text-pink-700 font-black">Mahamantra Ghosh</span>
          </div>
          <div className="flex gap-4">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-slate-700 hover:text-pink-600 hover:bg-white/80 transition-all border border-white/60 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.5-1.54 6.5-7a4.6 4.6 0 0 0-1.39-3.23 4.08 4.08 0 0 0-.14-3.23s-1.12-.35-3.6 1.32a12.8 12.8 0 0 0-6.8 0C6.12 1.05 5 1.4 5 1.4a4.08 4.08 0 0 0-.14 3.23A4.6 4.6 0 0 0 3.47 7.85c0 5.46 3.36 6.65 6.5 7a4.8 4.8 0 0 0-1 3.02v4"></path>
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:bg-white/80 transition-all border border-white/60 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}