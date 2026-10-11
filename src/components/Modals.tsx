import React, { useState, useEffect } from 'react';
import { GitHubRepoItem, FileNode, FileOpModalState } from '../types';

interface ModalsProps {
  showGitHubModal: boolean;
  onCloseGitHubModal: () => void;
  onSaveGitHubToken: (token: string) => void;
  onClearGitHubToken: () => void;
  githubToken: string | null;
  githubUser: string | null;
  onGitHubOAuth: () => void;
  firebaseUser: any;
  onLogoutFirebase: () => void;
  isOAuthExpired?: boolean;
  authType?: 'oauth' | 'pat' | null;

  showCloneModal: boolean;
  onCloseCloneModal: () => void;
  onCloneRepo: (url: string, branch: string) => void;

  showCreateRepoModal: boolean;
  onCloseCreateRepoModal: () => void;
  onCreateRepoSubmit: (name: string, description: string, isPrivate: boolean) => void;

  showBranchModal: boolean;
  onCloseBranchModal: () => void;
  branches: string[];
  currentBranch: string;
  onSwitchBranch: (branch: string) => void;

  repositories?: GitHubRepoItem[];
  isLoadingRepos?: boolean;
  onRefreshRepos?: () => void;
  onOpenRepoBrowser?: () => void;

  fileStructure?: FileNode | null;
  fileOpModal?: FileOpModalState;
  onCloseFileOpModal?: () => void;
  onConfirmFileOp?: (name: string) => void;
}

