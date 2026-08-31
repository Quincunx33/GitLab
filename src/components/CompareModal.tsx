import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { getMonacoLanguage, getLanguageFromFilename, getFileIconClass } from '../utils/fileIcons';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string | null;
  status?: string;
  originalContent: string;
  modifiedContent: string;
  isStaged: boolean;
  onStageFile?: (path: string) => void;
  onUnstageFile?: (path: string) => void;
  onRevertFile?: (path: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  filePath,
  status = 'modified',
  originalContent,
  modifiedContent,
  isStaged,
  onStageFile,
  onUnstageFile,
  onRevertFile,
}) => {
  const [renderSideBySide, setRenderSideBySide] = useState<boolean>(true);

  if (!isOpen || !filePath) return null;

  const fileName = filePath.split('/').pop() || filePath;
  const langKey = getLanguageFromFilename(fileName);
  const monacoLang = getMonacoLanguage(langKey);
  const iconClass = getFileIconClass(fileName);

  const origLines = originalContent ? originalContent.split('\n').length : 0;
  const modLines = modifiedContent ? modifiedContent.split('\n').length : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-2 md:p-6 overflow-hidden">
      <div className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#d4d4d4]">
        {/* Modal Header */}
        <div className="bg-[#252526] px-4 py-3 border-b border-[#3d3d3d] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3 truncate">
            <i className="fas fa-code-compare text-sky-400 text-lg hidden sm:inline-block"></i>
            <i className={iconClass}></i>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">{fileName}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    status === 'modified'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : status === 'added'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {status}
                </span>
                {isStaged && (
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-medium">
                    Staged
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[#888] truncate">{filePath}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle Side-by-Side vs Inline */}
            <button
              onClick={() => setRenderSideBySide((prev) => !prev)}
              className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] text-xs px-2.5 py-1 rounded flex items-center gap-1.5 text-white transition-colors"
              title="Toggle Layout View"
            >
              <i className={`fas ${renderSideBySide ? 'fa-columns' : 'fa-align-left'}`}></i>
              <span className="hidden sm:inline">
                {renderSideBySide ? 'Side by Side' : 'Inline Diff'}
              </span>
            </button>

            {/* Revert Changes Action */}
            {onRevertFile && status !== 'added' && (
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to revert all changes to "${fileName}"?`)) {
                    onRevertFile(filePath);
                    onClose();
                  }
                }}
                className="bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                title="Discard and revert local edits"
              >
                <i className="fas fa-undo"></i> Revert
              </button>
            )}

            {/* Stage / Unstage Quick Action */}
            {isStaged ? (
              onUnstageFile && (
                <button
                  onClick={() => {
                    onUnstageFile(filePath);
                  }}
                  className="bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-200 text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                  title="Unstage File"
                >
                  <i className="fas fa-minus"></i> Unstage
                </button>
              )
            ) : (
              onStageFile && (
                <button
                  onClick={() => {
                    onStageFile(filePath);
                  }}
                  className="bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 text-xs px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
                  title="Stage File"
                >
                  <i className="fas fa-plus"></i> Stage
                </button>
              )
            )}

            <button
              onClick={onClose}
              className="text-[#888] hover:text-white hover:bg-[#333] p-1.5 rounded-lg text-lg transition-colors leading-none"
              title="Close Diff View (Esc)"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Labels Banner */}
        <div className="bg-[#181818] border-b border-[#2d2d2d] px-4 py-1.5 text-[11px] flex justify-between text-[#888] font-mono select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Original (Repository Baseline) &mdash; {origLines} lines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Modified (Local Working Tree) &mdash; {modLines} lines</span>
          </div>
        </div>

        {/* Diff Editor Body */}
        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
          <DiffEditor
            original={originalContent}
            modified={modifiedContent}
            language={monacoLang}
            theme="vs-dark"
            height="100%"
            options={{
              readOnly: true,
              automaticLayout: true,
              renderSideBySide: renderSideBySide,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
              wordWrap: 'on',
              lineNumbers: 'on',
            }}
          />
        </div>

        {/* Footer */}
        <div className="bg-[#252526] border-t border-[#3d3d3d] px-4 py-2 flex items-center justify-between text-xs text-[#888] shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <i className="fas fa-info-circle text-sky-400"></i>
            <span>Visual diff comparing repository original vs local working copy</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded transition-colors"
          >
            Close Diff View
          </button>
        </div>
      </div>
    </div>
  );
};
