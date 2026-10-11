import React, { useState } from 'react';
import { SensitiveScanFinding } from '../utils/sensitiveScanner';
import { getFileIconClass } from '../utils/fileIcons';

interface SensitiveScanModalProps {
  isOpen: boolean;
  findings: SensitiveScanFinding[];
  totalFileCount: number;
  onCancel: () => void;
  onProceedAnyway: () => void;
  onExcludeAndPush: (excludedPaths: string[]) => void;
}

export const SensitiveScanModal: React.FC<SensitiveScanModalProps> = ({
  isOpen,
  findings,
  totalFileCount,
  onCancel,
  onProceedAnyway,
  onExcludeAndPush,
}) => {
  // Track which findings to exclude (defaults to excluding all findings)
  const [selectedExcludes, setSelectedExcludes] = useState<Set<string>>(() =>
    new Set(findings.map((f) => f.path))
  );

  const [confirmRiskChecked, setConfirmRiskChecked] = useState(false);

  // Sync state when findings update
  React.useEffect(() => {
    setSelectedExcludes(new Set(findings.map((f) => f.path)));
    setConfirmRiskChecked(false);
  }, [findings]);

  if (!isOpen || findings.length === 0) {
    return null;
  }

  const toggleExclude = (path: string) => {
    setSelectedExcludes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleExcludeAndPush = () => {
    onExcludeAndPush(Array.from(selectedExcludes));
  };

  const hasCritical = findings.some((f) => f.riskLevel === 'critical');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-[#1f1d1d] border border-rose-900/60 rounded-lg shadow-2xl w-full max-w-xl text-xs text-[#d4d4d4] flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3d2b2b] bg-[#271919] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
              <i className="fas fa-shield-halved text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-rose-300">
                  Sensitive Files & Secrets Detected
                </h3>
                <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.2 rounded font-mono font-bold uppercase">
                  {findings.length} Flagged
                </span>
              </div>
              <p className="text-[11px] text-[#aaa] mt-0.5">
                The scanner detected potential secrets or private configuration files in this commit.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-[#888] hover:text-white p-1 text-base transition-colors"
            title="Cancel push"
          >
            &times;
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-3 bg-rose-950/40 border-b border-rose-900/40 text-[11px] text-rose-200/90 leading-relaxed shrink-0 flex items-start gap-2">
          <i className="fas fa-triangle-exclamation text-rose-400 mt-0.5 shrink-0 text-xs"></i>
          <div>
            Pushing private keys, API tokens, or <code className="bg-[#111] px-1 py-0.2 rounded text-rose-300">.env</code> files to GitHub can expose them publicly or compromise your cloud accounts.
          </div>
        </div>

        {/* List of Flagged Files */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#888] pb-1 border-b border-[#333]">
            <span>Flagged Files ({findings.length})</span>
            <span className="text-[10px]">Check to exclude from commit</span>
          </div>

          {findings.map((finding) => {
            const isExcluded = selectedExcludes.has(finding.path);

            return (
              <div
                key={finding.path}
                onClick={() => toggleExclude(finding.path)}
                className={`p-3 rounded-md border transition-all cursor-pointer select-none space-y-1.5 ${
                  isExcluded
                    ? 'bg-[#261f1f] border-rose-800/60 hover:border-rose-700'
                    : 'bg-[#1e1e1e] border-[#3d3d3d] hover:border-[#555]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => toggleExclude(finding.path)}
                      className="cursor-pointer accent-rose-600 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <i className={`${getFileIconClass(finding.fileName)} text-sm shrink-0`}></i>
                    <span className="font-semibold text-white truncate font-mono text-xs">
                      {finding.path}
                    </span>
                  </div>

                  <span
                    className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border ${
                      finding.riskLevel === 'critical'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : 'bg-amber-950 text-amber-300 border-amber-700'
                    }`}
                  >
                    {finding.ruleName}
                  </span>
                </div>

                <div className="text-[11px] text-[#aaa] pl-6 leading-tight flex items-center justify-between gap-2">
                  <span>{finding.reason}</span>
                  {finding.matchSnippet && (
                    <span className="font-mono text-[10px] bg-[#141414] text-rose-300 px-1 py-0.2 rounded border border-[#333] shrink-0">
                      {finding.matchSnippet}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#191717] border-t border-[#382b2b] space-y-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 bg-[#333] hover:bg-[#3d3d3d] text-[#ccc] hover:text-white rounded font-medium transition-colors cursor-pointer text-xs"
            >
              Cancel Push
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExcludeAndPush}
                disabled={selectedExcludes.size === totalFileCount}
                className="px-3.5 py-1.5 bg-[#0066b8] hover:bg-[#005499] disabled:opacity-50 text-white rounded font-medium transition-colors flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
                title="Push all files except the selected sensitive files"
              >
                <i className="fas fa-shield-halved text-sky-200"></i>
                <span>
                  Exclude Flagged ({selectedExcludes.size}) & Push
                </span>
              </button>
            </div>
          </div>

          {/* Explicit Proceed Anyway Confirmation Toggle */}
          <div className="pt-2 border-t border-[#333] flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[10.5px] text-[#999] cursor-pointer">
              <input
                type="checkbox"
                checked={confirmRiskChecked}
                onChange={(e) => setConfirmRiskChecked(e.target.checked)}
                className="cursor-pointer accent-rose-600 rounded"
              />
              <span>I understand the security risks and want to force push all files</span>
            </label>

            <button
              onClick={onProceedAnyway}
              disabled={!confirmRiskChecked}
              className="text-[11px] text-rose-400 hover:text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed hover:underline font-medium"
            >
              Push Anyway &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
