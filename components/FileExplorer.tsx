"use client";

import React, { useState, useMemo } from "react";
import { Folder, File, FileCode, FileJson, Image as ImageIcon, ChevronRight, ChevronDown, Plus, Trash2, Edit2, FolderPlus, UploadCloud, FolderUp } from "lucide-react";

interface FileExplorerProps {
  files: Record<string, string>;
  activeFile: string;
  onFileSelect: (filename: string) => void;
  onFileCreate: (filename: string) => void;
  onFileDelete: (filename: string) => void;
  onFileRename?: (oldName: string, newName: string) => void;
  onFilesImport?: (files: Record<string, string>) => void;
}

type FileNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: Record<string, FileNode>;
};

export default function FileExplorer({ files, activeFile, onFileSelect, onFileCreate, onFileDelete, onFileRename, onFilesImport }: FileExplorerProps) {
  const [isCreatingFile, setIsCreatingFile] = useState<string | null>(null); // path of parent folder
  const [isCreatingFolder, setIsCreatingFolder] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/"]));

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !onFilesImport) return;
    
    const filesToImport: Record<string, string> = {};
    let filesProcessed = 0;
    const totalFiles = e.target.files.length;
    
    // Determine upload root
    let rootPath = "/";
    if (activeFile && activeFile !== "/") {
      const parts = activeFile.split("/");
      parts.pop();
      rootPath = parts.join("/") + "/";
      if (rootPath === "/") rootPath = "/"; // fix double slash
    }

    Array.from(e.target.files).forEach((file) => {
      // Determine file path
      // if webkitRelativePath exists (folder upload), use it. Otherwise just use filename.
      let relativePath = file.webkitRelativePath || file.name;
      // Ensure we don't have leading slash if rootPath is /
      if (rootPath === "/") {
        relativePath = "/" + relativePath;
      } else {
        relativePath = rootPath + (rootPath.endsWith("/") ? "" : "/") + relativePath;
      }

      const reader = new FileReader();
      
      // Check if image
      if (file.type.startsWith("image/")) {
        reader.onload = (e) => {
          filesToImport[relativePath] = (e.target?.result as string) || "";
          filesProcessed++;
          if (filesProcessed === totalFiles) onFilesImport(filesToImport);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (e) => {
          filesToImport[relativePath] = (e.target?.result as string) || "";
          filesProcessed++;
          if (filesProcessed === totalFiles) onFilesImport(filesToImport);
        };
        reader.readAsText(file);
      }
    });
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (folderInputRef.current) folderInputRef.current.value = "";
  };

  // Build tree from flat files
  const fileTree = useMemo(() => {
    const root: FileNode = { name: "root", path: "/", type: "folder", children: {} };

    Object.keys(files).forEach(filePath => {
      const parts = filePath.split("/").filter(Boolean);
      let current = root;
      let currentPath = "";

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath += "/" + part;
        const isFile = i === parts.length - 1 && !part.endsWith(".keep");

        if (isFile) {
          if (!current.children![part]) {
            current.children![part] = { name: part, path: currentPath, type: "file" };
          }
        } else {
          // It's a folder (or a .keep file representing an empty folder)
          const folderName = part.endsWith(".keep") ? part.replace(".keep", "") : part;
          if (folderName === "") continue; // avoid empty folder names
          
          const folderPath = currentPath.endsWith(".keep") ? currentPath.replace("/.keep", "") : currentPath;

          if (!current.children![folderName]) {
            current.children![folderName] = { name: folderName, path: folderPath, type: "folder", children: {} };
          }
          current = current.children![folderName];
        }
      }
    });
    return root;
  }, [files]);

  const toggleFolder = (path: string, forceExpand?: boolean) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (forceExpand) {
        next.add(path);
      } else {
        if (next.has(path)) next.delete(path);
        else next.add(path);
      }
      return next;
    });
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileCode size={14} className="text-orange-500" />;
    if (filename.endsWith('.css')) return <FileCode size={14} className="text-blue-500" />;
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.jsx') || filename.endsWith('.tsx')) return <FileCode size={14} className="text-yellow-500" />;
    if (filename.endsWith('.json')) return <FileJson size={14} className="text-green-500" />;
    if (filename.match(/\.(png|jpg|jpeg|svg|gif)$/)) return <ImageIcon size={14} className="text-purple-500" />;
    return <File size={14} className="text-slate-400" />;
  };

  const handleCreateSubmit = (e: React.FormEvent, type: "file" | "folder") => {
    e.preventDefault();
    if (newFileName.trim()) {
      let name = newFileName.trim();
      const parent = type === "file" ? isCreatingFile : isCreatingFolder;
      const parentPath = parent === "/" ? "" : parent;
      
      if (type === "folder") {
        onFileCreate(`${parentPath}/${name}/.keep`);
      } else {
        onFileCreate(`${parentPath}/${name}`);
      }
      
      setNewFileName("");
      setIsCreatingFile(null);
      setIsCreatingFolder(null);
      if (parent) toggleFolder(parent, true);
    }
  };

  const handleRenameSubmit = (e: React.FormEvent, oldPath: string) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue !== oldPath.split("/").pop() && onFileRename) {
      const parts = oldPath.split("/");
      parts[parts.length - 1] = renameValue.trim();
      const newPath = parts.join("/");
      onFileRename(oldPath, newPath);
    }
    setRenamingPath(null);
    setRenameValue("");
  };

  const RenderNode = ({ node, level }: { node: FileNode, level: number }) => {
    const isExpanded = expandedFolders.has(node.path);
    const isActive = activeFile === node.path;
    const isRenaming = renamingPath === node.path;
    const paddingLeft = `${level * 12 + 12}px`;

    if (node.type === "file") {
      return (
        <div className="group flex flex-col">
          {isRenaming ? (
            <form onSubmit={(e) => handleRenameSubmit(e, node.path)} className="flex items-center bg-transparent py-1 pr-3" style={{ paddingLeft }}>
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => setRenamingPath(null)}
                className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 ml-4"
              />
            </form>
          ) : (
            <div 
              className={`flex items-center justify-between py-1.5 cursor-pointer text-sm transition-colors rounded-r-md ${isActive ? "bg-pink-200/80 text-pink-900 font-bold border-l-4 border-pink-600 shadow-sm" : "bg-pink-100/30 text-pink-800 border-l-4 border-transparent hover:bg-pink-200/60 hover:text-pink-900"}`}
              style={{ paddingLeft }}
              onClick={() => onFileSelect(node.path)}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="opacity-0 w-3.5 inline-block shrink-0"></span>
                <span className="shrink-0">{getFileIcon(node.name)}</span>
                <span className="text-sm truncate">{node.name}</span>
              </div>
              <div className="hidden group-hover:flex items-center gap-1 pr-2 shrink-0">
                {onFileRename && (
                  <button onClick={(e) => { e.stopPropagation(); setRenamingPath(node.path); setRenameValue(node.name); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-blue-500 transition-opacity" title="Rename">
                    <Edit2 size={12} />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onFileDelete(node.path); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-red-500 transition-opacity" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col">
        {isRenaming && node.path !== "/" ? (
          <form onSubmit={(e) => handleRenameSubmit(e, node.path)} className="flex items-center bg-transparent py-1 pr-3" style={{ paddingLeft }}>
            <input
              autoFocus
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => setRenamingPath(null)}
              className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 ml-4"
            />
          </form>
        ) : (
          <div 
            className="group flex items-center justify-between py-1.5 cursor-pointer text-sm transition-colors rounded-r-md bg-transparent text-pink-800 border-l-4 border-transparent hover:bg-pink-200/40 hover:text-pink-900"
            style={{ paddingLeft }}
            onClick={() => toggleFolder(node.path)}
          >
            <div className="flex items-center gap-1.5 overflow-hidden font-medium">
              <span className="shrink-0">
                {isExpanded ? <ChevronDown size={14} className="text-pink-500/70" /> : <ChevronRight size={14} className="text-pink-500/70" />}
              </span>
              <Folder size={14} className="text-pink-400 shrink-0" fill="currentColor" fillOpacity={0.2} />
              <span className="text-sm truncate">{node.name}</span>
            </div>
            <div className="hidden group-hover:flex items-center gap-1 pr-2 shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setIsCreatingFile(node.path); toggleFolder(node.path, true); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-pink-800 transition-opacity" title="New File">
                <Plus size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsCreatingFolder(node.path); toggleFolder(node.path, true); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-pink-800 transition-opacity" title="New Folder">
                <FolderPlus size={12} />
              </button>
              {node.path !== "/" && onFileRename && (
                <button onClick={(e) => { e.stopPropagation(); setRenamingPath(node.path); setRenameValue(node.name); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-blue-500 transition-opacity" title="Rename Folder">
                  <Edit2 size={12} />
                </button>
              )}
              {node.path !== "/" && (
                <button onClick={(e) => { e.stopPropagation(); onFileDelete(node.path); }} className="opacity-0 group-hover:opacity-100 text-pink-500 hover:text-red-500 transition-opacity" title="Delete Folder">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          </div>
        )}
        
        {isExpanded && (
          <div className="flex flex-col">
            {isCreatingFile === node.path && (
              <form onSubmit={(e) => handleCreateSubmit(e, "file")} className="flex items-center py-1" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
                <span className="opacity-0 w-3.5 inline-block shrink-0"></span>
                <input
                  autoFocus
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={() => setIsCreatingFile(null)}
                  placeholder="new_file.js"
                  className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 ml-1"
                />
              </form>
            )}
            {isCreatingFolder === node.path && (
              <form onSubmit={(e) => handleCreateSubmit(e, "folder")} className="flex items-center py-1" style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}>
                <span className="opacity-0 w-3.5 inline-block shrink-0"></span>
                <input
                  autoFocus
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={() => setIsCreatingFolder(null)}
                  placeholder="new_folder"
                  className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500 ml-1"
                />
              </form>
            )}
            {Object.values(node.children || {}).sort((a, b) => {
              if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
              return a.name.localeCompare(b.name);
            }).map((child) => (
              <RenderNode key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent border-r border-pink-400/30 w-full shrink-0 select-none">
      <div className="flex items-center justify-between px-3 py-2 border-b border-pink-400/70 text-xs font-bold text-pink-700/80 uppercase tracking-wider">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsCreatingFile("/")} className="hover:bg-pink-200/50 p-1 rounded transition text-pink-600 hover:text-pink-900" title="New File">
            <Plus size={14} />
          </button>
          <button onClick={() => setIsCreatingFolder("/")} className="hover:bg-pink-200/50 p-1 rounded transition text-pink-600 hover:text-pink-900" title="New Folder">
            <FolderPlus size={14} />
          </button>
          <div className="w-px h-3 bg-pink-300/50 mx-1"></div>
          <button onClick={() => fileInputRef.current?.click()} className="hover:bg-pink-200/50 p-1 rounded transition text-pink-600 hover:text-pink-900" title="Upload Files">
            <UploadCloud size={14} />
          </button>
          <button onClick={() => folderInputRef.current?.click()} className="hover:bg-pink-200/50 p-1 rounded transition text-pink-600 hover:text-pink-900" title="Upload Folder">
            <FolderUp size={14} />
          </button>
          
          <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <input type="file" multiple ref={folderInputRef} className="hidden" onChange={handleFileUpload} {...{ webkitdirectory: "", directory: "" } as any} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2 custom-scroll bg-transparent">
        {isCreatingFile === "/" && (
          <form onSubmit={(e) => handleCreateSubmit(e, "file")} className="flex items-center py-1 px-3">
            <input autoFocus type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onBlur={() => setIsCreatingFile(null)} placeholder="new_file.js" className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500" />
          </form>
        )}
        {isCreatingFolder === "/" && (
          <form onSubmit={(e) => handleCreateSubmit(e, "folder")} className="flex items-center py-1 px-3">
            <input autoFocus type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} onBlur={() => setIsCreatingFolder(null)} placeholder="new_folder" className="w-full bg-white/70 border border-pink-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-pink-500" />
          </form>
        )}
        {Object.values(fileTree.children || {}).sort((a, b) => {
          if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
          return a.name.localeCompare(b.name);
        }).map(child => (
          <RenderNode key={child.path} node={child} level={0} />
        ))}
      </div>
    </div>
  );
}
