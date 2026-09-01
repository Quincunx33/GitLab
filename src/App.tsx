import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import { Toolbar } from './components/Toolbar';
import { Sidebar } from './components/Sidebar';
import { EditorArea } from './components/EditorArea';
import { Modals } from './components/Modals';
import { Notification } from './components/Notification';
import { CompareModal } from './components/CompareModal';
import { FileNode, Tab, OutlineItem, RepoInfo, SidebarTab, CommitInfo, GitHubRepoItem } from './types';
import { parseOutline } from './utils/codeParser';
import { getLanguageFromFilename, SYNTAX_OPTIONS } from './utils/fileIcons';
import { RepoBrowserModal } from './components/RepoBrowserModal';
import {
  parseRepoUrl,
  fetchGitHubRepoTree,
  fetchFileContent,
  fetchBranches,
  fetchGitHubUser,
  createGitHubRepository,
  commitAndPushFile,
  commitMultipleFilesToGitHub,
  CommitFilePayload,
  fetchCommitHistory,
  fetchUserRepositories,
  fetchPublicUserRepos,
  GitHubTreeItem,
  revertRepositoryToCommit,
} from './services/github';
import {
  auth,
  testFirebaseConnection,
  signInWithGitHubOAuth,
  logoutUser,
  onAuthStateChanged,
  User,
} from './services/firebase';

