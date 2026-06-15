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
      "bg-blue-600/30 text-blue-300 border-blue-500/20",
      "bg-purple-600/30 text-purple-300 border-purple-500/20",
      "bg-emerald-600/30 text-emerald-300 border-emerald-500/20",
      "bg-pink-600/30 text-pink-300 border-pink-500/20",
      "bg-amber-600/30 text-amber-300 border-amber-500/20",
      "bg-indigo-600/30 text-indigo-300 border-indigo-500/20",
      "bg-cyan-600/30 text-cyan-300 border-cyan-500/20"
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 p-4">
      {/* Room Info Section */}
      <div className="mb-6 bg-gray-900/40 border border-gray-850 rounded-xl p-3">
        <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-2 select-none">
          <Info size={12} className="text-blue-400" /> Room Details
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <span className="text-[10px] text-gray-500 block mb-1">Room ID</span>
            <code className="text-xs font-mono text-blue-400 bg-blue-950/20 px-2 py-1 rounded border border-blue-500/20 w-full block truncate">
              {roomId}
            </code>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition cursor-pointer active:scale-[0.97]"
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

      <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-gray-900 pb-2 select-none">
        <Users size={14} className="text-blue-500" /> Active Members
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {users.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-4">No active users.</div>
        ) : (
          users.map((user) => {
            const isMe = user.socketId === currentUserSocketId;
            const isTyping = typingUsers[user.username];

            return (
              <div
                key={user.socketId}
                className={`flex items-center gap-3 p-2 rounded-xl border transition ${
                  isMe 
                    ? "bg-blue-950/15 border-blue-500/20 text-white" 
                    : "bg-gray-900/40 border-gray-850 text-gray-300 hover:bg-gray-900/60"
                }`}
              >
                {/* User Avatar with Green Active Dot indicator */}
                <div className="relative shrink-0 select-none">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${getAvatarColor(
                      user.username
                    )}`}
                  >
                    {getInitials(user.username)}
                  </div>
                  <span className={`absolute bottom-0 right-0 block h-2 w-2 rounded-full ring-2 ring-gray-950 ${isConnected ? "bg-green-500" : "bg-gray-500"}`} />
                </div>

                {/* User details */}
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold truncate pr-2">
                      {user.username}
                    </span>
                    {isTyping && (
                      <span className="text-[10px] text-blue-400 animate-pulse font-medium">
                        is typing...
                      </span>
                    )}
                  </div>
                  
                  {isMe && (
                    <span className="flex items-center gap-1 text-[9px] bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full select-none shrink-0">
                      <ShieldCheck size={10} /> You
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 border-t border-gray-900 pt-3 text-[10px] text-gray-650 flex items-center justify-between select-none shrink-0">
        <span>Websocket state:</span>
        <span className={`flex items-center gap-1 font-semibold ${isConnected ? "text-green-500" : "text-amber-500"}`}>
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isConnected ? "bg-green-500" : "bg-amber-500"}`} /> {isConnected ? "connected" : "reconnecting..."}
        </span>
      </div>
    </div>
  );
}
