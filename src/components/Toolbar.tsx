import React, { useRef } from 'react';
import { RepoInfo } from '../types';
import { SYNTAX_OPTIONS } from '../utils/fileIcons';

interface ToolbarProps {
  onNewFile: () => void;
  onOpenFile: (file: File) => void;
  onOpenFolder: (files: FileList) => void;
  onSaveAs: () => void;
  currentSyntax: string;
  onSyntaxChange: (syntax: string) => void;
  githubToken: string | null;
  githubUser: string | null;
  repoCount?: number;
  repoInfo?: RepoInfo | null;
  currentBranch?: string;
  onBackToRepos?: () => void;
  onShowGitHubLogin: () => void;
  onShowCreateRepo: () => void;
  onShowCloneRepo: () => void;
  onShowRepoBrowser?: () => void;
  onCommitPush: () => void;
  onPullChanges: () => void;
  onToggleMobileSidebar?: () => void;
  onCompareActiveFile?: () => void;
  onDeleteActiveFile?: () => void;
  stagedCount?: number;
  totalChangedCount?: number;
  onStageAll?: () => void;
  onUnstageAll?: () => void;
  hasActiveFile?: boolean;
  isOAuthExpired?: boolean;
  authType?: 'oauth' | 'pat' | null;
  onReconnectOAuth?: () => void;
  onOpenLivePreview?: () => void;
  onOpenGitignoreModal?: () => void;
  onExportWorkspaceZip?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onNewFile,
  onOpenFile,
  onOpenFolder,
  onSaveAs,
  currentSyntax,
  onSyntaxChange,
  githubToken,
  githubUser,
  repoCount = 0,
  repoInfo = null,
  currentBranch = 'main',
  onBackToRepos,
  onShowGitHubLogin,
  onShowCreateRepo,
  onShowCloneRepo,
  onShowRepoBrowser,
  onCommitPush,
  onPullChanges,
  onToggleMobileSidebar,
  onCompareActiveFile,
  onDeleteActiveFile,
  stagedCount = 0,
  totalChangedCount = 0,
  onStageAll,
  onUnstageAll,
  hasActiveFile = false,
  isOAuthExpired = false,
  authType = null,
  onReconnectOAuth,
  onOpenLivePreview,
  onOpenGitignoreModal,
  onExportWorkspaceZip,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onOpenFolder(e.target.files);
      e.target.value = '';
    }
  };

  return (
    <div className="toolbar flex items-center gap-2 p-1.5 bg-[#2d2d2d] border-b border-[#1a1a1a] select-none text-xs text-[#d4d4d4] overflow-x-auto shrink-0 whitespace-nowrap no-scrollbar">
      {/* Mobile Sidebar Toggle Button */}
      {onToggleMobileSidebar && (
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden bg-[#0066b8] hover:bg-[#005499] text-white px-2.5 py-1 rounded flex items-center gap-1.5 font-medium shrink-0 shadow-sm"
          title="Toggle Explorer Sidebar"
        >
          <i className="fas fa-bars"></i>
          <span className="text-[11px]">Files</span>
        </button>
      )}

      {/* Back Button when Repo is Cloned / Active */}
      {repoInfo && onBackToRepos && (
        <div className="flex items-center gap-1.5 shrink-0 bg-[#1e1e1e] border border-sky-500/40 rounded px-1.5 py-0.5 shadow-sm">
          <button
            id="backToRepos"
            onClick={onBackToRepos}
            className="bg-[#0066b8] hover:bg-[#005499] text-white px-2.5 py-1 rounded flex items-center gap-1.5 font-medium transition-colors shadow-xs"
            title="Back to Repositories / Switch Repo"
          >
            <i className="fas fa-arrow-left text-[11px]"></i>
            <span className="font-semibold">Back to Repos</span>
          </button>
          <div
            onClick={onBackToRepos}
            className="cursor-pointer flex items-center gap-1 text-[11px] text-sky-300 hover:text-white px-1 py-0.5 rounded font-mono max-w-[180px] sm:max-w-[240px] truncate"
            title={`Active: ${repoInfo.owner}/${repoInfo.repo} (${currentBranch}) - Click to switch repository`}
          >
            <i className="fab fa-github text-[#aaa]"></i>
            <span className="truncate font-semibold">{repoInfo.repo}</span>
            <span className="text-[10px] bg-[#333] text-[#aaa] px-1 py-0.2 rounded font-sans hidden sm:inline">
              {currentBranch}
            </span>
          </div>
        </div>
      )}

      {/* File Operations */}
      <div className="file-operations flex items-center gap-1 shrink-0">
        <button
          id="newFile"
          onClick={onNewFile}
          className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1 transition-colors"
          title="Create New File"
        >
          <i className="fas fa-file"></i> New
        </button>

        <button
          id="openFile"
          onClick={() => fileInputRef.current?.click()}
          className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1 transition-colors"
          title="Open File"
        >
          <i className="fas fa-folder-open"></i> Open File
        </button>

        <button
          id="openFolder"
          onClick={() => folderInputRef.current?.click()}
          className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1 transition-colors"
          title="Open Folder"
        >
          <i className="fas fa-folder-plus"></i> Open Folder
        </button>

        <button
          id="saveAs"
          onClick={onSaveAs}
          className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1 transition-colors"
          title="Save As / Export Active File"
        >
          <i className="fas fa-download"></i> Save As
        </button>

        {onOpenLivePreview && (
          <button
            id="livePreviewBtn"
            onClick={onOpenLivePreview}
            className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 hover:text-white px-2 py-1 rounded flex items-center gap-1.5 transition-colors font-medium shadow-2xs"
            title="Launch In-Browser Code Runner & Live Preview"
          >
            <i className="fas fa-play text-emerald-400 text-xs"></i>
            <span>Preview</span>
          </button>
        )}

        {onExportWorkspaceZip && (
          <button
            id="exportZipBtn"
            onClick={onExportWorkspaceZip}
            className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1.5 transition-colors text-[#ccc] hover:text-white"
            title="Download entire workspace as a clean ZIP archive"
          >
            <i className="fas fa-file-zipper text-sky-400 text-xs"></i>
            <span>Export ZIP</span>
          </button>
        )}

        {onOpenGitignoreModal && (
          <button
            id="gitignoreModalBtn"
            onClick={onOpenGitignoreModal}
            className="hover:bg-[#3d3d3d] px-2 py-1 rounded flex items-center gap-1.5 transition-colors text-[#ccc] hover:text-white"
            title="Auto-detect project stack & generate .gitignore"
          >
            <i className="fas fa-shield-halved text-amber-400 text-xs"></i>
            <span>.gitignore</span>
          </button>
        )}

        {onCompareActiveFile && hasActiveFile && (
          <button
            id="compareFileToolbar"
            onClick={onCompareActiveFile}
            className="hover:bg-[#0066b8] hover:text-white text-[#d4d4d4] px-2 py-1 rounded flex items-center gap-1 transition-colors bg-[#333]/70 border border-[#444]"
            title="Compare active file with original repository baseline (Diff)"
          >
            <i className="fas fa-code-compare text-sky-400"></i>
            <span>Diff</span>
            {totalChangedCount > 0 && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1 py-0.2 rounded font-mono font-bold">
                {totalChangedCount}
              </span>
            )}
          </button>
        )}

        {onDeleteActiveFile && hasActiveFile && (
          <button
            id="deleteFileToolbar"
            onClick={onDeleteActiveFile}
            className="hover:bg-rose-900/60 hover:text-rose-200 text-[#aaa] px-2 py-1 rounded flex items-center gap-1 transition-colors"
            title="Delete active file"
          >
            <i className="fas fa-trash-alt text-rose-400"></i>
            <span>Delete</span>
          </button>
        )}

        {/* Hidden inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".zip,.js,.ts,.tsx,.jsx,.html,.css,.json,.md,.py,.txt,*"
          style={{ display: 'none' }}
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderChange}
          //@ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
        />
      </div>

      {/* Syntax Language Selector */}
      <div className="syntax-select flex items-center gap-1 shrink-0 border-l border-[#3d3d3d] pl-2">
        <select
          id="syntaxSelect"
          value={currentSyntax}
          onChange={(e) => onSyntaxChange(e.target.value)}
          className="bg-[#3d3d3d] text-[#d4d4d4] border-none px-2 py-1 rounded outline-none cursor-pointer"
        >
          {SYNTAX_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* GitHub Operations */}
      <div className="github-operations flex items-center gap-1.5 shrink-0 border-l border-[#3d3d3d] pl-2 ml-auto">
        {isOAuthExpired ? (
          <button
            id="githubLogin"
            onClick={onReconnectOAuth || onShowGitHubLogin}
            className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded border border-amber-400 flex items-center gap-1.5 transition-colors animate-pulse"
            title="GitHub OAuth session expired! Click to reconnect"
          >
            <i className="fas fa-exclamation-triangle text-amber-200"></i>
            <span>Reconnect OAuth</span>
          </button>
        ) : (
          <button
            id="githubLogin"
            onClick={onShowGitHubLogin}
            className={`px-2.5 py-1 rounded border border-[#3d3d3d] flex items-center gap-1.5 transition-colors ${
              githubToken ? 'bg-[#0066b8] text-white' : 'bg-[#2d2d2d] hover:bg-[#3d3d3d]'
            }`}
            title={authType === 'oauth' ? 'Connected via GitHub OAuth' : authType === 'pat' ? 'Connected via GitHub PAT' : 'GitHub Account'}
          >
            <i className="fab fa-github"></i>
            <span>{githubUser ? githubUser : 'GitHub Login'}</span>
            {authType === 'oauth' && githubToken && (
              <span className="text-[9px] bg-sky-900/90 text-sky-200 border border-sky-400/40 px-1 py-0.2 rounded uppercase font-semibold">
                OAuth
              </span>
            )}
          </button>
        )}

        {onShowRepoBrowser && (
          <button
            id="browseRepos"
            onClick={onShowRepoBrowser}
            className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3d3d3d] px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors"
            title="Browse your GitHub repositories"
          >
            <i className="fas fa-book-bookmark text-sky-400"></i>
            <span>Repositories</span>
            {repoCount > 0 && (
              <span className="bg-[#333] text-[10px] text-[#ccc] px-1.5 py-0.2 rounded font-mono font-bold">
                {repoCount}
              </span>
            )}
          </button>
        )}

        <button
          id="createRepo"
          onClick={onShowCreateRepo}
          className="bg-[#238636] hover:bg-[#2ea043] text-white px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors shadow-sm"
          title="Create New GitHub Repository"
        >
          <i className="fas fa-plus"></i> New Repo
        </button>

        <button
          id="cloneRepo"
          onClick={onShowCloneRepo}
          className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3d3d3d] px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-download"></i> Clone Repository
        </button>

        {repoInfo && (
          <div 
            id="stagedStatusIndicator"
            className="flex items-center gap-1.5 px-2 py-1 rounded border text-[11px] font-medium transition-all select-none"
            style={{
              backgroundColor: totalChangedCount === 0
                ? 'rgba(156, 163, 175, 0.05)'
                : stagedCount === 0 
                ? 'rgba(239, 68, 68, 0.08)'
                : stagedCount < totalChangedCount 
                ? 'rgba(245, 158, 11, 0.08)'
                : 'rgba(16, 185, 129, 0.08)',
              borderColor: totalChangedCount === 0
                ? 'rgba(156, 163, 175, 0.2)'
                : stagedCount === 0 
                ? 'rgba(239, 68, 68, 0.3)' 
                : stagedCount < totalChangedCount 
                ? 'rgba(245, 158, 11, 0.3)' 
                : 'rgba(16, 185, 129, 0.3)',
              color: totalChangedCount === 0
                ? '#9ca3af'
                : stagedCount === 0 
                ? '#fca5a5'
                : stagedCount < totalChangedCount 
                ? '#fcd34d'
                : '#6ee7b7',
            }}
            title={
              totalChangedCount === 0
                ? "No modified files in your workspace."
                : stagedCount === 0
                ? "All changes are unstaged. Committing will upload the current workspace state."
                : stagedCount < totalChangedCount
                ? `Only ${stagedCount} of ${totalChangedCount} changed files are staged. Committing now will push current workspace.`
                : "All changed files are staged and ready for commit."
            }
          >
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${
                totalChangedCount === 0
                  ? 'bg-gray-500'
                  : stagedCount === 0 
                  ? 'bg-red-400 animate-pulse' 
                  : stagedCount < totalChangedCount 
                  ? 'bg-amber-400 animate-pulse' 
                  : 'bg-emerald-400'
              }`} />
              {totalChangedCount === 0 ? (
                <span className="text-gray-400 font-sans">Workspace Clean</span>
              ) : (
                <>
                  <span className="text-[#aaa] font-normal font-sans text-[10px]">Staged:</span>
                  <span className="font-mono font-bold text-white text-xs">{stagedCount}</span>
                  <span className="text-[#666] font-mono text-[10px]">/</span>
                  <span className="font-mono font-bold text-[#aaa] text-xs">{totalChangedCount}</span>
                </>
              )}
            </span>

            {totalChangedCount > 0 && (
              <div className="flex items-center gap-1 border-l border-[#444] pl-1.5 ml-0.5">
                {stagedCount < totalChangedCount && onStageAll && (
                  <button
                    id="stageAllIndicatorBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageAll();
                    }}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-[#238636] hover:text-white text-[#ccc] rounded text-[10px] transition-colors cursor-pointer"
                    title="Stage all files"
                  >
                    Stage All
                  </button>
                )}
                {stagedCount > 0 && onUnstageAll && (
                  <button
                    id="unstageAllIndicatorBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnstageAll();
                    }}
                    className="px-1.5 py-0.5 bg-[#333] hover:bg-rose-900/60 hover:text-rose-200 text-[#ccc] rounded text-[10px] transition-colors cursor-pointer"
                    title="Unstage all"
                  >
                    Unstage All
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <button
          id="commitPush"
          onClick={onCommitPush}
          className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3d3d3d] px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-upload"></i> Commit & Push
        </button>

        <button
          id="pullChanges"
          onClick={onPullChanges}
          className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#3d3d3d] px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-sync"></i> Pull Changes
        </button>
      </div>
    </div>
  );
};
