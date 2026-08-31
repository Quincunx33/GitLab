import React, { useState, useMemo } from 'react';
import { GitHubRepoItem } from '../types';

interface RepoBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  repositories: GitHubRepoItem[];
  isLoading: boolean;
  githubUser: string | null;
  githubToken: string | null;
  onRefresh: () => void;
  onSelectRepo: (fullName: string, branch: string) => void;
  onOpenGitHubLogin: () => void;
  onOpenCreateRepo: () => void;
}

export const RepoBrowserModal: React.FC<RepoBrowserModalProps> = ({
  isOpen,
  onClose,
  repositories,
  isLoading,
  githubUser,
  githubToken,
  onRefresh,
  onSelectRepo,
  onOpenGitHubLogin,
  onOpenCreateRepo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private' | 'forks'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'stars'>('updated');

  const filteredRepos = useMemo(() => {
    return repositories
      .filter((repo) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = repo.name.toLowerCase().includes(q) || repo.full_name.toLowerCase().includes(q);
          const matchDesc = repo.description?.toLowerCase().includes(q);
          const matchLang = repo.language?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchLang) return false;
        }

        // Type filter
        if (filterType === 'public') return !repo.private;
        if (filterType === 'private') return repo.private;
        if (filterType === 'forks') return repo.fork;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stars') return b.stargazers_count - a.stargazers_count;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [repositories, searchQuery, filterType, sortBy]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getLangColor = (lang: string | null) => {
    switch (lang?.toLowerCase()) {
      case 'typescript':
        return 'bg-sky-500';
      case 'javascript':
        return 'bg-amber-400';
      case 'python':
        return 'bg-blue-500';
      case 'html':
        return 'bg-orange-500';
      case 'css':
        return 'bg-indigo-400';
      case 'go':
        return 'bg-teal-400';
      case 'rust':
        return 'bg-orange-600';
      case 'java':
        return 'bg-red-500';
      case 'c++':
      case 'cpp':
        return 'bg-pink-500';
      case 'c#':
        return 'bg-emerald-600';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-3 md:p-6 overflow-hidden">
      <div className="bg-[#1e1e1e] border border-[#3d3d3d] rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans text-[#d4d4d4]">
        {/* Header */}
        <div className="bg-[#252526] px-5 py-3.5 border-b border-[#3d3d3d] flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2d2d2d] border border-[#444] flex items-center justify-center text-white">
              <i className="fab fa-github text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">GitHub Repositories</h3>
                {githubUser && (
                  <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-medium">
                    @{githubUser}
                  </span>
                )}
                <span className="text-[10px] bg-[#333] text-[#aaa] px-2 py-0.5 rounded font-mono">
                  {repositories.length} repos
                </span>
              </div>
              <p className="text-[11px] text-[#888]">
                Browse and clone repositories directly into the web editor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-[#2d2d2d] hover:bg-[#3d3d3d] border border-[#444] text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 text-[#d4d4d4] hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Repositories"
            >
              <i className={`fas fa-sync-alt text-[11px] ${isLoading ? 'fa-spin' : ''}`}></i>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenCreateRepo();
              }}
              className="bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-2.5 py-1.5 rounded flex items-center gap-1.5 font-medium transition-colors"
              title="Create New Repository"
            >
              <i className="fas fa-plus text-[10px]"></i>
              <span className="hidden sm:inline">New Repo</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#888] hover:text-white hover:bg-[#333] p-1.5 rounded-lg text-lg transition-colors leading-none ml-1"
              title="Close"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-[#222] border-b border-[#333] p-3 flex flex-wrap items-center gap-3 shrink-0">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#777] text-xs"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter repositories by name, language, or description..."
              className="w-full bg-[#181818] border border-[#3d3d3d] rounded-lg pl-8 pr-8 py-1.5 text-xs text-[#d4d4d4] placeholder-[#666] outline-none focus:border-[#0066b8] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-[#bbb] text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-[#181818] border border-[#3d3d3d] rounded-lg p-0.5 text-xs">
            {(['all', 'public', 'private', 'forks'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded text-[11px] capitalize transition-colors ${
                  filterType === type
                    ? 'bg-[#0066b8] text-white font-medium shadow-sm'
                    : 'text-[#888] hover:text-[#ccc]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-[#888]">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#181818] border border-[#3d3d3d] text-[#ccc] rounded-lg px-2 py-1 outline-none text-xs cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="stars">Most Stars</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Repository List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#181818]">
          {isLoading && repositories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#888]">
              <i className="fas fa-circle-notch fa-spin text-3xl text-sky-400 mb-3"></i>
              <div className="text-sm font-semibold text-white">Fetching GitHub Repositories...</div>
              <div className="text-xs text-[#777] mt-1">Connecting to GitHub API</div>
            </div>
          ) : !githubUser && !githubToken ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#252526] border border-[#3d3d3d] flex items-center justify-center text-white mb-3">
                <i className="fab fa-github text-2xl"></i>
              </div>
              <div className="text-base font-semibold text-white mb-1">GitHub Account Not Connected</div>
              <p className="text-xs text-[#888] mb-4 leading-relaxed">
                Connect your GitHub account or enter a Personal Access Token (PAT) with <code className="text-sky-400 bg-[#252526] px-1 py-0.5 rounded">repo</code> scope to view all your public and private repositories.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenGitHubLogin();
                }}
                className="bg-[#0066b8] hover:bg-[#005499] text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <i className="fab fa-github"></i> Connect GitHub Account
              </button>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#888]">
              <i className="fas fa-folder-open text-3xl text-[#555] mb-3"></i>
              <div className="text-sm font-semibold text-white">No Repositories Found</div>
              <p className="text-xs text-[#777] mt-1 max-w-sm">
                {searchQuery
                  ? `No repositories match "${searchQuery}". Try clearing search or changing filters.`
                  : 'No repositories are available for this account. If you just created one, click Refresh or create a new repository.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white text-xs px-3 py-1.5 rounded"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#222] hover:bg-[#282828] border border-[#333] hover:border-[#444] rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-sky-400 hover:underline cursor-pointer truncate"
                      onClick={() => {
                        onClose();
                        onSelectRepo(repo.full_name, repo.default_branch || 'main');
                      }}
                    >
                      {repo.name}
                    </span>
                    <span className="text-[11px] text-[#666] font-mono">
                      ({repo.full_name})
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        repo.private
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {repo.private ? 'Private' : 'Public'}
                    </span>
                    {repo.fork && (
                      <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono">
                        <i className="fas fa-code-branch text-[9px]"></i> Fork
                      </span>
                    )}
                  </div>

                  {repo.description && (
                    <p className="text-xs text-[#999] mt-1 line-clamp-2 leading-relaxed">
                      {repo.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[#777] flex-wrap font-mono">
                    {repo.language && (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getLangColor(repo.language)}`}></span>
                        <span className="text-[#aaa]">{repo.language}</span>
                      </div>
                    )}

                    {repo.stargazers_count > 0 && (
                      <div className="flex items-center gap-1">
                        <i className="fas fa-star text-amber-400 text-[10px]"></i>
                        <span>{repo.stargazers_count}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <i className="fas fa-code-branch text-[10px]"></i>
                      <span>{repo.default_branch || 'main'}</span>
                    </div>

                    <div>
                      <span>Updated {formatDate(repo.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-[#777] hover:text-white bg-[#1a1a1a] hover:bg-[#333] border border-[#333] rounded text-xs transition-colors"
                    title="View on GitHub"
                  >
                    <i className="fas fa-external-link-alt"></i>
                  </a>

                  <button
                    onClick={() => {
                      onClose();
                      onSelectRepo(repo.full_name, repo.default_branch || 'main');
                    }}
                    className="bg-[#0066b8] hover:bg-[#005499] text-white text-xs px-3.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Clone and open in editor"
                  >
                    <i className="fas fa-download text-[11px]"></i> Open Repo
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#252526] border-t border-[#3d3d3d] px-5 py-2.5 flex items-center justify-between text-xs text-[#888] shrink-0">
          <div className="flex items-center gap-2 text-[11px]">
            <i className="fas fa-info-circle text-sky-400"></i>
            <span>
              {githubToken
                ? 'Showing all public and private repositories accessible with your credentials.'
                : 'Showing public repositories. Connect with a PAT or OAuth for private repos.'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#333] hover:bg-[#444] text-white px-3 py-1 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
