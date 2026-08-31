import React, { useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { RepoInfo, Tab } from '../types';

interface EditorAreaProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onContentChange: (value: string) => void;
  editorRef: React.MutableRefObject<any>;
  onOpenFile?: (file: File) => void;
  repoInfo?: RepoInfo | null;
  onBackToRepos?: () => void;
  onCompareFile?: (path: string) => void;
  onDeleteFile?: (path: string, name: string) => void;
  onRevertFile?: (path: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onContentChange,
  editorRef,
  onOpenFile,
  repoInfo = null,
  onBackToRepos,
  onCompareFile,
  onDeleteFile,
  onRevertFile,
}) => {
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onOpenFile) {
      onOpenFile(e.dataTransfer.files[0]);
    }
  };

  // Map editor language string for Monaco
  const getMonacoLanguage = (lang: string): string => {
    const l = lang.toLowerCase();
    if (['xml', 'html'].includes(l)) return 'html';
    if (['js', 'jsx'].includes(l)) return 'javascript';
    if (['ts', 'tsx'].includes(l)) return 'typescript';
    if (['py'].includes(l)) return 'python';
    if (['md'].includes(l)) return 'markdown';
    if (['c', 'cpp', 'c++', 'h', 'cs'].includes(l)) return 'cpp';
    if (['rb'].includes(l)) return 'ruby';
    if (['json'].includes(l)) return 'json';
    if (['yaml', 'yml'].includes(l)) return 'yaml';
    if (['css', 'scss'].includes(l)) return 'css';
    if (['java'].includes(l)) return 'java';
    if (['php'].includes(l)) return 'php';
    if (['sql'].includes(l)) return 'sql';
    if (['go'].includes(l)) return 'go';
    if (['rust', 'rs'].includes(l)) return 'rust';
    return l || 'plaintext';
  };

  return (
    <div className="editor-container flex-1 flex flex-col h-full bg-[#1e1e1e] overflow-hidden">
      {/* Top Tab Bar */}
      <div className="tabs flex bg-[#2d2d2d] border-b border-[#1a1a1a] overflow-x-auto whitespace-nowrap shrink-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab flex items-center px-3.5 py-1.5 cursor-pointer text-xs border-r border-[#1a1a1a] min-w-[120px] max-w-[200px] select-none transition-colors ${
              tab.id === activeTabId
                ? 'active bg-[#1e1e1e] text-white border-t-2 border-t-[#0066b8]'
                : 'bg-[#2d2d2d] text-[#888] hover:bg-[#383838] hover:text-[#d4d4d4]'
            }`}
            onClick={() => onSelectTab(tab.id)}
          >
            <span className="tab-title flex-1 truncate">
              {tab.title}
              {tab.isModified ? ' *' : ''}
            </span>
            <span
              className="tab-close ml-2 text-[#888] hover:text-white rounded hover:bg-[#444] px-1 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onCloseTab(tab.id);
              }}
            >
              &times;
            </span>
          </div>
        ))}

        {tabs.length === 0 && (
          <div className="px-4 py-2 text-xs text-[#666] italic">No active files</div>
        )}
      </div>

      {/* Active File Actions & Breadcrumb Bar */}
      {activeTab && (
        <div className="active-file-bar flex items-center justify-between px-3 py-1 bg-[#252526] border-b border-[#1a1a1a] text-xs text-[#aaa] shrink-0 select-none">
          <div className="flex items-center gap-1.5 truncate max-w-[50%] font-mono text-[11px]">
            <i className="fas fa-file-code text-sky-400"></i>
            <span className="truncate text-white font-medium">{activeTab.path}</span>
            {activeTab.isModified && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans">
                Modified
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onCompareFile && (
              <button
                onClick={() => onCompareFile(activeTab.path)}
                className="bg-[#2d2d2d] hover:bg-[#0066b8] hover:text-white text-[#ccc] border border-[#3d3d3d] px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors"
                title="View visual diff against repository original"
              >
                <i className="fas fa-code-compare text-sky-400"></i>
                <span>Local Diff</span>
              </button>
            )}

            {onRevertFile && activeTab.isModified && (
              <button
                onClick={() => {
                  if (window.confirm(`Discard and revert changes to "${activeTab.title}"?`)) {
                    onRevertFile(activeTab.path);
                  }
                }}
                className="bg-[#2d2d2d] hover:bg-rose-900/60 hover:text-rose-200 text-[#ccc] border border-[#3d3d3d] px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors"
                title="Revert changes to original repository baseline"
              >
                <i className="fas fa-undo text-rose-400"></i>
                <span>Revert</span>
              </button>
            )}

            {onDeleteFile && (
              <button
                onClick={() => onDeleteFile(activeTab.path, activeTab.title)}
                className="bg-[#2d2d2d] hover:bg-rose-900/60 hover:text-rose-200 text-[#ccc] border border-[#3d3d3d] px-2 py-0.5 rounded text-[11px] flex items-center gap-1 transition-colors"
                title="Delete this file"
              >
                <i className="fas fa-trash-alt text-rose-400"></i>
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div
        className="editor flex-1 relative overflow-hidden bg-[#1e1e1e]"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {activeTab ? (
          <Editor
            height="100%"
            language={getMonacoLanguage(activeTab.language)}
            theme="vs-dark"
            value={activeTab.content}
            onChange={(val) => onContentChange(val || '')}
            onMount={handleEditorDidMount}
            options={{
              fontSize: 13,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              minimap: { enabled: typeof window !== 'undefined' && window.innerWidth > 768 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              smoothScrolling: true,
            }}
          />
         ) : repoInfo ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#888] p-6 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#252526] border border-[#3d3d3d] flex items-center justify-center mb-3 shadow-lg p-2.5">
              <img src="/gitlab_logo.png" className="w-full h-full object-contain rounded" referrerPolicy="no-referrer" alt="GitLab Logo" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              {repoInfo.owner}/{repoInfo.repo}
            </h3>
            <p className="text-xs text-[#888] mb-4 leading-relaxed">
              Repository is active on branch <code className="text-sky-300 bg-[#252526] px-1.5 py-0.5 rounded font-mono font-medium">{repoInfo.branch || 'main'}</code>.
              Select a file from the explorer on the left to view or edit its contents.
            </p>
            {onBackToRepos && (
              <button
                onClick={onBackToRepos}
                className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] hover:border-sky-500/50 text-[#d4d4d4] hover:text-white text-xs px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all shadow-xs"
              >
                <i className="fas fa-arrow-left text-[11px] text-sky-400"></i>
                <span className="font-medium">Back to Repositories</span>
              </button>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-[#666] p-6">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-[#3d3d3d] flex items-center justify-center mb-4 p-1.5 bg-[#252526]">
              <img src="/gitlab_logo.png" className="w-full h-full object-contain rounded" referrerPolicy="no-referrer" alt="GitLab Logo" />
            </div>
            <h3 className="text-sm font-semibold text-[#888] mb-1">GitLab Workspace</h3>
            <p className="text-xs max-w-sm">
              Open a file from the toolbar, load a folder, or clone a repository to start coding.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Editor Status Bar */}
      <div className="status-bar bg-[#007acc] text-white text-[11px] px-3 py-0.5 flex items-center justify-between shrink-0 font-sans select-none">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-medium">
            <i className="fas fa-file-code text-[10px]"></i>
            {activeTab ? activeTab.title : 'Ready'}
          </span>
          {activeTab && (
            <span className="bg-emerald-500/30 text-emerald-100 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium">
              <i className="fas fa-check-circle text-[9px]"></i> Auto Saved
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>{activeTab ? activeTab.language.toUpperCase() : 'TEXT'}</span>
        </div>
      </div>
    </div>
  );
};
