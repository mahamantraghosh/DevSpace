"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import io, { Socket } from "socket.io-client";
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState<CodeState>({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"users" | "chat">("users");

  // Keep a reference to the latest code state to avoid stale closures in socket callbacks
  const codeRef = useRef(code);
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Load username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem("devspace-username");
    if (savedUsername) {
      setUsername(savedUsername);
      setShowPrompt(false);
    }
  }, []);

  // Connect to Socket.io when username is resolved and room ID exists
  useEffect(() => {
    if (showPrompt || !username || !roomId) return;

    // Connect to backend server running on port 5001
    const socketInstance = io("http://localhost:5001");
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setConnected(true);
      socketInstance.emit("join-room", { roomId, username });
    });

    // Initialize Room Data
    socketInstance.on("room-init", (data: { code: CodeState; messages: Message[]; users: User[] }) => {
      setCode(data.code);
      setMessages(data.messages);
      setUsers(data.users);
    });

    // Handle New User Joining
    socketInstance.on("user-joined", (data: { users: User[]; joinedUser: User }) => {
      setUsers(data.users);
      // Trigger a small confetti burst when someone new joins!
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 }
      });
    });

    // Handle User Leaving
    socketInstance.on("user-left", (data: { users: User[]; leftUser: User }) => {
      setUsers(data.users);
    });

    // Handle Real-Time Code Sync
    socketInstance.on("editor-update", (data: { codeType: "html" | "css" | "js"; value: string; senderSocketId: string }) => {
      setCode((prev) => ({
        ...prev,
        [data.codeType]: data.value,
      }));
    });

    // Handle Chat Messages
    socketInstance.on("receive-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [showPrompt, username, roomId]);

  // Save username from modal prompt
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
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    });
  };

  const handleExitRoom = () => {
    if (confirm("Are you sure you want to exit the playground?")) {
      router.push("/");
    }
  };

  // Sync Editor Value Locally and Emit to Room
  const handleCodeChange = (newVal: string) => {
    setCode((prev) => ({
      ...prev,
      [activeTab]: newVal
    }));
    
    if (socket) {
      socket.emit("editor-change", {
        roomId,
        codeType: activeTab,
        value: newVal
      });
    }
  };

  // Render Prompt Modal if username is missing
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
            <p className="text-sm text-gray-400 text-center mt-1">
              To join room <span className="text-blue-400 font-mono">{roomId}</span>, please enter a username.
            </p>
          </div>

          <form onSubmit={handlePromptSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-455 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. CodeExplorer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-655 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
            >
              Enter Room
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Connecting State
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-gray-300">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
        <p className="text-lg font-medium">Entering Room {roomId}...</p>
        <p className="text-sm text-gray-500 mt-1">Establishing real-time connection</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans">
      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-900 bg-gray-950 relative z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tighter text-xl bg-gradient-to-r from-blue-450 to-indigo-400 bg-clip-text text-transparent">
            DevSpace
          </div>
          <span className="h-4 w-px bg-gray-800" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Room:</span>
            <code className="text-sm font-mono text-gray-300 bg-gray-900 px-2 py-0.5 rounded border border-gray-850">
              {roomId}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-gray-800 bg-gray-900/50 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-500" /> Copied Room Link!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Room Link
              </>
            )}
          </button>

          <button
            onClick={handleExitRoom}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 hover:border-red-800/40 rounded-lg transition cursor-pointer"
          >
            <LogOut size={14} /> Exit Room
          </button>
        </div>
      </header>

      {/* Main room layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Toggle Sidebar buttons for smaller displays / custom sidebar selection */}
        <aside className="w-80 border-r border-gray-900 bg-gray-950 flex flex-col shrink-0">
          <div className="flex border-b border-gray-900 p-2 gap-1 bg-gray-950/50">
            <button
              onClick={() => setActiveTabSidebar("users")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTabSidebar === "users"
                  ? "bg-gray-900 text-white border border-gray-850"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <Users size={14} /> Active Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTabSidebar("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                activeTabSidebar === "chat"
                  ? "bg-gray-900 text-white border border-gray-850"
                  : "text-gray-400 hover:text-white hover:bg-gray-900/40"
              }`}
            >
              <MessageSquare size={14} /> Room Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeTabSidebar === "users" ? (
              <RoomSidebar users={users} currentUserSocketId={socket?.id || ""} />
            ) : (
              <ChatPanel
                socket={socket}
                roomId={roomId}
                username={username}
                messages={messages}
              />
            )}
          </div>
        </aside>

        {/* Editor & Preview Split Panel */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-950">
          {/* Left Split Pane: Editor */}
          <div className="flex-1 flex flex-col h-1/2 lg:h-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-900">
            <PlaygroundEditor
              code={code[activeTab]}
              codeType={activeTab}
              onChange={handleCodeChange}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          </div>

          {/* Right Split Pane: Preview */}
          <div className="flex-1 flex flex-col h-1/2 lg:h-full lg:w-1/2 bg-slate-950">
            <LivePreview html={code.html} css={code.css} js={code.js} />
          </div>
        </main>

      </div>
    </div>
  );
}
