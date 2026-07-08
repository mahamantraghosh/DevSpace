"use client";

import React, { useState, useEffect } from "react";
import { GitBranch, GitPullRequest, GitCommit, Download, LogIn, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface GitHubPanelProps {
  roomId: string;
  onCloneSuccess: () => void;
}

export default function GitHubPanel({ roomId, onCloneSuccess }: GitHubPanelProps) {
  const [loading, setLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [commitMessage, setCommitMessage] = useState("");
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    checkGithubConnection();
  }, []);

  const checkGithubConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/github/repos");
      if (res.status === 403 || res.status === 401) {
        setGithubConnected(false);
      } else if (res.ok) {
        const data = await res.json();
        setGithubConnected(true);
        setRepos(data.repos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = "/api/github/auth";
  };

  const handleClone = async () => {
    if (!selectedRepo) return toast.error("Please select a repository");
    
    setActionLoading("clone");
    const [owner, repo] = selectedRepo.split("/");
    
    try {
      const res = await fetch("/api/github/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch, roomId }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully cloned ${data.filesCount} files!`);
        onCloneSuccess();
      } else {
        toast.error(data.error || "Failed to clone repository");
      }
    } catch (err) {
      toast.error("An error occurred while cloning");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommit = async () => {
    if (!selectedRepo) return toast.error("Please select a repository");
    if (!commitMessage) return toast.error("Please enter a commit message");
    
    setActionLoading("commit");
    const [owner, repo] = selectedRepo.split("/");
    
    try {
      const res = await fetch("/api/github/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo, branch, message: commitMessage, roomId }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Successfully pushed to GitHub!");
        setCommitMessage("");
      } else {
        toast.error(data.error || "Failed to push to GitHub");
      }
    } catch (err) {
      toast.error("An error occurred while pushing");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-pink-500" />
        <p className="text-sm font-medium">Checking GitHub status...</p>
      </div>
    );
  }

  if (!githubConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <GitBranch className="w-8 h-8 text-slate-700 dark:text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Connect GitHub</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Connect your GitHub account to import repositories and push your changes directly from MantraCode.
        </p>
        <button
          onClick={handleConnect}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <LogIn size={18} />
          Connect Account
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent overflow-y-auto custom-scroll p-4 space-y-6">
      
      {/* Repository Selection */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-pink-200/50 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <GitBranch size={16} /> Repository
          </h4>
          <button onClick={checkGithubConnection} className="text-slate-400 hover:text-pink-500 transition-colors" title="Refresh Repos">
            <RefreshCw size={14} />
          </button>
        </div>
        
        <select 
          value={selectedRepo} 
          onChange={(e) => setSelectedRepo(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 mb-3"
        >
          <option value="">Select a repository...</option>
          {repos.map(repo => (
            <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
          ))}
        </select>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Branch</label>
            <input 
              type="text" 
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="main"
            />
          </div>
        </div>

        <button
          onClick={handleClone}
          disabled={!selectedRepo || actionLoading === "clone"}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-400 border border-pink-300 dark:border-pink-500/30 rounded-lg font-bold text-sm hover:bg-pink-200 dark:hover:bg-pink-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === "clone" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Clone to Workspace
        </button>
      </div>

      {/* Commit & Push */}
      <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm p-4 rounded-2xl border border-pink-200/50 dark:border-slate-700/50 shadow-sm">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
          <GitCommit size={16} /> Commit & Push
        </h4>
        
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Update awesome feature..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 min-h-[80px] mb-3 resize-none custom-scroll"
        />

        <button
          onClick={handleCommit}
          disabled={!selectedRepo || !commitMessage.trim() || actionLoading === "commit"}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg font-bold text-sm hover:from-pink-600 hover:to-purple-600 transition-all shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionLoading === "commit" ? <Loader2 size={16} className="animate-spin" /> : <GitPullRequest size={16} />}
          Commit & Push
        </button>
      </div>

    </div>
  );
}
