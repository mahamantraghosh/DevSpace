"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import SiteLogo from "@/components/SiteLogo";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGithubLogin = () => {
    setLoading(true);
    window.location.href = "/api/github/auth";
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
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
    <div className="dark min-h-screen flex items-center justify-center bg-transparent px-4 relative z-10">
      <div className="w-full max-w-md">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-slate-700/50 rounded-3xl p-8 shadow-[0_8px_30px_rgba(236,72,153,0.1)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.1)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-white/10 dark:from-slate-800/40 dark:to-slate-900/10 pointer-events-none" />
          
          <div className="flex flex-col items-center mb-8 text-center relative z-10">
            <div className="mb-6 flex justify-center">
              <SiteLogo />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to access your workspaces and collaborate.</p>
          </div>

          <div className="space-y-5 relative z-10">
            <button 
              onClick={handleGithubLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading && !showEmailLogin ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <svg height="20" viewBox="0 0 16 16" width="20" className="fill-current"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                  Continue with GitHub
                </>
              )}
            </button>
            
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-slate-400 font-medium uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-700"></div>
            </div>
            
            {!showEmailLogin ? (
              <button
                type="button"
                onClick={() => setShowEmailLogin(true)}
                className="w-full flex items-center justify-center py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white/30 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                Login with Email
              </button>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
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
                    className="w-full px-4 py-2.5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-400 shadow-inner"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none mt-2"
                >
                  {loading && showEmailLogin ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}
          </div>

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
