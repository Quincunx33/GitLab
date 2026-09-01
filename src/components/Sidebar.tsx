import React, { useState, useEffect, useRef } from 'react';
import { CommitInfo, FileNode, GitHubRepoItem, OutlineItem, RepoInfo, SidebarTab } from '../types';
import { getFileIconClass } from '../utils/fileIcons';

interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
}

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  fileStructure: FileNode | null;
  onFileSelect: (node: FileNode) => void;
  onCloseFolder: () => void;
  outlineItems: OutlineItem[];
  onOutlineClick: (line: number) => void;
  repoInfo: RepoInfo | null;
  currentBranch: string;
  onChangeBranch: () => void;
  onRefreshRepo: () => void;
  sourceControlChanges: Map<string, string>;
  stagedChanges: Map<string, string>;
  onStageFile: (path: string) => void;
  onUnstageFile: (path: string) => void;
  onCompareFile?: (path: string) => void;
  onStageAll: () => void;
  onUnstageAll: () => void;
  commitMessage: string;
  setCommitMessage: (msg: string) => void;
  onCommitChanges: () => void;
  onCommitPush?: () => void;
  onDeleteNode?: (path: string, type: 'file' | 'folder', name: string) => void;
  onRenameNode?: (path: string, currentName: string, type: 'file' | 'folder') => void;
  onNewItem?: (parentPath: string, type: 'file' | 'folder') => void;
  onMoveItem?: (path: string, currentName: string, type: 'file' | 'folder') => void;
  onMoveNode?: (sourcePath: string, destParentPath: string) => void;
  onRevertFile?: (path: string) => void;
  isMobileShow: boolean;
  onCloseMobileSidebar?: () => void;
  commitHistory?: CommitInfo[];
  isLoadingHistory?: boolean;
  onRefreshHistory?: () => void;
  onRevertCommit?: (commitSha: string, treeSha: string) => void;
  repositories?: GitHubRepoItem[];
  githubUser?: string | null;
  githubToken?: string | null;
  onOpenRepoBrowser?: () => void;
  onCloneRepo?: (url: string, branch: string) => void;
  onBackToRepos?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  fileStructure,
  onFileSelect,
  onCloseFolder,
  outlineItems,
  onOutlineClick,
  repoInfo,
  currentBranch,
  onChangeBranch,
  onRefreshRepo,
  sourceControlChanges,
  stagedChanges,
  onStageFile,
  onUnstageFile,
  onCompareFile,
  onStageAll,
  onUnstageAll,
  commitMessage,
  setCommitMessage,
  onCommitChanges,
  onCommitPush,
  onDeleteNode,
  onRenameNode,
  onNewItem,
  onMoveItem,
  onMoveNode,
  onRevertFile,
  isMobileShow,
  onCloseMobileSidebar,
  commitHistory = [],
  isLoadingHistory = false,
  onRefreshHistory,
  onRevertCommit,
  repositories = [],
  githubUser = null,
  githubToken = null,
  onOpenRepoBrowser,
  onCloneRepo,
  onBackToRepos,
}) => {
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [draggedNodePath, setDraggedNodePath] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener('click', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
    };
  }, [contextMenu]);

  const handleFileClick = (node: FileNode) => {
    onFileSelect(node);
    if (onCloseMobileSidebar) {
      onCloseMobileSidebar();
    }
  };

  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const collapseAllFolders = () => {
    if (!fileStructure) return;
    const allPaths: Record<string, boolean> = {};
    const collectPaths = (node: FileNode) => {
      if (node.type === 'folder') {
        allPaths[node.path] = true;
        if (node.children) {
          Object.values(node.children).forEach(collectPaths);
        }
      }
    };
    collectPaths(fileStructure);
    setCollapsedFolders(allPaths);
  };

  const expandAllFolders = () => {
    setCollapsedFolders({});
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 190),
      y: Math.min(e.clientY, window.innerHeight - 220),
      node,
    });
  };

  const renderFileNode = (node: FileNode) => {
    if (node.type === 'folder') {
      const isCollapsed = collapsedFolders[node.path];
      const childrenList = node.children ? Object.values(node.children) : [];
      const isDragOver = dragOverTarget === node.path;
      const isBeingDragged = draggedNodePath === node.path;

      childrenList.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      });

      return (
        <div
          key={node.path}
          className={`folder-group group/folder ${isBeingDragged ? 'opacity-40' : ''}`}
        >
          <div
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData('text/plain', node.path);
              setDraggedNodePath(node.path);
            }}
            onDragEnd={() => {
              setDraggedNodePath(null);
              setDragOverTarget(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (draggedNodePath && draggedNodePath !== node.path && !node.path.startsWith(draggedNodePath + '/')) {
                setDragOverTarget(node.path);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (dragOverTarget === node.path) {
                setDragOverTarget(null);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const src = e.dataTransfer.getData('text/plain') || draggedNodePath;
              if (src && onMoveNode && src !== node.path) {
                onMoveNode(src, node.path);
              }
              setDragOverTarget(null);
              setDraggedNodePath(null);
            }}
            className={`folder-header flex items-center justify-between px-1.5 py-1 cursor-pointer hover:bg-[#2d2d2d] text-[#d4d4d4] select-none text-xs rounded transition-all ${
              isDragOver ? 'bg-sky-950/80 border border-sky-500 ring-2 ring-sky-500/40 text-white' : ''
            }`}
            onClick={() => toggleFolder(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
          >
            <div className="flex items-center gap-1 min-w-0 flex-1 truncate">
              <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'down'} w-3.5 text-[10px] text-[#858585]`}></i>
              <i className={`fas fa-folder${isCollapsed ? '' : '-open'} text-amber-400 mr-1 text-xs shrink-0`}></i>
              <span className="truncate font-medium">{node.name}</span>
            </div>

            {/* Folder Actions */}
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              {/* Three dots menu button - always visible (subtle opacity, perfect for both touch devices/iPads and desktop) */}
              <button
                id={`folder-menu-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setContextMenu({
                    x: Math.min(rect.left - 130, window.innerWidth - 190),
                    y: Math.min(rect.bottom + 5, window.innerHeight - 250),
                    node,
                  });
                }}
                className="p-1 text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded text-[11px] opacity-60 hover:opacity-100 transition-opacity ml-1"
                title="Folder actions"
              >
                <i className="fas fa-ellipsis-v px-1.5"></i>
              </button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="folder-content pl-2.5 border-l border-[#404040]/40 ml-2 space-y-0.5 mt-0.5">
              {childrenList.map((child) => renderFileNode(child))}
            </div>
          )}
        </div>
      );
    } else {
      const isModified = sourceControlChanges.has(node.path) || stagedChanges.has(node.path);
      const changeStatus = stagedChanges.get(node.path) || sourceControlChanges.get(node.path);
      const isBeingDragged = draggedNodePath === node.path;

      return (
        <div
          key={node.path}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', node.path);
            setDraggedNodePath(node.path);
          }}
          onDragEnd={() => {
            setDraggedNodePath(null);
            setDragOverTarget(null);
          }}
          className={`folder-item file flex items-center justify-between px-1.5 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[#d4d4d4] text-xs rounded transition-colors group/file ${
            isBeingDragged ? 'opacity-40' : ''
          }`}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            <i className={`${getFileIconClass(node.name)} w-3.5 text-center shrink-0`}></i>
            <span className={`truncate ${isModified ? 'text-white font-medium' : ''}`}>{node.name}</span>
            {isModified && (
              <span
                className={`text-[9px] font-mono font-bold px-1 rounded ${
                  changeStatus === 'added'
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-amber-400 bg-amber-950/40'
                }`}
                title={changeStatus === 'added' ? 'New file (added)' : 'Modified file'}
              >
                {changeStatus === 'added' ? 'A' : 'M'}
              </span>
            )}
          </div>

          {/* File Actions */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1">
            {onCompareFile && isModified && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareFile(node.path);
                }}
                className="p-1 hover:text-sky-400 text-sky-400/80 hover:bg-[#3d3d3d] rounded text-[10px]"
                title="Compare Diff with repository original"
              >
                <i className="fas fa-code-compare"></i>
              </button>
            )}

            {/* Three dots menu button - always visible (subtle opacity, perfect for both touch devices/iPads and desktop) */}
            <button
              id={`file-menu-${node.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({
                  x: Math.min(rect.left - 130, window.innerWidth - 190),
                  y: Math.min(rect.bottom + 5, window.innerHeight - 250),
                  node,
                });
              }}
              className="p-1 text-[#aaa] hover:text-white hover:bg-[#3d3d3d] rounded text-[11px] opacity-60 hover:opacity-100 transition-opacity ml-1"
              title="File actions"
            >
              <i className="fas fa-ellipsis-v px-1.5"></i>
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <aside
      className={`sidebar fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 bg-[#252526] flex flex-col border-r border-[#1a1a1a] shrink-0 h-full select-none transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${
        isMobileShow ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Sidebar Top Icon Navigation Bar */}
      <div className="sidebar-header flex items-center p-1 bg-[#2d2d2d] border-b border-[#1a1a1a]">
        <button
          className={`sidebar-toggle p-2 text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3d3d3d] rounded flex-1 text-center ${
            activeTab === 'explorer' ? 'active text-white bg-[#3d3d3d]' : ''
          }`}
          onClick={() => setActiveTab('explorer')}
          title="File Explorer"
        >
          <i className="fas fa-folder"></i>
        </button>

        <button
          className={`sidebar-toggle p-2 text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3d3d3d] rounded flex-1 text-center ${
            activeTab === 'outline' ? 'active text-white bg-[#3d3d3d]' : ''
          }`}
          onClick={() => setActiveTab('outline')}
          title="Code Outline"
        >
          <i className="fas fa-list"></i>
        </button>

        <button
          className={`sidebar-toggle p-2 text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3d3d3d] rounded flex-1 text-center relative ${
            activeTab === 'source-control' ? 'active text-white bg-[#3d3d3d]' : ''
          }`}
          onClick={() => setActiveTab('source-control')}
          title="Source Control"
        >
          <i className="fas fa-code-branch"></i>
          {sourceControlChanges.size + stagedChanges.size > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 bg-sky-500 rounded-full ring-2 ring-[#2d2d2d]"></span>
          )}
        </button>

        <button
          className={`sidebar-toggle p-2 text-[#858585] hover:text-[#d4d4d4] hover:bg-[#3d3d3d] rounded flex-1 text-center ${
            activeTab === 'history' ? 'active text-white bg-[#3d3d3d]' : ''
          }`}
          onClick={() => setActiveTab('history')}
          title="Commit History"
        >
          <i className="fas fa-history"></i>
        </button>

        {/* Mobile close button inside sidebar header */}
        <button
          onClick={onCloseMobileSidebar}
          className="md:hidden p-2 text-[#858585] hover:text-white rounded ml-1"
          title="Close Sidebar"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Explorer Content */}
      {activeTab === 'explorer' && (
        <div className="sidebar-content flex-1 flex flex-col overflow-y-auto">
          <div className="explorer-header flex justify-between items-center px-3 py-2 text-[11px] font-bold text-[#858585] uppercase tracking-wider border-b border-[#1a1a1a]">
            <span>EXPLORER</span>
            <div className="explorer-actions flex items-center gap-1">
              {onNewItem && (
                <button
                  onClick={() => onNewItem(fileStructure ? fileStructure.path : '', 'file')}
                  className="p-1 hover:bg-[#3d3d3d] hover:text-white text-[#858585] rounded"
                  title="New File"
                >
                  <i className="fas fa-file-circle-plus"></i>
                </button>
              )}
              {onNewItem && (
                <button
                  onClick={() => onNewItem(fileStructure ? fileStructure.path : '', 'folder')}
                  className="p-1 hover:bg-[#3d3d3d] hover:text-white text-[#858585] rounded"
                  title="New Folder"
                >
                  <i className="fas fa-folder-plus"></i>
                </button>
              )}
              {fileStructure && (
                <button
                  id="closeFolder"
                  onClick={onCloseFolder}
                  className="p-1 hover:bg-[#3d3d3d] hover:text-white text-[#858585] rounded"
                  title="Close Workspace / Folder"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
              <button
                id="collapseAll"
                onClick={collapseAllFolders}
                className="p-1 hover:bg-[#3d3d3d] hover:text-white text-[#858585] rounded"
                title="Collapse All"
              >
                <i className="fas fa-compress-arrows-alt"></i>
              </button>
              <button
                id="expandAll"
                onClick={expandAllFolders}
                className="p-1 hover:bg-[#3d3d3d] hover:text-white text-[#858585] rounded"
                title="Expand All"
              >
                <i className="fas fa-expand-arrows-alt"></i>
              </button>
            </div>
          </div>

          {/* Active Cloned Repository Navigation Banner */}
          {repoInfo && onBackToRepos && (
            <div className="p-2 bg-[#222] border-b border-[#333] flex items-center justify-between gap-1.5 shrink-0 select-none">
              <button
                id="sidebarBackToRepos"
                onClick={onBackToRepos}
                className="flex-1 bg-[#0066b8]/20 hover:bg-[#0066b8] border border-sky-500/40 text-sky-300 hover:text-white px-2.5 py-1.5 rounded flex items-center justify-center gap-2 text-xs font-semibold transition-all shadow-xs group"
                title="Back to Repositories list / Switch Repo"
              >
                <i className="fas fa-arrow-left text-[11px] transition-transform group-hover:-translate-x-0.5"></i>
                <span className="truncate">Back to Repositories</span>
              </button>
              <button
                onClick={onCloseFolder}
                className="p-1.5 hover:bg-[#333] text-[#888] hover:text-white rounded text-xs transition-colors"
                title="Close Workspace"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <div
            className={`folder-structure p-2 flex-1 overflow-y-auto rounded transition-colors ${
              dragOverTarget === '__root__' ? 'bg-sky-950/40 ring-2 ring-sky-500/50' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedNodePath) {
                setDragOverTarget('__root__');
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverTarget === '__root__') setDragOverTarget(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const src = e.dataTransfer.getData('text/plain') || draggedNodePath;
              if (src && onMoveNode) {
                onMoveNode(src, '');
              }
              setDragOverTarget(null);
              setDraggedNodePath(null);
            }}
          >
            {fileStructure ? (
              fileStructure.type === 'folder' && fileStructure.children ? (
                (Object.values(fileStructure.children) as FileNode[])
                  .sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'folder' ? -1 : 1;
                  })
                  .map((child) => renderFileNode(child))
              ) : (
                renderFileNode(fileStructure)
              )
            ) : (
              <div className="p-3 text-center space-y-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-[#3d3d3d] flex items-center justify-center mx-auto p-1 bg-[#1e1e1f] shadow-inner">
                  <img src="/gitlab_logo.png" className="w-full h-full object-contain rounded" referrerPolicy="no-referrer" alt="GitLab Logo" />
                </div>
                <div>
                  <p className="text-xs text-[#bbb] font-medium">No folder opened</p>
                  <p className="text-[11px] text-[#777] mt-0.5">Open a zip file, folder, or select a repository.</p>
                </div>

                {repositories.length > 0 && (
                  <div className="pt-2 border-t border-[#333] text-left space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#888] uppercase">
                      <span>Your Repositories</span>
                      {onOpenRepoBrowser && (
                        <button
                          onClick={onOpenRepoBrowser}
                          className="text-sky-400 hover:text-sky-300 normal-case font-normal text-[11px]"
                        >
                          View all ({repositories.length}) &rarr;
                        </button>
                      )}
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                      {repositories.slice(0, 5).map((repo) => (
                        <div
                          key={repo.id}
                          onClick={() => onCloneRepo && onCloneRepo(repo.full_name, repo.default_branch || 'main')}
                          className="p-2 bg-[#2d2d2d] hover:bg-[#383838] border border-[#3a3a3a] rounded cursor-pointer transition-colors group text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white truncate group-hover:text-sky-400">
                              {repo.name}
                            </span>
                            {repo.private && (
                              <span className="text-[9px] bg-[#333] text-[#aaa] px-1 py-0.5 rounded">Private</span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[10px] text-[#888] truncate mt-0.5">{repo.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outline Content */}
      {activeTab === 'outline' && (
        <div className="sidebar-content flex-1 flex flex-col overflow-y-auto">
          <div className="explorer-header flex justify-between items-center px-3 py-2 text-[11px] font-bold text-[#858585] uppercase tracking-wider border-b border-[#1a1a1a]">
            <span>OUTLINE</span>
          </div>
          <div className="outline-structure p-2 flex-1 overflow-y-auto space-y-0.5">
            {outlineItems.length > 0 ? (
              outlineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="outline-item flex items-center px-2 py-1 cursor-pointer hover:bg-[#2a2d2e] text-[#d4d4d4] text-xs rounded transition-colors"
                  style={{ paddingLeft: `${item.level * 16 + 8}px` }}
                  onClick={() => onOutlineClick(item.line)}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="ml-auto text-[10px] text-[#666] font-mono">L{item.line}</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[#777] p-3 text-center">
                No symbols found in current active file.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Source Control Content */}
      {activeTab === 'source-control' && (
        <div className="sidebar-content flex-1 flex flex-col overflow-y-auto p-3 space-y-3 text-xs">
          <div className="explorer-header flex justify-between items-center px-1 pb-2 border-b border-[#1a1a1a] text-[11px] font-bold text-[#858585] uppercase">
            <span>SOURCE CONTROL</span>
            <button
              id="refreshRepo"
              onClick={onRefreshRepo}
              className="p-1 hover:bg-[#3d3d3d] text-[#858585] hover:text-white rounded"
              title="Refresh"
            >
              <i className="fas fa-sync"></i>
            </button>
          </div>

          {/* Branch Info */}
          <div className="branch-info flex items-center justify-between p-2 bg-[#2d2d2d] rounded border border-[#3d3d3d]">
            <div className="current-branch flex items-center gap-1.5 text-sky-400 font-mono font-medium truncate">
              <i className="fas fa-code-branch"></i>
              <span className="truncate">{repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : 'Local Workspace'} ({currentBranch})</span>
            </div>
            {repoInfo && (
              <button
                id="changeBranch"
                onClick={onChangeBranch}
                className="icon-button text-[#aaa] hover:text-white p-1 shrink-0"
                title="Switch Branch"
              >
                <i className="fas fa-exchange-alt"></i>
              </button>
            )}
          </div>

          {/* Unstaged Changes Section */}
          <div className="changes-section">
            <div className="section-header flex justify-between items-center text-[11px] uppercase font-semibold text-[#aaa] py-1 border-b border-[#333]">
              <span>Changes ({sourceControlChanges.size})</span>
              {sourceControlChanges.size > 0 && (
                <button
                  id="stageAllChanges"
                  onClick={onStageAll}
                  className="p-1 hover:text-white text-[#aaa]"
                  title="Stage All Changes"
                >
                  <i className="fas fa-plus"></i>
                </button>
              )}
            </div>
            <div className="changed-files space-y-1 mt-1 max-h-36 overflow-y-auto">
              {Array.from(sourceControlChanges.entries()).map(([path, status]) => (
                <div
                  key={path}
                  onClick={() => onCompareFile && onCompareFile(path)}
                  className="file-change flex items-center justify-between p-1 hover:bg-[#2d2d2d] rounded cursor-pointer group"
                  title="Click to compare changes (Diff)"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <span
                      className={`status text-xs font-bold font-mono ${
                        status === 'modified'
                          ? 'text-amber-400'
                          : status === 'added'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {status === 'modified' ? 'M' : status === 'added' ? 'A' : 'D'}
                    </span>
                    <span className="truncate text-[#d4d4d4]">{path}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {status !== 'deleted' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompareFile && onCompareFile(path);
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-[#333] hover:bg-[#0066b8] text-[#ccc] hover:text-white rounded flex items-center gap-1 transition-colors"
                        title="Compare file changes (Diff)"
                      >
                        Diff
                      </button>
                    )}
                    {onRevertFile && status === 'modified' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Discard and revert changes to "${path}"?`)) {
                            onRevertFile(path);
                          }
                        }}
                        className="p-1 hover:text-rose-400 text-[#888] hover:bg-rose-950/40 rounded text-[10px]"
                        title="Revert changes"
                      >
                        <i className="fas fa-undo"></i>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStageFile(path);
                      }}
                      className="icon-button p-1 hover:text-emerald-400 text-[#888] hover:bg-[#3d3d3d] rounded text-[10px]"
                      title="Stage Change"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              ))}
              {sourceControlChanges.size === 0 && (
                <div className="text-[11px] text-[#666] py-1">No unstaged changes</div>
              )}
            </div>
          </div>

          {/* Staged Changes Section */}
          <div className="staged-section">
            <div className="section-header flex justify-between items-center text-[11px] uppercase font-semibold text-[#aaa] py-1 border-b border-[#333]">
              <span>Staged Changes ({stagedChanges.size})</span>
              {stagedChanges.size > 0 && (
                <button
                  id="unstageAllChanges"
                  onClick={onUnstageAll}
                  className="p-1 hover:text-white text-[#aaa]"
                  title="Unstage All Changes"
                >
                  <i className="fas fa-minus"></i>
                </button>
              )}
            </div>
            <div className="staged-files space-y-1 mt-1 max-h-36 overflow-y-auto">
              {Array.from(stagedChanges.entries()).map(([path, status]) => (
                <div
                  key={path}
                  onClick={() => onCompareFile && onCompareFile(path)}
                  className="file-change flex items-center justify-between p-1 hover:bg-[#2d2d2d] rounded cursor-pointer group"
                  title="Click to compare changes (Diff)"
                >
                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                    <span
                      className={`status text-xs font-bold font-mono ${
                        status === 'modified'
                          ? 'text-amber-400'
                          : status === 'added'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {status === 'modified' ? 'M' : status === 'added' ? 'A' : 'D'}
                    </span>
                    <span className="truncate text-[#d4d4d4]">{path}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {status !== 'deleted' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompareFile && onCompareFile(path);
                        }}
                        className="px-1.5 py-0.5 text-[10px] bg-[#333] hover:bg-[#0066b8] text-[#ccc] hover:text-white rounded flex items-center gap-1 transition-colors"
                        title="Compare file changes"
                      >
                        Compare
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnstageFile(path);
                      }}
                      className="icon-button opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400"
                      title="Unstage Change"
                    >
                      <i className="fas fa-minus"></i>
                    </button>
                  </div>
                </div>
              ))}
              {stagedChanges.size === 0 && (
                <div className="text-[11px] text-[#666] py-1">No staged changes</div>
              )}
            </div>
          </div>

          {/* Commit Message & Action */}
          <div className="commit-section space-y-2 pt-2 border-t border-[#3d3d3d]">
            <div>
              <textarea
                id="commitMessage"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message (Optional: leave empty for auto timestamp)"
                className="w-full h-14 bg-[#1e1e1e] border border-[#3d3d3d] text-[#d4d4d4] p-2 rounded outline-none text-xs resize-none focus:border-sky-500 placeholder:text-[#666]"
              ></textarea>
            </div>

            <div className="flex flex-col gap-1.5">
              <button
                id="commitChanges"
                onClick={onCommitChanges}
                className="w-full bg-[#0066b8] hover:bg-[#005499] text-white py-1.5 px-3 rounded flex items-center justify-center gap-1.5 font-medium transition-colors text-xs"
                title="Commit staged changes locally"
              >
                <i className="fas fa-check"></i> Commit Changes
              </button>

              {onCommitPush && (
                <button
                  id="commitAndPushSidebar"
                  onClick={onCommitPush}
                  className="w-full bg-[#238636] hover:bg-[#2ea043] text-white py-1.5 px-3 rounded flex items-center justify-center gap-1.5 font-medium transition-colors text-xs shadow-sm"
                  title="Commit & Push all project files to GitHub"
                >
                  <i className="fas fa-upload"></i> Commit & Push to GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Content */}
      {activeTab === 'history' && (
        <div className="sidebar-content flex-1 flex flex-col overflow-y-auto p-3 space-y-3 text-xs">
          <div className="explorer-header flex justify-between items-center px-1 pb-2 border-b border-[#1a1a1a] text-[11px] font-bold text-[#858585] uppercase">
            <span>COMMIT HISTORY</span>
            {onRefreshHistory && (
              <button
                onClick={onRefreshHistory}
                className="p-1 hover:bg-[#3d3d3d] text-[#858585] hover:text-white rounded"
                title="Refresh History"
              >
                <i className={`fas fa-sync ${isLoadingHistory ? 'animate-spin text-sky-400' : ''}`}></i>
              </button>
            )}
          </div>

          {!repoInfo ? (
            <div className="text-xs text-[#777] p-3 text-center leading-relaxed">
              No GitHub repository loaded. Connect or clone a repository to view its commit history.
            </div>
          ) : isLoadingHistory ? (
            <div className="flex items-center justify-center py-8 gap-2 text-[#aaa]">
              <i className="fas fa-spinner animate-spin text-sky-400 text-sm"></i>
              <span>Loading commit history...</span>
            </div>
          ) : commitHistory.length === 0 ? (
            <div className="text-xs text-[#777] p-3 text-center">
              No commits found for branch <span className="font-mono text-sky-400">{currentBranch}</span>.
            </div>
          ) : (
            <div className="commit-list space-y-2 overflow-y-auto flex-1 pr-1">
              {commitHistory.map((commit) => {
                const firstLineMessage = commit.message.split('\n')[0];
                const formattedDate = commit.date
                  ? new Date(commit.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <div
                    key={commit.sha}
                    className="commit-item p-2.5 bg-[#2d2d2d] hover:bg-[#333333] border border-[#3d3d3d] rounded-md transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-[#e1e1e1] line-clamp-2 leading-snug">
                        {firstLineMessage}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {onRevertCommit && commit.treeSha && (
                          <button
                            onClick={() => onRevertCommit(commit.sha, commit.treeSha!)}
                            className="flex items-center text-[#888] hover:text-amber-400 bg-[#1e1e1e] hover:bg-[#3d3d3d] border border-[#3d3d3d] hover:border-amber-500/50 px-2 py-0.5 rounded transition-colors text-[10px] font-medium"
                            title="Revert repository to this commit"
                          >
                            <i className="fas fa-undo"></i>
                            <span className="ml-1">Revert</span>
                          </button>
                        )}
                        <a
                          href={commit.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] bg-[#1e1e1e] hover:bg-sky-900/60 text-sky-400 hover:text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded transition-colors"
                          title="View commit on GitHub"
                        >
                          {commit.shortSha}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#999] pt-1 border-t border-[#383838]">
                      <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                        {commit.authorAvatar ? (
                          <img
                            src={commit.authorAvatar}
                            alt={commit.authorName}
                            className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <i className="fas fa-user-circle text-[#888]"></i>
                        )}
                        <span className="truncate text-[#bbb] font-medium">{commit.authorName}</span>
                      </div>
                      <span className="shrink-0 text-[#888]">{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-[#252526] border border-[#3d3d3d] rounded-md shadow-2xl py-1 w-44 text-xs text-[#d4d4d4] select-none"
        >
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#888] border-b border-[#333] truncate">
            {contextMenu.node.name}
          </div>

          {contextMenu.node.type === 'file' && (
            <>
              <button
                onClick={() => {
                  const node = contextMenu.node;
                  setContextMenu(null);
                  handleFileClick(node);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
              >
                <i className="fas fa-file-code w-3.5 text-sky-400"></i> Open File
              </button>
              {onCompareFile && (
                <button
                  onClick={() => {
                    const node = contextMenu.node;
                    setContextMenu(null);
                    onCompareFile(node.path);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
                >
                  <i className="fas fa-code-compare w-3.5 text-sky-400"></i> Compare (Diff)
                </button>
              )}
              {onRevertFile && (sourceControlChanges.has(contextMenu.node.path) || stagedChanges.has(contextMenu.node.path)) && (
                <button
                  onClick={() => {
                    const node = contextMenu.node;
                    setContextMenu(null);
                    if (window.confirm(`Discard and revert changes to "${node.name}"?`)) {
                      onRevertFile(node.path);
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-rose-900 hover:text-white text-rose-300 flex items-center gap-2"
                >
                  <i className="fas fa-undo w-3.5"></i> Revert Changes
                </button>
              )}
              <div className="my-1 border-t border-[#333]"></div>
            </>
          )}

          {contextMenu.node.type === 'folder' && onNewItem && (
            <>
              <button
                onClick={() => {
                  const p = contextMenu.node.path;
                  setContextMenu(null);
                  onNewItem(p, 'file');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
              >
                <i className="fas fa-file-circle-plus w-3.5 text-emerald-400"></i> New File
              </button>
              <button
                onClick={() => {
                  const p = contextMenu.node.path;
                  setContextMenu(null);
                  onNewItem(p, 'folder');
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
              >
                <i className="fas fa-folder-plus w-3.5 text-amber-400"></i> New Folder
              </button>
              <div className="my-1 border-t border-[#333]"></div>
            </>
          )}

          {onMoveItem && (
            <button
              onClick={() => {
                const node = contextMenu.node;
                setContextMenu(null);
                onMoveItem(node.path, node.name, node.type);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
            >
              <i className="fas fa-arrows-up-down-left-right w-3.5 text-amber-400"></i> Move to...
            </button>
          )}

          {onRenameNode && (
            <button
              onClick={() => {
                const node = contextMenu.node;
                setContextMenu(null);
                onRenameNode(node.path, node.name, node.type);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
            >
              <i className="fas fa-pen w-3.5 text-sky-400"></i> Rename
            </button>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(contextMenu.node.path);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#0066b8] hover:text-white flex items-center gap-2"
          >
            <i className="fas fa-copy w-3.5 text-[#aaa]"></i> Copy Path
          </button>

          {onDeleteNode && (
            <>
              <div className="my-1 border-t border-[#333]"></div>
              <button
                onClick={() => {
                  const node = contextMenu.node;
                  setContextMenu(null);
                  onDeleteNode(node.path, node.type, node.name);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-400 flex items-center gap-2"
              >
                <i className="fas fa-trash-alt w-3.5"></i> Delete
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};
