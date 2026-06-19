"use client";

import { useState } from "react";
import { Users, ShieldCheck, Copy, Check, Info } from "lucide-react";
import confetti from "canvas-confetti";

interface User {
  socketId: string;
  username: string;
}

interface RoomSidebarProps {
  users: User[];
  currentUserSocketId: string;
  typingUsers: Record<string, boolean>;
  roomId: string;
  isConnected?: boolean;
}

export default function RoomSidebar({ users, currentUserSocketId, typingUsers, roomId, isConnected = true }: RoomSidebarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    });
  };

  // Generate an avatar color based on username
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "bg-blue-100 text-blue-600 border-blue-200",
      "bg-purple-100 text-purple-600 border-purple-200",
      "bg-emerald-100 text-emerald-600 border-emerald-200",
      "bg-pink-100 text-pink-600 border-pink-200",
      "bg-amber-100 text-amber-600 border-amber-200",
      "bg-indigo-100 text-indigo-600 border-indigo-200",
      "bg-cyan-100 text-cyan-600 border-cyan-200"
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-4">
      {/* Room Info Section */}
      <div className="mb-6 bg-pink-50/50 border border-pink-100 rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 select-none">
          <Info size={12} className="text-pink-400" /> Room Details
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[10px] text-slate-500 block mb-1">Room ID</span>
            <code className="text-xs font-mono text-pink-600 bg-white px-2 py-1 rounded border border-pink-200 w-full block truncate">
              {roomId}
            </code>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition cursor-pointer active:scale-[0.97] shadow-sm shadow-pink-500/20"
          >
            {copied ? (
              <>
                <Check size={14} /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Room Link
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-4 border-b border-pink-100 pb-2 select-none">
        <Users size={14} className="text-pink-500" /> Active Members
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto custom-scroll pr-1">
        {users.length === 0 ? (
          <div className="text-center text-xs text-slate-400 font-medium py-4">No active users.</div>
        ) : (
          users.map((user) => {
            const isMe = user.socketId === currentUserSocketId;
            const isTyping = typingUsers[user.username];

            return (
              <div
                key={user.socketId}
                className={`flex items-center gap-3 p-2 rounded-xl border transition ${isMe
                    ? "bg-pink-50 border-pink-200"
                    : "bg-slate-50 border-slate-100 hover:bg-pink-50/50 hover:border-pink-100"
                  }`}
              >
                {/* User Avatar with Green Active Dot indicator */}
                <div className="relative shrink-0 select-none">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shadow-sm ${getAvatarColor(
                      user.username
                    )}`}
                  >
                    {getInitials(user.username)}
                  </div>
                  <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>

                {/* User details */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 truncate pr-2">
                      {user.username}
                    </span>
                    {isTyping && (
                      <span className="text-[10px] text-pink-500 animate-pulse font-medium">
                        is typing...
                      </span>
                    )}
                  </div>

                  {isMe && (
                    <span className="flex items-center gap-1 text-[9px] bg-pink-100 border border-pink-200 text-pink-600 font-bold px-2 py-0.5 rounded-full select-none shrink-0 shadow-sm">
                      <ShieldCheck size={10} /> You
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 border-t border-pink-100 pt-3 text-[10px] text-slate-500 flex items-center justify-between select-none shrink-0">
        <span className="font-medium">Websocket state:</span>
        <span className={`flex items-center gap-1 font-bold ${isConnected ? "text-emerald-500" : "text-yellow-600"}`}>
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-sm ${isConnected ? "bg-emerald-500 shadow-emerald-500/50" : "bg-yellow-500 shadow-yellow-500/50"}`} /> {isConnected ? "connected" : "reconnecting..."}
        </span>
      </div>
    </div>
  );
}
