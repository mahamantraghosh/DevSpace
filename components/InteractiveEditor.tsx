"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  Users,
  MessageSquare,
  Play,
  Send,
  FileCode,
  FolderTree,
  Settings,
  ChevronRight,
  Info
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "You" | "Krishna" | "Mahamantra";
  text: string;
  time: string;
  avatarColor: string;
}
const PLAYLIST = [
  { title: "Tum Se Hi", src: "/tum-se-hi.mp3" },
  { title: "Kingdom Dance", src: "/kingdom-dance.mp3" }
];

export default function InteractiveEditor() {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [mobileTab, setMobileTab] = useState<"code" | "preview" | "chat">("code");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "Krishna",
      text: "Oi Mantra did you implement the idea that i told you last night?",
      time: "17:34",
      avatarColor: "bg-pink-500",
    },
    {
      id: "2",
      sender: "Mahamantra",
      text: "Yes Krishna!! i am working on it🌸",
      time: "17:35",
      avatarColor: "bg-yellow-500",
    },
  ]);

  const [terminalLines, setTerminalLines] = useState<string[]>([
    "[MantraCode Server] Initializing web sandbox...",
    "[MantraCode Server] Hot module reloading active.",
    "[MantraCode Server] Server listening on http://localhost:3000",
  ]);

  const [simulatedCodeLine, setSimulatedCodeLine] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Audio Player State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(1); // Default to Kingdom Dance
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const currentTrack = PLAYLIST[currentTrackIndex];

  const handleNextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
    if (!isPlayingMusic) {
      setIsPlayingMusic(true);
      window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'interactive' } }));
    }
  };

  const handlePrevTrack = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
    if (!isPlayingMusic) {
      setIsPlayingMusic(true);
      window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'interactive' } }));
    }
  };

  useEffect(() => {
    if (isPlayingMusic && audioRef.current) {
      audioRef.current.play().catch(e => console.log(e));
    }
  }, [currentTrackIndex, isPlayingMusic]);

  useEffect(() => {
    const handlePauseAudio = (e: any) => {
      if (e.detail?.source !== 'interactive' && audioRef.current) {
        audioRef.current.pause();
        setIsPlayingMusic(false);
      }
    };
    window.addEventListener('pause-audio', handlePauseAudio);
    return () => window.removeEventListener('pause-audio', handlePauseAudio);
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isPlayingMusic) {
        audioRef.current.pause();
      } else {
        window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'interactive' } }));
        audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };



  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Simulate remote typing changes over time
  useEffect(() => {
    let index = 0;
    const codeToAdd = "  console.log('Audio visualizer synced!');";

    const typingTimeout = setTimeout(() => {
      setIsTyping(true);

      const charInterval = setInterval(() => {
        if (index < codeToAdd.length) {
          setSimulatedCodeLine((prev) => prev + codeToAdd[index]);
          index++;
        } else {
          clearInterval(charInterval);
          setIsTyping(false);
          // Append output to terminal
          setTerminalLines((prev) => [
            ...prev,
            `[MantraCode Compiler] app.js compiled successfully.`,
            `[MantraCode Runtime] console.log: "Audio visualizer synced!"`
          ]);
        }
      }, 80);

      return () => clearInterval(charInterval);
    }, 5000);

    return () => clearTimeout(typingTimeout);
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      avatarColor: "bg-pink-600",
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage("");

    // Simulate reply
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const replies = [
          "Kemon laglo?",
          "Yes bro ami ei part ta kore nebo",
          "tui frontend ta samla, ami backend ta dekhchi, lets share work",
          "Eksathe code korte ki moja asche, darun workspace toh eta!!"
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        const replyMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: Math.random() > 0.5 ? "Mahamantra" : "Krishna",
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatarColor: Math.random() > 0.5 ? "bg-yellow-500" : "bg-pink-500",
        };
        setChatMessages((prev) => [...prev, replyMsg]);
      }, 1500);
    }, 1000);
  };

  const codeSnippets = {
    html: [
      { text: '<!DOCTYPE html>', color: 'text-slate-500' },
      { text: '<html lang="en">', color: 'text-pink-600' },
      { text: '<head>', color: 'text-pink-600' },
      { text: '  <link rel="stylesheet" href="styles.css">', color: 'text-yellow-600' },
      { text: '</head>', color: 'text-pink-600' },
      { text: '<body>', color: 'text-pink-600' },
      { text: '  <div class="player-card">', color: 'text-pink-600' },
      { text: '    <div class="vinyl-record spinning">', color: 'text-pink-600' },
      { text: '      <div class="center-label"></div>', color: 'text-pink-600' },
      { text: '    </div>', color: 'text-pink-600' },
      { text: '    <div class="track-info">', color: 'text-pink-600' },
      { text: '      <h4>Now Playing</h4>', color: 'text-blue-900 font-bold' },
      { text: '      <h2>Lofi Code Beats</h2>', color: 'text-blue-900 font-bold' },
      { text: '      <div class="audio-waves">', color: 'text-pink-600' },
      { text: '        <div class="bar"></div>', color: 'text-pink-600' },
      { text: '        <!-- more bars -->', color: 'text-slate-400' },
      { text: '      </div>', color: 'text-pink-600' },
      { text: '    </div>', color: 'text-pink-600' },
      { text: '  </div>', color: 'text-pink-600' },
      { text: '  <script src="app.js"></script>', color: 'text-yellow-600' },
      { text: '</body>', color: 'text-pink-600' },
      { text: '</html>', color: 'text-pink-600' }
    ],
    css: [
      { text: '.player-card {', color: 'text-pink-600' },
      { text: '  display: flex;', color: 'text-yellow-600' },
      { text: '  align-items: center;', color: 'text-yellow-600' },
      { text: '  gap: 16px;', color: 'text-yellow-600' },
      { text: '  background: rgba(255, 255, 255, 0.4);', color: 'text-yellow-600' },
      { text: '  padding: 16px;', color: 'text-yellow-600' },
      { text: '  border-radius: 16px;', color: 'text-yellow-600' },
      { text: '  backdrop-filter: blur(12px);', color: 'text-yellow-600' },
      { text: '}', color: 'text-pink-600' },
      { text: '', color: '' },
      { text: '.vinyl-record {', color: 'text-pink-600' },
      { text: '  width: 48px;', color: 'text-yellow-600' },
      { text: '  height: 48px;', color: 'text-yellow-600' },
      { text: '  background: #1e293b;', color: 'text-yellow-600' },
      { text: '  border-radius: 50%;', color: 'text-yellow-600' },
      { text: '}', color: 'text-pink-600' },
      { text: '', color: '' },
      { text: '.spinning {', color: 'text-pink-600' },
      { text: '  animation: spin 3s linear infinite;', color: 'text-yellow-600' },
      { text: '}', color: 'text-pink-600' },
      { text: '', color: '' },
      { text: '.bar {', color: 'text-pink-600' },
      { text: '  width: 4px;', color: 'text-yellow-600' },
      { text: '  background: #ec4899;', color: 'text-yellow-600' },
      { text: '  animation: pulse 0.5s ease-in-out infinite alternate;', color: 'text-yellow-600' },
      { text: '}', color: 'text-pink-600' }
    ],
    js: [
      { text: 'const bars = document.querySelectorAll(".bar");', color: 'text-pink-600' },
      { text: '', color: '' },
      { text: 'function syncVisualizer() {', color: 'text-yellow-600 font-bold' },
      { text: '  bars.forEach(bar => {', color: 'text-pink-600' },
      { text: '    const duration = Math.random() * 0.5 + 0.3;', color: 'text-pink-600' },
      { text: '    const height = Math.floor(Math.random() * 100);', color: 'text-pink-600' },
      { text: '    bar.style.animationDuration = `${duration}s`;', color: 'text-pink-600' },
      { text: '    bar.style.height = `${height}%`;', color: 'text-pink-600' },
      { text: '  });', color: 'text-pink-600' },
      { text: '  requestAnimationFrame(syncVisualizer);', color: 'text-pink-600' },
      { text: '}', color: 'text-yellow-600 font-bold' },
      { text: '', color: '' }
    ]
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/50 bg-white/30 shadow-2xl shadow-pink-500/20 backdrop-blur-xl overflow-hidden flex flex-col h-[600px] text-left relative z-20">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 bg-white/40 backdrop-blur-md select-none">
        <div className="flex items-center gap-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500 hover:bg-red-500 transition-colors cursor-pointer shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500 hover:bg-yellow-500 transition-colors cursor-pointer shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500 hover:bg-green-500 transition-colors cursor-pointer shadow-sm"></div>
          </div>
          <div className="h-4 w-px bg-white/50"></div>
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-bold">
            <span className="text-pink-600">workspace /</span>
            <span>music-player</span>
          </div>
        </div>

        {/* Presence badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center -space-x-1.5 mr-2">
            <div className="w-7 h-7 rounded-full bg-pink-500 border-[2px] border-white/80 flex items-center justify-center text-[10px] font-bold text-white shadow-md z-30" title="You">Y</div>
            <div className="w-7 h-7 rounded-full bg-yellow-400 border-[2px] border-white/80 flex items-center justify-center text-[10px] font-bold text-white shadow-md animate-pulse z-20" title="Krishna">K</div>
            <div className="w-7 h-7 rounded-full bg-pink-400 border-[2px] border-white/80 flex items-center justify-center text-[10px] font-bold text-white shadow-md z-10" title="Mahamantra">M</div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-700 px-2 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/80 backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            3 active
          </div>
        </div>
      </div>

      {/* Mobile Panel Tabs */}
      <div className="flex border-b border-white/30 bg-white/30 backdrop-blur-md md:hidden select-none">
        <button
          type="button"
          onClick={() => setMobileTab("code")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-bold transition-all cursor-pointer ${mobileTab === "code"
            ? "text-pink-600 border-b-2 border-pink-500 bg-white/40"
            : "text-slate-600 hover:text-slate-800 border-b-2 border-transparent"
            }`}
        >
          Code
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-bold transition-all cursor-pointer ${mobileTab === "preview"
            ? "text-pink-600 border-b-2 border-pink-500 bg-white/40"
            : "text-slate-600 hover:text-slate-800 border-b-2 border-transparent"
            }`}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2.5 text-center text-xs font-mono font-bold transition-all cursor-pointer ${mobileTab === "chat"
            ? "text-pink-600 border-b-2 border-pink-500 bg-white/40"
            : "text-slate-600 hover:text-slate-800 border-b-2 border-transparent"
            }`}
        >
          Chat
        </button>
      </div>

      {/* Editor Main Content Area */}
      <div className="flex-1 flex overflow-hidden bg-white/10">
        {/* Leftmost Sidebar Navigation */}
        <div className="hidden sm:flex w-12 border-r border-white/30 bg-white/20 backdrop-blur-md flex-col items-center py-4 justify-between select-none shadow-inner">
          <div className="flex flex-col gap-5 items-center w-full">
            <button className="text-slate-500 hover:text-pink-600 transition-colors cursor-pointer relative" title="File Explorer">
              <FolderTree className="w-5 h-5 text-pink-600" />
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-pink-600 rounded-r"></div>
            </button>
            <button className="text-slate-500 hover:text-pink-600 transition-colors cursor-pointer relative" title="Collaborators">
              <Users className="w-5 h-5" />
            </button>
            <button className="text-slate-500 hover:text-pink-600 transition-colors cursor-pointer relative" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="text-slate-500 hover:text-slate-700 cursor-pointer">
            <Info className="w-5 h-5" />
          </div>
        </div>

        {/* File Tree Explorer (Small sidebar) */}
        <div className="hidden md:flex flex-col w-44 bg-white/30 backdrop-blur-md border-r border-white/30 p-3 select-none">
          <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 mb-3 block">Files</span>
          <div className="flex flex-col gap-1 text-xs">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${activeTab === "html" ? "bg-white/50 text-pink-700 font-bold shadow-sm border border-white/60" : "text-slate-700 font-medium hover:bg-white/40"
                }`}
            >
              <FileCode className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-mono">index.html</span>
            </button>
            <button
              onClick={() => setActiveTab("css")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${activeTab === "css" ? "bg-white/50 text-pink-700 font-bold shadow-sm border border-white/60" : "text-slate-700 font-medium hover:bg-white/40"
                }`}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono">styles.css</span>
            </button>
            <button
              onClick={() => setActiveTab("js")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${activeTab === "js" ? "bg-white/50 text-pink-700 font-bold shadow-sm border border-white/60" : "text-slate-700 font-medium hover:bg-white/40"
                }`}
            >
              <FileCode className="w-3.5 h-3.5 text-yellow-600" />
              <span className="font-mono">app.js</span>
            </button>
          </div>
        </div>

        {/* Code Editor view */}
        <div className={`flex-1 flex-col bg-white/20 backdrop-blur-sm overflow-hidden ${mobileTab === 'code' ? 'flex' : 'hidden md:flex'}`}>
          {/* File tabs for mobile */}
          <div className="flex border-b border-white/30 bg-white/20 md:hidden">
            <button
              onClick={() => setActiveTab("html")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b-2 font-bold transition-all ${activeTab === "html" ? "border-pink-500 text-pink-600 bg-white/40" : "border-transparent text-slate-600"
                }`}
            >
              index.html
            </button>
            <button
              onClick={() => setActiveTab("css")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b-2 font-bold transition-all ${activeTab === "css" ? "border-pink-500 text-pink-600 bg-white/40" : "border-transparent text-slate-600"
                }`}
            >
              styles.css
            </button>
            <button
              onClick={() => setActiveTab("js")}
              className={`flex-1 py-2 text-center text-xs font-mono border-b-2 font-bold transition-all ${activeTab === "js" ? "border-pink-500 text-pink-600 bg-white/40" : "border-transparent text-slate-600"
                }`}
            >
              app.js
            </button>
          </div>

          {/* Active file indicator / breadcrumb for desktop */}
          <div className="hidden md:flex items-center justify-between px-4 py-2 bg-white/30 border-b border-white/30 text-xs font-mono text-slate-600 font-bold">
            <div className="flex items-center gap-1">
              <span>music-player</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className={activeTab === 'html' ? 'text-orange-600' : activeTab === 'css' ? 'text-blue-600' : 'text-yellow-600'}>
                {activeTab === "html" ? "index.html" : activeTab === "css" ? "styles.css" : "app.js"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></span>
              <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider">Autosaved</span>
            </div>
          </div>

          {/* Code display area */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed select-text custom-scroll bg-white/10 text-slate-800">
            {codeSnippets[activeTab].map((line, idx) => (
              <div key={idx} className="flex hover:bg-white/40 px-1 rounded transition-colors group relative">
                <span className="w-8 text-slate-400 text-right select-none pr-3 block border-r border-white/40 mr-3 font-semibold shrink-0">
                  {idx + 1}
                </span>
                <span className={`${line.color} whitespace-pre font-medium relative`}>
                  {line.text}
                  {activeTab !== "js" && idx === codeSnippets[activeTab].length - 1 && (
                    <span className="absolute top-0 right-[-4px] translate-x-full flex items-center pointer-events-none select-none z-10">
                      <span className="h-4 w-0.5 bg-yellow-500 animate-pulse"></span>
                      <span className="bg-yellow-400 text-slate-900 text-[9px] font-sans px-1 py-0.2 rounded-sm shadow-md whitespace-nowrap ml-0.5 select-none font-bold border border-yellow-500/50">
                        Krishna
                      </span>
                    </span>
                  )}
                </span>
              </div>
            ))}

            {/* Simulating code being typed by Mahamantra in JS file */}
            {activeTab === "js" && (
              <div className="flex hover:bg-white/40 px-1 rounded transition-colors relative">
                <span className="w-8 text-slate-400 text-right select-none pr-3 block border-r border-white/40 mr-3 font-semibold">
                  {codeSnippets.js.length + 1}
                </span>
                <span className="text-pink-600 whitespace-pre relative font-medium">
                  {simulatedCodeLine}
                  <span className="inline-block w-1.5 h-4 bg-yellow-500 animate-pulse align-middle ml-0.5"></span>
                  <span className="absolute -top-5 left-full bg-yellow-400 text-slate-900 text-[9px] font-sans px-1 rounded shadow-md whitespace-nowrap z-10 font-bold border border-yellow-500/50">
                    Mahamantra
                  </span>
                </span>
              </div>
            )}


          </div>

          {/* Mini Terminal (bottom of code editor) */}
          <div className="h-28 border-t border-white/30 bg-white/40 backdrop-blur-md flex flex-col font-mono text-[10px] text-slate-700 font-medium">
            <div className="flex items-center justify-between px-3 py-1 bg-white/50 border-b border-white/30">
              <div className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-pink-600" />
                <span className="font-bold text-pink-700 uppercase tracking-wider text-[9px]">Terminal</span>
              </div>
              <span className="text-[9px] text-emerald-700 bg-emerald-100/80 font-bold border border-emerald-200/80 px-1.5 py-0.2 rounded shadow-sm">online</span>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-1 custom-scroll">
              {terminalLines.map((line, idx) => (
                <div key={idx} className={`${line.includes('Compiler') ? 'text-pink-600' : line.includes('Runtime') ? 'text-yellow-600' : 'text-slate-600'}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Live Preview & Chat (Responsive side panel) */}
        <div className={`w-full md:w-72 border-t md:border-t-0 md:border-l border-white/30 bg-white/20 backdrop-blur-md flex flex-col overflow-hidden ${mobileTab === 'preview' || mobileTab === 'chat' ? 'flex flex-1' : 'hidden md:flex'
          }`}>
          {/* Top Half: Live Sandbox Preview */}
          <div className={`flex-1 flex flex-col border-b border-white/30 min-h-[180px] bg-white/30 ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'
            }`}>
            <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-white/30 text-xs">
              <div className="flex items-center gap-1.5 font-mono">
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/30" />
                <span className="text-pink-700 font-bold">Live Preview</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]"></span>
                <span className="text-[10px] text-slate-600 font-mono font-bold">PORT: 3000</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-white/10">
              {/* Radial gradient background behind clock */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-gradient-to-tr from-pink-300/40 to-yellow-300/40 rounded-full blur-2xl"></div>

              {/* Music Player Wrapper */}
              <div className="relative flex flex-col items-center gap-4 z-10">
                {/* Music Player Widget Output */}
                <div 
                  className="relative group bg-white/50 border border-white/60 hover:border-pink-300/80 rounded-2xl p-4 w-[280px] shadow-2xl shadow-pink-500/10 backdrop-blur-2xl transition-all duration-300 flex flex-col gap-4"
                >
                <audio 
                  ref={audioRef} 
                  src={currentTrack.src} 
                  onEnded={() => setIsPlayingMusic(false)}
                  preload="metadata"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
                
                {/* Top Section: Vinyl, Info, and Play Button */}
                <div className="flex items-center gap-4">
                  <div className={`relative shrink-0 w-14 h-14 rounded-full bg-slate-800 border-[3px] border-slate-900 shadow-lg flex items-center justify-center overflow-hidden ${isPlayingMusic ? 'animate-spin [animation-duration:3s]' : 'transition-transform duration-500'}`}>
                    {/* Vinyl Grooves */}
                    <div className="absolute inset-0 rounded-full border border-slate-700 m-[3px]"></div>
                    <div className="absolute inset-0 rounded-full border border-slate-700 m-[8px]"></div>
                    
                    {/* Spinning Arrow Indicator */}
                    <div className="absolute top-1 right-2 text-pink-400 drop-shadow-md rotate-45 z-0">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z"/></svg>
                    </div>
                    
                    {/* Glare Reflection */}
                    <div className="absolute top-0 right-1/2 w-4 h-1 bg-white/20 rounded-full blur-[1px]"></div>

                    {/* Center Label */}
                    <div className="relative w-4 h-4 bg-pink-500 rounded-full border border-pink-400 shadow-inner flex items-center justify-center z-10">
                      <div className="w-1 h-1 bg-white/80 rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col relative">

                    <h4 className="text-[9px] uppercase tracking-widest text-pink-600 font-mono font-black truncate leading-none mb-1 flex items-center gap-1">
                      {isPlayingMusic ? (
                        <><span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span> Playing</>
                      ) : 'Paused'}
                    </h4>
                    <select 
                      value={currentTrackIndex}
                      onChange={(e) => {
                        setCurrentTrackIndex(Number(e.target.value));
                        if (!isPlayingMusic) {
                          setIsPlayingMusic(true);
                          window.dispatchEvent(new CustomEvent('pause-audio', { detail: { source: 'interactive' } }));
                        }
                      }}
                      className="text-[13px] font-bold text-slate-800 bg-transparent outline-none cursor-pointer appearance-none truncate leading-tight mb-1 hover:text-pink-600 transition-colors w-full"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23ec4899' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', paddingRight: '16px' }}
                    >
                      {PLAYLIST.map((t, i) => (
                        <option key={i} value={i} className="text-slate-800">{t.title}</option>
                      ))}
                    </select>
                    
                    {/* Music visuals according to beat */}
                    <div className="flex items-end gap-[2px] h-3 opacity-80">
                      <div className={`w-1 bg-pink-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-full animate-pulse [animation-duration:0.4s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-yellow-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-2/3 animate-pulse [animation-duration:0.6s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-pink-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-4/5 animate-pulse [animation-duration:0.5s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-yellow-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-1/2 animate-pulse [animation-duration:0.7s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-pink-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-3/4 animate-pulse [animation-duration:0.3s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-yellow-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-full animate-pulse [animation-duration:0.5s]' : 'h-1'}`}></div>
                      <div className={`w-1 bg-pink-500 rounded-t-sm transition-all ${isPlayingMusic ? 'h-2/3 animate-pulse [animation-duration:0.4s]' : 'h-1'}`}></div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 shrink-0 ml-1">
                    <div className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-white/70 text-pink-600 border border-white/90 shadow-sm backdrop-blur-md -mb-0.5">
                      {formatTime(currentTime)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={handlePrevTrack} 
                        className="w-7 h-7 rounded-full bg-white/40 text-slate-500 hover:text-pink-600 hover:bg-white/70 flex items-center justify-center transition-all shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
                      </button>
                      <button 
                        onClick={toggleMusic}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 to-pink-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 hover:shadow-pink-500/40 transition-all cursor-pointer border border-pink-400/50"
                      >
                        {isPlayingMusic ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"></rect><rect x="14" y="4" width="4" height="16" rx="1"></rect></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round" strokeWidth="2"></polygon></svg>
                        )}
                      </button>
                      <button 
                        onClick={handleNextTrack} 
                        className="w-7 h-7 rounded-full bg-white/40 text-slate-500 hover:text-pink-600 hover:bg-white/70 flex items-center justify-center transition-all shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrubber slidable */}
                <div className="flex flex-col gap-1 w-full select-none">
                  <input 
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeekChange}
                    className="w-full h-1.5 appearance-none cursor-pointer rounded-full outline-none hover:h-2 transition-all shadow-inner bg-white/40"
                    style={{
                      background: `linear-gradient(to right, #ec4899 ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.6) ${(currentTime / (duration || 1)) * 100}%)`
                    }}
                  />
                  <div className="flex justify-between w-full">
                     {/* The styles for the thumb (the dragger) need to be handled carefully in React, but tailwind accent color works in modern browsers */}
                     <style>{`
                       input[type=range]::-webkit-slider-thumb {
                         -webkit-appearance: none;
                         height: 10px;
                         width: 10px;
                         border-radius: 50%;
                         background: #ec4899;
                         box-shadow: 0 0 4px rgba(236,72,153,0.5);
                         cursor: pointer;
                       }
                     `}</style>
                  </div>
                </div>
              </div>
              
              {/* Call to action when paused (below the player) */}
              {!isPlayingMusic && (
                <div className="text-[10px] font-bold text-pink-600 animate-bounce tracking-wider drop-shadow-sm bg-white/40 px-4 py-1.5 rounded-full border border-pink-200 shadow-sm backdrop-blur-md">
                  Click play to listen! 🎵
                </div>
              )}
            </div>
            </div>
          </div>

          {/* Bottom Half: Live Chat pane */}
          <div className={`flex-1 flex flex-col h-[200px] md:h-auto bg-white/40 backdrop-blur-md ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'
            }`}>
            <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-b border-white/30 text-xs select-none">
              <div className="flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-3.5 h-3.5 text-pink-600" />
                <span className="text-pink-700 font-bold">Room Chat</span>
              </div>
              <span className="text-[9px] text-slate-500 font-mono font-bold">Channel: #general</span>
            </div>

            {/* Chat message logs */}
            <div ref={chatContainerRef} className="flex-1 p-3 overflow-y-auto space-y-4 custom-scroll select-text font-medium">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex gap-2 text-xs">
                  <div className={`w-6 h-6 rounded-full ${msg.avatarColor} text-white flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm border border-white/50`}>
                    {msg.sender[0]}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`font-bold text-[11px] ${msg.sender === 'You' ? 'text-pink-700' : 'text-slate-800'}`}>
                        {msg.sender}
                      </span>
                      <span className="text-[8px] text-slate-500 font-mono font-bold">{msg.time}</span>
                    </div>
                    <p className="text-slate-700 font-medium leading-normal text-[11px] break-words bg-white/60 p-2 rounded-xl rounded-tl-sm border border-white/80 inline-block shadow-sm backdrop-blur-md">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 text-xs items-center text-slate-500 font-bold">
                  <span className="text-[10px] italic font-mono">Someone typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce"></span>
                    <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-1 bg-pink-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                </div>
              )}
            </div>

            {/* Chat Message Input form */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-white/30 bg-white/50 backdrop-blur-lg">
              <div className="relative flex items-center bg-white/70 rounded-xl border border-white/80 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-400/20 transition-all shadow-sm">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask team or chat..."
                  className="w-full bg-transparent px-3 py-2 pr-8 text-xs font-medium text-slate-800 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 p-1.5 rounded-lg text-pink-500 hover:text-white hover:bg-pink-500 transition-colors cursor-pointer"
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