export const Modals: React.FC<ModalsProps> = ({
  showGitHubModal,
  onCloseGitHubModal,
  onSaveGitHubToken,
  onClearGitHubToken,
  githubToken,
  githubUser,
  onGitHubOAuth,
  firebaseUser,
  onLogoutFirebase,
  isOAuthExpired = false,
  authType = null,

  showCloneModal,
  onCloseCloneModal,
  onCloneRepo,

  showCreateRepoModal,
  onCloseCreateRepoModal,
  onCreateRepoSubmit,

  showBranchModal,
  onCloseBranchModal,
  branches,
  currentBranch,
  onSwitchBranch,

  repositories = [],
  isLoadingRepos = false,
  onRefreshRepos,
  onOpenRepoBrowser,

  fileOpModal,
  onCloseFileOpModal,
  onConfirmFileOp,
}) => {
  const [patInput, setPatInput] = useState('');
  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneBranch, setCloneBranch] = useState('main');
  const [cloneTab, setCloneTab] = useState<'my-repos' | 'custom-url'>('my-repos');
  const [repoSearch, setRepoSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(currentBranch);

  // File Op Input state
  const [fileOpInput, setFileOpInput] = useState('');

  // Sync initial input when modal opens
  React.useEffect(() => {
    if (fileOpModal?.isOpen) {
      setFileOpInput(fileOpModal.initialName || '');
    }
  }, [fileOpModal]);

  // Create Repo state
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');
  const [newRepoPrivate, setNewRepoPrivate] = useState(false);

  if (!showGitHubModal && !showCloneModal && !showBranchModal && !showCreateRepoModal && !fileOpModal?.isOpen) {
    return null;
  }

  const filteredModalRepos = repositories.filter((r) => {
    if (!repoSearch.trim()) return true;
    const q = repoSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.full_name.toLowerCase().includes(q) ||
      r.language?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Auth & GitHub Login Modal */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-full max-w-md p-5 text-xs text-[#d4d4d4] shadow-2xl my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d3d3d] mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <i className="fab fa-github text-lg text-sky-400"></i> GitHub Authentication & Session
              </h3>
              <button onClick={onCloseGitHubModal} className="text-[#888] hover:text-white text-base p-1">
                &times;
              </button>
            </div>

            {/* OAuth Session Expired Warning Banner */}
            {isOAuthExpired && (
              <div className="mb-4 p-3 bg-amber-950/80 border border-amber-600/60 rounded-lg space-y-2 text-amber-200">
                <div className="flex items-center gap-2 font-semibold text-amber-300">
                  <i className="fas fa-exclamation-triangle text-amber-400 text-sm"></i>
                  <span>GitHub OAuth Session Expired</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Your GitHub OAuth access token has expired due to inactivity. Reconnect below to resume loading repositories and pushing or pulling commits.
                </p>
                <button
                  onClick={onGitHubOAuth}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-1.5 px-3 rounded text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  <i className="fas fa-rotate"></i> Reconnect GitHub OAuth Now
                </button>
              </div>
            )}

            {/* Logged in status header */}
            {(firebaseUser || githubUser) && (
              <div className="mb-4 p-3 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {firebaseUser?.photoURL ? (
                      <img src={firebaseUser.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-sky-500/40" />
                    ) : (
                      <i className="fas fa-user-circle text-2xl text-sky-400"></i>
                    )}
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{githubUser || firebaseUser?.displayName || firebaseUser?.email}</span>
                        {authType === 'oauth' && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isOAuthExpired 
                              ? 'bg-amber-900/80 text-amber-300 border border-amber-600/50' 
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/50'
                          }`}>
                            {isOAuthExpired ? 'OAuth Expired' : 'OAuth Active'}
                          </span>
                        )}
                        {authType === 'pat' && (
                          <span className="text-[9px] bg-sky-950/80 text-sky-300 border border-sky-600/50 px-1.5 py-0.2 rounded font-bold uppercase">
                            PAT
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#888]">
                        {authType === 'oauth'
                          ? isOAuthExpired
                            ? 'OAuth Token expired (needs reconnect)'
                            : 'Connected with full GitHub OAuth scopes'
                          : githubToken
                          ? 'Personal Access Token (PAT) active'
                          : 'Firebase session authenticated'}
                      </div>
                    </div>
                  </div>
                  {firebaseUser && (
                    <button
                      onClick={onLogoutFirebase}
                      className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-2 py-1 rounded text-[11px]"
                    >
                      Log Out
                    </button>
                  )}
                </div>

                {repositories.length > 0 && onOpenRepoBrowser && (
                  <button
                    onClick={() => {
                      onCloseGitHubModal();
                      onOpenRepoBrowser();
                    }}
                    className="w-full bg-[#0066b8] hover:bg-[#005499] text-white py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    <i className="fas fa-book-bookmark"></i> Browse My Repositories ({repositories.length})
                  </button>
                )}
              </div>
            )}

            {/* OAuth Buttons & Information */}
            <div className="space-y-2 mb-4">
              <button
                onClick={onGitHubOAuth}
                className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white p-2.5 rounded border border-[#444] flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer shadow-sm"
              >
                <i className="fab fa-github text-base text-sky-400"></i>
                <span>
                  {isOAuthExpired
                    ? 'Reconnect GitHub OAuth Session'
                    : authType === 'oauth' && githubToken
                    ? 'Refresh GitHub OAuth Session'
                    : 'Sign in with GitHub OAuth'}
                </span>
              </button>
              <div className="text-[10.5px] text-[#888] leading-tight px-1 flex items-start gap-1.5">
                <i className="fas fa-info-circle text-sky-400 mt-0.5 shrink-0"></i>
                <span>
                  GitHub OAuth access tokens expire periodically. You can renew your session with a single click anytime.
                </span>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-[#3d3d3d]"></div>
              <span className="flex-shrink mx-2 text-[#777] text-[10px] uppercase font-bold">OR USE PAT TOKEN</span>
              <div className="flex-grow border-t border-[#3d3d3d]"></div>
            </div>

            <p className="mb-2 text-[#aaa] leading-relaxed text-[11px]">
              Or enter a GitHub Personal Access Token (PAT) with <code className="bg-[#1e1e1e] px-1 py-0.5 rounded text-sky-400">repo</code> scope for private repository access.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-[#aaa] font-medium">Personal Access Token (PAT)</label>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-sky-400 pt-1">
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  <i className="fas fa-external-link-alt"></i> Generate Token on GitHub
                </a>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d] mt-4">
                {githubToken && (
                  <button
                    onClick={() => {
                      onClearGitHubToken();
                      setPatInput('');
                    }}
                    className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3 py-1.5 rounded transition-colors"
                  >
                    Clear Token
                  </button>
                )}
                <button
                  onClick={onCloseGitHubModal}
                  className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (patInput.trim()) {
                      onSaveGitHubToken(patInput.trim());
                      setPatInput('');
                    }
                  }}
                  className="bg-[#0066b8] hover:bg-[#005499] text-white px-4 py-1.5 rounded font-medium transition-colors"
                >
                  Save Token
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clone Repo Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-full max-w-lg p-5 text-xs text-[#d4d4d4] shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d3d3d] mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <i className="fas fa-download text-sky-400"></i> Clone GitHub Repository
              </h3>
              <button onClick={onCloseCloneModal} className="text-[#888] hover:text-white text-base">
                &times;
              </button>
            </div>

            {/* Tab switch: My Repos vs Custom URL */}
            <div className="flex items-center gap-1 bg-[#1e1e1e] p-1 rounded-lg border border-[#333] mb-3">
              <button
                onClick={() => setCloneTab('my-repos')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  cloneTab === 'my-repos'
                    ? 'bg-[#0066b8] text-white shadow-sm'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                <i className="fab fa-github"></i> My Repositories ({repositories.length})
              </button>
              <button
                onClick={() => setCloneTab('custom-url')}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                  cloneTab === 'custom-url'
                    ? 'bg-[#0066b8] text-white shadow-sm'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                <i className="fas fa-link"></i> Enter URL / Path
              </button>
            </div>

            {cloneTab === 'my-repos' ? (
              <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[#777] text-xs"></i>
                    <input
                      type="text"
                      value={repoSearch}
                      onChange={(e) => setRepoSearch(e.target.value)}
                      placeholder="Search your repositories..."
                      className="w-full bg-[#1e1e1e] border border-[#3d3d3d] rounded pl-7 pr-3 py-1.5 text-xs text-[#d4d4d4] outline-none focus:border-[#0066b8]"
                    />
                  </div>
                  {onRefreshRepos && (
                    <button
                      onClick={onRefreshRepos}
                      disabled={isLoadingRepos}
                      className="bg-[#333] hover:bg-[#444] text-[#ccc] p-1.5 rounded text-xs"
                      title="Refresh repositories"
                    >
                      <i className={`fas fa-sync-alt ${isLoadingRepos ? 'fa-spin' : ''}`}></i>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[300px] border border-[#333] rounded-lg p-1.5 bg-[#1a1a1a] space-y-1.5">
                  {isLoadingRepos && repositories.length === 0 ? (
                    <div className="p-6 text-center text-[#888]">
                      <i className="fas fa-spinner fa-spin text-lg text-sky-400 mb-2"></i>
                      <div>Loading repositories...</div>
                    </div>
                  ) : repositories.length === 0 ? (
                    <div className="p-6 text-center text-[#888]">
                      <i className="fab fa-github text-2xl text-[#555] mb-2"></i>
                      <div className="text-white font-medium">No repositories loaded</div>
                      <div className="text-[11px] text-[#777] mt-1">
                        Connect GitHub account or enter a Personal Access Token (PAT).
                      </div>
                    </div>
                  ) : filteredModalRepos.length === 0 ? (
                    <div className="p-4 text-center text-[#777]">
                      No repositories match "{repoSearch}"
                    </div>
                  ) : (
                    filteredModalRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="bg-[#222] hover:bg-[#282828] border border-[#333] hover:border-sky-500/40 p-2 rounded-lg flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-medium text-white truncate text-xs">{repo.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                                repo.private
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {repo.private ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#888] truncate mt-0.5">
                            {repo.full_name} {repo.language && `• ${repo.language}`}
                          </div>
                        </div>
                        <button
                          onClick={() => onCloneRepo(repo.full_name, repo.default_branch || 'main')}
                          className="bg-[#0066b8] hover:bg-[#005499] text-white px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 shrink-0 shadow-sm"
                        >
                          <i className="fas fa-download text-[10px]"></i> Clone
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#888] pt-2 border-t border-[#3d3d3d]">
                  {onOpenRepoBrowser && (
                    <button
                      onClick={() => {
                        onCloseCloneModal();
                        onOpenRepoBrowser();
                      }}
                      className="text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <i className="fas fa-expand-alt text-[10px]"></i> Open Full Repository Browser
                    </button>
                  )}
                  <button
                    onClick={onCloseCloneModal}
                    className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors ml-auto"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 text-[#aaa] font-medium">Repository URL or owner/repo</label>
                  <input
                    type="text"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="https://github.com/facebook/react or facebook/react"
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[#aaa] font-medium">Branch (default: main)</label>
                  <input
                    type="text"
                    value={cloneBranch}
                    onChange={(e) => setCloneBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d] mt-4">
                  <button
                    onClick={onCloseCloneModal}
                    className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (cloneUrl.trim()) {
                        onCloneRepo(cloneUrl.trim(), cloneBranch.trim() || 'main');
                      }
                    }}
                    className="bg-[#0066b8] hover:bg-[#005499] text-white px-4 py-1.5 rounded font-medium transition-colors"
                  >
                    Clone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Repository Modal */}
      {showCreateRepoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-full max-w-md p-5 text-xs text-[#d4d4d4] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d3d3d] mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <i className="fas fa-plus-circle text-emerald-400"></i> Create New GitHub Repository
              </h3>
              <button onClick={onCloseCreateRepoModal} className="text-[#888] hover:text-white text-base">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-[#aaa] font-medium">Repository Name *</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="e.g. my-awesome-project"
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#aaa] font-medium">Description (optional)</label>
                <textarea
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                  placeholder="Short project description..."
                  rows={2}
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="privateRepoCheck"
                  checked={newRepoPrivate}
                  onChange={(e) => setNewRepoPrivate(e.target.checked)}
                  className="rounded bg-[#1e1e1e] border-[#3d3d3d] text-[#0066b8] focus:ring-0"
                />
                <label htmlFor="privateRepoCheck" className="text-[#d4d4d4] cursor-pointer">
                  Private Repository
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d] mt-4">
                <button
                  onClick={onCloseCreateRepoModal}
                  className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newRepoName.trim()) {
                      onCreateRepoSubmit(newRepoName.trim(), newRepoDesc.trim(), newRepoPrivate);
                      setNewRepoName('');
                      setNewRepoDesc('');
                      setNewRepoPrivate(false);
                    }
                  }}
                  className="bg-[#238636] hover:bg-[#2ea043] text-white px-4 py-1.5 rounded font-medium transition-colors"
                >
                  Create Repository
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Switch Branch Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-full max-w-sm p-5 text-xs text-[#d4d4d4] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d3d3d] mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                <i className="fas fa-code-branch text-sky-400"></i> Switch Branch
              </h3>
              <button onClick={onCloseBranchModal} className="text-[#888] hover:text-white text-base">
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block mb-1 text-[#aaa] font-medium">Select Branch</label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-[#0066b8]"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b} {b === currentBranch ? '(current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d] mt-4">
                <button
                  onClick={onCloseBranchModal}
                  className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSwitchBranch(selectedBranch);
                    onCloseBranchModal();
                  }}
                  className="bg-[#0066b8] hover:bg-[#005499] text-white px-4 py-1.5 rounded font-medium transition-colors"
                >
                  Switch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File & Folder Operations Modal (New File, New Folder, Rename, Delete) */}
      {fileOpModal?.isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-full max-w-sm p-5 text-xs text-[#d4d4d4] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#3d3d3d] mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-white">
                {fileOpModal.mode === 'new-file' && (
                  <>
                    <i className="fas fa-file-circle-plus text-emerald-400"></i> Create New File
                  </>
                )}
                {fileOpModal.mode === 'new-folder' && (
                  <>
                    <i className="fas fa-folder-plus text-amber-400"></i> Create New Folder
                  </>
                )}
                {fileOpModal.mode === 'rename' && (
                  <>
                    <i className="fas fa-pen text-sky-400"></i> Rename {fileOpModal.nodeType === 'folder' ? 'Folder' : 'File'}
                  </>
                )}
                {fileOpModal.mode === 'move' && (
                  <>
                    <i className="fas fa-arrows-up-down-left-right text-amber-400"></i> Move {fileOpModal.nodeType === 'folder' ? 'Folder' : 'File'}
                  </>
                )}
                {fileOpModal.mode === 'delete' && (
                  <>
                    <i className="fas fa-trash-alt text-rose-400"></i> Delete {fileOpModal.nodeType === 'folder' ? 'Folder' : 'File'}
                  </>
                )}
              </h3>
              <button onClick={onCloseFileOpModal} className="text-[#888] hover:text-white text-base">
                &times;
              </button>
            </div>

            {fileOpModal.mode === 'delete' ? (
              <div className="space-y-4">
                <p className="text-sm text-[#e1e1e1] leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-mono font-semibold text-rose-400 bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#383838]">
                    {fileOpModal.initialName || fileOpModal.targetPath}
                  </span>
                  ?
                </p>
                {fileOpModal.nodeType === 'folder' && (
                  <p className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-2 rounded">
                    <i className="fas fa-exclamation-triangle mr-1"></i> All files and subfolders inside this folder will also be deleted.
                  </p>
                )}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d]">
                  <button
                    onClick={onCloseFileOpModal}
                    className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onConfirmFileOp && onConfirmFileOp('')}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded font-medium transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (fileOpModal.mode === 'move' || fileOpInput.trim()) {
                    onConfirmFileOp && onConfirmFileOp(fileOpInput.trim());
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1.5 text-[#aaa] font-medium">
                    {fileOpModal.mode === 'new-file' && 'File name or relative path (e.g. index.ts or src/utils.js)'}
                    {fileOpModal.mode === 'new-folder' && 'Folder name (e.g. components)'}
                    {fileOpModal.mode === 'rename' && 'New name'}
                    {fileOpModal.mode === 'move' && 'Target folder path (e.g. src/components or leave empty for root)'}
                  </label>
                  <input
                    type="text"
                    value={fileOpInput}
                    onChange={(e) => setFileOpInput(e.target.value)}
                    placeholder={
                      fileOpModal.mode === 'new-file'
                        ? 'e.g. App.tsx'
                        : fileOpModal.mode === 'new-folder'
                        ? 'e.g. utils'
                        : fileOpModal.mode === 'move'
                        ? 'e.g. src/components (or empty)'
                        : 'Enter name'
                    }
                    autoFocus
                    className="w-full bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none focus:border-sky-500 font-mono text-xs"
                  />
                  {fileOpModal.targetPath && (
                    <p className="text-[10px] text-[#777] mt-1 truncate">
                      Item: <span className="font-mono text-[#999]">{fileOpModal.targetPath}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3d3d3d]">
                  <button
                    type="button"
                    onClick={onCloseFileOpModal}
                    className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-[#d4d4d4] px-3 py-1.5 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fileOpModal.mode !== 'move' && !fileOpInput.trim()}
                    className="bg-[#0066b8] hover:bg-[#005499] disabled:opacity-50 text-white px-4 py-1.5 rounded font-medium transition-colors"
                  >
                    {fileOpModal.mode === 'rename' ? 'Rename' : fileOpModal.mode === 'move' ? 'Move' : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};

