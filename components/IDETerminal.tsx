"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

interface IDETerminalProps {
  onClose: () => void;
  files: Record<string, string>;
  roomId: string;
}

interface LogEntry {
  type: "command" | "output" | "error" | "system";
  text: string;
}

export default function IDETerminal({ onClose, files, roomId }: IDETerminalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: "system", text: "MantraCode Web Terminal v1.0.0" },
    { type: "system", text: "Type 'help' for a list of available commands." }
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [height, setHeight] = useState(256); // 256px default (equivalent to h-64)
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const { theme: globalTheme } = useTheme();
  const [themeMode, setThemeMode] = useState<"system" | "dark" | "light">("system");
  const isDark = themeMode === "dark" || (themeMode === "system" && globalTheme === "dark");

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY; // delta is positive when dragging UP
      const newHeight = Math.max(100, Math.min(startHeight.current + delta, window.innerHeight * 0.8));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = 'default';
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = height;
    document.body.style.cursor = 'row-resize';
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setInput("");
    
    setLogs(prev => [...prev, { type: "command", text: `$ ${cmd}` }]);

    const args = cmd.split(" ").filter(Boolean);
    const baseCmd = args[0].toLowerCase();

    switch (baseCmd) {
      case "help":
        setLogs(prev => [...prev, { 
          type: "output", 
          text: "Available commands:\n  ls       - List workspace files\n  clear    - Clear terminal output\n  echo     - Print text\n  git      - Simulated git commands (e.g. 'git status', 'git push origin main')\n  npm      - Simulated node commands\n  theme    - Change terminal theme (dark|light|system)" 
        }]);
        break;
      case "clear":
        setLogs([]);
        break;
      case "ls":
        const fileNames = Object.keys(files).map(f => f.replace(/^\//, '')).join("  ");
        setLogs(prev => [...prev, { type: "output", text: fileNames || "(empty directory)" }]);
        break;
      case "echo":
        setLogs(prev => [...prev, { type: "output", text: args.slice(1).join(" ") }]);
        break;
      case "npm":
        if (args[1] === "run" && args[2] === "dev") {
          setLogs(prev => [...prev, { type: "system", text: "Starting Next.js dev server..." }]);
          setTimeout(() => {
            setLogs(prev => [...prev, { type: "output", text: "ready - started server on 0.0.0.0:3000, url: http://localhost:3000" }]);
          }, 800);
        } else {
          setLogs(prev => [...prev, { type: "error", text: "This is a web sandbox. Real npm commands are not supported." }]);
        }
        break;
      case "theme":
        if (args[1] === "dark") {
          setThemeMode("dark");
          setLogs(prev => [...prev, { type: "system", text: "Terminal theme set to dark" }]);
        } else if (args[1] === "light") {
          setThemeMode("light");
          setLogs(prev => [...prev, { type: "system", text: "Terminal theme set to light" }]);
        } else if (args[1] === "system") {
          setThemeMode("system");
          setLogs(prev => [...prev, { type: "system", text: "Terminal theme synced with system" }]);
        } else {
          setLogs(prev => [...prev, { type: "output", text: "Usage: theme <dark|light|system>" }]);
        }
        break;
      case "git":
        await handleGitCommand(args);
        break;
      default:
        setLogs(prev => [...prev, { type: "error", text: `command not found: ${baseCmd}` }]);
    }
  };

  const handleGitCommand = async (args: string[]) => {
    const subCmd = args[1]?.toLowerCase();
    
    if (subCmd === "status") {
      setLogs(prev => [...prev, { type: "output", text: `On branch main\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n\nno changes added to commit (use "git add" and/or "git commit -a")` }]);
    } else if (subCmd === "push") {
      setLogs(prev => [...prev, { type: "system", text: "Pushing to GitHub..." }]);
      try {
        const res = await fetch("/api/github/commit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, message: "Pushed from MantraCode Terminal" }),
        });
        const data = await res.json();
        if (res.ok) {
          setLogs(prev => [...prev, { type: "output", text: "Success! Changes securely pushed to GitHub." }]);
        } else {
          setLogs(prev => [...prev, { type: "error", text: `Error: ${data.error}` }]);
        }
      } catch (e: any) {
        setLogs(prev => [...prev, { type: "error", text: "Network error while pushing to GitHub." }]);
      }
    } else if (subCmd === "commit") {
      setLogs(prev => [...prev, { type: "output", text: "[main 4c3d2e1] Simulated commit\n 2 files changed, 42 insertions(+), 1 deletion(-)" }]);
    } else if (subCmd === "add") {
      setLogs(prev => [...prev, { type: "output", text: "" }]); // git add doesn't output anything on success
    } else if (subCmd === "log") {
      setLogs(prev => [...prev, { type: "output", text: "commit 4c3d2e1 (HEAD -> main)\nAuthor: Mantra User <user@mantracode.dev>\nDate:   Just now\n\n    Simulated commit\n\ncommit a1b2c3d\nAuthor: Mantra User <user@mantracode.dev>\nDate:   An hour ago\n\n    Initial commit" }]);
    } else if (subCmd === "--help" || subCmd === "help") {
      setLogs(prev => [...prev, { type: "output", text: "usage: git <command> [<args>]\n\nThese are common Git commands used in various situations:\n\nstart a working area (see also: git help tutorial)\n   clone     Clone a repository into a new directory\n   init      Create an empty Git repository or reinitialize an existing one\n\nwork on the current change (see also: git help everyday)\n   add       Add file contents to the index\n   mv        Move or rename a file, a directory, or a symlink\n   restore   Restore working tree files\n   rm        Remove files from the working tree and from the index\n\nexamine the history and state (see also: git help revisions)\n   status    Show the working tree status\n   log       Show commit logs" }]);
    } else if (subCmd === "clone" || subCmd === "pull") {
      setLogs(prev => [...prev, { type: "system", text: "Please use the 'Source Control' panel in the sidebar to clone repositories into this workspace." }]);
    } else if (!subCmd) {
      setLogs(prev => [...prev, { type: "error", text: "usage: git <command> [<args>]\n\nType 'git --help' for more information." }]);
    } else {
      setLogs(prev => [...prev, { type: "error", text: `git: '${subCmd}' is not a git command. See 'git --help'.` }]);
    }
  };

  return (
    <div 
      style={{ height: isExpanded ? '50vh' : `${height}px` }}
      className={`flex flex-col shadow-2xl z-30 relative shrink-0 border-t ${isDark ? "bg-slate-950 border-slate-700/50" : "bg-slate-100 border-slate-300"} ${isExpanded ? "transition-all duration-300" : ""}`}
    >
      {/* Resizer Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className="h-1.5 w-full bg-transparent hover:bg-pink-500 cursor-row-resize shrink-0 transition-colors absolute top-0 left-0 right-0 z-40"
      />
      
      {/* Terminal Header */}
      <div className={`flex items-center justify-between px-4 py-2 border-b shrink-0 select-none ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-200 border-slate-300"}`}>
        <div className="flex items-center gap-2">
          <TerminalIcon size={14} className={`text-slate-500 ${isDark ? "text-slate-400" : ""}`} />
          <span className={`text-xs font-mono ${isDark ? "text-slate-300" : "text-slate-700"}`}>bash</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsExpanded(!isExpanded)} className={`transition ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-500 hover:text-slate-800"}`}>
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button onClick={onClose} className={`transition ${isDark ? "text-slate-500 hover:text-red-400" : "text-slate-500 hover:text-red-500"}`}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        className="flex-1 overflow-y-auto p-3 font-mono text-xs sm:text-sm custom-scroll cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-col gap-1 mb-2">
          {logs.map((log, i) => (
            <div key={i} className={`whitespace-pre-wrap break-all ${
              log.type === "command" ? (isDark ? "text-slate-300" : "text-slate-800") :
              log.type === "error" ? (isDark ? "text-red-400" : "text-red-600") :
              log.type === "system" ? (isDark ? "text-blue-400 font-bold" : "text-blue-600 font-bold") :
              (isDark ? "text-green-400" : "text-green-700")
            }`}>
              {log.text}
            </div>
          ))}
        </div>
        
        {/* Input Line */}
        <form onSubmit={handleCommand} className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
          <ChevronRight size={14} className={`shrink-0 ${isDark ? "text-pink-500" : "text-pink-600"}`} />
          <span className={`font-bold shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`}>~/workspace</span>
          <span className="text-slate-500 shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className={`flex-1 bg-transparent border-none outline-none min-w-0 ${isDark ? "text-slate-300" : "text-slate-800"}`}
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </form>
        <div ref={endRef} />
      </div>
    </div>
  );
}
