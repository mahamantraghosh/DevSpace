"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { FileCode, Braces, Terminal } from "lucide-react";

interface PlaygroundEditorProps {
  code: string;
  codeType: "html" | "css" | "js";
  onChange: (val: string) => void;
  activeTab: "html" | "css" | "js";
  setActiveTab: (tab: "html" | "css" | "js") => void;
  roomId: string;
  username: string;
}

export default function PlaygroundEditor({
  code,
  codeType,
  onChange,
  activeTab,
  setActiveTab,
  roomId,
  username
}: PlaygroundEditorProps) {
  const editorRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const broadcastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localCode, setLocalCode] = useState(code);

  const getLanguage = () => {
    switch (codeType) {
      case "html": return "html";
      case "css": return "css";
      case "js": return "javascript";
      default: return "html";
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("devspace-dark", {
      base: "vs-dark", inherit: true,
      rules: [],
      colors: { "editor.background": "#09090b" }
    });
    monaco.editor.setTheme("devspace-dark");
  };

  const handleEditorChange = (val: string | undefined) => {
    const newValue = val || "";
    setLocalCode(newValue);
    
    // Update parent state immediately for local UI (preview)
    onChange(newValue);

    // Typing status via API
    if (roomId && username) {
      // We don't debounce typing status start, but we do debounce stop
      fetch(`/api/room/${roomId}/action`, {
        method: "POST",
        body: JSON.stringify({
          type: "typing-status",
          payload: { username, isTyping: true }
        })
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          body: JSON.stringify({
            type: "typing-status",
            payload: { username, isTyping: false }
          })
        });
      }, 2000);

      // Debounce the code broadcast
      if (broadcastTimeoutRef.current) clearTimeout(broadcastTimeoutRef.current);
      broadcastTimeoutRef.current = setTimeout(async () => {
        await fetch(`/api/room/${roomId}/action`, {
          method: "POST",
          body: JSON.stringify({
            type: "editor-change",
            payload: { codeType, value: newValue }
          })
        });
      }, 500); // 500ms debounce
    }
  };

  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code || "");
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">
      <div className="flex items-center justify-between border-b border-gray-900 bg-gray-950 px-4 py-1.5 h-[45px]">
        <div className="flex gap-1">
          {["html", "css", "js"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${activeTab === tab ? "bg-blue-950/20 border-blue-500/30 text-blue-400" : "border-transparent text-gray-400"}`}>
              {tab === "html" && <FileCode size={14} className="inline mr-1" />}
              {tab === "css" && <Braces size={14} className="inline mr-1" />}
              {tab === "js" && <Terminal size={14} className="inline mr-1" />}
              index.{tab}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <Editor
          height="100%" language={getLanguage()} value={localCode}
          onChange={handleEditorChange} onMount={handleEditorDidMount}
          options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
        />
      </div>
    </div>
  );
}
