"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { Monaco, useMonaco } from "@monaco-editor/react";
import { FileCode, Braces, Terminal } from "lucide-react";
import { useTheme } from "next-themes";

interface PlaygroundEditorProps {
  code: string;
  codeType: string;
  onChange: (val: string) => void;
}

export default function PlaygroundEditor({
  code,
  codeType,
  onChange
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
      rules: [
        { token: "", foreground: "1e3a8a", fontStyle: "bold" },             // Default plain text (e.g., inside <p> tags)
        { token: "keyword", foreground: "be185d", fontStyle: "bold" },      // pink-700 (Deep prominent pink)
        { token: "identifier", foreground: "1e3a8a", fontStyle: "bold" },   // blue-900 (Deep Royal Blue for contrast instead of black)
        { token: "string", foreground: "6d28d9", fontStyle: "bold" },       // violet-700 (Deep violet contrast)
        { token: "tag", foreground: "be185d", fontStyle: "bold" },          // pink-700
        { token: "attribute.name", foreground: "4338ca", fontStyle: "bold" }, // indigo-700 (Contrasting dark blue)
        { token: "attribute.value", foreground: "be185d" },                 // pink-700
        { token: "comment", foreground: "15803d", fontStyle: "italic bold" }, // green-700 (Deep green as requested)
        { token: "number", foreground: "c026d3", fontStyle: "bold" },       // fuchsia-600
        { token: "type", foreground: "4338ca", fontStyle: "bold" },         // indigo-700
        { token: "function", foreground: "6d28d9", fontStyle: "bold" },     // violet-700
      ],
      colors: { 
        "editor.background": "#ffffff40",
        "editor.foreground": "#1e3a8a"
      } // Semi-transparent glass for light mode
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

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
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
