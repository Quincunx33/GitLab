import React, { useState } from 'react';
import { FileConflictItem, FileConflictModalState } from '../types';
import { getFileIconClass } from '../utils/fileIcons';

interface FileConflictModalProps {
  modalState: FileConflictModalState;
  onClose: () => void;
  onConfirm: (resolvedConflicts: FileConflictItem[]) => void;
}

export const FileConflictModal: React.FC<FileConflictModalProps> = ({
  modalState,
  onClose,
  onConfirm,
}) => {
  const { isOpen, sourceType, conflicts, nonConflictingFiles, folderName } = modalState;

  // Local state for actions of each conflicting file
  const [items, setItems] = useState<FileConflictItem[]>(() =>
    conflicts.map((c) => ({ ...c }))
  );

  // Sync state if modalState conflicts change
  React.useEffect(() => {
    setItems(conflicts.map((c) => ({ ...c })));
  }, [conflicts]);

  // Preview state for diff / content comparison
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (!isOpen || items.length === 0) {
    return null;
  }

  const setAllActions = (action: 'overwrite' | 'keep_both' | 'skip') => {
    setItems((prev) => prev.map((item) => ({ ...item, action })));
  };

  const updateItemAction = (index: number, action: 'overwrite' | 'keep_both' | 'skip') => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], action };
      return next;
    });
  };

  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const overwriteCount = items.filter((i) => i.action === 'overwrite').length;
  const keepBothCount = items.filter((i) => i.action === 'keep_both').length;
  const skipCount = items.filter((i) => i.action === 'skip').length;

  const handleApply = () => {
    onConfirm(items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg shadow-2xl w-full max-w-2xl text-xs text-[#d4d4d4] flex flex-col max-h-[85vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#1e1e1e] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <i className="fas fa-copy text-base"></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Existing File Conflict Detected
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
                  {items.length} {items.length === 1 ? 'collision' : 'collisions'}
                </span>
              </h3>
              <p className="text-[11px] text-[#888] mt-0.5">
                {sourceType === 'folder'
                  ? `Importing folder "${folderName || 'folder'}" contains files that already exist in your workspace.`
                  : 'The file you are opening already exists in your workspace. Choose how to rewrite or handle the file:'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white p-1 text-base transition-colors"
            title="Cancel import"
          >
            &times;
          </button>
        </div>

        {/* Global Bulk Control Actions */}
        <div className="px-4 py-2.5 bg-[#2a2a2b] border-b border-[#333] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] text-[#aaa] font-medium">
            Bulk Action for all {items.length} conflicts:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAllActions('overwrite')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                overwriteCount === items.length
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : 'bg-[#333] hover:bg-[#3d3d3d] border-[#444] text-[#ccc]'
              }`}
              title="Replace all existing files with newly imported ones"
            >
              <i className="fas fa-rotate"></i>
              <span>Rewrite All</span>
            </button>
            <button
              onClick={() => setAllActions('keep_both')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                keepBothCount === items.length
                  ? 'bg-sky-600 border-sky-500 text-white'
                  : 'bg-[#333] hover:bg-[#3d3d3d] border-[#444] text-[#ccc]'
              }`}
              title="Keep existing files and auto-rename imported files"
            >
              <i className="fas fa-clone"></i>
              <span>Keep Both All</span>
            </button>
            <button
              onClick={() => setAllActions('skip')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1.5 ${
                skipCount === items.length
                  ? 'bg-zinc-600 border-zinc-500 text-white'
                  : 'bg-[#333] hover:bg-[#3d3d3d] border-[#444] text-[#ccc]'
              }`}
              title="Keep existing files and do not import these"
            >
              <i className="fas fa-forward"></i>
              <span>Skip All</span>
            </button>
          </div>
        </div>

        {/* Conflicting Files List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {items.map((item, idx) => {
            const isPreviewOpen = previewIndex === idx;

            return (
              <div
                key={item.targetPath || idx}
                className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-md p-3 space-y-2.5 hover:border-[#4d4d4d] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <i className={`${getFileIconClass(item.name)} text-base shrink-0`}></i>
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate text-xs flex items-center gap-1.5">
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-[#777] font-mono">({item.targetPath})</span>
                      </div>
                      <div className="text-[10.5px] text-[#888] flex items-center gap-2 mt-0.5">
                        <span>
                          Existing:{' '}
                          <span className="text-[#bbb] font-mono font-medium">
                            {formatBytes(item.existingSize)}
                          </span>
                        </span>
                        <span>&rarr;</span>
                        <span>
                          Incoming:{' '}
                          <span className="text-sky-300 font-mono font-medium">
                            {formatBytes(item.incomingSize)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Per-item action selector */}
                  <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                    <button
                      onClick={() => updateItemAction(idx, 'overwrite')}
                      className={`px-2 py-1 rounded text-[10.5px] font-medium border flex items-center gap-1 transition-colors ${
                        item.action === 'overwrite'
                          ? 'bg-amber-600 border-amber-500 text-white shadow-xs'
                          : 'bg-[#2a2a2a] hover:bg-[#333] border-[#3d3d3d] text-[#bbb]'
                      }`}
                      title="Rewrite / overwrite the existing file with the incoming content"
                    >
                      <i className="fas fa-pencil-alt text-[10px]"></i>
                      <span>Rewrite (Replace)</span>
                    </button>

                    <button
                      onClick={() => updateItemAction(idx, 'keep_both')}
                      className={`px-2 py-1 rounded text-[10.5px] font-medium border flex items-center gap-1 transition-colors ${
                        item.action === 'keep_both'
                          ? 'bg-sky-600 border-sky-500 text-white shadow-xs'
                          : 'bg-[#2a2a2a] hover:bg-[#333] border-[#3d3d3d] text-[#bbb]'
                      }`}
                      title="Keep existing and auto-rename the imported file"
                    >
                      <i className="fas fa-clone text-[10px]"></i>
                      <span>Keep Both</span>
                    </button>

                    <button
                      onClick={() => updateItemAction(idx, 'skip')}
                      className={`px-2 py-1 rounded text-[10.5px] font-medium border flex items-center gap-1 transition-colors ${
                        item.action === 'skip'
                          ? 'bg-zinc-600 border-zinc-500 text-white shadow-xs'
                          : 'bg-[#2a2a2a] hover:bg-[#333] border-[#3d3d3d] text-[#bbb]'
                      }`}
                      title="Skip importing this file"
                    >
                      <i className="fas fa-forward text-[10px]"></i>
                      <span>Skip</span>
                    </button>

                    <button
                      onClick={() => setPreviewIndex(isPreviewOpen ? null : idx)}
                      className={`p-1 rounded text-[11px] border ml-1 transition-colors ${
                        isPreviewOpen
                          ? 'bg-sky-950/80 text-sky-300 border-sky-500'
                          : 'bg-[#2a2a2a] text-[#888] hover:text-[#ddd] border-[#3d3d3d]'
                      }`}
                      title="Toggle preview of existing vs incoming content"
                    >
                      <i className={`fas ${isPreviewOpen ? 'fa-chevron-up' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Content Comparison Preview Drawer */}
                {isPreviewOpen && (
                  <div className="pt-2 border-t border-[#333] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] animate-in fade-in">
                    <div className="space-y-1">
                      <div className="font-semibold text-[#aaa] flex items-center gap-1">
                        <i className="fas fa-file-lines text-amber-400"></i> Current Existing Content
                      </div>
                      <pre className="bg-[#141414] border border-[#2a2a2a] p-2 rounded text-[#999] font-mono max-h-32 overflow-auto whitespace-pre-wrap break-all leading-tight">
                        {item.existingContent?.slice(0, 500) || '(empty)'}
                        {(item.existingContent?.length || 0) > 500 && '\n... (truncated)'}
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold text-[#aaa] flex items-center gap-1">
                        <i className="fas fa-file-import text-sky-400"></i> Incoming Imported Content
                      </div>
                      <pre className="bg-[#141414] border border-[#2a2a2a] p-2 rounded text-sky-200/90 font-mono max-h-32 overflow-auto whitespace-pre-wrap break-all leading-tight">
                        {item.incomingContent?.slice(0, 500) || '(empty)'}
                        {(item.incomingContent?.length || 0) > 500 && '\n... (truncated)'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {nonConflictingFiles && nonConflictingFiles.length > 0 && (
            <div className="p-2.5 bg-[#1a1a1a] border border-[#2d2d2d] rounded-md text-[11px] text-[#aaa] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fas fa-check-circle text-emerald-400"></i>
                <span>{nonConflictingFiles.length} new non-conflicting files will be imported seamlessly.</span>
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-[#888]">
            Plan:{' '}
            <span className="text-amber-400 font-medium">{overwriteCount} Rewrite</span>
            {' · '}
            <span className="text-sky-400 font-medium">{keepBothCount} Keep Both</span>
            {' · '}
            <span className="text-zinc-400 font-medium">{skipCount} Skip</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#333] hover:bg-[#3d3d3d] text-[#ccc] rounded font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-[#0066b8] hover:bg-[#005499] text-white rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <i className="fas fa-check"></i>
              <span>Apply & Import</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
