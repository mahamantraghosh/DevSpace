"use client";

import { useEffect, useState, useRef } from "react";
import { Play, RotateCw, Terminal, Trash2, Eye } from "lucide-react";

interface LivePreviewProps {
  html: string;
  css: string;
  js: string;
}

interface LogEntry {
  level: "log" | "error" | "warn";
  text: string;
  timestamp: string;
}

export default function LivePreview({ html, css, js }: LivePreviewProps) {
  const [srcDoc, setSrcDoc] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Generate Iframe Content with injected Console overrides and Tailwind CSS
  const updatePreview = () => {
    const timestamp = new Date().toLocaleTimeString();
    
    // Reset logs on fresh recompilation
    setLogs([]);

    const combinedDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* Custom styles from editor */
          ${css}
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
            window.addEventListener('error', function(event) {
              sendLog('error', [event.message]);
            });
          })();
        </script>
      </head>
      <body>
        ${html}
        <script>
          // Evaluate JavaScript safely
          try {
            ${js}
          } catch(err) {
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
    const timer = setTimeout(() => {
      updatePreview();
    }, 600);

    return () => clearTimeout(timer);
  }, [html, css, js]);

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
    <div className="flex flex-col h-full bg-gray-950">
      {/* Live Preview Tabs/Actions */}
      <div className="flex items-center justify-between border-b border-gray-900 bg-gray-950 px-4 py-1.5 h-[45px] shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
          <Eye size={14} className="text-blue-500" /> Live View
        </div>
        <div className="flex gap-2">
          {/* Toggle Developer Console */}
          <button
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md border transition cursor-pointer ${
              isConsoleOpen
                ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-400"
                : "border-gray-850 bg-gray-900 text-gray-400 hover:text-white"
            }`}
          >
            <Terminal size={12} />
            Console {logs.length > 0 && `(${logs.length})`}
          </button>

          {/* Refresh Action */}
          <button
            onClick={updatePreview}
            className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md border border-gray-850 bg-gray-900 text-gray-400 hover:text-white transition cursor-pointer"
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
            className="w-full h-full border-none"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-gray-500">
            Generating live environment...
          </div>
        )}
      </div>

      {/* Developer Console Drawer */}
      {isConsoleOpen && (
        <div className="h-48 border-t border-gray-900 bg-gray-950 flex flex-col shrink-0">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/60 border-b border-gray-900/40">
            <div className="flex items-center gap-2 text-xs font-bold font-mono text-gray-400 uppercase tracking-wider">
              <Terminal size={14} className="text-green-500" /> Web Console
            </div>
            <button
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
              className="text-gray-500 hover:text-white disabled:opacity-40 transition cursor-pointer"
              title="Clear Logs"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="flex-1 p-3 font-mono text-xs overflow-y-auto space-y-2 select-text selection:bg-indigo-950 select-auto">
            {logs.length === 0 ? (
              <div className="text-gray-600 text-center py-8">
                No logs. Click the interactive elements inside the preview window to trigger script execution.
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 border-b border-gray-900/30 pb-1.5 ${
                    log.level === "error"
                      ? "text-red-400 bg-red-950/5 px-2 py-0.5 rounded"
                      : log.level === "warn"
                      ? "text-amber-400 bg-amber-950/5 px-2 py-0.5 rounded"
                      : "text-gray-300"
                  }`}
                >
                  <span className="text-[10px] text-gray-650 select-none">{log.timestamp}</span>
                  <span className="font-semibold select-none">
                    {log.level === "error" ? "✖" : log.level === "warn" ? "⚠" : "›"}
                  </span>
                  <pre className="flex-1 whitespace-pre-wrap font-sans">{log.text}</pre>
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
