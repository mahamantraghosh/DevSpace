"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import SiteLogo from "@/components/SiteLogo";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        login(data.user);
        toast.success("Account created successfully!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen flex items-center justify-center bg-transparent px-4 py-12 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgba(250,204,21,0.1)] dark:shadow-[0_8px_30px_rgba(59,130,246,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 text-center relative z-10">
            <div className="mb-6 flex justify-center">
              <SiteLogo />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create an Account</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Join MantraCode and start collaborating</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                placeholder="developer_maha"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
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
                className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign Up <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400 relative z-10">
            Already have an account?{" "}
            <Link href="/login" className="text-yellow-600 dark:text-yellow-500 font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
