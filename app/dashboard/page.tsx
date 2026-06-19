"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Sparkles, LogOut, Copy, Check, Users, Lock, Unlock, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Room {
  roomId: string;
  name: string;
  visibility: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomVisibility, setNewRoomVisibility] = useState("public");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchRooms();
    }
  }, [user, authLoading, router]);

  const fetchRooms = async () => {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load your workspacess");
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreating(true);
    // Generate random id
    const descriptors = ["maha", "mantra", "nova", "hyper", "cyber"];
    const roomId = `${descriptors[Math.floor(Math.random() * descriptors.length)]}-${Math.floor(Math.random() * 9000) + 1000}`;

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          name: newRoomName,
          visibility: newRoomVisibility
        })
      });

      if (res.ok) {
        const newRoom = await res.json();
        setRooms([newRoom, ...rooms]);
        setIsModalOpen(false);
        setNewRoomName("");
        toast.success("Workspace created!");

        // Ensure their username is saved locally for the room chat logic
        localStorage.setItem("devspace-username", user!.username);

        // Ask if they want to go there now
        toast((t) => (
          <span className="flex items-center gap-3">
            Ready to code?
            <button
              onClick={() => { toast.dismiss(t.id); router.push(`/room/${roomId}`); }}
              className="bg-pink-500 text-white px-3 py-1 rounded text-xs font-bold"
            >
              Enter Room
            </button>
          </span>
        ), { duration: 5000 });

      } else {
        toast.error("Failed to create room");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copied link!");
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-pink-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      {/* Dashboard Header */}
      <header className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl border-b border-white/50 dark:border-slate-600/60 sticky top-0 z-10 shadow-[0_4px_30px_rgba(0,0,0,0.05)] shadow-inner">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-white/30 dark:bg-slate-800/80 border border-white/50 dark:border-slate-500/70 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-pink-700 drop-shadow-sm" />
            </div>
            <span className="font-black text-xl tracking-tight text-black dark:text-white group-hover:text-pink-700 transition-colors drop-shadow-md">
              Mantra<span className="text-pink-600">Code</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-base font-black text-slate-950 dark:text-white drop-shadow-sm">{user.username}</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-yellow-400 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                {user.username.slice(0, 2)}
              </div>
            </div>
            <div className="w-px h-6 bg-pink-100"></div>
            <button
              onClick={logout}
              className="text-slate-700 dark:text-slate-300 hover:text-pink-700 dark:hover:text-pink-400 transition-colors p-2"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-8 py-10 max-w-6xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-950 dark:text-white mb-2 drop-shadow-md">Your Workspaces</h1>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-200 drop-shadow-sm">Manage and join your real-time collaborative coding sessions.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-pink-500/20 transition-all hover:shadow-pink-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            New Room
          </button>
        </div>

        {loadingRooms ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-pink-100 shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400 mb-4" />
            <p className="text-slate-500 font-medium">Loading your spaces...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-600/60 border-dashed text-center shadow-xl shadow-pink-500/5 shadow-inner">
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-pink-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-2 drop-shadow-md tracking-tight">No workspaces yet</h2>
            <p className="text-slate-800 dark:text-slate-200 max-w-sm mb-6 font-bold drop-shadow-sm">
              Create your first real-time collaborative room to start pair programming with your team.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-600/60 text-slate-900 dark:text-slate-100 font-bold px-6 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/70 hover:text-pink-600 transition-all shadow-md drop-shadow-sm"
            >
              Create your first room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => {
              const url = `${window.location.origin}/room/${room.roomId}`;
              return (
                <div key={room.roomId} className="bg-white/20 dark:bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-600/60 p-6 shadow-xl shadow-pink-500/5 hover:bg-white/30 dark:hover:bg-slate-900/40 hover:scale-[1.02] shadow-inner transition-all group flex flex-col justify-between h-56 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${room.visibility === 'private' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-green-50 text-green-600 border-green-200'
                        }`}>
                        {room.visibility === 'private' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {room.visibility}
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(room.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-black text-2xl text-slate-950 dark:text-white mb-1 line-clamp-1 tracking-tight drop-shadow-md">{room.name}</h3>
                    <p className="text-sm text-slate-800 dark:text-slate-300 font-mono font-bold flex items-center gap-1.5 drop-shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 drop-shadow-md"></span>
                      ID: {room.roomId}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2">
                    <button
                      onClick={() => {
                        localStorage.setItem("devspace-username", user!.username);
                        router.push(`/room/${room.roomId}`);
                      }}
                      className="flex-1 bg-white/40 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white/60 dark:hover:bg-slate-800/70 text-slate-900 dark:text-slate-100 hover:text-pink-600 border border-white/60 dark:border-slate-600/60 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all text-center flex justify-center items-center gap-2 shadow-md drop-shadow-sm"
                    >
                      <Users className="w-4 h-4 drop-shadow-sm" />
                      Join Space
                    </button>
                    <button
                      onClick={() => copyToClipboard(url, room.roomId)}
                      className="w-10 h-10 flex items-center justify-center bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-600/60 hover:bg-white/60 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200 hover:text-pink-600 rounded-xl transition-all shadow-md"
                      title="Copy invite link"
                    >
                      {copiedId === room.roomId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-[0_8px_30px_rgba(236,72,153,0.1)] dark:shadow-[0_8px_30px_rgba(168,85,247,0.1)] border border-white/60 dark:border-slate-700/50 shadow-inner">
            <h2 className="text-3xl font-black text-slate-950 dark:text-white mb-2 drop-shadow-md tracking-tight">New Workspace</h2>
            <p className="text-slate-800 dark:text-slate-200 font-bold text-sm mb-6 drop-shadow-sm">Create a sandbox room to collaborate in real-time.</p>

            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider ml-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Next.js Landing Page"
                  className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white placeholder:text-slate-500 shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider ml-1 drop-shadow-sm">Visibility</label>
                <select
                  value={newRoomVisibility}
                  onChange={(e) => setNewRoomVisibility(e.target.value)}
                  className="w-full px-4 py-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/50 dark:border-slate-600/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white/60 dark:focus:bg-slate-800/60 transition-all text-slate-800 dark:text-white shadow-inner"
                >
                  <option value="public">Public (Anyone with link can join)</option>
                  <option value="private">Private (Invite only)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/60 dark:border-slate-600/60 text-slate-900 dark:text-slate-100 font-bold rounded-xl hover:bg-white/60 dark:hover:bg-slate-800/70 transition-all shadow-md drop-shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 shadow-md shadow-pink-500/20 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Space"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
