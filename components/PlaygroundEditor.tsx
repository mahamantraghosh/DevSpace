"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import { FileCode, Braces, Terminal } from "lucide-react";
import { useTheme } from "next-themes";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const monacoInstance = useMonaco();

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
    
    monaco.editor.defineTheme("mantracode-light", {
      base: "vs", inherit: true,
      rules: [],
      colors: { "editor.background": "#ffffff40" } // Semi-transparent glass for light mode
    });
    
    monaco.editor.defineTheme("mantracode-dark", {
      base: "vs-dark", inherit: true,
      rules: [],
      colors: { "editor.background": "#00000040" } // Semi-transparent glass for dark mode
    });
    
    monaco.editor.setTheme(theme === "dark" ? "mantracode-dark" : "mantracode-light");
  };

  useEffect(() => {
    if (monacoInstance) {
      monacoInstance.editor.setTheme(theme === "dark" ? "mantracode-dark" : "mantracode-light");
    }
  }, [theme, monacoInstance]);

  const handleEditorChange = (val: string | undefined) => {
    const newValue = val || "";
    
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
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      <div className="flex items-center justify-between border-b border-white/20 bg-white/40 backdrop-blur-md px-4 py-1.5 h-[45px]">
        <div className="flex gap-1">
          {["html", "css", "js"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as "html" | "css" | "js")} className={`px-3 py-1.5 text-xs font-bold rounded-md border transition cursor-pointer ${activeTab === tab ? "bg-white/50 border-white/40 text-pink-600 shadow-sm" : "border-transparent text-slate-500 hover:text-pink-600 hover:bg-white/30"}`}>
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
          height="100%" language={getLanguage()} value={code}
          onChange={handleEditorChange} onMount={handleEditorDidMount}
          options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }}
        />
      </div>
    </div>
  );
}
