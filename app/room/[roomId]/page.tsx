"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Pusher from "pusher-js";
import { Code, Users, MessageSquare, LogOut, Loader2, Sparkles, Copy, Check } from "lucide-react";
import PlaygroundEditor from "@/components/PlaygroundEditor";
import LivePreview from "@/components/LivePreview";
import ChatPanel from "@/components/ChatPanel";
import RoomSidebar from "@/components/RoomSidebar";
import confetti from "canvas-confetti";

interface User {
  socketId: string;
  username: string;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
}

interface CodeState {
  html: string;
  css: string;
  js: string;
}

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomId = resolvedParams.roomId;

  const [username, setUsername] = useState<string>("");
  const [showPrompt, setShowPrompt] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [pusherConnected, setPusherConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState<CodeState>({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"users" | "chat">("users");

  const [currentUserSocketId, setCurrentUserSocketId] = useState<string>("");

  // Load username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("devspace-username");
    if (savedUsername) {
      setUsername(savedUsername);
      setShowPrompt(false);
    }
  }, []);

  // Initialize Pusher and Fetch Room Data
  useEffect(() => {
    if (showPrompt || !username || !roomId) return;

    const fetchInitialData = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/init`);
        const data = await res.json();
        setCode(data.code);
        setMessages(data.messages);
        setConnected(true);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchInitialData();

    // Setup Pusher with Presence Channel
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
      auth: {
        params: { username },
      },
    });

    pusher.connection.bind("connected", () => {
      setCurrentUserSocketId(pusher.connection.socket_id);
      setPusherConnected(true);
    });

    pusher.connection.bind("disconnected", () => {
      setPusherConnected(false);
    });

    const channel = pusher.subscribe(`presence-${roomId}`);

    channel.bind("pusher:subscription_succeeded", () => {
      const members: User[] = [];
      channel.members.each((member: any) => {
        members.push({ socketId: member.id, username: member.info.username });
      });
      setUsers(members);
    });

    channel.bind("pusher:member_added", (member: any) => {
      setUsers((prev) => [...prev, { socketId: member.id, username: member.info.username }]);
    });

    channel.bind("pusher:member_removed", (member: any) => {
      setUsers((prev) => prev.filter((u) => u.socketId !== member.id));
    });

    channel.bind("editor-update", (data: { codeType: "html" | "css" | "js"; value: string }) => {
      setCode((prev) => ({
        ...prev,
        [data.codeType]: data.value,
      }));
    });

    channel.bind("typing-update", (data: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.username]: data.isTyping
      }));
    });

    channel.bind("receive-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      pusher.unsubscribe(`presence-${roomId}`);
      pusher.disconnect();
    };
  }, [showPrompt, username, roomId]);

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem("devspace-username", username.trim());
      setShowPrompt(false);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      confetti({ particleCount: 50, spread: 60 });
    });
  };

  const handleCodeChange = async (newVal: string) => {
    setCode((prev) => ({ ...prev, [activeTab]: newVal }));
    
    // Broadcast via API
    await fetch(`/api/room/${roomId}/action`, {
      method: "POST",
      body: JSON.stringify({
        type: "editor-change",
        payload: { codeType: activeTab, value: newVal }
      })
    });
  };

  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950 p-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-purple-900/10 pointer-events-none" />
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 border border-blue-500/20">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Set Your Display Name</h3>
            <p className="text-sm text-gray-400 text-center mt-1">To join room <span className="text-blue-400 font-mono">{roomId}</span></p>
          </div>
          <form onSubmit={handlePromptSubmit} className="space-y-4">
            <input
              type="text" required autoFocus placeholder="e.g. CodeExplorer"
              value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500">
              Enter Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-300">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-lg font-medium">Entering Room {roomId}...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-900 bg-gray-950 shrink-0">
        <div className="flex items-center gap-3">
          <div className="font-bold text-xl bg-gradient-to-r from-blue-450 to-indigo-400 bg-clip-text text-transparent">DevSpace</div>
          <span className="h-4 w-px bg-gray-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Room:</span>
            <code className="text-sm font-mono text-gray-300 bg-gray-900 px-2 py-0.5 rounded border border-gray-850">{roomId}</code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCopyLink} className="px-3 py-1.5 text-xs font-semibold border border-gray-800 bg-gray-900/50 rounded-lg text-gray-300 hover:text-white transition cursor-pointer">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Link"}
          </button>
          <button onClick={() => router.push("/")} className="px-3 py-1.5 text-xs font-semibold bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg transition cursor-pointer">
            <LogOut size={14} /> Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className="w-80 border-r border-gray-900 bg-gray-950 flex flex-col shrink-0">
          <div className="flex border-b border-gray-900 p-2 gap-1">
            <button onClick={() => setActiveTabSidebar("users")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activeTabSidebar === "users" ? "bg-gray-900 text-white" : "text-gray-400"}`}>
              <Users size={14} className="inline mr-1" /> Users
            </button>
            <button onClick={() => setActiveTabSidebar("chat")} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activeTabSidebar === "chat" ? "bg-gray-900 text-white" : "text-gray-400"}`}>
              <MessageSquare size={14} className="inline mr-1" /> Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTabSidebar === "users" ? (
              <RoomSidebar users={users} currentUserSocketId={currentUserSocketId} typingUsers={typingUsers} roomId={roomId} isConnected={pusherConnected} />
            ) : (
              <ChatPanel roomId={roomId} username={username} messages={messages} />
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-950">
          <div className="flex-1 flex flex-col border-r border-gray-900">
            <PlaygroundEditor
              code={code[activeTab]} codeType={activeTab}
              onChange={handleCodeChange} activeTab={activeTab} setActiveTab={setActiveTab}
              roomId={roomId} username={username}
            />
          </div>
          <div className="flex-1 flex flex-col bg-slate-950">
            <LivePreview html={code.html} css={code.css} js={code.js} />
          </div>
        </main>
      </div>
    </div>
  );
}
