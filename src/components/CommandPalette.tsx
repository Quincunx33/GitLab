import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FileNode } from '../types';
import { Search, FileText, X, Terminal, HelpCircle, Code, GitCommit, Settings, ChevronRight } from 'lucide-react';

interface CommandPaletteProps {
  fileStructure: FileNode | null;
  onFileSelect: (node: FileNode) => void;
  isOpen: boolean;
  onClose: () => void;
  mode: 'command' | 'shortcuts' | 'search';
}

interface FlatFile {
  name: string;
  path: string;
  node: FileNode;
}

const SHORTCUTS = [
  { key: 'Ctrl + P', description: 'Search Files (Command Palette)' },
  { key: 'Ctrl + Shift + F', description: 'Global Search (Coming Soon)' },
  { key: 'Ctrl + S', description: 'Save Active File' },
  { key: 'Ctrl + W', description: 'Close Active Tab' },
  { key: 'Ctrl + /', description: 'Toggle Keyboard Shortcuts Help' },
  { key: 'Esc', description: 'Close Overlays/Modals' }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  fileStructure,
  onFileSelect,
  isOpen,
  onClose,
  mode
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const flatFiles = useMemo(() => {
    const result: FlatFile[] = [];
    const traverse = (node: FileNode) => {
      if (node.type === 'file') {
        result.push({ name: node.name, path: node.path, node });
      }
      if (node.children) {
        Object.values(node.children).forEach(traverse);
      }
    };
    if (fileStructure) {
      if (fileStructure.children) {
        Object.values(fileStructure.children).forEach(traverse);
      } else {
        traverse(fileStructure);
      }
    }
    return result;
  }, [fileStructure]);

  const filteredFiles = useMemo(() => {
    if (!query) return flatFiles.slice(0, 20);
    const q = query.toLowerCase();
    return flatFiles
      .filter((f) => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [flatFiles, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
      
      if (mode === 'command' || mode === 'search') {
        if (e.key === 'ArrowDown') {
          setSelectedIndex((prev) => Math.min(prev + 1, filteredFiles.length - 1));
          e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          e.preventDefault();
        }
        if (e.key === 'Enter' && filteredFiles[selectedIndex]) {
          onFileSelect(filteredFiles[selectedIndex].node);
          onClose();
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredFiles, selectedIndex, onClose, onFileSelect, mode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-[#1e1e1e] border border-[#333] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'command' && (
          <>
            <div className="flex items-center px-4 py-3 border-b border-[#333] bg-[#252526]">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 outline-none text-lg"
                placeholder="Search files by name or path..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredFiles.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No files found matching "{query}"
                </div>
              ) : (
                filteredFiles.map((file, idx) => (
                  <div
                    key={file.path}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                      idx === selectedIndex ? 'bg-[#0066b8] text-white' : 'text-gray-300 hover:bg-[#2a2d2e]'
                    }`}
                    onClick={() => {
                      onFileSelect(file.node);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <FileText className={`w-4 h-4 mr-3 ${idx === selectedIndex ? 'text-white' : 'text-gray-400'}`} />
                    <div className="flex flex-col overflow-hidden">
                      <span className="truncate font-medium">{file.name}</span>
                      <span className={`text-xs truncate ${idx === selectedIndex ? 'text-blue-200' : 'text-gray-500'}`}>
                        {file.path}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-4 py-2 border-t border-[#333] text-xs text-gray-500 flex items-center justify-between bg-[#1e1e1e]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><kbd className="bg-[#333] px-1.5 py-0.5 rounded text-gray-300">↑</kbd><kbd className="bg-[#333] px-1.5 py-0.5 rounded text-gray-300">↓</kbd> to navigate</span>
                <span className="flex items-center gap-1"><kbd className="bg-[#333] px-1.5 py-0.5 rounded text-gray-300">Enter</kbd> to open</span>
              </div>
              <span className="flex items-center gap-1"><kbd className="bg-[#333] px-1.5 py-0.5 rounded text-gray-300">Esc</kbd> to close</span>
            </div>
          </>
        )}

        {mode === 'shortcuts' && (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#333] bg-[#252526]">
              <div className="flex items-center">
                <Terminal className="w-5 h-5 text-blue-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-100">Keyboard Shortcuts</h2>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {SHORTCUTS.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#2a2d2e] transition-colors border border-transparent hover:border-[#333]">
                  <span className="text-gray-300">{shortcut.description}</span>
                  <kbd className="bg-[#333] border border-[#444] px-2 py-1 rounded text-sm text-gray-200 font-mono shadow-sm">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