export const App: React.FC = () => {
  // File Structure & Tabs (starts empty without demo files)
  const [fileStructure, setFileStructure] = useState<FileNode | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');

  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  // GitHub State
  const [githubToken, setGithubToken] = useState<string | null>(() => localStorage.getItem('github_pat'));
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepoItem[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState<boolean>(false);
  const [showRepoBrowserModal, setShowRepoBrowserModal] = useState<boolean>(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('main');

  // Source Control State
  const [sourceControlChanges, setSourceControlChanges] = useState<Map<string, string>>(new Map());
  const [stagedChanges, setStagedChanges] = useState<Map<string, string>>(new Map());
  const [deletedFiles, setDeletedFiles] = useState<Set<string>>(new Set());
  const [commitMessage, setCommitMessage] = useState<string>('');

  // Original contents tracking for Diff comparison
  const [originalContents, setOriginalContents] = useState<Map<string, string>>(new Map());

  // Compare Modal State
  const [compareModalState, setCompareModalState] = useState<{
    isOpen: boolean;
    filePath: string | null;
  }>({ isOpen: false, filePath: null });

  // File Operations Modal State (New File, New Folder, Rename, Delete)
  const [fileOpModal, setFileOpModal] = useState<{
    isOpen: boolean;
    mode: 'new-file' | 'new-folder' | 'rename' | 'delete';
    targetPath: string;
    initialName?: string;
    nodeType?: 'file' | 'folder';
  }>({
    isOpen: false,
    mode: 'new-file',
    targetPath: '',
  });

  // Outline State
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);

  // History State
  const [commitHistory, setCommitHistory] = useState<CommitInfo[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Modals & UI State
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showCreateRepoModal, setShowCreateRepoModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isMobileShow, setIsMobileShow] = useState(false);

  // Editor Ref
  const editorRef = useRef<any>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Initialize Firebase connection & Auth state listener
  useEffect(() => {
    testFirebaseConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user && !githubUser) {
        setGithubUser(user.displayName || user.email || 'User');
      }
    });
    return () => unsubscribe();
  }, [githubUser]);

  // Load User Repositories from GitHub
  const loadUserRepositories = useCallback(
    async (token?: string | null, username?: string | null, notify: boolean = false) => {
      const activeToken = token !== undefined ? token : githubToken;
      const activeUser = username !== undefined ? username : githubUser;

      if (!activeToken && !activeUser) {
        setRepositories([]);
        return;
      }

      try {
        setIsLoadingRepos(true);
        let repos: GitHubRepoItem[] = [];
        if (activeToken) {
          repos = await fetchUserRepositories(activeToken);
        } else if (activeUser) {
          repos = await fetchPublicUserRepos(activeUser);
        }
        setRepositories(repos);
        if (notify && repos.length > 0) {
          showToast(`Found ${repos.length} GitHub repositories for @${activeUser || 'user'}`, 'success');
        }
      } catch (err: any) {
        console.error('Error fetching repositories:', err);
        if (notify) {
          showToast(err.message || 'Failed to load GitHub repositories', 'error');
        }
      } finally {
        setIsLoadingRepos(false);
      }
    },
    [githubToken, githubUser, showToast]
  );

  // Auto-fetch repositories whenever credentials change
  useEffect(() => {
    if (githubToken || githubUser) {
      loadUserRepositories(githubToken, githubUser, false);
    }
  }, [githubToken, githubUser, loadUserRepositories]);

  // Check stored GitHub token on boot
  useEffect(() => {
    if (githubToken) {
      fetchGitHubUser(githubToken)
        .then((username) => {
          setGithubUser(username);
          loadUserRepositories(githubToken, username, false);
        })
        .catch(() => {
          localStorage.removeItem('github_pat');
          setGithubToken(null);
          setGithubUser(null);
          setRepositories([]);
        });
    }
  }, [githubToken]);

  // Load Commit History
  const loadCommitHistory = useCallback(async () => {
    if (!repoInfo) return;
    try {
      setIsLoadingHistory(true);
      const history = await fetchCommitHistory(
        repoInfo.owner,
        repoInfo.repo,
        currentBranch,
        githubToken
      );
      setCommitHistory(history);
    } catch (err: any) {
      console.error('Error fetching commit history:', err);
      const errMsg = err.message || '';
      if (
        errMsg.toLowerCase().includes('empty') ||
        errMsg.toLowerCase().includes('conflict') ||
        errMsg.toLowerCase().includes('409') ||
        errMsg.toLowerCase().includes('not found') ||
        errMsg.toLowerCase().includes('404')
      ) {
        setCommitHistory([]);
      } else {
        showToast(errMsg || 'Failed to fetch commit history', 'error');
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [repoInfo, currentBranch, githubToken, showToast]);

  useEffect(() => {
    if (activeSidebarTab === 'history' && repoInfo) {
      loadCommitHistory();
    }
  }, [activeSidebarTab, repoInfo, currentBranch, loadCommitHistory]);


  // GitHub OAuth Login via Firebase
  const handleGitHubOAuth = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Signing in with GitHub OAuth...');
      const { user, githubAccessToken } = await signInWithGitHubOAuth();
      const resolvedUsername = user.displayName || user.email || 'User';

      if (githubAccessToken) {
        localStorage.setItem('github_pat', githubAccessToken);
        setGithubToken(githubAccessToken);
        showToast(`Connected with GitHub OAuth as ${resolvedUsername}!`, 'success');
      } else {
        showToast(`Signed in with GitHub as ${resolvedUsername}`, 'success');
      }

      setGithubUser(resolvedUsername);
      setShowGitHubModal(false);
      
      // Immediately fetch and display user's repositories
      await loadUserRepositories(githubAccessToken || null, resolvedUsername, true);
    } catch (err: any) {
      showToast(err.message || 'GitHub OAuth failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout Firebase User
  const handleLogoutFirebase = async () => {
    try {
      await logoutUser();
      showToast('Logged out of Firebase', 'info');
    } catch (err: any) {
      showToast(err.message || 'Logout failed', 'error');
    }
  };

  // Update outline items whenever active tab content/language changes
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab) {
      const parsed = parseOutline(activeTab.content, activeTab.language);
      setOutlineItems(parsed);
    } else {
      setOutlineItems([]);
    }
  }, [tabs, activeTabId]);

  // Active Tab language getter
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const currentSyntax = activeTab ? activeTab.language : 'plaintext';

  // Helper to open or switch to a file tab
  const openFileInTab = useCallback((path: string, name: string, content: string, sha?: string) => {
    setOriginalContents((prev) => {
      if (!prev.has(path)) {
        const next = new Map(prev);
        next.set(path, content);
        return next;
      }
      return prev;
    });

    setTabs((prevTabs) => {
      const existing = prevTabs.find((t) => t.id === path);
      if (existing) {
        return prevTabs;
      }
      const newTab: Tab = {
        id: path,
        title: name,
        path,
        content,
        isModified: false,
        language: getLanguageFromFilename(name),
        sha,
      };
      return [...prevTabs, newTab];
    });
    setActiveTabId(path);
  }, []);

  // Handle File Selection from Sidebar Tree
  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.type === 'file') {
      if (node.content !== undefined) {
        openFileInTab(node.path, node.name, node.content, node.sha);
      } else if (node.zipEntry) {
        try {
          setIsLoading(true);
          setLoadingMessage(`Reading ${node.name}...`);
          let content = '';
          const ext = node.name.split('.').pop()?.toLowerCase() || '';
          const binaryExtensions = new Set([
            'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'pdf', 'zip', 'tar',
            'gz', '7z', 'exe', 'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf',
            'eot', 'mp3', 'mp4', 'wav', 'avi', 'mov', 'pyc', 'wasm', 'class', 'o',
            'svg', 'psd', 'ai', 'apk', 'jar', 'iso'
          ]);
          if (binaryExtensions.has(ext)) {
            content = '[Binary File]';
          } else {
            try {
              content = await node.zipEntry.async('string');
            } catch (e) {
              content = '[Binary File]';
            }
          }
          node.content = content;
          openFileInTab(node.path, node.name, content, node.sha);
        } catch (err: any) {
          showToast(`Error reading file: ${err.message}`, 'error');
        } finally {
          setIsLoading(false);
        }
      } else if (repoInfo && githubToken) {
        // Lazy fetch file content from GitHub REST API
        try {
          setIsLoading(true);
          setLoadingMessage(`Loading ${node.name}...`);
          const fetchedContent = await fetchFileContent(
            repoInfo.owner,
            repoInfo.repo,
            node.path.replace(`${repoInfo.repo}/`, ''),
            currentBranch,
            githubToken
          );
          node.content = fetchedContent;
          openFileInTab(node.path, node.name, fetchedContent, node.sha);
        } catch (err: any) {
          showToast(`Error loading file: ${err.message}`, 'error');
        } finally {
          setIsLoading(false);
        }
      }
    }
  }, [openFileInTab, repoInfo, githubToken, currentBranch, showToast]);

  // Handle Content Change in Editor (Auto Save)
  const handleContentChange = (newContent: string) => {
    if (!activeTabId) return;

    let targetPath = '';
    let currentContentBeforeEdit = '';

    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeTabId) {
          targetPath = t.path;
          currentContentBeforeEdit = t.content;
          return { ...t, content: newContent, isModified: false };
        }
        return t;
      })
    );

    if (targetPath) {
      setOriginalContents((prev) => {
        if (!prev.has(targetPath)) {
          const next = new Map(prev);
          next.set(targetPath, currentContentBeforeEdit);
          return next;
        }
        return prev;
      });
      // Auto-save to file structure tree node
      setFileStructure((prev) => {
        if (!prev) return prev;
        const updateNode = (node: FileNode): FileNode => {
          if (node.path === targetPath) {
            return { ...node, content: newContent };
          }
          if (node.children) {
            const updatedChildren: Record<string, FileNode> = {};
            Object.entries(node.children).forEach(([k, child]) => {
              updatedChildren[k] = updateNode(child);
            });
            return { ...node, children: updatedChildren };
          }
          return node;
        };
        return updateNode(prev);
      });

      // Track change in source control
      setSourceControlChanges((prev) => {
        const next = new Map(prev);
        next.set(targetPath, 'modified');
        return next;
      });
    }
  };

  // Close Tab
  const handleCloseTab = (id: string) => {
    setTabs((prevTabs) => {
      const nextTabs = prevTabs.filter((t) => t.id !== id);
      if (activeTabId === id) {
        const closedIndex = prevTabs.findIndex((t) => t.id === id);
        const nextActive = nextTabs[closedIndex] || nextTabs[closedIndex - 1] || nextTabs[0] || null;
        setActiveTabId(nextActive ? nextActive.id : null);
      }
      return nextTabs;
    });
  };

  // Toolbar Actions
  const handleNewFile = () => {
    const fileName = prompt('Enter new file name:', 'untitled.js');
    if (!fileName) return;

    const path = fileStructure ? `${fileStructure.path}/${fileName}` : fileName;
    const newTab: Tab = {
      id: path,
      title: fileName,
      path,
      content: '// New File\n',
      isModified: true,
      language: getLanguageFromFilename(fileName),
    };

    // Add to file tree
    setFileStructure((prev) => {
      if (!prev) {
        return {
          name: 'workspace',
          path: 'workspace',
          type: 'folder',
          children: { [fileName]: { name: fileName, path, type: 'file', content: '// New File\n' } },
        };
      }
      const updatedChildren = { ...(prev.children || {}) };
      updatedChildren[fileName] = { name: fileName, path, type: 'file', content: '// New File\n' };
      return { ...prev, children: updatedChildren };
    });

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);

    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      next.set(path, 'added');
      return next;
    });
  };

  const handleOpenFile = async (file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      try {
        setIsLoading(true);
        setLoadingMessage(`Extracting zip archive "${file.name}"...`);
        const zip = new JSZip();
        const loadedZip = await zip.loadAsync(file);

        const rootName = repoInfo ? repoInfo.repo : file.name.replace(/\.zip$/i, '');

        // 1. Gather all non-junk entries with normalized path slashes
        const allEntries = Object.keys(loadedZip.files)
          .map((rawPath) => {
            const norm = rawPath.replace(/\\/g, '/');
            return { rawPath, norm, zipEntry: loadedZip.files[rawPath] };
          })
          .filter(({ norm }) => {
            return (
              !norm.startsWith('__MACOSX/') &&
              !norm.includes('/.DS_Store') &&
              !norm.endsWith('.DS_Store')
            );
          });

        if (allEntries.length === 0) {
          showToast(`Zip file "${file.name}" is empty`, 'info');
          setIsLoading(false);
          return;
        }

        // Detect if all entries share a single common top-level root folder prefix (extremely common in GitHub downloads)
        let commonRootPrefix = '';
        const firstEntry = allEntries[0];
        if (firstEntry) {
          const firstPart = firstEntry.norm.split('/')[0];
          if (firstPart) {
            const allShare = allEntries.every((e) => e.norm.startsWith(firstPart + '/'));
            if (allShare) {
              commonRootPrefix = firstPart + '/';
            }
          }
        }

        // 2. Build temporary hierarchy tree using Map to avoid node overwrite issues
        interface TempNode {
          name: string;
          type: 'folder' | 'file';
          zipEntry?: any;
          children?: Map<string, TempNode>;
        }

        const rootTemp: TempNode = {
          name: rootName,
          type: 'folder',
          children: new Map(),
        };

        const getOrCreateFolder = (parent: TempNode, folderName: string): TempNode => {
          if (!parent.children) parent.children = new Map();
          let existing = parent.children.get(folderName);
          if (!existing || existing.type !== 'folder') {
            existing = { name: folderName, type: 'folder', children: new Map() };
            parent.children.set(folderName, existing);
          }
          return existing;
        };

        const binaryExtensions = new Set([
          'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'pdf', 'zip', 'tar',
          'gz', '7z', 'exe', 'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf',
          'eot', 'mp3', 'mp4', 'wav', 'avi', 'mov', 'pyc', 'wasm', 'class', 'o',
          'svg', 'psd', 'ai', 'apk', 'jar', 'iso'
        ]);

        let fileCount = 0;

        for (const entry of allEntries) {
          const { norm, zipEntry } = entry;
          const isDir = zipEntry.dir || norm.endsWith('/');
          
          let cleanPath = norm;
          if (commonRootPrefix && cleanPath.startsWith(commonRootPrefix)) {
            cleanPath = cleanPath.slice(commonRootPrefix.length);
          }
          cleanPath = cleanPath.replace(/^\/+/, '').replace(/\/+$/, '');
          if (!cleanPath) continue;

          const parts = cleanPath.split('/').filter(Boolean);
          if (parts.length === 0) continue;

          let current = rootTemp;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;

            if (isLast && !isDir) {
              if (!current.children) current.children = new Map();
              const existing = current.children.get(part);
              if (!existing || existing.type === 'file') {
                current.children.set(part, {
                  name: part,
                  type: 'file',
                  zipEntry,
                });
                fileCount++;
              }
            } else {
              current = getOrCreateFolder(current, part);
            }
          }
        }

        // 3. Recursively convert TempNode -> FileNode with full path tracking
        const tempToNode = (temp: TempNode, currentPath: string): FileNode => {
          if (temp.type === 'file') {
            const ext = temp.name.split('.').pop()?.toLowerCase() || '';
            const isBinary = binaryExtensions.has(ext);
            return {
              name: temp.name,
              path: currentPath,
              type: 'file',
              zipEntry: temp.zipEntry,
              content: isBinary ? '[Binary File]' : undefined,
            };
          } else {
            const childrenRecord: Record<string, FileNode> = {};
            if (temp.children) {
              for (const [childName, childTemp] of temp.children.entries()) {
                const childPath = `${currentPath}/${childName}`;
                childrenRecord[childName] = tempToNode(childTemp, childPath);
              }
            }
            return {
              name: temp.name,
              path: currentPath,
              type: 'folder',
              children: childrenRecord,
            };
          }
        };

        const rootNode = tempToNode(rootTemp, rootName);

        // 4. Un-nest single wrapper folders (e.g. repo-main/repo-main)
        let finalTree = rootNode;
        while (
          finalTree.type === 'folder' &&
          finalTree.children &&
          Object.keys(finalTree.children).length === 1
        ) {
          const soleKey = Object.keys(finalTree.children)[0];
          const soleChild = finalTree.children[soleKey];
          if (soleChild.type === 'folder') {
            finalTree = soleChild;
          } else {
            break;
          }
        }

        setFileStructure(finalTree);

        // 5. Smart candidate file ranking for initial open tabs
        const allTextFiles: FileNode[] = [];
        const collectFiles = (node: FileNode) => {
          if (node.type === 'file') {
            const ext = node.name.split('.').pop()?.toLowerCase() || '';
            if (!binaryExtensions.has(ext)) {
              allTextFiles.push(node);
            }
          } else if (node.children) {
            Object.values(node.children).forEach(collectFiles);
          }
        };
        collectFiles(finalTree);

        const getPriority = (fileName: string): number => {
          const lower = fileName.toLowerCase();
          if (lower === 'readme.md') return 100;
          if (lower === 'index.html') return 95;
          if (lower === 'main.py' || lower === 'app.py' || lower === 'index.py') return 90;
          if (lower === 'package.json') return 88;
          if (lower === 'main.js' || lower === 'index.js' || lower === 'app.js') return 85;
          if (lower === 'main.ts' || lower === 'index.ts' || lower === 'app.tsx') return 85;
          if (lower === 'main.go' || lower === 'main.rs' || lower === 'main.cpp') return 80;
          if (lower.startsWith('.env')) return -10; // Avoid env files as top choice
          if (lower.startsWith('.')) return -5;
          return 10;
        };

        allTextFiles.sort((a, b) => getPriority(b.name) - getPriority(a.name));

        const selectedCandidates = allTextFiles.slice(0, 5);

        const openedTabs: Tab[] = [];
        for (const candidate of selectedCandidates) {
          let content = '';
          if (candidate.zipEntry) {
            try {
              content = await candidate.zipEntry.async('string');
            } catch (e) {
              content = '[Binary File]';
            }
          } else {
            content = candidate.content || '';
          }
          candidate.content = content;

          openedTabs.push({
            id: candidate.path,
            title: candidate.name,
            path: candidate.path,
            content,
            isModified: false,
            language: getLanguageFromFilename(candidate.name),
          });
        }

        if (openedTabs.length > 0) {
          setTabs(openedTabs);
          setActiveTabId(openedTabs[0].id);
        } else {
          setTabs([]);
          setActiveTabId(null);
        }

        // Automatically focus Explorer tab and expand Mobile sidebar
        setActiveSidebarTab('explorer');
        setIsMobileShow(true);

        showToast(`Extracted ${fileCount} files from "${file.name}"`, 'success');
      } catch (err: any) {
        console.error('Zip extraction error:', err);
        showToast(err.message || 'Failed to extract zip file', 'error');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Single non-zip file upload
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      openFileInTab(file.name, file.name, content);
      setActiveSidebarTab('explorer');
      setIsMobileShow(true);
    };
    reader.readAsText(file);
  };

  const handleOpenFolder = (files: FileList) => {
    if (!files || files.length === 0) return;

    const rootName = files[0].webkitRelativePath.split('/')[0] || 'folder';
    const rootNode: FileNode = {
      name: rootName,
      path: rootName,
      type: 'folder',
      children: {},
    };

    const filePromises: Promise<void>[] = [];

    Array.from(files).forEach((file) => {
      const relPath = file.webkitRelativePath;
      const parts = relPath.split('/');

      let current = rootNode;
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (isFile) {
          const promise = file.text().then((text) => {
            if (!current.children) current.children = {};
            current.children[part] = {
              name: part,
              path: relPath,
              type: 'file',
              content: text,
            };
          });
          filePromises.push(promise);
        } else {
          if (!current.children) current.children = {};
          if (!current.children[part]) {
            current.children[part] = {
              name: part,
              path: parts.slice(0, i + 1).join('/'),
              type: 'folder',
              children: {},
            };
          }
          current = current.children[part];
        }
      }
    });

    Promise.all(filePromises).then(() => {
      setFileStructure(rootNode);
      setActiveSidebarTab('explorer');
      setIsMobileShow(true);
      showToast(`Opened folder "${rootName}"`, 'success');
    });
  };

  const handleSave = () => {
    if (!activeTab) return;

    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab.id ? { ...t, isModified: false } : t))
    );

    // Update file tree node
    setFileStructure((prev) => {
      if (!prev) return prev;
      const updateNode = (node: FileNode): FileNode => {
        if (node.path === activeTab.path) {
          return { ...node, content: activeTab.content };
        }
        if (node.children) {
          const updatedChildren: Record<string, FileNode> = {};
          Object.entries(node.children).forEach(([k, child]) => {
            updatedChildren[k] = updateNode(child);
          });
          return { ...node, children: updatedChildren };
        }
        return node;
      };
      return updateNode(prev);
    });

    showToast(`Saved ${activeTab.title}`, 'success');
  };

  const handleSaveAs = () => {
    if (!activeTab) return;
    const blob = new Blob([activeTab.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeTab.title;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${activeTab.title}`, 'success');
  };

  // Editor Actions
  const handleSelectAll = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.setSelection(model.getFullModelRange());
      }
    }
  };

  const handleCopy = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && model) {
        const text = model.getValueInRange(selection);
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'info');
      }
    }
  };

  const handleCut = () => {
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && model) {
        const text = model.getValueInRange(selection);
        navigator.clipboard.writeText(text);
        editorRef.current.executeEdits('', [
          { range: selection, text: '', forceMoveMarkers: true },
        ]);
        showToast('Cut to clipboard', 'info');
      }
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (editorRef.current && text) {
        const selection = editorRef.current.getSelection();
        if (selection) {
          editorRef.current.executeEdits('', [
            { range: selection, text, forceMoveMarkers: true },
          ]);
        }
      }
    } catch (e) {
      showToast('Clipboard access denied', 'error');
    }
  };

  const handleSyntaxChange = (syntax: string) => {
    if (!activeTabId) return;
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, language: syntax } : t))
    );
  };

  // Outline Jump to Line
  const handleOutlineClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  // GitHub Actions
  const handleSaveGitHubToken = (token: string) => {
    setIsLoading(true);
    setLoadingMessage('Verifying GitHub Token...');
    fetchGitHubUser(token)
      .then((username) => {
        localStorage.setItem('github_pat', token);
        setGithubToken(token);
        setGithubUser(username);
        setShowGitHubModal(false);
        showToast(`Authenticated as ${username}`, 'success');
        loadUserRepositories(token, username, true);
      })
      .catch((err) => {
        showToast(`Authentication failed: ${err.message}`, 'error');
      })
      .finally(() => setIsLoading(false));
  };

  const handleClearGitHubToken = () => {
    localStorage.removeItem('github_pat');
    setGithubToken(null);
    setGithubUser(null);
    setRepositories([]);
    showToast('Logged out from GitHub', 'info');
  };

  const handleCloneRepo = async (url: string, branch: string) => {
    const parsed = parseRepoUrl(url);
    if (!parsed) {
      showToast('Invalid GitHub URL format', 'error');
      return;
    }

    setShowCloneModal(false);
    setIsLoading(true);
    setLoadingMessage(`Cloning ${parsed.owner}/${parsed.repo} (${branch})...`);

    try {
      let treeItems: GitHubTreeItem[] = [];
      let branchList: string[] = [];
      let isBlankRepo = false;

      try {
        treeItems = await fetchGitHubRepoTree(parsed.owner, parsed.repo, branch, githubToken);
        branchList = await fetchBranches(parsed.owner, parsed.repo, githubToken);
      } catch (err: any) {
        const errMsg = err.message || '';
        if (
          errMsg.toLowerCase().includes('empty') ||
          errMsg.toLowerCase().includes('conflict') ||
          errMsg.toLowerCase().includes('409')
        ) {
          isBlankRepo = true;
          // Try to fetch branches, default to current branch if it fails
          try {
            branchList = await fetchBranches(parsed.owner, parsed.repo, githubToken);
            if (branchList.length === 0) branchList = [branch || 'main'];
          } catch (_) {
            branchList = [branch || 'main'];
          }
        } else {
          throw err;
        }
      }

      setRepoInfo({
        owner: parsed.owner,
        repo: parsed.repo,
        branch,
        branches: branchList,
      });
      setBranches(branchList);
      setCurrentBranch(branch);

      // Construct file tree structure from flat tree items
      const rootNode: FileNode = {
        name: parsed.repo,
        path: parsed.repo,
        type: 'folder',
        children: {},
      };

      if (!isBlankRepo) {
        treeItems.forEach((item) => {
          const parts = item.path.split('/');
          let current = rootNode;

          parts.forEach((part, index) => {
            const isFile = index === parts.length - 1 && item.type === 'blob';
            const fullPath = `${parsed.repo}/${parts.slice(0, index + 1).join('/')}`;

            if (isFile) {
              if (!current.children) current.children = {};
              current.children[part] = {
                name: part,
                path: fullPath,
                type: 'file',
                sha: item.sha,
              };
            } else {
              if (!current.children) current.children = {};
              if (!current.children[part]) {
                current.children[part] = {
                  name: part,
                  path: fullPath,
                  type: 'folder',
                  children: {},
                };
              }
              current = current.children[part];
            }
          });
        });
      }

      setFileStructure(rootNode);
      setTabs([]);

      if (!isBlankRepo) {
        // Automatically open README.md or first file if available
        const readmeItem = treeItems.find((i) => i.path.toLowerCase() === 'readme.md');
        const targetPath = readmeItem ? readmeItem.path : treeItems.find((i) => i.type === 'blob')?.path;

        if (targetPath) {
          const content = await fetchFileContent(parsed.owner, parsed.repo, targetPath, branch, githubToken);
          openFileInTab(`${parsed.repo}/${targetPath}`, targetPath.split('/').pop() || targetPath, content, readmeItem?.sha);
        }

        showToast(`Cloned ${parsed.owner}/${parsed.repo} successfully!`, 'success');
      } else {
        showToast(`Successfully opened empty repository "${parsed.owner}/${parsed.repo}"! Create or upload files to begin.`, 'success');
      }
    } catch (err: any) {
      showToast(`Clone failed: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create GitHub Repository Handler
  const handleRevertCommit = async (commitSha: string, treeSha: string) => {
    if (!repoInfo || !githubToken) {
      showToast("You must be connected to a GitHub repository with an access token to revert.", "error");
      return;
    }
    const confirmRevert = window.confirm(
      "Are you sure you want to revert the repository to this commit? This will create a new commit replacing the current state with the old state."
    );
    if (!confirmRevert) return;

    setIsLoading(true);
    setLoadingMessage("Reverting repository to old commit...");
    try {
      await revertRepositoryToCommit(
        repoInfo.owner,
        repoInfo.repo,
        currentBranch,
        commitSha,
        treeSha,
        githubToken
      );
      showToast("Successfully reverted the repository!", "success");
      await handleCloneRepo(`${repoInfo.owner}/${repoInfo.repo}`, currentBranch);
      loadCommitHistory();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to revert commit", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRepoSubmit = async (name: string, description: string, isPrivate: boolean) => {
    if (!githubToken) {
      showToast('Please sign in or enter a GitHub Personal Access Token first.', 'error');
      setShowGitHubModal(true);
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage(`Creating repository "${name}" on GitHub...`);
      const newRepo = await createGitHubRepository(name, description, isPrivate, githubToken);
      showToast(`Repository "${name}" created successfully!`, 'success');
      setShowCreateRepoModal(false);

      // Auto clone / load the newly created repository
      await handleCloneRepo(newRepo.html_url, 'main');
      // Refresh user's repository list
      loadUserRepositories(githubToken, githubUser, false);
    } catch (err: any) {
      showToast(err.message || 'Failed to create repository', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    if (!repoInfo) return;
    setShowBranchModal(false);
    handleCloneRepo(`${repoInfo.owner}/${repoInfo.repo}`, branchName);
  };

  // Source Control Handlers
  const handleStageFile = (path: string) => {
    const status = sourceControlChanges.get(path);
    if (!status) return;

    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });

    setStagedChanges((prev) => {
      const next = new Map(prev);
      next.set(path, status);
      return next;
    });
  };

  const handleUnstageFile = (path: string) => {
    const status = stagedChanges.get(path);
    if (!status) return;

    setStagedChanges((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });

    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      next.set(path, status);
      return next;
    });
  };

  const handleStageAll = () => {
    setStagedChanges((prev) => {
      const next = new Map(prev);
      sourceControlChanges.forEach((v, k) => next.set(k, v));
      return next;
    });
    setSourceControlChanges(new Map());
  };

  const handleUnstageAll = () => {
    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      stagedChanges.forEach((v, k) => next.set(k, v));
      return next;
    });
    setStagedChanges(new Map());
  };

  // Helper to find file node recursively
  const findNodeByPath = useCallback((node: FileNode | null, targetPath: string): FileNode | null => {
    if (!node) return null;
    if (node.path === targetPath) return node;
    if (node.children) {
      for (const child of Object.values(node.children)) {
        const found = findNodeByPath(child, targetPath);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Helper to remove node from tree
  const removeNodeFromTree = (root: FileNode, targetPath: string): FileNode | null => {
    if (root.path === targetPath) {
      return null;
    }
    if (!root.children) return root;

    const newChildren: Record<string, FileNode> = {};
    for (const [key, child] of Object.entries(root.children)) {
      if (child.path === targetPath) {
        continue;
      }
      if (child.type === 'folder') {
        const updatedChild = removeNodeFromTree(child, targetPath);
        if (updatedChild) {
          newChildren[key] = updatedChild;
        }
      } else {
        newChildren[key] = child;
      }
    }

    return {
      ...root,
      children: newChildren,
    };
  };

  // Helper to rename node in tree
  const renameNodeInTree = (
    root: FileNode,
    targetPath: string,
    newName: string,
    newPath: string
  ): FileNode => {
    if (root.path === targetPath) {
      return {
        ...root,
        name: newName,
        path: newPath,
      };
    }
    if (!root.children) return root;

    const newChildren: Record<string, FileNode> = {};
    for (const [key, child] of Object.entries(root.children)) {
      if (child.path === targetPath) {
        newChildren[newName] = {
          ...child,
          name: newName,
          path: newPath,
        };
      } else if (child.type === 'folder' && (targetPath === child.path || targetPath.startsWith(child.path + '/'))) {
        newChildren[key] = renameNodeInTree(child, targetPath, newName, newPath);
      } else {
        newChildren[key] = child;
      }
    }

    return {
      ...root,
      children: newChildren,
    };
  };

  // Helper to recursively update all paths inside a node when moved or renamed
  const updateNodePaths = (node: FileNode, newBasePath: string): FileNode => {
    const updated: FileNode = {
      ...node,
      path: newBasePath,
    };
    if (node.children) {
      const updatedChildren: Record<string, FileNode> = {};
      for (const [name, child] of Object.entries(node.children)) {
        const childNewPath = `${newBasePath}/${name}`.replace(/\/+/g, '/');
        updatedChildren[name] = updateNodePaths(child, childNewPath);
      }
      updated.children = updatedChildren;
    }
    return updated;
  };

  // Helper to insert new node into tree
  const insertNodeIntoTree = (
    root: FileNode,
    parentPath: string,
    newNode: FileNode
  ): FileNode => {
    const normParent = parentPath ? parentPath.replace(/^\/+|\/+$/g, '') : '';
    const normRoot = root.path ? root.path.replace(/^\/+|\/+$/g, '') : '';

    if (!normParent || normParent === normRoot || normParent === 'workspace') {
      return {
        ...root,
        children: {
          ...(root.children || {}),
          [newNode.name]: newNode,
        },
      };
    }

    if (!root.children) return root;

    const newChildren: Record<string, FileNode> = {};
    for (const [key, child] of Object.entries(root.children)) {
      const normChild = child.path ? child.path.replace(/^\/+|\/+$/g, '') : '';
      if (child.type === 'folder' && (normParent === normChild || normParent.startsWith(normChild + '/'))) {
        newChildren[key] = insertNodeIntoTree(child, parentPath, newNode);
      } else {
        newChildren[key] = child;
      }
    }

    return {
      ...root,
      children: newChildren,
    };
  };

  // Helper to update node content in tree
  const updateNodeInTree = (
    root: FileNode,
    targetPath: string,
    newContent: string
  ): FileNode => {
    if (root.path === targetPath) {
      return {
        ...root,
        content: newContent,
      };
    }
    if (!root.children) return root;

    const newChildren: Record<string, FileNode> = {};
    for (const [key, child] of Object.entries(root.children)) {
      if (child.path === targetPath || targetPath.startsWith(child.path + '/')) {
        newChildren[key] = updateNodeInTree(child, targetPath, newContent);
      } else {
        newChildren[key] = child;
      }
    }

    return {
      ...root,
      children: newChildren,
    };
  };

  // Collect all files across workspace for full multi-file commit
  const collectAllWorkspaceFiles = async (
    root: FileNode | null,
    openTabs: Tab[],
    rootPrefixToStrip: string
  ): Promise<CommitFilePayload[]> => {
    if (!root) return [];
    const files: CommitFilePayload[] = [];
    const openTabsMap = new Map(openTabs.map((t) => [t.path, t.content]));

    const walk = async (node: FileNode) => {
      if (node.type === 'file') {
        let relativePath = node.path;
        if (rootPrefixToStrip && relativePath.startsWith(rootPrefixToStrip)) {
          relativePath = relativePath.slice(rootPrefixToStrip.length).replace(/^\/+/, '');
        } else if (rootPrefixToStrip && relativePath.includes('/')) {
          // If path starts with root folder name
          const firstSegment = relativePath.split('/')[0] + '/';
          if (rootPrefixToStrip === firstSegment) {
            relativePath = relativePath.slice(firstSegment.length);
          }
        }
        relativePath = relativePath.replace(/^\/+/, '');
        if (!relativePath) return;

        if (openTabsMap.has(node.path)) {
          files.push({
            path: relativePath,
            content: openTabsMap.get(node.path) || '',
          });
        } else if (node.content !== undefined) {
          files.push({
            path: relativePath,
            content: node.content,
          });
        } else if (node.zipEntry) {
          try {
            const ext = node.name.split('.').pop()?.toLowerCase() || '';
            const binaryExtensions = new Set([
              'png', 'jpg', 'jpeg', 'gif', 'ico', 'webp', 'pdf', 'zip', 'tar',
              'gz', '7z', 'exe', 'dll', 'so', 'dylib', 'woff', 'woff2', 'ttf',
              'eot', 'mp3', 'mp4', 'wav', 'avi', 'mov', 'wasm'
            ]);
            if (binaryExtensions.has(ext)) {
              const base64Data = await node.zipEntry.async('base64');
              files.push({
                path: relativePath,
                content: base64Data,
                encoding: 'base64',
              });
            } else {
              const textContent = await node.zipEntry.async('string');
              files.push({
                path: relativePath,
                content: textContent,
              });
            }
          } catch (e) {
            console.warn('Could not read zip entry for commit:', node.path, e);
          }
        }
      } else if (node.type === 'folder' && node.children) {
        for (const child of Object.values(node.children)) {
          await walk(child);
        }
      }
    };

    if (root.type === 'folder' && root.children) {
      for (const child of Object.values(root.children)) {
        await walk(child);
      }
    } else {
      await walk(root);
    }

    return files;
  };

  // File Operations: New File/Folder, Rename, Delete
  const handleNewItem = (parentPath: string, type: 'file' | 'folder') => {
    setFileOpModal({
      isOpen: true,
      mode: type === 'file' ? 'new-file' : 'new-folder',
      targetPath: parentPath,
      nodeType: type,
      initialName: '',
    });
  };

  const handleRenameNode = (path: string, currentName: string, type: 'file' | 'folder') => {
    setFileOpModal({
      isOpen: true,
      mode: 'rename',
      targetPath: path,
      initialName: currentName,
      nodeType: type,
    });
  };

  const handleDeleteNode = (path: string, type: 'file' | 'folder', name: string) => {
    setFileOpModal({
      isOpen: true,
      mode: 'delete',
      targetPath: path,
      initialName: name,
      nodeType: type,
    });
  };

  const handleMoveItem = (path: string, currentName: string, type: 'file' | 'folder') => {
    setFileOpModal({
      isOpen: true,
      mode: 'move',
      targetPath: path,
      initialName: currentName,
      nodeType: type,
    });
  };

  const handleMoveNode = (sourcePath: string, destParentPath: string) => {
    if (!fileStructure || !sourcePath) return;

    // Normalizing paths
    const targetParent = destParentPath === '/' || destParentPath === '' ? '' : destParentPath.trim();

    // Prevent moving into itself or into its own subfolder
    if (sourcePath === targetParent || targetParent.startsWith(sourcePath + '/')) {
      showToast('Cannot move a folder into itself or its subfolder', 'error');
      return;
    }

    const nodeToMove = findNodeByPath(fileStructure, sourcePath);
    if (!nodeToMove) {
      showToast(`Source item "${sourcePath}" not found`, 'error');
      return;
    }

    const rootPrefix = fileStructure.path === 'workspace' ? 'workspace' : fileStructure.path;
    let effectiveParentPath = targetParent;
    if (!effectiveParentPath || effectiveParentPath === 'workspace' || effectiveParentPath === rootPrefix) {
      effectiveParentPath = fileStructure.path;
    }

    const currentParentPath = sourcePath.includes('/')
      ? sourcePath.substring(0, sourcePath.lastIndexOf('/'))
      : fileStructure.path;

    if (currentParentPath === effectiveParentPath) {
      showToast('Item is already in this directory', 'info');
      return;
    }

    const newPath = effectiveParentPath && effectiveParentPath !== fileStructure.path
      ? `${effectiveParentPath}/${nodeToMove.name}`.replace(/\/+/g, '/')
      : `${fileStructure.path}/${nodeToMove.name}`.replace(/\/+/g, '/');

    // Check if destination already has an item with the same name
    const existingNode = findNodeByPath(fileStructure, newPath);
    if (existingNode) {
      showToast(`An item named "${nodeToMove.name}" already exists in the destination`, 'error');
      return;
    }

    // Remove from old location
    const treeWithoutNode = removeNodeFromTree(fileStructure, sourcePath);
    if (!treeWithoutNode) return;

    // Update internal paths of node and its children
    const updatedNode = updateNodePaths(nodeToMove, newPath);

    // Insert into destination
    const finalTree = insertNodeIntoTree(treeWithoutNode, effectiveParentPath, updatedNode);
    setFileStructure(finalTree);

    // Update tabs
    setTabs((prev) =>
      prev.map((t) => {
        if (t.path === sourcePath) {
          return {
            ...t,
            id: newPath,
            path: newPath,
          };
        } else if (t.path.startsWith(sourcePath + '/')) {
          const subRel = t.path.slice(sourcePath.length);
          const subNewPath = newPath + subRel;
          return {
            ...t,
            id: subNewPath,
            path: subNewPath,
          };
        }
        return t;
      })
    );

    // Update active tab ID
    if (activeTabId === sourcePath) {
      setActiveTabId(newPath);
    } else if (activeTabId && activeTabId.startsWith(sourcePath + '/')) {
      const subRel = activeTabId.slice(sourcePath.length);
      setActiveTabId(newPath + subRel);
    }

    // Track modified in source control
    const movedFilePaths: string[] = [];
    const collectFiles = (n: FileNode) => {
      if (n.type === 'file') movedFilePaths.push(n.path);
      else if (n.children) Object.values(n.children).forEach(collectFiles);
    };
    collectFiles(updatedNode);

    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      next.delete(sourcePath);
      movedFilePaths.forEach((p) => next.set(p, 'modified'));
      return next;
    });

    const destLabel = effectiveParentPath === fileStructure.path ? 'root' : effectiveParentPath;
    showToast(`Moved "${nodeToMove.name}" to ${destLabel}`, 'success');
  };

  const handleConfirmFileOp = (name: string) => {
    const { mode, targetPath, initialName, nodeType } = fileOpModal;
    setFileOpModal({ isOpen: false, mode: 'new-file', targetPath: '' });

    if (mode === 'move') {
      handleMoveNode(targetPath, name);
      return;
    }

    if (mode === 'delete') {
      if (!fileStructure) return;
      // If deleting the root
      if (fileStructure.path === targetPath) {
        setFileStructure(null);
        setTabs([]);
        setActiveTabId(null);
        showToast('Closed workspace', 'info');
        return;
      }

      // Collect all nested file paths to mark as deleted
      const deletedPaths: string[] = [];
      const collectDeletions = (node: FileNode) => {
        if (node.type === 'file') {
          deletedPaths.push(node.path);
        } else if (node.children) {
          Object.values(node.children).forEach(collectDeletions);
        }
      };

      const targetNode = findNodeByPath(fileStructure, targetPath);
      if (targetNode) {
        collectDeletions(targetNode);
      }

      const updatedTree = removeNodeFromTree(fileStructure, targetPath);
      setFileStructure(updatedTree);

      // Close tabs for deleted files
      setTabs((prev) => prev.filter((t) => !t.path.startsWith(targetPath)));
      if (activeTabId && activeTabId.startsWith(targetPath)) {
        setActiveTabId(null);
      }

      // Track deletions for Git commit
      setDeletedFiles((prev) => {
        const next = new Set(prev);
        deletedPaths.forEach((p) => next.add(p));
        next.add(targetPath);
        return next;
      });

      // Update source control
      setSourceControlChanges((prev) => {
        const next = new Map(prev);
        deletedPaths.forEach((p) => next.set(p, 'deleted'));
        return next;
      });

      showToast(`Deleted ${nodeType === 'folder' ? 'folder' : 'file'} "${initialName || targetPath}"`, 'info');
      return;
    }

    if (mode === 'new-file') {
      const cleanName = name.trim();
      if (!cleanName) return;

      const parentDir = targetPath || (fileStructure ? fileStructure.path : '');
      const newPath = parentDir ? `${parentDir}/${cleanName}`.replace(/\/+/g, '/') : cleanName;
      const fileName = cleanName.split('/').pop() || cleanName;

      const newNode: FileNode = {
        name: fileName,
        path: newPath,
        type: 'file',
        content: '',
      };

      if (!fileStructure) {
        setFileStructure({
          name: 'workspace',
          path: 'workspace',
          type: 'folder',
          children: {
            [fileName]: newNode,
          },
        });
      } else {
        const updated = insertNodeIntoTree(fileStructure, parentDir, newNode);
        setFileStructure(updated);
      }

      // Open new file immediately
      openFileInTab(newPath, fileName, '');
      setSourceControlChanges((prev) => {
        const next = new Map(prev);
        next.set(newPath, 'added');
        return next;
      });

      showToast(`Created file "${cleanName}"`, 'success');
      return;
    }

    if (mode === 'new-folder') {
      const cleanName = name.trim();
      if (!cleanName) return;

      const parentDir = targetPath || (fileStructure ? fileStructure.path : '');
      const newPath = parentDir ? `${parentDir}/${cleanName}`.replace(/\/+/g, '/') : cleanName;
      const folderName = cleanName.split('/').pop() || cleanName;

      const newNode: FileNode = {
        name: folderName,
        path: newPath,
        type: 'folder',
        children: {},
      };

      if (!fileStructure) {
        setFileStructure({
          name: 'workspace',
          path: 'workspace',
          type: 'folder',
          children: {
            [folderName]: newNode,
          },
        });
      } else {
        const updated = insertNodeIntoTree(fileStructure, parentDir, newNode);
        setFileStructure(updated);
      }

      showToast(`Created folder "${cleanName}"`, 'success');
      return;
    }

    if (mode === 'rename') {
      const cleanName = name.trim();
      if (!cleanName || !fileStructure) return;

      const pathParts = targetPath.split('/');
      pathParts[pathParts.length - 1] = cleanName;
      const newPath = pathParts.join('/');

      const updated = renameNodeInTree(fileStructure, targetPath, cleanName, newPath);
      setFileStructure(updated);

      // Update tabs
      setTabs((prev) =>
        prev.map((t) => {
          if (t.path === targetPath) {
            return {
              ...t,
              id: newPath,
              path: newPath,
              title: cleanName,
              language: getLanguageFromFilename(cleanName),
            };
          } else if (t.path.startsWith(targetPath + '/')) {
            const subRel = t.path.slice(targetPath.length);
            const subNewPath = newPath + subRel;
            return {
              ...t,
              id: subNewPath,
              path: subNewPath,
            };
          }
          return t;
        })
      );

      if (activeTabId === targetPath) {
        setActiveTabId(newPath);
      } else if (activeTabId && activeTabId.startsWith(targetPath + '/')) {
        const subRel = activeTabId.slice(targetPath.length);
        setActiveTabId(newPath + subRel);
      }

      // Track change
      setSourceControlChanges((prev) => {
        const next = new Map(prev);
        next.delete(targetPath);
        next.set(newPath, 'modified');
        return next;
      });

      showToast(`Renamed to "${cleanName}"`, 'success');
    }
  };

  const handleCompareFile = useCallback((path: string) => {
    setCompareModalState({
      isOpen: true,
      filePath: path,
    });
  }, []);

  const handleRevertFile = useCallback((path: string) => {
    const orig = originalContents.get(path);
    if (orig === undefined) {
      showToast(`No original baseline found for "${path}"`, 'error');
      return;
    }

    // Revert tab content if open
    setTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, content: orig, isModified: false } : t))
    );

    // Revert fileStructure node content
    setFileStructure((prev) => {
      if (!prev) return prev;
      return updateNodeInTree(prev, path, orig);
    });

    // Remove from modified/staged maps
    setSourceControlChanges((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });
    setStagedChanges((prev) => {
      const next = new Map(prev);
      next.delete(path);
      return next;
    });

    showToast(`Reverted changes to "${path.split('/').pop() || path}"`, 'success');
  }, [originalContents, showToast]);

  const handleCommitChanges = () => {
    if (stagedChanges.size === 0 && sourceControlChanges.size === 0) {
      showToast('No changes to commit', 'error');
      return;
    }

    const autoMsg = `Update project files - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const msg = commitMessage.trim() || autoMsg;

    // Update originalContents for staged and modified files
    setOriginalContents((prev) => {
      const next = new Map(prev);
      stagedChanges.forEach((_, path) => {
        const tab = tabs.find((t) => t.path === path);
        const node = findNodeByPath(fileStructure, path);
        const latestContent = tab ? tab.content : node?.content || '';
        next.set(path, latestContent);
      });
      sourceControlChanges.forEach((_, path) => {
        const tab = tabs.find((t) => t.path === path);
        const node = findNodeByPath(fileStructure, path);
        const latestContent = tab ? tab.content : node?.content || '';
        next.set(path, latestContent);
      });
      return next;
    });

    const count = stagedChanges.size || sourceControlChanges.size;
    setStagedChanges(new Map());
    setSourceControlChanges(new Map());
    setCommitMessage('');
    showToast(`Committed ${count} files locally: "${msg}"`, 'success');
  };

  const handleCommitPush = async () => {
    if (!githubToken) {
      showToast('Please sign in with GitHub or provide a GitHub Token first', 'error');
      setShowGitHubModal(true);
      return;
    }

    if (!repoInfo) {
      showToast('Please select or create a GitHub repository to push to', 'error');
      setShowRepoBrowserModal(true);
      return;
    }

    if (!fileStructure && tabs.length === 0) {
      showToast('No workspace files to commit', 'error');
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Preparing all project files for GitHub commit...`);

    try {
      // Determine root folder prefix to strip so files sit cleanly at repository root
      let rootPrefix = '';
      if (fileStructure && fileStructure.type === 'folder' && fileStructure.name) {
        rootPrefix = fileStructure.path + '/';
      } else if (repoInfo?.repo) {
        rootPrefix = repoInfo.repo + '/';
      }

      // Collect all workspace files
      const allFiles = await collectAllWorkspaceFiles(fileStructure, tabs, rootPrefix);

      if (allFiles.length === 0 && deletedFiles.size === 0) {
        showToast('No files found to commit', 'error');
        setIsLoading(false);
        return;
      }

      // Process deleted file paths
      const deletedPathsList: string[] = [];
      deletedFiles.forEach((p) => {
        let rel = p;
        if (rootPrefix && rel.startsWith(rootPrefix)) {
          rel = rel.slice(rootPrefix.length).replace(/^\/+/, '');
        }
        rel = rel.replace(/^\/+/, '');
        if (rel) {
          deletedPathsList.push(rel);
        }
      });

      const autoMsg = `Update project (${allFiles.length} files) - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const finalCommitMsg = commitMessage.trim() || autoMsg;

      setLoadingMessage(`Pushing ${allFiles.length} files to ${repoInfo.owner}/${repoInfo.repo} (${currentBranch})...`);

      const result = await commitMultipleFilesToGitHub(
        repoInfo.owner,
        repoInfo.repo,
        currentBranch,
        allFiles,
        deletedPathsList,
        finalCommitMsg,
        githubToken
      );

      // Reset modified state
      setTabs((prev) => prev.map((t) => ({ ...t, isModified: false })));
      setStagedChanges(new Map());
      setSourceControlChanges(new Map());
      setDeletedFiles(new Set());
      setCommitMessage('');

      showToast(`Successfully committed & pushed ${result.fileCount} files to GitHub (${repoInfo.owner}/${repoInfo.repo})!`, 'success');
      loadCommitHistory();
    } catch (err: any) {
      console.error('Commit & Push failed:', err);
      showToast(`Commit & Push failed: ${err.message || err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullChanges = async () => {
    if (!repoInfo) {
      showToast('No active GitHub repository to pull', 'error');
      return;
    }
    handleCloneRepo(`${repoInfo.owner}/${repoInfo.repo}`, currentBranch);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast('Auto-save active — All changes are saved automatically', 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  const comparePath = compareModalState.filePath;
  const compareStatus = comparePath
    ? stagedChanges.get(comparePath) || sourceControlChanges.get(comparePath) || 'modified'
    : 'modified';
  const compareIsStaged = comparePath ? stagedChanges.has(comparePath) : false;
  const compareNode = comparePath ? findNodeByPath(fileStructure, comparePath) : null;
  const compareTab = comparePath ? tabs.find((t) => t.path === comparePath) : null;
  const compareModifiedContent = compareTab ? compareTab.content : compareNode?.content || '';
  const compareOriginalContent = comparePath
    ? compareStatus === 'added'
      ? ''
      : originalContents.get(comparePath) ?? compareModifiedContent
    : '';

  const handleBackToRepos = useCallback(() => {
    setShowRepoBrowserModal(true);
  }, []);

  const handleCloseWorkspace = useCallback(() => {
    setFileStructure(null);
    setRepoInfo(null);
    setTabs([]);
    setActiveTabId(null);
    setStagedChanges(new Map());
    setSourceControlChanges(new Map());
    setDeletedFiles(new Set());
    showToast('Closed workspace', 'info');
  }, [showToast]);

  return (
    <div className="app-layout flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e] font-sans">
      {/* Top Main Toolbar */}
      <Toolbar
        onNewFile={handleNewFile}
        onOpenFile={handleOpenFile}
        onOpenFolder={handleOpenFolder}
        onSaveAs={handleSaveAs}
        currentSyntax={currentSyntax}
        onSyntaxChange={handleSyntaxChange}
        githubToken={githubToken}
        githubUser={githubUser}
        repoCount={repositories.length}
        repoInfo={repoInfo}
        currentBranch={currentBranch}
        onBackToRepos={handleBackToRepos}
        onShowGitHubLogin={() => setShowGitHubModal(true)}
        onShowCreateRepo={() => setShowCreateRepoModal(true)}
        onShowCloneRepo={() => setShowCloneModal(true)}
        onShowRepoBrowser={() => setShowRepoBrowserModal(true)}
        onCommitPush={handleCommitPush}
        onPullChanges={handlePullChanges}
        onToggleMobileSidebar={() => setIsMobileShow((prev) => !prev)}
        onCompareActiveFile={activeTab ? () => handleCompareFile(activeTab.path) : undefined}
        onDeleteActiveFile={activeTab ? () => handleDeleteNode(activeTab.path, 'file', activeTab.title) : undefined}
        hasActiveFile={!!activeTab}
        stagedCount={stagedChanges.size}
        totalChangedCount={stagedChanges.size + sourceControlChanges.size}
        onStageAll={handleStageAll}
        onUnstageAll={handleUnstageAll}
      />

      {/* Main Content Area (Sidebar + Editor) */}
      <div className="main-content flex flex-1 h-full overflow-hidden relative min-w-0">
        {/* Mobile Backdrop Overlay */}
        {isMobileShow && (
          <div
            onClick={() => setIsMobileShow(false)}
            className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in"
          />
        )}

        <Sidebar
          activeTab={activeSidebarTab}
          setActiveTab={setActiveSidebarTab}
          fileStructure={fileStructure}
          onFileSelect={handleFileSelect}
          onCloseFolder={handleCloseWorkspace}
          outlineItems={outlineItems}
          onOutlineClick={handleOutlineClick}
          repoInfo={repoInfo}
          currentBranch={currentBranch}
          onChangeBranch={() => setShowBranchModal(true)}
          onRefreshRepo={handlePullChanges}
          sourceControlChanges={sourceControlChanges}
          stagedChanges={stagedChanges}
          onStageFile={handleStageFile}
          onUnstageFile={handleUnstageFile}
          onCompareFile={handleCompareFile}
          onStageAll={handleStageAll}
          onUnstageAll={handleUnstageAll}
          commitMessage={commitMessage}
          setCommitMessage={setCommitMessage}
          onCommitChanges={handleCommitChanges}
          onCommitPush={handleCommitPush}
          onDeleteNode={handleDeleteNode}
          onRenameNode={handleRenameNode}
          onNewItem={handleNewItem}
          onMoveItem={handleMoveItem}
          onMoveNode={handleMoveNode}
          onRevertFile={handleRevertFile}
          isMobileShow={isMobileShow}
          onCloseMobileSidebar={() => setIsMobileShow(false)}
          commitHistory={commitHistory}
          isLoadingHistory={isLoadingHistory}
          onRefreshHistory={loadCommitHistory}
          onRevertCommit={handleRevertCommit}
          repositories={repositories}
          githubUser={githubUser}
          githubToken={githubToken}
          onOpenRepoBrowser={() => setShowRepoBrowserModal(true)}
          onCloneRepo={handleCloneRepo}
          onBackToRepos={handleBackToRepos}
        />

        <EditorArea
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={handleCloseTab}
          onContentChange={handleContentChange}
          editorRef={editorRef}
          onOpenFile={handleOpenFile}
          repoInfo={repoInfo}
          onBackToRepos={handleBackToRepos}
          onCompareFile={handleCompareFile}
          onDeleteFile={(path, name) => handleDeleteNode(path, 'file', name)}
          onRevertFile={handleRevertFile}
        />
      </div>

      {/* Diff Compare Modal */}
      <CompareModal
        isOpen={compareModalState.isOpen}
        onClose={() => setCompareModalState({ isOpen: false, filePath: null })}
        filePath={compareModalState.filePath}
        status={compareStatus}
        originalContent={compareOriginalContent}
        modifiedContent={compareModifiedContent}
        isStaged={compareIsStaged}
        onStageFile={(path) => {
          handleStageFile(path);
          setCompareModalState((prev) => ({ ...prev }));
        }}
        onUnstageFile={(path) => {
          handleUnstageFile(path);
          setCompareModalState((prev) => ({ ...prev }));
        }}
        onRevertFile={(path) => {
          handleRevertFile(path);
          setCompareModalState({ isOpen: false, filePath: null });
        }}
      />

      {/* Full Repository Browser Modal */}
      <RepoBrowserModal
        isOpen={showRepoBrowserModal}
        onClose={() => setShowRepoBrowserModal(false)}
        repositories={repositories}
        isLoading={isLoadingRepos}
        githubUser={githubUser}
        githubToken={githubToken}
        onRefresh={() => loadUserRepositories(githubToken, githubUser, true)}
        onSelectRepo={(fullName, branch) => handleCloneRepo(fullName, branch)}
        onOpenGitHubLogin={() => setShowGitHubModal(true)}
        onOpenCreateRepo={() => setShowCreateRepoModal(true)}
      />

      {/* Modals & Notifications */}
      <Modals
        showGitHubModal={showGitHubModal}
        onCloseGitHubModal={() => setShowGitHubModal(false)}
        onSaveGitHubToken={handleSaveGitHubToken}
        onClearGitHubToken={handleClearGitHubToken}
        githubToken={githubToken}
        githubUser={githubUser}
        onGitHubOAuth={handleGitHubOAuth}
        firebaseUser={firebaseUser}
        onLogoutFirebase={handleLogoutFirebase}
        showCloneModal={showCloneModal}
        onCloseCloneModal={() => setShowCloneModal(false)}
        onCloneRepo={handleCloneRepo}
        showCreateRepoModal={showCreateRepoModal}
        onCloseCreateRepoModal={() => setShowCreateRepoModal(false)}
        onCreateRepoSubmit={handleCreateRepoSubmit}
        showBranchModal={showBranchModal}
        onCloseBranchModal={() => setShowBranchModal(false)}
        branches={branches}
        currentBranch={currentBranch}
        onSwitchBranch={handleSwitchBranch}
        repositories={repositories}
        isLoadingRepos={isLoadingRepos}
        onRefreshRepos={() => loadUserRepositories(githubToken, githubUser, true)}
        onOpenRepoBrowser={() => setShowRepoBrowserModal(true)}
        fileStructure={fileStructure}
        fileOpModal={fileOpModal}
        onCloseFileOpModal={() => setFileOpModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirmFileOp={handleConfirmFileOp}
      />

      <Notification
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        toast={toast}
        onCloseToast={() => setToast(null)}
      />
    </div>
  );
};

export default App;
