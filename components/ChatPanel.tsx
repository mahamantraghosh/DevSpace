"use client";

import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { Send, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
  username: string;
  messages: Message[];
}

export default function ChatPanel({ socket, roomId, username, messages }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    socket.emit("send-message", {
      roomId,
      sender: username,
      text: inputText.trim()
    });

    setInputText("");
  };

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Generate an avatar color based on user's name to make it visually pleasing
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
    <div className="flex flex-col h-full bg-gray-950">
      {/* Messages Log area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 select-text">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 text-center px-4">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-2 text-gray-500 border border-gray-850">
              <MessageSquare size={18} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1">Room Chat</p>
            <p className="text-xs text-gray-500">No messages yet. Send a greeting to other developers in the room!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === username;
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border ${getAvatarColor(
                    msg.sender
                  )} shrink-0 select-none`}
                >
                  {getInitials(msg.sender)}
                </div>

                {/* Message Content bubble */}
                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex gap-2 items-center mb-1">
                    <span className="text-[11px] font-bold text-gray-400">
                      {isMe ? "You" : msg.sender}
                    </span>
                    <span className="text-[9px] text-gray-600">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  
                  <div
                    className={`px-3 py-2 text-xs rounded-xl border leading-relaxed break-words whitespace-pre-wrap ${
                      isMe
                        ? "bg-blue-600/10 border-blue-500/20 text-blue-100 rounded-tr-none"
                        : "bg-gray-900 border-gray-850 text-gray-300 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-gray-900 bg-gray-950 flex gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-600 hover:bg-blue-500 text-white rounded-xl active:scale-[0.96] transition cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
