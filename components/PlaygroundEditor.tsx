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
        { token: "keyword", foreground: "db2777", fontStyle: "bold" },      // pink-600
        { token: "identifier", foreground: "1e293b" },                      // slate-800
        { token: "string", foreground: "ca8a04" },                          // yellow-600
        { token: "tag", foreground: "db2777", fontStyle: "bold" },          // pink-600
        { token: "attribute.name", foreground: "ca8a04" },                  // yellow-600
        { token: "attribute.value", foreground: "db2777" },                 // pink-600
        { token: "comment", foreground: "94a3b8", fontStyle: "italic" },    // slate-400
        { token: "number", foreground: "db2777" },                          // pink-600
        { token: "type", foreground: "ca8a04", fontStyle: "bold" },         // yellow-600
        { token: "function", foreground: "ca8a04", fontStyle: "bold" },     // yellow-600
      ],
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
