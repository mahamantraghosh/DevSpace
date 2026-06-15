"use client";

import { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import { FileCode, Braces, Terminal } from "lucide-react";

interface PlaygroundEditorProps {
  code: string;
  codeType: "html" | "css" | "js";
  onChange: (val: string) => void;
  activeTab: "html" | "css" | "js";
  setActiveTab: (tab: "html" | "css" | "js") => void;
}

export default function PlaygroundEditor({
  code,
  codeType,
  onChange,
  activeTab,
  setActiveTab
}: PlaygroundEditorProps) {
  const editorRef = useRef<any>(null);

  // Map our internal tab names to Monaco-supported languages
  const getLanguage = () => {
    switch (codeType) {
      case "html":
        return "html";
      case "css":
        return "css";
      case "js":
        return "javascript";
      default:
        return "html";
    }
  };

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;

    // Custom configuration for Monaco theme to blend with dark mode
    monaco.editor.defineTheme("devspace-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6272a4" },
        { token: "keyword", foreground: "ff79c6" },
        { token: "string", foreground: "f1fa8c" },
        { token: "number", foreground: "bd93f9" }
      ],
      colors: {
        "editor.background": "#09090b", // slate-950 equivalent
        "editor.foreground": "#f8fafc",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#38bdf8",
        "editor.lineHighlightBackground": "#1e293b50",
        "editor.selectionBackground": "#334155"
      }
    });

    monaco.editor.setTheme("devspace-dark");
  };

  // Keep code values synced without resetting cursor when incoming sync happens
  useEffect(() => {
    if (editorRef.current) {
      const editorValue = editorRef.current.getValue();
      if (code !== editorValue) {
        const position = editorRef.current.getPosition();
        editorRef.current.setValue(code || "");
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-[#09090b] relative">
      {/* Editor Tabs bar */}
      <div className="flex items-center justify-between border-b border-gray-900 bg-gray-950 px-4 py-1.5 h-[45px] shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("html")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
              activeTab === "html"
                ? "bg-amber-950/20 border-amber-500/30 text-amber-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <FileCode size={14} /> index.html
          </button>
          <button
            onClick={() => setActiveTab("css")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
              activeTab === "css"
                ? "bg-blue-950/20 border-blue-500/30 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Braces size={14} /> styles.css
          </button>
          <button
            onClick={() => setActiveTab("js")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
              activeTab === "js"
                ? "bg-yellow-950/20 border-yellow-500/30 text-yellow-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Terminal size={14} /> script.js
          </button>
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
          Editor ({codeType.toUpperCase()})
        </div>
      </div>

      {/* Monaco Editor container */}
      <div className="flex-1 w-full relative min-h-0">
        <Editor
          height="100%"
          language={getLanguage()}
          value={code}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          loading={
            <div className="absolute inset-0 flex items-center justify-center bg-[#09090b]">
              <span className="text-sm font-semibold text-gray-550">Initializing Monaco Editor...</span>
            </div>
          }
          options={{
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
            wordWrap: "on",
            cursorBlinking: "smooth",
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
            padding: { top: 10, bottom: 10 }
          }}
        />
      </div>
    </div>
  );
}
