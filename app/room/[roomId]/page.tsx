"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Pusher, { PresenceChannel } from "pusher-js";
import { Users, MessageSquare, LogOut, Loader2, Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import PlaygroundEditor from "@/components/PlaygroundEditor";
import LivePreview from "@/components/LivePreview";
import ChatPanel from "@/components/ChatPanel";
import RoomSidebar from "@/components/RoomSidebar";
import InteractiveWorkspaceBg from "@/components/InteractiveWorkspaceBg";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";

interface User {
  socketId: string;
  username: string;
}

interface PusherMember {
  id: string;
  info: {
    username: string;
  };
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

  const { user, loading: authLoading } = useAuth();
  const username = user?.username || "";

  const [connected, setConnected] = useState<boolean>(false);
  const [pusherConnected, setPusherConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [code, setCode] = useState<CodeState>({ html: "", css: "", js: "" });
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"users" | "chat">("users");
  const [error, setError] = useState<string | null>(null);

  const [currentUserSocketId, setCurrentUserSocketId] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Initialize Pusher and Fetch Room Data
  useEffect(() => {
    if (authLoading || !username || !roomId) return;

    let pusher: Pusher | null = null;

    const fetchInitialData = async () => {
      try {
        const res = await fetch(`/api/room/${roomId}/init`);
        if (!res.ok) {
          throw new Error(`Failed to fetch room data: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        setCode(data.code);
        setMessages(data.messages);
        setConnected(true);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to initialize room data.");
      }
    };

    fetchInitialData();

    // Setup Pusher with Presence Channel
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!pusherKey || !pusherCluster) {
        throw new Error("Pusher configuration missing. Check environment variables.");
      }

      pusher = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: "/api/pusher/auth",
        auth: {
          params: { username },
        },
      });

      pusher.connection.bind("connected", () => {
        setCurrentUserSocketId(pusher!.connection.socket_id);
        setPusherConnected(true);
      });

      pusher.connection.bind("disconnected", () => {
        setPusherConnected(false);
      });

      pusher.connection.bind("error", (err: any) => {
        console.error("Pusher connection error:", err);
        // Don't set global error yet, maybe it reconnects
      });

      const channel = pusher.subscribe(`presence-${roomId}`) as PresenceChannel;

      channel.bind("pusher:subscription_succeeded", () => {
        const members: User[] = [];
        channel.members.each((member: PusherMember) => {
          members.push({ socketId: member.id, username: member.info.username });
        });
        setUsers(members);
      });

      channel.bind("pusher:member_added", (member: PusherMember) => {
        setUsers((prev) => [...prev, { socketId: member.id, username: member.info.username }]);
      });

      channel.bind("pusher:member_removed", (member: PusherMember) => {
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

    } catch (err: any) {
      console.error("Pusher Init Error:", err);
      setError(err.message || "Failed to initialize real-time connection.");
    }

    return () => {
      if (pusher) {
        pusher.unsubscribe(`presence-${roomId}`);
        pusher.disconnect();
      }
    };
  }, [authLoading, username, roomId]);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      confetti({ particleCount: 50, spread: 60 });
    });
  };

  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCodeChange = (newVal: string) => {
    setCode((prev) => ({ ...prev, [activeTab]: newVal }));
    
    if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    
    broadcastTimeoutRef.current = setTimeout(async () => {
      // Broadcast via API
      try {
        await fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          body: JSON.stringify({
            type: "editor-change",
            socket_id: currentUserSocketId, // IMPORTANT: Prevents cursor bounce
            payload: { codeType: activeTab, value: newVal }
          })
        });
      } catch (err) {
        console.error("Action error:", err);
      }
    }, 500);
  };

  if (authLoading || (!connected && !error)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-transparent text-pink-500">
        <InteractiveWorkspaceBg />
        <Loader2 className="animate-spin mb-4 relative z-10" size={40} />
        <p className="text-lg font-bold text-slate-800 relative z-10">Entering Workspace {roomId}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-white/90 border border-red-200 rounded-2xl p-6 shadow-2xl relative">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-3 border border-red-100">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center">Initialization Failed</h3>
            <p className="text-sm text-slate-600 text-center mt-4 bg-red-50 p-3 rounded-lg border border-red-100 font-mono">
              {error}
            </p>
            <p className="text-xs text-slate-500 text-center mt-4">
              Please check your connection or try refreshing.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-transparent text-foreground overflow-hidden font-sans relative z-10">
      <InteractiveWorkspaceBg />
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/20 bg-white/40 backdrop-blur-xl shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center shadow-sm shadow-pink-500/10">
            <Sparkles className="w-4 h-4 text-pink-500" />
          </div>
          <div className="font-bold text-xl text-slate-800">MantraCode</div>
          <span className="h-5 w-px bg-pink-200" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Workspace:</span>
            <code className="text-sm font-mono text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100">{roomId}</code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleCopyLink} className="px-3 py-1.5 text-xs font-bold border border-pink-200 bg-pink-50 rounded-lg text-pink-600 hover:bg-pink-100 transition cursor-pointer flex items-center gap-1.5 shadow-sm">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Link"}
          </button>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 text-slate-500 hover:text-pink-600 hover:border-pink-200 rounded-lg transition cursor-pointer flex items-center gap-1.5">
            <LogOut size={14} /> Exit
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative bg-transparent">
        <aside className="w-80 border-r border-white/20 bg-white/40 backdrop-blur-md flex flex-col shrink-0 relative z-20">
          <div className="flex border-b border-white/20 p-2 gap-1 bg-white/20">
            <button onClick={() => setActiveTabSidebar("users")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${activeTabSidebar === "users" ? "bg-white/60 text-pink-600 shadow-sm" : "text-slate-500 hover:bg-white/40 hover:text-pink-600"}`}>
              <Users size={14} className="inline mr-1" /> Users
            </button>
            <button onClick={() => setActiveTabSidebar("chat")} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${activeTabSidebar === "chat" ? "bg-white/60 text-pink-600 shadow-sm" : "text-slate-500 hover:bg-white/40 hover:text-pink-600"}`}>
              <MessageSquare size={14} className="inline mr-1" /> Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-transparent">
            {activeTabSidebar === "users" ? (
              <RoomSidebar users={users} currentUserSocketId={currentUserSocketId} typingUsers={typingUsers} roomId={roomId} isConnected={pusherConnected} />
            ) : (
              <ChatPanel roomId={roomId} username={username} messages={messages} />
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-transparent relative z-20">
          <div className="flex-1 flex flex-col border-r border-white/20 bg-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.02)] z-10">
            <PlaygroundEditor
              code={code[activeTab]} codeType={activeTab}
              onChange={handleCodeChange} activeTab={activeTab} setActiveTab={setActiveTab}
              roomId={roomId} username={username}
            />
          </div>
          <div className="flex-1 flex flex-col bg-white/10 backdrop-blur-sm">
            <LivePreview html={code.html} css={code.css} js={code.js} />
          </div>
        </main>
      </div>
    </div>
  );
}

