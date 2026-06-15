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
}

export default function ChatPanel({ roomId, username, messages }: ChatPanelProps) {
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
    const colors = ["bg-blue-600/30", "bg-purple-600/30", "bg-emerald-600/30", "bg-pink-600/30"];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <MessageSquare size={18} className="mb-2" />
            <p className="text-xs">No messages yet.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === username ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${getAvatarColor(msg.sender)}`}>
                {msg.sender.slice(0, 2).toUpperCase()}
              </div>
              <div className={`flex flex-col max-w-[75%] ${msg.sender === username ? "items-end" : "items-start"}`}>
                <div className="flex gap-2 items-center mb-1">
                  <span className="text-[11px] font-bold text-gray-400">{msg.sender === username ? "You" : msg.sender}</span>
                </div>
                <div className={`px-3 py-2 text-xs rounded-xl border ${msg.sender === username ? "bg-blue-600/10 border-blue-500/20" : "bg-gray-900 border-gray-850"}`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-900 flex gap-2">
        <input
          type="text" value={inputText} onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-900 border border-gray-850 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
        />
        <button type="submit" disabled={!inputText.trim()} className="p-2.5 bg-blue-600 text-white rounded-xl disabled:opacity-40">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
