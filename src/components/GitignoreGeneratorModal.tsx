import React, { useState, useEffect, useMemo } from 'react';
import { FileNode } from '../types';
import {
  UNIVERSAL_CATEGORIES,
  detectProjectStacks,
  compileGitignoreContent,
} from '../utils/gitignorePresets';

interface GitignoreGeneratorModalProps {
  isOpen: boolean;
  fileStructure: FileNode | null;
  existingGitignoreContent?: string | null;
  onClose: () => void;
  onApply: (content: string) => void;
}

export const GitignoreGeneratorModal: React.FC<GitignoreGeneratorModalProps> = ({
  isOpen,
  fileStructure,
  existingGitignoreContent,
  onClose,
  onApply,
}) => {
  const detectedStacks = useMemo(() => detectProjectStacks(fileStructure), [fileStructure]);

  // Determine initial selected categories based on detected stack
  const initialCategoryIds = useMemo(() => {
    const ids = new Set<string>(['secrets', 'os_editor']);
    detectedStacks.forEach((stack) => {
      stack.categoryIds.forEach((id) => ids.add(id));
    });
    return Array.from(ids);
  }, [detectedStacks]);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(initialCategoryIds);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setSelectedCategoryIds(initialCategoryIds);
  }, [initialCategoryIds, isOpen]);

  if (!isOpen) return null;

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedCategoryIds(UNIVERSAL_CATEGORIES.map((c) => c.id));
  };

  const selectRecommended = () => {
    setSelectedCategoryIds(initialCategoryIds);
  };

  const compiledContent = compileGitignoreContent(selectedCategoryIds);

  const handleApply = () => {
    onApply(compiledContent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg shadow-2xl w-full max-w-2xl text-xs text-[#d4d4d4] flex flex-col max-h-[85vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333] bg-[#1e1e1e] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <i className="fas fa-file-shield text-base"></i>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Generate .gitignore
                {existingGitignoreContent && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans">
                    Existing will be replaced
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-[#888] mt-0.5">
                Automatically protect your repository against leaking private keys, tokens, and build junk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-white p-1 text-base transition-colors"
            title="Close"
          >
            &times;
          </button>
        </div>

        {/* Detected Tech Stack Banner */}
        <div className="px-4 py-2.5 bg-[#202022] border-b border-[#333] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#aaa] font-medium">Auto-Detected Stack:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {detectedStacks.map((stack) => (
                <span
                  key={stack.name}
                  className="bg-[#2d2d2d] border border-[#444] text-white px-2 py-0.5 rounded text-[10.5px] flex items-center gap-1 font-medium shadow-2xs"
                >
                  <i className={stack.icon}></i>
                  <span>{stack.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectRecommended}
              className="text-sky-400 hover:text-sky-300 text-[11px] hover:underline cursor-pointer"
            >
              Reset to Recommended
            </button>
            <span className="text-[#555]">·</span>
            <button
              onClick={selectAll}
              className="text-[#aaa] hover:text-white text-[11px] hover:underline cursor-pointer"
            >
              Select All
            </button>
          </div>
        </div>

        {/* Categories Selection */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {UNIVERSAL_CATEGORIES.map((cat) => {
            const isChecked = selectedCategoryIds.includes(cat.id);
            const isDetected = detectedStacks.some((s) => s.categoryIds.includes(cat.id));

            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`p-3 rounded-md border transition-all cursor-pointer select-none space-y-1 ${
                  isChecked
                    ? 'bg-[#1e1e1e] border-sky-600/50 hover:border-sky-500'
                    : 'bg-[#1b1b1b] border-[#333] hover:border-[#444] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(cat.id)}
                      className="cursor-pointer accent-sky-500 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="font-semibold text-white text-xs">{cat.name}</span>
                    {isDetected && (
                      <span className="text-[9.5px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-sans">
                        Detected
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#777] font-mono">
                    {cat.rules.filter((r) => r && !r.startsWith('#')).length} rules
                  </span>
                </div>
                <p className="text-[11px] text-[#888] pl-6 leading-tight">{cat.description}</p>
              </div>
            );
          })}

          {/* Collapsible Content Preview */}
          <div className="pt-2">
            <button
              onClick={() => setShowPreview((p) => !p)}
              className="text-[11px] text-[#aaa] hover:text-white flex items-center gap-1.5 font-medium transition-colors"
            >
              <i className={`fas ${showPreview ? 'fa-chevron-down' : 'fa-chevron-right'} text-xs`}></i>
              <span>{showPreview ? 'Hide .gitignore Preview' : 'Preview .gitignore Content'}</span>
            </button>

            {showPreview && (
              <pre className="mt-2 bg-[#141414] border border-[#2d2d2d] rounded p-3 text-[10.5px] font-mono text-[#aaa] max-h-48 overflow-y-auto whitespace-pre leading-relaxed animate-in fade-in">
                {compiledContent}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-[#1e1e1e] border-t border-[#333] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#888]">
            {selectedCategoryIds.length} categories active ({selectedCategoryIds.length === 0 ? 'empty file' : 'ready to generate'})
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#333] hover:bg-[#3d3d3d] text-[#ccc] hover:text-white rounded font-medium transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCategoryIds.length === 0}
              className="px-4 py-1.5 bg-[#0066b8] hover:bg-[#005499] disabled:opacity-50 text-white rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
            >
              <i className="fas fa-check"></i>
              <span>Create .gitignore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
