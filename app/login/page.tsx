"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        login(data.user);
        toast.success("Welcome back to MantraCode!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgba(236,72,153,0.1)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 text-center relative z-10">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-white/50 border border-white/60 dark:bg-slate-800/50 dark:border-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                <Sparkles className="w-5 h-5 text-pink-500" />
              </div>
              <span className="font-bold text-xl text-slate-800 dark:text-white">MantraCode</span>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your credentials to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 relative z-10">
            Don't have an account?{" "}
            <Link href="/signup" className="text-pink-600 dark:text-pink-400 font-bold hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
