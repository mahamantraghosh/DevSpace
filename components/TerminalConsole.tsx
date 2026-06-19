import React from "react";
import { Terminal as TerminalIcon } from "lucide-react";

interface LogMessage {
  type: "log" | "error" | "info" | "system";
  content: string;
  time: string;
}

export default function TerminalConsole({ logs }: { logs: LogMessage[] }) {
  return (
    <div className="h-40 border-t border-pink-100 bg-white flex flex-col font-mono text-[11px] text-slate-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-pink-50 border-b border-pink-100 text-slate-500 select-none">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5 text-pink-500" />
          <span className="font-bold text-pink-600 uppercase tracking-wider text-[10px]">Console</span>
        </div>
      </div>
      <div className="flex-1 p-2 overflow-y-auto space-y-1 custom-scroll bg-slate-50/50">
        {logs.length === 0 ? (
          <div className="text-slate-400 italic text-[10px]">No logs yet...</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className="flex gap-2 border-b border-slate-100/50 pb-1 mb-1 last:border-0">
              <span className="text-slate-400 shrink-0 select-none">[{log.time}]</span>
              <span className={`break-all ${log.type === "error" ? "text-red-500" :
                  log.type === "system" ? "text-pink-500 font-semibold" :
                    log.type === "info" ? "text-blue-500" :
                      "text-slate-700"
                }`}>
                {log.content}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
