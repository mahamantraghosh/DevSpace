"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Pusher, { PresenceChannel } from "pusher-js";
import { Users, MessageSquare, LogOut, Loader2, Sparkles, Copy, Check, AlertCircle, Lock, GitBranch, Terminal } from "lucide-react";
import PlaygroundEditor from "@/components/PlaygroundEditor";
import LivePreview from "@/components/LivePreview";
import ChatPanel from "@/components/ChatPanel";
import RoomSidebar from "@/components/RoomSidebar";
import FileExplorer from "@/components/FileExplorer";
import GitHubPanel from "@/components/GitHubPanel";
import IDETerminal from "@/components/IDETerminal";
import InteractiveWorkspaceBg from "@/components/InteractiveWorkspaceBg";
import NavbarThemeToggle from "@/components/NavbarThemeToggle";
import SiteLogo from "@/components/SiteLogo";
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

import { useParams } from "next/navigation";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.roomId as string;

  const { user, loading: authLoading } = useAuth();
  const username = user?.username || "";

  const [connected, setConnected] = useState<boolean>(false);
  const [pusherConnected, setPusherConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({
    "/index.html": '<!-- Welcome to MantraCode -->\n<div class="hello">Hello World</div>',
    "/styles.css": '.hello {\n  color: #ec4899;\n  font-weight: bold;\n}',
    "/script.js": 'console.log("MantraCode is running!");'
  });
  const [activeFile, setActiveFile] = useState<string>("/index.html");
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"files" | "users" | "chat" | "github">("files");
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [roomPassword, setRoomPassword] = useState("");
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const [currentUserSocketId, setCurrentUserSocketId] = useState<string>("");

  const [leftWidth, setLeftWidth] = useState(320);
  const [rightWidth, setRightWidth] = useState(400);
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);

  const [isDragging, setIsDragging] = useState(false);
  const [mobileTab, setMobileTab] = useState<"sidebar" | "editor" | "preview">("editor");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Set initially
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft.current) {
        setLeftWidth(Math.max(200, Math.min(e.clientX, window.innerWidth / 2.5)));
      } else if (isDraggingRight.current) {
        setRightWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, window.innerWidth / 1.5)));
      }
    };
    const handleMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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
        setVerifyingPassword(true);
        const res = await fetch(`/api/room/${roomId}/init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: roomPassword })
        });
        
        if (res.status === 401) {
          const data = await res.json();
          if (data.requiresPassword) {
            setPasswordRequired(true);
            setVerifyingPassword(false);
            return false; // Stop pusher init
          }
        }
        
        if (!res.ok) {
          throw new Error(`Failed to fetch room data: ${res.statusText}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        let initialFiles = data.code;
        if (initialFiles && initialFiles.html !== undefined && !initialFiles['/index.html']) {
          initialFiles = {
            "/index.html": initialFiles.html || "",
            "/styles.css": initialFiles.css || "",
            "/script.js": initialFiles.js || ""
          };
        }
        setFiles(initialFiles || { "/index.html": "" });
        setMessages(data.messages || []);
        setConnected(true);
        setPasswordRequired(false);
        setVerifyingPassword(false);
        return true; // Continue to pusher init
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to initialize room data.");
        setVerifyingPassword(false);
        return false;
      }
    };

    fetchInitialData().then((shouldContinue) => {
      if (!shouldContinue) return;

      // Setup Pusher with Presence Channel
    try {
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!pusherKey || !pusherCluster) {
        throw new Error("Pusher configuration missing. Check environment variables.");
      }

      console.log("PUSHER ENV:", pusherKey, pusherCluster);
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
        const membersMap = new Map<string, User>();
        channel.members.each((member: PusherMember) => {
          membersMap.set(member.id, { socketId: member.id, username: member.info.username });
        });
        setUsers(Array.from(membersMap.values()));
      });

      channel.bind("pusher:member_added", (member: PusherMember) => {
        setUsers((prev) => {
          if (prev.some(u => u.socketId === member.id)) return prev;
          return [...prev, { socketId: member.id, username: member.info.username }];
        });
      });

      channel.bind("pusher:member_removed", (member: PusherMember) => {
        setUsers((prev) => prev.filter((u) => u.socketId !== member.id));
      });

      channel.bind("editor-update", (data: { filename: string; value: string }) => {
        setFiles((prev) => ({
          ...prev,
          [data.filename]: data.value,
        }));
        if (data.filename === activeFile) {
          setIsSaved(false);
          // Auto-save indication after a short delay is handled by the typist if needed, 
          // or we just rely on manual save for visual feedback.
        }
      });

      channel.bind("file-create", (data: { filename: string; value: string }) => {
        setFiles((prev) => ({ ...prev, [data.filename]: data.value }));
      });

      channel.bind("file-delete", (data: { filename: string }) => {
        setFiles((prev) => {
          const newFiles = { ...prev };
          delete newFiles[data.filename];
          return newFiles;
        });
      });

      channel.bind("file-rename", (data: { oldPath: string, newPath: string, isFolder: boolean }) => {
        setFiles((prev) => {
          const newFiles = { ...prev };
          if (data.isFolder) {
            Object.keys(newFiles).forEach(key => {
              if (key.startsWith(data.oldPath + "/")) {
                const newKey = data.newPath + key.slice(data.oldPath.length);
                newFiles[newKey] = newFiles[key];
                delete newFiles[key];
              }
            });
          } else {
            if (newFiles[data.oldPath] !== undefined) {
              newFiles[data.newPath] = newFiles[data.oldPath];
              delete newFiles[data.oldPath];
            }
          }
          return newFiles;
        });
      });

      channel.bind("files-import", (data: { files: Record<string, string> }) => {
        setFiles((prev) => ({ ...prev, ...data.files }));
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
    });

    return () => {
      if (pusher) {
        pusher.unsubscribe(`presence-${roomId}`);
        pusher.disconnect();
      }
    };
  }, [authLoading, username, roomId, roomPassword]);

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      confetti({ particleCount: 50, spread: 60 });
    });
  };

  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const handleCodeChange = (newVal: string) => {
    setFiles((prev) => ({ ...prev, [activeFile]: newVal }));
    
    // Broadcast typing status
    if (!isTypingRef.current && currentUserSocketId) {
      isTypingRef.current = true;
      fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "typing-status",
          socket_id: currentUserSocketId,
          payload: { username, isTyping: true }
        })
      }).catch(console.error);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (currentUserSocketId) {
        fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          body: JSON.stringify({
            type: "typing-status",
            socket_id: currentUserSocketId,
            payload: { username, isTyping: false }
          })
        }).catch(console.error);
      }
    }, 1500);

    if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
    
    broadcastTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          body: JSON.stringify({
            type: "editor-change",
            socket_id: currentUserSocketId,
            payload: { filename: activeFile, value: newVal }
          })
        });
      } catch (err) {
        console.error("Action error:", err);
      }
    }, 500);
  };

  const handleFileCreate = async (filename: string) => {
    if (files[filename] !== undefined) return;
    setFiles((prev) => ({ ...prev, [filename]: "" }));
    setActiveFile(filename);
    try {
      await fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "file-create",
          socket_id: currentUserSocketId,
          payload: { filename, value: "" }
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilesImport = async (importedFiles: Record<string, string>) => {
    setFiles((prev) => ({ ...prev, ...importedFiles }));
    
    // Set the first imported file as active if there are any
    const newKeys = Object.keys(importedFiles);
    if (newKeys.length > 0) {
      setActiveFile(newKeys[0]);
    }

    try {
      await fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "files-import",
          socket_id: currentUserSocketId,
          payload: { files: importedFiles }
        })
      });
    } catch (err) {
      console.error("Failed to import files:", err);
    }
  };

  const handleFileRename = async (oldPath: string, newPath: string) => {
    const isFolder = Object.keys(files).some(f => f.startsWith(oldPath + "/"));
    
    setFiles((prev) => {
      const newFiles = { ...prev };
      if (isFolder) {
        Object.keys(newFiles).forEach(key => {
          if (key.startsWith(oldPath + "/")) {
            const newKey = newPath + key.slice(oldPath.length);
            newFiles[newKey] = newFiles[key];
            delete newFiles[key];
          }
        });
      } else {
        if (newFiles[oldPath] !== undefined) {
          newFiles[newPath] = newFiles[oldPath];
          delete newFiles[oldPath];
        }
      }
      return newFiles;
    });

    if (activeFile === oldPath) setActiveFile(newPath);
    else if (activeFile.startsWith(oldPath + "/")) {
      setActiveFile(newPath + activeFile.slice(oldPath.length));
    }

    try {
      await fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "file-rename",
          socket_id: currentUserSocketId,
          payload: { oldPath, newPath, isFolder }
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileDelete = async (filename: string) => {
    setFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[filename];
      return newFiles;
    });
    if (activeFile === filename) {
      const remainingFiles = Object.keys(files).filter(f => f !== filename);
      if (remainingFiles.length > 0) setActiveFile(remainingFiles[0]);
    }
    try {
      await fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "file-delete",
          socket_id: currentUserSocketId,
          payload: { filename }
        })
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        setIsSaved(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (passwordRequired) {
    return (
      <div className="flex flex-col h-screen bg-transparent text-foreground overflow-hidden font-sans relative z-10">
        <InteractiveWorkspaceBg />
        <div className="flex-1 flex items-center justify-center relative z-20 p-4">
          <div className="w-full max-w-md bg-white/60 backdrop-blur-xl border border-pink-200/60 rounded-3xl p-8 shadow-[0_8px_30px_rgba(236,72,153,0.15)] shadow-inner">
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mb-4 border border-pink-200 shadow-sm">
                <Lock size={28} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 text-center tracking-tight drop-shadow-sm">Private Workspace</h3>
              <p className="text-sm font-bold text-slate-600 text-center mt-2">
                This workspace is protected. Please enter the password to join.
              </p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); }} className="space-y-4">
              <input
                type="password"
                required
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white text-slate-800 placeholder:text-slate-500 shadow-inner"
              />
              <button 
                type="submit"
                disabled={verifyingPassword || !roomPassword}
                className="w-full py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition shadow-md shadow-pink-500/20 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {verifyingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unlock Workspace"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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
      <header className="flex items-center justify-between px-6 py-3 border-b border-pink-400/80 dark:border-slate-600/90 bg-pink-300/80 dark:bg-slate-900/90 backdrop-blur-2xl shadow-lg shadow-pink-200/50 dark:shadow-slate-900/80 shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <SiteLogo />
          <span className="h-5 w-px bg-pink-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Workspace:</span>
            <code className="text-sm font-mono text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-pink-100 dark:border-slate-700">{roomId}</code>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NavbarThemeToggle />
          <button onClick={handleCopyLink} className="px-3 py-1.5 text-xs font-bold border border-pink-200 dark:border-slate-600 bg-pink-50 dark:bg-slate-800 rounded-lg text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-sm">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} {copied ? "Copied!" : "Copy Link"}
          </button>
          <button onClick={() => router.push("/dashboard")} className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-pink-600 dark:hover:text-pink-400 hover:border-pink-200 dark:hover:border-slate-500 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-sm">
            <LogOut size={14} /> Exit
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Primary Left Sidebar */}
        <div style={{ width: isMobile ? '100%' : leftWidth }} className={`shrink-0 flex-col bg-white/60 backdrop-blur-lg z-10 relative ${mobileTab === 'sidebar' ? 'flex w-full' : 'hidden md:flex'}`}>
          <div className="flex border-b border-pink-300/80 p-2 gap-1 bg-white/40 shadow-sm">
            <button 
              onClick={() => setActiveTabSidebar("files")}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTabSidebar === "files" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-slate-500 hover:bg-white/80 hover:text-pink-600"}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
              Files
            </button>
            <button 
              onClick={() => setActiveTabSidebar("users")}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTabSidebar === "users" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-slate-500 hover:bg-white/80 hover:text-pink-600"}`}
            >
              <Users size={14} strokeWidth={2.5} />
              Users
            </button>
            <button 
              onClick={() => setActiveTabSidebar("chat")}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTabSidebar === "chat" ? "bg-pink-500 text-white shadow-md shadow-pink-500/30" : "text-slate-500 hover:bg-white/80 hover:text-pink-600"}`}
            >
              <MessageSquare size={14} strokeWidth={2.5} />
              Chat
            </button>
            <button 
              onClick={() => setActiveTabSidebar("github")}
              className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${activeTabSidebar === "github" ? "bg-slate-900 text-white shadow-md shadow-slate-900/30 dark:bg-white dark:text-slate-900" : "text-slate-500 hover:bg-white/80 hover:text-slate-800 dark:hover:text-white"}`}
            >
              <GitBranch size={14} strokeWidth={2.5} />
              GitHub
            </button>
          </div>
          <div className="p-2 border-b border-pink-400/70 font-black text-[10px] uppercase tracking-widest text-pink-600 bg-white/30">
            {activeTabSidebar === "files" && "Workspace Explorer"}
            {activeTabSidebar === "users" && "Active Users"}
            {activeTabSidebar === "chat" && "Team Communication"}
            {activeTabSidebar === "github" && "Source Control"}
          </div>
          <div className="flex-1 overflow-hidden relative">
            {activeTabSidebar === "files" && (
              <FileExplorer 
                files={files} 
                activeFile={activeFile} 
                onFileSelect={setActiveFile} 
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
                onFilesImport={handleFilesImport}
              />
            )}
            {activeTabSidebar === "users" && (
              <RoomSidebar users={users} currentUserSocketId={currentUserSocketId} typingUsers={typingUsers} roomId={roomId} isConnected={pusherConnected} />
            )}
            {activeTabSidebar === "chat" && (
              <ChatPanel roomId={roomId} username={username} messages={messages} typingUsers={typingUsers} />
            )}
            {activeTabSidebar === "github" && (
              <GitHubPanel 
                roomId={roomId} 
                onCloneSuccess={() => {
                  window.location.reload();
                }} 
              />
            )}
          </div>
        </div>

        {/* Resizer Left */}
        <div 
          className="hidden md:block w-1.5 bg-pink-400/40 hover:bg-pink-500 active:bg-pink-600 cursor-col-resize shrink-0 transition-colors relative z-20 shadow-sm"
          onMouseDown={() => {
            isDraggingLeft.current = true;
            setIsDragging(true);
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* Center: Editor */}
        <div className={`flex-1 flex-col min-w-0 bg-white/30 backdrop-blur-md relative ${isDragging ? 'pointer-events-none' : ''} ${mobileTab === 'editor' ? 'flex w-full' : 'hidden md:flex'}`}>
          {/* Editor Header / Tabs */}
          <div className="flex bg-white/50 border-b border-pink-400/70 overflow-hidden relative h-12">
            <div className="flex-1 overflow-x-auto custom-scroll flex items-center pr-24">
              {Object.keys(files)
                .filter((f) => !f.endsWith(".keep") && !f.endsWith("/"))
                .map((filename) => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`px-4 py-2 text-sm whitespace-nowrap border-r border-slate-200/50 dark:border-slate-800 transition-colors ${
                      activeFile === filename
                        ? "bg-white text-pink-700 border-t-2 border-t-pink-500 shadow-sm"
                        : "text-slate-600 hover:bg-white/80 border-t-2 border-t-transparent hover:text-pink-700"
                    }`}
                  >
                    {filename.split('/').pop()}
                    {activeFile === filename && !isSaved && <span className="ml-2 text-pink-500 font-bold">*</span>}
                  </button>
                ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 bg-gradient-to-l from-slate-50 via-slate-50 to-transparent">
              {activeFile && (
                <button 
                  onClick={() => setIsSaved(true)} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition ${isSaved ? "text-slate-400 bg-slate-100" : "text-white bg-pink-500 shadow-md shadow-pink-500/20"}`}
                  title="Save (Cmd+S)"
                >
                  <Check size={14} />
                  {isSaved ? "Saved" : "Save"}
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 relative flex flex-col min-h-0">
            <div className="flex-1 relative min-h-0">
              {Object.keys(files).length > 0 ? (
                <PlaygroundEditor
                  code={files[activeFile] || ""}
                  onChange={handleCodeChange}
                  codeType={activeFile.split('.').pop() || "js"}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 font-bold">
                  No files open. Create a file in the explorer.
                </div>
              )}
            </div>
            
            {isTerminalOpen && (
              <IDETerminal 
                onClose={() => setIsTerminalOpen(false)} 
                files={files} 
                roomId={roomId} 
                onFileCreate={handleFileCreate}
                onFileDelete={handleFileDelete}
                onFileRename={handleFileRename}
              />
            )}
            
            {!isTerminalOpen && (
              <button 
                onClick={() => setIsTerminalOpen(true)}
                className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 z-20 backdrop-blur-md border border-slate-700/50"
                title="Open Terminal"
              >
                <Terminal size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Resizer Right */}
        <div 
          className="hidden md:block w-1.5 bg-pink-400/40 hover:bg-pink-500 active:bg-pink-600 cursor-col-resize shrink-0 transition-colors relative z-20 shadow-sm"
          onMouseDown={() => {
            isDraggingRight.current = true;
            setIsDragging(true);
            document.body.style.cursor = 'col-resize';
          }}
        />

        {/* Right: Live Preview */}
        <aside style={{ width: isMobile ? '100%' : rightWidth }} className={`flex-col bg-white/40 backdrop-blur-md shrink-0 relative ${isDragging ? 'pointer-events-none' : ''} ${mobileTab === 'preview' ? 'flex w-full' : 'hidden md:flex'}`}>
          <div className="p-2 border-b border-pink-200/60 bg-white/50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Live Preview</span>
          </div>
          <div className="flex-1 border-0">
            <LivePreview files={files} activeFile={activeFile} />
          </div>
        </aside>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden flex bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-pink-200/50 dark:border-slate-700/50 shrink-0">
        <button onClick={() => setMobileTab("sidebar")} className={`flex-1 py-3.5 text-center text-[10px] uppercase tracking-wider font-bold transition ${mobileTab === 'sidebar' ? 'text-pink-600 bg-white/60 dark:bg-slate-800/60 shadow-inner' : 'text-slate-500 hover:text-pink-500'}`}>Menu</button>
        <button onClick={() => setMobileTab("editor")} className={`flex-1 py-3.5 text-center text-[10px] uppercase tracking-wider font-bold transition border-l border-r border-pink-200/50 dark:border-slate-700/50 ${mobileTab === 'editor' ? 'text-pink-600 bg-white/60 dark:bg-slate-800/60 shadow-inner' : 'text-slate-500 hover:text-pink-500'}`}>Editor</button>
        <button onClick={() => setMobileTab("preview")} className={`flex-1 py-3.5 text-center text-[10px] uppercase tracking-wider font-bold transition ${mobileTab === 'preview' ? 'text-pink-600 bg-white/60 dark:bg-slate-800/60 shadow-inner' : 'text-slate-500 hover:text-pink-500'}`}>Preview</button>
      </div>
    </div>
  );

}
