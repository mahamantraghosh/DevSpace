"use client";

import { useEffect, useState, useRef } from "react";
import { Play, RotateCw, Terminal, Trash2, Eye } from "lucide-react";

interface LivePreviewProps {
  files?: Record<string, string>;
  activeFile?: string;
}

interface LogEntry {
  level: "log" | "error" | "warn";
  text: string;
  timestamp: string;
}

export default function LivePreview({ files = {}, activeFile }: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Generate Iframe Content with injected Console overrides and Tailwind CSS
  const updatePreview = () => {
    const timestamp = new Date().toLocaleTimeString();

    // Reset logs on fresh recompilation
    setLogs([]);

    // Intelligently find the primary HTML and CSS files
    const htmlFileKey = Object.keys(files).find(f => f.endsWith('.html')) || "/index.html";
    let htmlContent = files[htmlFileKey] || "";

    // Concatenate all CSS files
    const cssContent = Object.keys(files)
      .filter(f => f.endsWith('.css'))
      .map(f => files[f])
      .join('\n\n');

    // Concatenate all JS files (except HTML of course)
    const jsContent = Object.keys(files)
      .filter(f => f.endsWith('.js'))
      .map(f => files[f])
      .join('\n\n');

    const combinedDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Custom styles from editor */
          ${cssContent}
        </style>
        <script>
          // Override Console Logger inside Iframe
          (function() {
            const sendLog = (level, args) => {
              window.parent.postMessage({
                type: 'DEVSPACE_CONSOLE_LOG',
                level: level,
                text: args.map(arg => {
                  if (typeof arg === 'object') {
                    try { return JSON.stringify(arg, null, 2); } catch(e) {}
                  }
                  return String(arg);
                }).join(' ')
              }, '*');
            };

            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;

            console.log = function(...args) {
              sendLog('log', args);
              originalLog.apply(console, args);
            };
            console.warn = function(...args) {
              sendLog('warn', args);
              originalWarn.apply(console, args);
            };
            console.error = function(...args) {
              sendLog('error', args);
              originalError.apply(console, args);
            };

            // Global error catcher
            window.onerror = function(message, source, lineno, colno, error) {
              sendLog('error', [message]);
              return false;
            };
          })();
        </script>
      </head>
      <body>
        ${htmlContent}
        <script>
          try {
            ${jsContent}
          } catch (err) {
            console.error(err.message);
          }
        </script>
      </body>
      </html>
    `;
    setSrcDoc(combinedDoc);
  };

  // Debounced live preview rendering (triggers 600ms after user stops typing)
  useEffect(() => {
    // Initial compile delay to prevent flashing
    const timer = setTimeout(() => {
      updatePreview();
    }, 800);
    return () => clearTimeout(timer);
  }, [files, activeFile]);

  // Listen to messages from the Iframe sandbox console
  useEffect(() => {
    const handleConsoleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "DEVSPACE_CONSOLE_LOG") {
        const newLog: LogEntry = {
          level: event.data.level,
          text: event.data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        setLogs((prev) => [...prev, newLog]);
      }
    };

    window.addEventListener("message", handleConsoleMessage);
    return () => window.removeEventListener("message", handleConsoleMessage);
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#fffafa]">
      {/* Live Preview Tabs/Actions */}
      <div className="flex items-center justify-between border-b border-pink-100 bg-white px-4 py-1.5 h-[45px] shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Play size={14} className="text-emerald-600 fill-emerald-600/30" /> 
          <span className="text-pink-700 font-bold">Live Preview</span>
        </div>
        <div className="flex gap-2">
          {/* Toggle Developer Console */}
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-md border transition cursor-pointer ${isConsoleOpen
              ? "bg-pink-50 border-pink-200 text-pink-600"
              : "border-slate-200 bg-white text-slate-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50"
              }`}
          >
            <Terminal size={12} />
            Console {logs.length > 0 && `(${logs.length})`}
          </button>

          {/* Refresh Action */}
          <button
            onClick={updatePreview}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-md border border-slate-200 bg-white text-slate-500 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition cursor-pointer"
          >
            <RotateCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Output Render Frame */}
      <div className="flex-1 w-full relative bg-white min-h-0">
        {srcDoc ? (
          <iframe
            srcDoc={srcDoc}
            title="DevSpace Live Sandbox Output"
            sandbox="allow-scripts"
            className="w-full h-full border-none bg-white"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-pink-50/50 text-slate-400 font-medium">
            Generating live environment...
          </div>
        )}
      </div>

      {/* Developer Console Drawer */}
      {isConsoleOpen && (
        <div className="h-48 border-t border-pink-100 bg-white flex flex-col shrink-0 shadow-inner">
          <div className="flex items-center justify-between px-4 py-2 bg-pink-50 border-b border-pink-100">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-pink-600 uppercase tracking-wider">
              <Terminal size={14} className="text-pink-500" /> Web Console
            </div>
            <button
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
              className="text-slate-400 hover:text-pink-600 disabled:opacity-40 transition cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 select-text selection:bg-pink-100 select-auto custom-scroll bg-[#fffafa]">
            {logs.length === 0 ? (
              <div className="text-slate-400 text-center py-8 italic">
                No logs. Click the interactive elements inside the preview window to trigger script execution.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 border-b border-pink-50 pb-1.5 ${log.level === "error"
                    ? "text-red-500 bg-red-50 px-2 py-1 rounded-md"
                    : log.level === "warn"
                      ? "text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md"
                      : "text-slate-700"
                    }`}
                >
                  <span className="text-[10px] text-slate-400 select-none">[{log.timestamp}]</span>
                  <span className="font-semibold select-none">
                    {log.level === "error" ? "✖" : log.level === "warn" ? "⚠" : "›"}
                  </span>
                  <pre className="flex-1 whitespace-pre-wrap font-sans font-medium">{log.text}</pre>
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
