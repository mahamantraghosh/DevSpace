"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquare } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface ChatPanelProps {
  roomId: string;
  username: string;
  messages: Message[];
  typingUsers?: Record<string, boolean>;
}

export default function ChatPanel({ roomId, username, messages, typingUsers = {} }: ChatPanelProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messagePayload = {
      sender: username,
      text: inputText.trim()
    };

    setInputText("");

    await fetch(`/api/room/${roomId}/action`, {
      method: "POST",
      body: JSON.stringify({
        type: "send-message",
        payload: messagePayload
      })
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["bg-blue-100 text-blue-600", "bg-purple-100 text-purple-600", "bg-emerald-100 text-emerald-600", "bg-pink-100 text-pink-600", "bg-yellow-100 text-yellow-600"];
    return colors[Math.abs(hash) % colors.length];
  };

  const getMessageBubbleColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ["bg-blue-50 border-blue-200", "bg-purple-50 border-purple-200", "bg-emerald-50 border-emerald-200", "bg-orange-50 border-orange-200", "bg-yellow-50 border-yellow-200"];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-4">
      <div className="flex-1 overflow-y-auto space-y-4 custom-scroll pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare size={18} className="mb-2" />
            <p className="text-xs font-medium">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAI = msg.sender === "Mantra AI";
            const isMe = msg.sender === username;
            
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${isAI ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 ring-2 ring-indigo-200' : getAvatarColor(msg.sender)}`}>
                  {isAI ? 'AI' : msg.sender.slice(0, 2).toUpperCase()}
                </div>
                <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex gap-2 items-center mb-1">
                    <span className={`text-[11px] font-bold ${isAI ? 'text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100' : 'text-slate-500'}`}>
                      {isMe ? "You" : msg.sender}
                    </span>
                  </div>
                  <div className={`px-3 py-2.5 text-[13px] rounded-xl border leading-relaxed break-words whitespace-pre-wrap ${
                    isMe 
                      ? "bg-pink-50 border-pink-200 text-slate-800" 
                      : isAI 
                        ? "bg-indigo-50 border-indigo-200 text-slate-800 shadow-sm" 
                        : `${getMessageBubbleColor(msg.sender)} text-slate-800`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicators */}
        {Object.entries(typingUsers).map(([user, isTyping]) => {
          if (!isTyping || user === username) return null;
          const isAI = user === "Mantra AI";
          return (
            <div key={`typing-${user}`} className="flex gap-3 flex-row animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${isAI ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : getAvatarColor(user)}`}>
                {isAI ? 'AI' : user.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex gap-2 items-center mb-1">
                  <span className={`text-[11px] font-bold ${isAI ? 'text-indigo-600' : 'text-slate-500'}`}>{user}</span>
                </div>
                <div className="px-3 py-3 text-xs rounded-xl border bg-slate-50 border-slate-200 flex items-center gap-1.5 h-9">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>
      <div className="px-3 pt-2 pb-1 border-t border-white/20">
        <button 
          onClick={() => setInputText((prev) => (prev ? prev + " @MantraAI " : "@MantraAI "))}
          className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full hover:bg-indigo-200 transition-colors border border-indigo-200"
        >
          ✨ Ask Mantra AI
        </button>
      </div>
      <form onSubmit={handleSendMessage} className="px-3 pb-3 pt-1 flex gap-2 bg-transparent">
        <input
          type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white/40 backdrop-blur-md border border-white/40 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all shadow-sm placeholder:text-slate-500"
        />
        <button type="submit" disabled={!inputText.trim()} className="p-2.5 bg-pink-500 text-white rounded-xl disabled:opacity-40 hover:bg-pink-600 transition cursor-pointer shadow-sm shadow-pink-500/20">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
