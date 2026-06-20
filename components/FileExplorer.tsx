"use client";

import { useState } from "react";
import { Folder, File, FileCode, FileJson, Image as ImageIcon, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string) => void;
  onFileDelete: (filename: string) => void;
}

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, onFileDelete }: FileExplorerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileCode size={14} className="text-orange-500" />;
    if (filename.endsWith('.css')) return <FileCode size={14} className="text-blue-500" />;
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx')) return <FileCode size={14} className="text-yellow-500" />;
    if (filename.endsWith('.json')) return <FileJson size={14} className="text-green-500" />;
    if (filename.match(/\.(png|jpg|jpeg|svg|gif)$/)) return <ImageIcon size={14} className="text-purple-500" />;
    return <File size={14} className="text-slate-400" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      let name = newFileName.trim();
      if (!name.startsWith('/')) name = '/' + name;
      onFileCreate(name);
      setNewFileName("");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-md border-r border-white/50 w-48 shrink-0 select-none">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/30 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Explorer</span>
        <button 
          onClick={() => setIsCreating(true)}
          className="hover:bg-slate-200/50 p-1 rounded transition text-slate-600 hover:text-slate-900"
          title="New File"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scroll">
        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="px-3 mb-2">
            <input
              autoFocus
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => setIsCreating(false)}
              placeholder="/new-file.js"
              className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </form>
        )}

        {Object.keys(files).sort().map(filename => (
          <div 
            key={filename}
            onClick={() => onFileSelect(filename)}
            className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs transition-colors ${
              activeFile === filename 
                ? "bg-pink-100 text-pink-700 font-bold border-l-2 border-pink-500" 
                : "text-slate-700 hover:bg-slate-100/50 border-l-2 border-transparent hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {getFileIcon(filename)}
              <span className="truncate">{filename.replace(/^\//, '')}</span>
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if(confirm(`Delete ${filename}?`)) onFileDelete(filename);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
