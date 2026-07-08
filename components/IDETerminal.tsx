"use client";

import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, X, Maximize2, Minimize2, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";

interface IDETerminalProps {
  onClose: () => void;
  files: Record<string, string>;
  roomId: string;
  onFileCreate?: (path: string) => void;
  onFileDelete?: (path: string) => void;
  onFileRename?: (oldPath: string, newPath: string) => void;
}

interface LogEntry {
  type: "command" | "output" | "error" | "system";
  text: string;
}

export default function IDETerminal({ onClose, files, roomId, onFileCreate, onFileDelete, onFileRename }: IDETerminalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/");
  const [logs, setLogs] = useState<LogEntry[]>([
    { type: "system", text: "MantraCode Web Terminal v2.0.0" },
    { type: "system", text: "Type 'help' for a list of available commands." }
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [height, setHeight] = useState(256); 
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
      const delta = startY.current - e.clientY; 
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

  const resolvePath = (p: string) => {
    if (p.startsWith("/")) return p;
    if (p === ".") return cwd;
    if (p === "..") {
      const parts = cwd.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/");
    }
    const cleanCwd = cwd === "/" ? "" : cwd;
    return `${cleanCwd}/${p}`;
  };

  const getSubFolders = (dir: string) => {
    const folders = new Set<string>();
    Object.keys(files).forEach(f => {
      if (f.startsWith(dir === "/" ? "/" : dir + "/")) {
        const relative = f.slice(dir === "/" ? 1 : dir.length + 1);
        const nextSlash = relative.indexOf("/");
        if (nextSlash > -1) {
          folders.add(relative.slice(0, nextSlash));
        } else if (relative.endsWith(".keep")) {
          // It's an empty folder
          folders.add(relative.replace(".keep", ""));
        }
      }
    });
    return Array.from(folders);
  };

  const isFolder = (dir: string) => {
    if (dir === "/") return true;
    return Object.keys(files).some(f => f.startsWith(dir + "/"));
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    setInput("");
    
    setLogs(prev => [...prev, { type: "command", text: `~${cwd}$ ${cmd}` }]);

    // Use regex to properly split by space respecting quotes
    const args = cmd.match(/(?:[^\s"]+|"[^"]*")+/g)?.map(arg => arg.replace(/^"|"$/g, '')) || [];
    const baseCmd = args[0].toLowerCase();

    switch (baseCmd) {
      case "help":
        setLogs(prev => [...prev, { 
          type: "output", 
          text: "Available commands:\n  ls       - List workspace files\n  cd       - Change directory\n  touch    - Create a new file\n  mkdir    - Create a new directory\n  rm       - Remove a file or directory\n  mv       - Rename or move a file/directory\n  cat      - Print file content\n  clear    - Clear terminal output\n  echo     - Print text\n  theme    - Change terminal theme (dark|light|system)\n  git      - Simulated git commands\n  npm      - Simulated node commands" 
        }]);
        break;
      case "clear":
        setLogs([]);
        break;
      case "cd":
        if (!args[1] || args[1] === "~" || args[1] === "/") {
          setCwd("/");
        } else {
          const target = resolvePath(args[1]);
          if (isFolder(target)) {
            setCwd(target);
          } else {
            setLogs(prev => [...prev, { type: "error", text: `cd: no such file or directory: ${args[1]}` }]);
          }
        }
        break;
      case "pwd":
        setLogs(prev => [...prev, { type: "output", text: `/workspace${cwd === '/' ? '' : cwd}` }]);
        break;
      case "ls":
        const currentDirContent = new Set<string>();
        Object.keys(files).forEach(f => {
          const prefix = cwd === "/" ? "/" : cwd + "/";
          if (f.startsWith(prefix)) {
            const rel = f.slice(prefix.length);
            const firstPart = rel.split("/")[0];
            if (firstPart.endsWith(".keep")) {
              currentDirContent.add(firstPart.replace(".keep", "") + "/");
            } else if (rel.includes("/")) {
              currentDirContent.add(firstPart + "/");
            } else {
              currentDirContent.add(firstPart);
            }
          }
        });
        const outFiles = Array.from(currentDirContent).join("  ");
        setLogs(prev => [...prev, { type: "output", text: outFiles || "(empty)" }]);
        break;
      case "cat":
        if (args[1]) {
          const target = resolvePath(args[1]);
          if (files[target] !== undefined) {
            setLogs(prev => [...prev, { type: "output", text: files[target] }]);
          } else {
            setLogs(prev => [...prev, { type: "error", text: `cat: ${args[1]}: No such file or directory` }]);
          }
        } else {
          setLogs(prev => [...prev, { type: "error", text: "cat: missing operand" }]);
        }
        break;
      case "touch":
        if (args[1] && onFileCreate) {
          onFileCreate(resolvePath(args[1]));
        } else if (!args[1]) {
          setLogs(prev => [...prev, { type: "error", text: "touch: missing file operand" }]);
        }
        break;
      case "mkdir":
        if (args[1] && onFileCreate) {
          onFileCreate(resolvePath(args[1]) + "/.keep");
        } else if (!args[1]) {
          setLogs(prev => [...prev, { type: "error", text: "mkdir: missing operand" }]);
        }
        break;
      case "rm":
        if (args[1] && onFileDelete) {
          const isRecursive = args[1] === "-rf" || args[1] === "-r";
          const targetArg = isRecursive ? args[2] : args[1];
          if (!targetArg) {
            setLogs(prev => [...prev, { type: "error", text: "rm: missing operand" }]);
            break;
          }
          const target = resolvePath(targetArg);
          if (isFolder(target) && !isRecursive) {
            setLogs(prev => [...prev, { type: "error", text: `rm: ${targetArg}: is a directory (use -rf)` }]);
          } else {
            onFileDelete(target);
          }
        } else if (!args[1]) {
          setLogs(prev => [...prev, { type: "error", text: "rm: missing operand" }]);
        }
        break;
      case "mv":
        if (args[1] && args[2] && onFileRename) {
          onFileRename(resolvePath(args[1]), resolvePath(args[2]));
        } else {
          setLogs(prev => [...prev, { type: "error", text: "mv: missing file operand" }]);
        }
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
      setLogs(prev => [...prev, { type: "output", text: "" }]); 
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
      <div 
        onMouseDown={handleMouseDown}
        className="h-1.5 w-full bg-transparent hover:bg-pink-500 cursor-row-resize shrink-0 transition-colors absolute top-0 left-0 right-0 z-40"
      />
      
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
        
        <form onSubmit={handleCommand} className={`flex items-center gap-2 ${isDark ? "text-slate-300" : "text-slate-800"}`}>
          <ChevronRight size={14} className={`shrink-0 ${isDark ? "text-pink-500" : "text-pink-600"}`} />
          <span className={`font-bold shrink-0 ${isDark ? "text-blue-400" : "text-blue-600"}`}>~{cwd === '/' ? '' : cwd}</span>
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
