/**
 * Pushhub - Modern GitHub Web App Client
 * Integrates Firebase v9 Auth, Octokit.js, Monaco Code Editor,
 * Multi-file Drag & Drop Uploader, GitHub Actions Workflows & Templates, and Commit Revert Engine.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GithubAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { Octokit } from 'https://esm.sh/octokit@3.1.2';

// ----------------------------------------------------
// APPLICATION STATE
// ----------------------------------------------------
const state = {
  firebaseApp: null,
  auth: null,
  currentUser: null,
  githubToken: null,
  octokit: null,
  repositories: [],
  filteredRepos: [],
  selectedRepo: null,
  selectedBranch: 'main',
  branches: [],
  currentPath: '',
  files: [],
  activeFile: null,
  isModified: false,
  recentCommits: [],
  revertCommitData: null,
  activeFilter: 'all',
  currentTab: 'files',
  stagedUploadFiles: [],
  workflowRuns: []
};

// Default fallback Firebase config for pre-configured project
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDummyKeyReplaceIfCustom",
  authDomain: "gen-lang-client-0834922836.firebaseapp.com",
  projectId: "gen-lang-client-0834922836",
  storageBucket: "gen-lang-client-0834922836.appspot.com",
  messagingSenderId: "834922836",
  appId: "1:834922836:web:d984316d39b541a5b4bb"
};

// ----------------------------------------------------
// DOM ELEMENTS CACHE
// ----------------------------------------------------
const DOM = {
  // Top Double Toolbar Action Buttons (Matching reference UI)
  btnToolNew: document.getElementById('btnToolNew'),
  btnToolOpenFile: document.getElementById('btnToolOpenFile'),
  localFileInput: document.getElementById('localFileInput'),
  btnToolOpenFolder: document.getElementById('btnToolOpenFolder'),
  btnToolSave: document.getElementById('btnToolSave'),
  btnToolSaveAs: document.getElementById('btnToolSaveAs'),
  btnToolSelectAll: document.getElementById('btnToolSelectAll'),
  btnToolCopy: document.getElementById('btnToolCopy'),
  btnToolCut: document.getElementById('btnToolCut'),
  btnToolPaste: document.getElementById('btnToolPaste'),
  languageSelect: document.getElementById('languageSelect'),
  btnToolCloneRepo: document.getElementById('btnToolCloneRepo'),
  btnToolCommitPush: document.getElementById('btnToolCommitPush'),
  btnToolPullChanges: document.getElementById('btnToolPullChanges'),

  // Clone Repo Modal
  cloneRepoModal: document.getElementById('cloneRepoModal'),
  btnCloseCloneRepoModal: document.getElementById('btnCloseCloneRepoModal'),
  btnCancelCloneRepo: document.getElementById('btnCancelCloneRepo'),
  cloneRepoUrlInput: document.getElementById('cloneRepoUrlInput'),
  btnSubmitCloneRepo: document.getElementById('btnSubmitCloneRepo'),

  // Navigation & Auth
  btnToggleMobileSidebar: document.getElementById('btnToggleMobileSidebar'),
  repoSidebar: document.getElementById('repoSidebar'),
  sidebarBackdrop: document.getElementById('sidebarBackdrop'),
  btnCloseMobileSidebar: document.getElementById('btnCloseMobileSidebar'),
  unauthArea: document.getElementById('unauthArea'),
  authArea: document.getElementById('authArea'),
  btnGithubLogin: document.getElementById('btnGithubLogin'),
  btnLogout: document.getElementById('btnLogout'),
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  currentRepoOwner: document.getElementById('currentRepoOwner'),
  currentRepoName: document.getElementById('currentRepoName'),
  branchSelectorContainer: document.getElementById('branchSelectorContainer'),
  branchSelect: document.getElementById('branchSelect'),

  // Primary Buttons
  btnHeaderNewRepo: document.getElementById('btnHeaderNewRepo'),
  btnSidebarNewRepo: document.getElementById('btnSidebarNewRepo'),
  btnOpenFirebaseSettings: document.getElementById('btnOpenFirebaseSettings'),

  // Tabs
  tabBtnFiles: document.getElementById('tabBtnFiles'),
  tabBtnUpload: document.getElementById('tabBtnUpload'),
  tabBtnWorkflows: document.getElementById('tabBtnWorkflows'),
  tabBtnRevert: document.getElementById('tabBtnRevert'),
  tabBtnHistory: document.getElementById('tabBtnHistory'),

  // Tab Contents
  tabContentFiles: document.getElementById('tabContentFiles'),
  tabContentUpload: document.getElementById('tabContentUpload'),
  tabContentWorkflows: document.getElementById('tabContentWorkflows'),
  tabContentRevert: document.getElementById('tabContentRevert'),
  tabContentHistory: document.getElementById('tabContentHistory'),

  // Repositories Sidebar
  repoCountBadge: document.getElementById('repoCountBadge'),
  btnRefreshRepos: document.getElementById('btnRefreshRepos'),
  repoSearchInput: document.getElementById('repoSearchInput'),
  repoListContainer: document.getElementById('repoListContainer'),
  repoLoginPrompt: document.getElementById('repoLoginPrompt'),
  repoLoading: document.getElementById('repoLoading'),
  repoList: document.getElementById('repoList'),
  filterButtons: document.querySelectorAll('.repo-filter-btn'),

  // Explorer & Editor
  btnToggleExplorer: document.getElementById('btnToggleExplorer'),
  fileExplorerPane: document.getElementById('fileExplorerPane'),
  fileCountBadge: document.getElementById('fileCountBadge'),
  fileList: document.getElementById('fileList'),
  fileListEmpty: document.getElementById('fileListEmpty'),
  breadcrumbBar: document.getElementById('breadcrumbBar'),
  btnNewFile: document.getElementById('btnNewFile'),
  btnQuickUpload: document.getElementById('btnQuickUpload'),
  editorPane: document.getElementById('editorPane'),
  editorEmptyState: document.getElementById('editorEmptyState'),
  editorFileName: document.getElementById('editorFileName'),
  editorFileSize: document.getElementById('editorFileSize'),
  editorFileStatus: document.getElementById('editorFileStatus'),
  btnResetFile: document.getElementById('btnResetFile'),
  btnTogglePreview: document.getElementById('btnTogglePreview'),
  previewPanel: document.getElementById('previewPanel'),
  monacoContainer: document.getElementById('monacoContainer'),
  lineNumbers: document.getElementById('lineNumbers'),
  codeEditor: document.getElementById('codeEditor'),
  commitMessageInput: document.getElementById('commitMessageInput'),
  commitDescInput: document.getElementById('commitDescInput'),
  btnCommitPush: document.getElementById('btnCommitPush'),
  btnCommitPushText: document.getElementById('btnCommitPushText'),

  // Upload Tab
  uploadTargetBranchBadge: document.getElementById('uploadTargetBranchBadge'),
  uploadDropZone: document.getElementById('uploadDropZone'),
  uploadFileInput: document.getElementById('uploadFileInput'),
  stagedFilesContainer: document.getElementById('stagedFilesContainer'),
  stagedFilesCount: document.getElementById('stagedFilesCount'),
  stagedFilesList: document.getElementById('stagedFilesList'),
  btnClearStagedFiles: document.getElementById('btnClearStagedFiles'),
  uploadDirPathInput: document.getElementById('uploadDirPathInput'),
  uploadCommitMessageInput: document.getElementById('uploadCommitMessageInput'),
  uploadProgressText: document.getElementById('uploadProgressText'),
  btnCommitUploadFiles: document.getElementById('btnCommitUploadFiles'),
  btnCommitUploadFilesText: document.getElementById('btnCommitUploadFilesText'),

  // Workflows Tab
  btnRefreshWorkflows: document.getElementById('btnRefreshWorkflows'),
  workflowRunsList: document.getElementById('workflowRunsList'),
  workflowRunsCountBadge: document.getElementById('workflowRunsCountBadge'),

  // Revert Tab
  revertShaInput: document.getElementById('revertShaInput'),
  btnFetchCommitToRevert: document.getElementById('btnFetchCommitToRevert'),
  revertCommitDetails: document.getElementById('revertCommitDetails'),
  revertCommitShaBadge: document.getElementById('revertCommitShaBadge'),
  revertCommitMessage: document.getElementById('revertCommitMessage'),
  revertCommitAuthor: document.getElementById('revertCommitAuthor'),
  revertCommitDate: document.getElementById('revertCommitDate'),
  revertFilesCountBadge: document.getElementById('revertFilesCountBadge'),
  revertFilesList: document.getElementById('revertFilesList'),
  btnExecuteRevert: document.getElementById('btnExecuteRevert'),
  revertRecentCommitsList: document.getElementById('revertRecentCommitsList'),

  // History Tab
  btnRefreshHistory: document.getElementById('btnRefreshHistory'),
  historyListContainer: document.getElementById('historyListContainer'),

  // New Repo Modal
  newRepoModal: document.getElementById('newRepoModal'),
  btnCloseNewRepoModal: document.getElementById('btnCloseNewRepoModal'),
  btnCancelNewRepo: document.getElementById('btnCancelNewRepo'),
  newRepoForm: document.getElementById('newRepoForm'),
  newRepoNameInput: document.getElementById('newRepoNameInput'),
  newRepoDescInput: document.getElementById('newRepoDescInput'),
  newRepoInitReadme: document.getElementById('newRepoInitReadme'),
  newRepoGitignoreSelect: document.getElementById('newRepoGitignoreSelect'),
  btnSubmitNewRepo: document.getElementById('btnSubmitNewRepo'),

  // Firebase Config Modal
  firebaseModal: document.getElementById('firebaseModal'),
  btnCloseFirebaseModal: document.getElementById('btnCloseFirebaseModal'),
  firebaseConfigInput: document.getElementById('firebaseConfigInput'),
  btnLoadDefaultConfig: document.getElementById('btnLoadDefaultConfig'),
  btnSaveFirebaseConfig: document.getElementById('btnSaveFirebaseConfig'),
  directPatInput: document.getElementById('directPatInput'),
  btnSaveDirectPat: document.getElementById('btnSaveDirectPat'),
  btnCopyCallbackUrl: document.getElementById('btnCopyCallbackUrl'),
  callbackUrlText: document.getElementById('callbackUrlText'),

  // New File Modal
  newFileModal: document.getElementById('newFileModal'),
  btnCloseNewFileModal: document.getElementById('btnCloseNewFileModal'),
  btnCancelNewFile: document.getElementById('btnCancelNewFile'),
  newFilePathInput: document.getElementById('newFilePathInput'),
  newFileContentInput: document.getElementById('newFileContentInput'),
  newFileCommitMsgInput: document.getElementById('newFileCommitMsgInput'),
  btnSubmitNewFile: document.getElementById('btnSubmitNewFile'),

  // Feedback
  toastContainer: document.getElementById('toastContainer'),
  globalLoader: document.getElementById('globalLoader'),
  globalLoaderText: document.getElementById('globalLoaderText')
};

// ----------------------------------------------------
// WORKFLOW CI/CD TEMPLATES (YML)
// ----------------------------------------------------
const WORKFLOW_TEMPLATES = {
  'node-ci': {
    name: 'Node.js CI/CD',
    path: '.github/workflows/node-ci.yml',
    content: `name: Node.js CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm test --if-present
    - run: npm run build --if-present
`
  },
  'gh-pages': {
    name: 'GitHub Pages Deploy',
    path: '.github/workflows/gh-pages.yml',
    content: `name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`
  },
  'docker-build': {
    name: 'Docker Build & Push',
    path: '.github/workflows/docker-build.yml',
    content: `name: Docker Container Build

on:
  push:
    branches: [ main ]

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Build Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: app:latest
`
  },
  'python-ci': {
    name: 'Python Test CI',
    path: '.github/workflows/python-ci.yml',
    content: `name: Python CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Set up Python
      uses: actions/setup-python@v5
      with:
        python-version: '3.11'
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
    - name: Test with pytest
      run: |
        python -m unittest discover || true
`
  }
};

// ----------------------------------------------------
// UTILITY FUNCTIONS
// ----------------------------------------------------
function showLoader(message = 'Loading...') {
  DOM.globalLoaderText.textContent = message;
  DOM.globalLoader.classList.remove('hidden');
}

function hideLoader() {
  DOM.globalLoader.classList.add('hidden');
}

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  const colors = {
    info: 'bg-[#111827] text-white border-sky-500/50 shadow-sky-500/10',
    success: 'bg-[#111827] text-emerald-300 border-emerald-500/50 shadow-emerald-500/10',
    error: 'bg-[#111827] text-rose-300 border-rose-500/50 shadow-rose-500/10'
  };

  const icons = {
    info: `<svg class="w-4 h-4 text-sky-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    success: `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`,
    error: `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`
  };

  toast.className = `p-3 rounded-xl border shadow-xl flex items-center gap-3 text-xs pointer-events-auto transform transition-all duration-200 translate-y-2 opacity-0 ${colors[type] || colors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span class="flex-1 font-medium leading-snug">${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str)));
}

// ----------------------------------------------------
// FIREBASE INITIALIZATION & AUTH
// ----------------------------------------------------
function getSavedFirebaseConfig() {
  const saved = localStorage.getItem('git_client_firebase_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.warn('Invalid saved Firebase config');
    }
  }
  return DEFAULT_FIREBASE_CONFIG;
}

function initFirebase() {
  const config = getSavedFirebaseConfig();
  DOM.firebaseConfigInput.value = JSON.stringify(config, null, 2);

  try {
    state.firebaseApp = initializeApp(config);
    state.auth = getAuth(state.firebaseApp);

    onAuthStateChanged(state.auth, (user) => {
      if (user) {
        state.currentUser = user;
        updateUserUI(user);
        const token = state.githubToken || localStorage.getItem('git_client_github_token');
        if (token) {
          initOctokit(token);
        }
      } else {
        const token = localStorage.getItem('git_client_github_token');
        if (token) {
          state.githubToken = token;
          initOctokit(token);
        } else {
          showLoggedOutUI();
        }
      }
    });
  } catch (error) {
    console.error('Firebase init error:', error);
    showToast(`Firebase Init Error: ${error.message}`, 'error');
  }
}

async function handleGithubLogin() {
  if (!state.auth) {
    showToast('Firebase Auth ইনিশিয়ালাইজ হয়নি। Settings চেক করুন।', 'error');
    DOM.firebaseModal.classList.remove('hidden');
    return;
  }

  showLoader('Signing in with GitHub OAuth...');
  try {
    const provider = new GithubAuthProvider();
    provider.addScope('repo');
    provider.addScope('workflow');
    provider.addScope('user');

    const result = await signInWithPopup(state.auth, provider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (token) {
      state.githubToken = token;
      localStorage.setItem('git_client_github_token', token);
      showToast('GitHub OAuth সফল হয়েছে!', 'success');
      initOctokit(token);
    } else {
      showToast('OAuth সম্পন্ন হয়েছে কিন্তু টোকেন পাওয়া যায়নি।', 'info');
    }
  } catch (error) {
    console.error('GitHub Auth Error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      showToast('লগইন পপআপ বন্ধ করা হয়েছে।', 'info');
    } else {
      showToast(`OAuth ত্রুটি: ${error.message}`, 'error', 6000);
      DOM.firebaseModal.classList.remove('hidden');
    }
  } finally {
    hideLoader();
  }
}

function handleLogout() {
  if (state.auth) {
    signOut(state.auth).catch(console.error);
  }
  state.currentUser = null;
  state.githubToken = null;
  state.octokit = null;
  state.repositories = [];
  state.selectedRepo = null;
  state.files = [];
  state.activeFile = null;
  state.stagedUploadFiles = [];

  localStorage.removeItem('git_client_github_token');
  showLoggedOutUI();
  showToast('লগআউট সফল হয়েছে', 'info');
}

function updateUserUI(user) {
  DOM.unauthArea.classList.add('hidden');
  DOM.authArea.classList.remove('hidden');
  DOM.authArea.classList.add('flex');
  DOM.userName.textContent = user.displayName || user.email || 'User';
  if (user.photoURL) {
    DOM.userAvatar.src = user.photoURL;
  } else {
    DOM.userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0284c7&color=fff`;
  }
  DOM.repoLoginPrompt.classList.add('hidden');
}

function showLoggedOutUI() {
  DOM.unauthArea.classList.remove('hidden');
  DOM.authArea.classList.add('hidden');
  DOM.repoLoginPrompt.classList.remove('hidden');
  DOM.repoList.innerHTML = '';
  DOM.repoCountBadge.textContent = '0';
  resetWorkspace();
}

// ----------------------------------------------------
// OCTOKIT CLIENT & GITHUB API
// ----------------------------------------------------
async function initOctokit(token) {
  showLoader('Connecting to GitHub API...');
  try {
    state.octokit = new Octokit({ auth: token });
    const { data: user } = await state.octokit.rest.users.getAuthenticated();
    
    if (!state.currentUser) {
      state.currentUser = {
        displayName: user.login,
        email: user.email,
        photoURL: user.avatar_url
      };
      updateUserUI(state.currentUser);
    }

    showToast(`স্বাগতম @${user.login}!`, 'success');
    await fetchRepositories();
  } catch (error) {
    console.error('Octokit Init Error:', error);
    showToast(`GitHub API কানেকশন সমস্যা: ${error.message}`, 'error');
    if (error.status === 401) {
      localStorage.removeItem('git_client_github_token');
    }
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// REPOSITORIES MANAGEMENT
// ----------------------------------------------------
async function fetchRepositories() {
  if (!state.octokit) return;

  DOM.repoLoading.classList.remove('hidden');
  DOM.repoList.innerHTML = '';

  try {
    const { data: repos } = await state.octokit.rest.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    });

    state.repositories = repos;
    DOM.repoCountBadge.textContent = `${repos.length}`;
    filterAndRenderRepos();

    // Auto-select first repo if none selected
    if (!state.selectedRepo && repos.length > 0) {
      selectRepository(repos[0]);
    }
  } catch (error) {
    console.error('Error fetching repositories:', error);
    showToast(`রিপোজিটরি লোড করতে ব্যর্থ: ${error.message}`, 'error');
  } finally {
    DOM.repoLoading.classList.add('hidden');
  }
}

function filterAndRenderRepos() {
  const searchTerm = DOM.repoSearchInput.value.toLowerCase().trim();
  const filter = state.activeFilter;

  state.filteredRepos = state.repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm) || 
                          (repo.description && repo.description.toLowerCase().includes(searchTerm));
    if (!matchesSearch) return false;

    if (filter === 'public') return !repo.private;
    if (filter === 'private') return repo.private;
    if (filter === 'forks') return repo.fork;
    return true;
  });

  renderRepoList(state.filteredRepos);
}

function renderRepoList(repos) {
  DOM.repoList.innerHTML = '';

  if (repos.length === 0) {
    DOM.repoList.innerHTML = `
      <div class="p-6 text-center text-xs text-[#64748b]">
        কোনো রিপোজিটরি পাওয়া যায়নি।
      </div>
    `;
    return;
  }

  repos.forEach(repo => {
    const li = document.createElement('li');
    const isSelected = state.selectedRepo && state.selectedRepo.id === repo.id;

    li.className = `p-2.5 rounded-xl cursor-pointer border transition-all ${
      isSelected 
        ? 'bg-sky-500/10 border-sky-500/40 text-white shadow-sm' 
        : 'bg-[#0b0f19] hover:bg-[#1e293b]/70 border-[#1f293d] text-[#cbd5e1]'
    }`;

    // Language dot color
    const langColor = getLanguageColor(repo.language);

    li.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5 truncate">
            <span class="font-bold text-xs ${isSelected ? 'text-sky-400' : 'text-white'} truncate">${repo.name}</span>
            ${repo.private 
              ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">Private</span>' 
              : '<span class="text-[9px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#94a3b8] border border-[#334155]">Public</span>'
            }
          </div>
          ${repo.description ? `<p class="text-[11px] text-[#94a3b8] truncate mt-0.5">${repo.description}</p>` : ''}
          <div class="flex items-center gap-2.5 text-[10px] text-[#64748b] mt-1.5">
            ${repo.language ? `
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" style="background-color: ${langColor};"></span>
                <span class="text-[#94a3b8]">${repo.language}</span>
              </span>
            ` : ''}
            <span class="flex items-center gap-1">
              <svg class="w-3 h-3 text-amber-400/80" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              ${repo.stargazers_count || 0}
            </span>
            <span>${formatDate(repo.updated_at)}</span>
          </div>
        </div>
      </div>
    `;

    li.addEventListener('click', () => {
      selectRepository(repo);
      closeMobileSidebar();
    });

    DOM.repoList.appendChild(li);
  });
}

function getLanguageColor(lang) {
  const map = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Vue: '#41b883',
    Rust: '#dea584',
    Go: '#00ADD8',
    Java: '#b07219',
    C: '#555555',
    'C++': '#f34b7d',
    PHP: '#4F5D95',
    Ruby: '#701516'
  };
  return map[lang] || '#8b949e';
}

// ----------------------------------------------------
// REPOSITORY SELECTION & BRANCHES
// ----------------------------------------------------
async function selectRepository(repo) {
  state.selectedRepo = repo;
  state.selectedBranch = repo.default_branch || 'main';
  state.currentPath = '';
  state.activeFile = null;

  // Header update
  DOM.currentRepoOwner.textContent = repo.owner.login;
  DOM.currentRepoName.textContent = repo.name;
  DOM.uploadTargetBranchBadge.textContent = state.selectedBranch;
  DOM.btnNewFile.classList.remove('hidden');
  DOM.btnNewFile.classList.add('flex');
  DOM.btnQuickUpload.classList.remove('hidden');
  DOM.btnQuickUpload.classList.add('flex');
  DOM.branchSelectorContainer.classList.remove('hidden');
  DOM.branchSelectorContainer.classList.add('flex');

  resetEditor();
  filterAndRenderRepos(); // Re-render for selection highlight

  showLoader(`Loading ${repo.name}...`);
  try {
    await fetchBranches();
    await fetchContents('');
    await fetchRecentCommits();
    await fetchWorkflowRuns();
  } catch (error) {
    console.error('Error selecting repo:', error);
    showToast(`রিপোজিটরি লোডে সমস্যা: ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

async function fetchBranches() {
  if (!state.octokit || !state.selectedRepo) return;

  try {
    const { data: branches } = await state.octokit.rest.repos.listBranches({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      per_page: 50
    });

    state.branches = branches;
    DOM.branchSelect.innerHTML = '';

    branches.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.name;
      opt.textContent = b.name;
      if (b.name === state.selectedBranch) {
        opt.selected = true;
      }
      DOM.branchSelect.appendChild(opt);
    });
  } catch (error) {
    console.warn('Error fetching branches:', error.message);
  }
}

// ----------------------------------------------------
// CREATE NEW REPOSITORY HANDLER
// ----------------------------------------------------
async function handleCreateNewRepo(e) {
  e.preventDefault();
  if (!state.octokit) {
    showToast('অনুগ্রহ করে প্রথমে লগইন করুন', 'error');
    return;
  }

  const name = DOM.newRepoNameInput.value.trim();
  const description = DOM.newRepoDescInput.value.trim();
  const visibility = document.querySelector('input[name="repoVisibility"]:checked')?.value || 'public';
  const isPrivate = visibility === 'private';
  const initReadme = DOM.newRepoInitReadme.checked;
  const gitignoreTemplate = DOM.newRepoGitignoreSelect.value;

  if (!name) {
    showToast('রিপোজিটরির নাম দিন', 'error');
    return;
  }

  showLoader(`Creating repository ${name}...`);
  try {
    const params = {
      name,
      description,
      private: isPrivate,
      auto_init: initReadme
    };
    if (gitignoreTemplate) {
      params.gitignore_template = gitignoreTemplate;
    }

    const { data: newRepo } = await state.octokit.rest.repos.createForAuthenticatedUser(params);
    showToast(`রিপোজিটরি "${newRepo.name}" সফলভাবে তৈরি হয়েছে!`, 'success', 6000);

    DOM.newRepoModal.classList.add('hidden');
    DOM.newRepoNameInput.value = '';
    DOM.newRepoDescInput.value = '';

    // Refresh and auto-select
    await fetchRepositories();
    selectRepository(newRepo);

  } catch (error) {
    console.error('Error creating repo:', error);
    showToast(`রিপোজিটরি তৈরিতে ব্যর্থ: ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// REPOSITORY FILE CONTENTS & TREE
// ----------------------------------------------------
async function fetchContents(path = '') {
  if (!state.octokit || !state.selectedRepo) return;

  state.currentPath = path;
  updateBreadcrumbs(path);
  showLoader(`Fetching ${path || 'root'}...`);

  try {
    const { data } = await state.octokit.rest.repos.getContent({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      path: path,
      ref: state.selectedBranch
    });

    const items = Array.isArray(data) ? data : [data];
    // Sort directories first, then alphabetically
    items.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'dir' ? -1 : 1;
    });

    state.files = items;
    renderFileList(items);
  } catch (error) {
    console.error('Error fetching contents:', error);
    if (error.status === 404) {
      state.files = [];
      renderFileList([]);
    } else {
      showToast(`ফাইল লোড ত্রুটি: ${error.message}`, 'error');
    }
  } finally {
    hideLoader();
  }
}

function updateBreadcrumbs(path) {
  DOM.breadcrumbBar.innerHTML = '';
  
  const rootSpan = document.createElement('span');
  rootSpan.className = 'text-sky-400 cursor-pointer hover:underline font-semibold';
  rootSpan.textContent = state.selectedRepo ? state.selectedRepo.name : 'root';
  rootSpan.addEventListener('click', () => fetchContents(''));
  DOM.breadcrumbBar.appendChild(rootSpan);

  if (!path) return;

  const parts = path.split('/').filter(Boolean);
  let accumulatedPath = '';

  parts.forEach((part, index) => {
    accumulatedPath += (index === 0 ? '' : '/') + part;
    const currentPathRef = accumulatedPath;
    const isLast = index === parts.length - 1;

    const separator = document.createElement('span');
    separator.className = 'text-[#64748b]';
    separator.textContent = '/';
    DOM.breadcrumbBar.appendChild(separator);

    const crumb = document.createElement('span');
    crumb.className = isLast 
      ? 'text-white font-medium truncate max-w-[150px]' 
      : 'text-sky-400 cursor-pointer hover:underline truncate max-w-[150px]';
    crumb.textContent = part;

    if (!isLast) {
      crumb.addEventListener('click', () => fetchContents(currentPathRef));
    }
    DOM.breadcrumbBar.appendChild(crumb);
  });
}

function renderFileList(items) {
  DOM.fileList.innerHTML = '';
  DOM.fileCountBadge.textContent = `${items.length} items`;

  if (items.length === 0) {
    DOM.fileListEmpty.textContent = 'এই ফোল্ডারে কোনো ফাইল নেই।';
    DOM.fileListEmpty.classList.remove('hidden');
    return;
  }

  DOM.fileListEmpty.classList.add('hidden');

  // Back button for subdirectories
  if (state.currentPath) {
    const backLi = document.createElement('li');
    backLi.className = 'p-2 rounded-lg hover:bg-[#1e293b] cursor-pointer flex items-center gap-2 text-xs text-[#94a3b8] hover:text-white transition-colors';
    backLi.innerHTML = `
      <svg class="w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 0118 0z" />
      </svg>
      <span>.. (Parent Directory)</span>
    `;
    backLi.addEventListener('click', () => {
      const parts = state.currentPath.split('/');
      parts.pop();
      fetchContents(parts.join('/'));
    });
    DOM.fileList.appendChild(backLi);
  }

  items.forEach(item => {
    const li = document.createElement('li');
    const isDir = item.type === 'dir';
    const isCurrentActive = state.activeFile && state.activeFile.path === item.path;

    li.className = `p-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 text-xs transition-colors border ${
      isCurrentActive 
        ? 'bg-sky-500/20 border-sky-500/40 text-white font-medium' 
        : 'hover:bg-[#1e293b] border-transparent text-[#cbd5e1]'
    }`;

    const iconSvg = isDir
      ? `<svg class="w-4 h-4 text-sky-400 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19.5 21a3 3 0 003-3v-4.5a3 3 0 00-3-3h-1.5V9a3 3 0 00-3-3h-4.636a3 3 0 01-2.121-.879l-.879-.878A3 3 0 006.243 3.5H4.5A3 3 0 001.5 6.5v11.5a3 3 0 003 3h15z"/></svg>`
      : `<svg class="w-4 h-4 text-[#94a3b8] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;

    li.innerHTML = `
      <div class="flex items-center gap-2 truncate">
        ${iconSvg}
        <span class="truncate">${item.name}</span>
      </div>
      <span class="text-[10px] text-[#64748b] shrink-0 font-mono">${isDir ? 'dir' : formatBytes(item.size)}</span>
    `;

    li.addEventListener('click', () => {
      if (isDir) {
        fetchContents(item.path);
      } else {
        openFile(item);
      }
    });

    DOM.fileList.appendChild(li);
  });
}

// ----------------------------------------------------
// MONACO CODE EDITOR & FILE VIEW
// ----------------------------------------------------
let monacoEditorInstance = null;

function getLanguageFromFileName(fileName) {
  if (!fileName) return 'plaintext';
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': case 'mjs': case 'cjs': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'html': case 'htm': return 'html';
    case 'css': case 'scss': case 'less': return 'css';
    case 'json': case 'jsonc': return 'json';
    case 'md': case 'markdown': return 'markdown';
    case 'py': return 'python';
    case 'rs': return 'rust';
    case 'go': return 'go';
    case 'sql': return 'sql';
    case 'yml': case 'yaml': return 'yaml';
    case 'sh': case 'bash': return 'shell';
    case 'c': case 'cpp': case 'h': case 'hpp': return 'cpp';
    case 'java': return 'java';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'xml': case 'svg': return 'xml';
    default: return 'plaintext';
  }
}

function updateMonacoContent(content, fileName) {
  if (!DOM.monacoContainer) return;
  const lang = getLanguageFromFileName(fileName);
  
  if (window.monaco && window.monaco.editor) {
    if (DOM.lineNumbers) DOM.lineNumbers.classList.add('hidden');
    if (DOM.codeEditor) DOM.codeEditor.classList.add('hidden');
    DOM.monacoContainer.classList.remove('hidden');

    if (!monacoEditorInstance) {
      monacoEditorInstance = window.monaco.editor.create(DOM.monacoContainer, {
        value: content,
        language: lang,
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 13,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        padding: { top: 10, bottom: 10 }
      });

      monacoEditorInstance.onDidChangeModelContent(() => {
        const val = monacoEditorInstance.getValue();
        DOM.codeEditor.value = val;
        checkEditorModified();
      });
    } else {
      const model = monacoEditorInstance.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, lang);
      }
      monacoEditorInstance.setValue(content);
    }
  } else if (window.require) {
    try {
      window.require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
      window.require(['vs/editor/editor.main'], function() {
        updateMonacoContent(content, fileName);
      });
    } catch (e) {
      console.warn('Monaco fallback to standard editor', e);
    }
  }
}

async function openFile(fileItem) {
  showLoader(`Loading ${fileItem.name}...`);
  try {
    const { data } = await state.octokit.rest.repos.getContent({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      path: fileItem.path,
      ref: state.selectedBranch
    });

    let rawText = '';
    if (data.content && data.encoding === 'base64') {
      rawText = b64_to_utf8(data.content);
    } else if (typeof data === 'string') {
      rawText = data;
    }

    state.activeFile = {
      name: data.name,
      path: data.path,
      sha: data.sha,
      content: rawText,
      originalContent: rawText,
      size: data.size,
      download_url: data.download_url
    };

    state.isModified = false;

    // Switch to files tab if not on it
    switchTab('files');

    // Update UI
    DOM.editorEmptyState.classList.add('hidden');
    DOM.codeEditor.disabled = false;
    DOM.codeEditor.value = rawText;
    DOM.editorFileName.textContent = data.name;
    DOM.editorFileSize.textContent = formatBytes(data.size);
    DOM.editorFileStatus.classList.add('hidden');
    DOM.btnResetFile.classList.remove('hidden');
    DOM.btnResetFile.classList.add('flex');
    DOM.lineNumbers.classList.remove('hidden');
    DOM.commitMessageInput.value = `Update ${data.name}`;
    DOM.commitDescInput.value = '';

    // Markdown preview button
    if (data.name.endsWith('.md') || data.name.endsWith('.markdown')) {
      DOM.btnTogglePreview.classList.remove('hidden');
      DOM.btnTogglePreview.classList.add('flex');
    } else {
      DOM.btnTogglePreview.classList.add('hidden');
      DOM.previewPanel.classList.add('hidden');
    }

    const fileLang = getLanguageFromFileName(data.name);
    if (DOM.languageSelect) DOM.languageSelect.value = fileLang;

    updateMonacoContent(rawText, data.name);

    if (window.innerWidth < 768 && DOM.fileExplorerPane) {
      DOM.fileExplorerPane.classList.add('hidden');
    }

    if (monacoEditorInstance) {
      setTimeout(() => monacoEditorInstance.layout(), 100);
    }

    updateLineNumbers();
    updateCommitButtonState();
    renderFileList(state.files);

  } catch (error) {
    console.error('Error opening file:', error);
    showToast(`ফাইল ওপেন করতে ব্যর্থ: ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

function updateLineNumbers() {
  const lines = DOM.codeEditor.value.split('\n').length;
  let numbersHtml = '';
  for (let i = 1; i <= Math.max(lines, 1); i++) {
    numbersHtml += `${i}\n`;
  }
  DOM.lineNumbers.textContent = numbersHtml;
}

function checkEditorModified() {
  if (!state.activeFile) return;
  const currentVal = DOM.codeEditor.value;
  state.isModified = currentVal !== state.activeFile.originalContent;
  
  if (state.isModified) {
    DOM.editorFileStatus.classList.remove('hidden');
  } else {
    DOM.editorFileStatus.classList.add('hidden');
  }

  updateCommitButtonState();
}

function updateCommitButtonState() {
  const hasFile = !!state.activeFile;
  const hasMessage = DOM.commitMessageInput.value.trim().length > 0;
  DOM.btnCommitPush.disabled = !(hasFile && hasMessage);
}

function resetEditor() {
  state.activeFile = null;
  state.isModified = false;
  DOM.codeEditor.value = '';
  DOM.codeEditor.disabled = true;
  DOM.editorFileName.textContent = 'No file selected';
  DOM.editorFileSize.textContent = '0 B';
  DOM.editorFileStatus.classList.add('hidden');
  DOM.btnResetFile.classList.add('hidden');
  DOM.btnTogglePreview.classList.add('hidden');
  DOM.previewPanel.classList.add('hidden');
  DOM.lineNumbers.classList.add('hidden');
  if (DOM.monacoContainer) DOM.monacoContainer.classList.add('hidden');
  DOM.editorEmptyState.classList.remove('hidden');
  DOM.commitMessageInput.value = '';
  DOM.commitDescInput.value = '';
  updateCommitButtonState();
}

function resetWorkspace() {
  resetEditor();
  DOM.currentRepoOwner.textContent = 'owner';
  DOM.currentRepoName.textContent = 'Select a repository';
  DOM.btnNewFile.classList.add('hidden');
  DOM.btnQuickUpload.classList.add('hidden');
  DOM.branchSelectorContainer.classList.add('hidden');
  DOM.fileList.innerHTML = '';
  DOM.fileListEmpty.classList.remove('hidden');
  DOM.fileCountBadge.textContent = '0 items';
  DOM.breadcrumbBar.innerHTML = '<span class="text-sky-400">root</span>';
}

// ----------------------------------------------------
// COMMIT & PUSH TO GITHUB
// ----------------------------------------------------
async function handleCommitAndPush() {
  if (!state.octokit || !state.selectedRepo || !state.activeFile) return;

  const commitMsg = DOM.commitMessageInput.value.trim();
  const commitDesc = DOM.commitDescInput.value.trim();
  const fullMessage = commitDesc ? `${commitMsg}\n\n${commitDesc}` : commitMsg;
  const fileContent = DOM.codeEditor.value;

  if (!commitMsg) {
    showToast('অনুগ্রহ করে একটি Commit Message লিখুন', 'error');
    return;
  }

  showLoader(`Committing and pushing ${state.activeFile.name}...`);
  DOM.btnCommitPush.disabled = true;
  DOM.btnCommitPushText.textContent = 'Pushing...';

  try {
    const encodedContent = utf8_to_b64(fileContent);

    const response = await state.octokit.rest.repos.createOrUpdateFileContents({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      path: state.activeFile.path,
      message: fullMessage,
      content: encodedContent,
      sha: state.activeFile.sha,
      branch: state.selectedBranch
    });

    const newCommitSha = response.data.commit.sha;
    state.activeFile.sha = response.data.content.sha;
    state.activeFile.originalContent = fileContent;
    state.isModified = false;
    DOM.editorFileStatus.classList.add('hidden');

    showToast(`কমিট ও পুশ সফল হয়েছে! (SHA: ${newCommitSha.substring(0, 7)})`, 'success', 6000);

    await fetchContents(state.currentPath);
    await fetchRecentCommits();
    await fetchWorkflowRuns();

  } catch (error) {
    console.error('Commit and push failed:', error);
    let msg = error.message;
    if (error.status === 409) {
      msg = 'Conflict! রিমোট রিপোজিটরিতে ফাইলটি ইতিমধ্যে পরিবর্তিত হয়েছে। রিফ্রেশ করে আবার চেষ্টা করুন।';
    }
    showToast(`পুশ ব্যর্থ হয়েছে: ${msg}`, 'error', 6000);
  } finally {
    DOM.btnCommitPush.disabled = false;
    DOM.btnCommitPushText.textContent = 'Commit & Push Changes';
    hideLoader();
  }
}

// ----------------------------------------------------
// CREATE NEW FILE
// ----------------------------------------------------
async function handleCreateNewFile() {
  if (!state.octokit || !state.selectedRepo) return;

  const rawPath = DOM.newFilePathInput.value.trim();
  const content = DOM.newFileContentInput.value;
  const commitMsg = DOM.newFileCommitMsgInput.value.trim() || `Create ${rawPath}`;

  if (!rawPath) {
    showToast('ফাইলের নাম বা পাথ প্রদান করুন', 'error');
    return;
  }

  let finalPath = rawPath;
  if (!finalPath.startsWith('/') && state.currentPath) {
    finalPath = `${state.currentPath}/${finalPath}`.replace(/\/+/g, '/');
  }
  finalPath = finalPath.replace(/^\//, '');

  showLoader(`Creating new file ${finalPath}...`);
  try {
    const encodedContent = utf8_to_b64(content);

    await state.octokit.rest.repos.createOrUpdateFileContents({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      path: finalPath,
      message: commitMsg,
      content: encodedContent,
      branch: state.selectedBranch
    });

    showToast(`নতুন ফাইল "${finalPath}" তৈরি ও পুশ করা হয়েছে!`, 'success');
    DOM.newFileModal.classList.add('hidden');
    DOM.newFilePathInput.value = '';
    DOM.newFileContentInput.value = '';

    await fetchContents(state.currentPath);
    await fetchRecentCommits();
    await fetchWorkflowRuns();

  } catch (error) {
    console.error('Error creating file:', error);
    showToast(`ফাইল তৈরিতে সমস্যা: ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// MULTI-FILE DRAG & DROP UPLOADER
// ----------------------------------------------------
function setupUploadHandlers() {
  const dropZone = DOM.uploadDropZone;
  const fileInput = DOM.uploadFileInput;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-emerald-500', 'bg-[#1e293b]/50');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-emerald-500', 'bg-[#1e293b]/50');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-emerald-500', 'bg-[#1e293b]/50');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  });

  DOM.btnClearStagedFiles.addEventListener('click', () => {
    state.stagedUploadFiles = [];
    renderStagedFiles();
  });

  DOM.btnCommitUploadFiles.addEventListener('click', handleExecuteUploadCommit);
}

function handleFilesSelected(fileList) {
  const newFiles = Array.from(fileList);
  state.stagedUploadFiles = [...state.stagedUploadFiles, ...newFiles];
  renderStagedFiles();
  showToast(`${newFiles.length}টি ফাইল আপলোড স্টেজে যোগ করা হয়েছে`, 'info');
}

function renderStagedFiles() {
  DOM.stagedFilesList.innerHTML = '';
  const count = state.stagedUploadFiles.length;

  if (count === 0) {
    DOM.stagedFilesContainer.classList.add('hidden');
    return;
  }

  DOM.stagedFilesContainer.classList.remove('hidden');
  DOM.stagedFilesCount.textContent = `${count} file${count > 1 ? 's' : ''}`;

  state.stagedUploadFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'p-2.5 rounded-xl bg-[#0b0f19] border border-[#1f293d] flex items-center justify-between gap-3 text-xs';
    
    item.innerHTML = `
      <div class="flex items-center gap-2.5 truncate">
        <svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span class="font-medium text-white truncate">${file.name}</span>
        <span class="text-[10px] text-[#64748b] font-mono shrink-0">${formatBytes(file.size)}</span>
      </div>
      <button data-index="${index}" class="btn-remove-staged p-1 rounded hover:bg-rose-500/20 text-[#64748b] hover:text-rose-400 transition-colors">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    `;

    item.querySelector('.btn-remove-staged').addEventListener('click', (e) => {
      e.stopPropagation();
      state.stagedUploadFiles.splice(index, 1);
      renderStagedFiles();
    });

    DOM.stagedFilesList.appendChild(item);
  });
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Extract base64 part after comma
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

async function handleExecuteUploadCommit() {
  if (!state.octokit || !state.selectedRepo) {
    showToast('অনুগ্রহ করে প্রথমে রিপোজিটরি সিলেক্ট করুন', 'error');
    return;
  }

  if (state.stagedUploadFiles.length === 0) {
    showToast('কোনো ফাইল সিলেক্ট করা নেই', 'error');
    return;
  }

  const commitMsg = DOM.uploadCommitMessageInput.value.trim() || `Upload ${state.stagedUploadFiles.length} files`;
  let targetDir = DOM.uploadDirPathInput.value.trim().replace(/^\/+|\/+$/g, '');

  DOM.btnCommitUploadFiles.disabled = true;
  DOM.btnCommitUploadFilesText.textContent = 'Uploading...';
  showLoader('Uploading staged files...');

  let successCount = 0;

  try {
    for (let i = 0; i < state.stagedUploadFiles.length; i++) {
      const file = state.stagedUploadFiles[i];
      const filePath = targetDir ? `${targetDir}/${file.name}` : file.name;
      
      DOM.uploadProgressText.textContent = `Uploading ${i + 1} of ${state.stagedUploadFiles.length}: ${file.name}...`;

      const base64Content = await readFileAsBase64(file);

      // Check if file exists to provide sha
      let existingSha = undefined;
      try {
        const { data: existingFile } = await state.octokit.rest.repos.getContent({
          owner: state.selectedRepo.owner.login,
          repo: state.selectedRepo.name,
          path: filePath,
          ref: state.selectedBranch
        });
        existingSha = existingFile.sha;
      } catch (e) {
        // File doesn't exist yet
      }

      await state.octokit.rest.repos.createOrUpdateFileContents({
        owner: state.selectedRepo.owner.login,
        repo: state.selectedRepo.name,
        path: filePath,
        message: `${commitMsg} (${file.name})`,
        content: base64Content,
        sha: existingSha,
        branch: state.selectedBranch
      });

      successCount++;
    }

    showToast(`সফলভাবে ${successCount}টি ফাইল পুশ করা হয়েছে!`, 'success', 6000);
    state.stagedUploadFiles = [];
    renderStagedFiles();
    DOM.uploadProgressText.textContent = '';

    await fetchContents(state.currentPath);
    await fetchRecentCommits();
    await fetchWorkflowRuns();

    // Switch back to editor tab
    switchTab('files');

  } catch (error) {
    console.error('Upload error:', error);
    showToast(`আপলোড ত্রুটি: ${error.message}`, 'error', 6000);
  } finally {
    DOM.btnCommitUploadFiles.disabled = false;
    DOM.btnCommitUploadFilesText.textContent = 'Commit & Push Files';
    hideLoader();
  }
}

// ----------------------------------------------------
// GITHUB ACTIONS WORKFLOWS & CI/CD
// ----------------------------------------------------
async function fetchWorkflowRuns() {
  if (!state.octokit || !state.selectedRepo) return;

  try {
    const { data } = await state.octokit.rest.actions.listWorkflowRunsForRepo({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      per_page: 20
    });

    state.workflowRuns = data.workflow_runs || [];
    renderWorkflowRuns(state.workflowRuns);
  } catch (error) {
    console.warn('Error fetching workflow runs (Actions might not be initialized):', error.message);
    renderWorkflowRuns([]);
  }
}

function renderWorkflowRuns(runs) {
  if (!DOM.workflowRunsList) return;
  DOM.workflowRunsList.innerHTML = '';
  DOM.workflowRunsCountBadge.textContent = `${runs.length} runs`;

  if (runs.length === 0) {
    DOM.workflowRunsList.innerHTML = `
      <div class="p-8 text-center text-xs text-[#64748b] space-y-2">
        <p>এই রিপোজিটরিতে কোনো Workflow Run পাওয়া যায়নি।</p>
        <p class="text-[11px] text-[#475569]">উপরে থাকা "1-Click Workflow Connect Presets" দিয়ে CI/CD পাইপলাইন যোগ করুন।</p>
      </div>
    `;
    return;
  }

  runs.forEach(run => {
    const item = document.createElement('div');
    item.className = 'p-4 hover:bg-[#1e293b]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors';

    // Status badge & styling
    let statusPill = `<span class="text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">${run.status}</span>`;
    if (run.conclusion === 'success') {
      statusPill = `<span class="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Success</span>`;
    } else if (run.conclusion === 'failure') {
      statusPill = `<span class="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px] font-bold">Failed</span>`;
    } else if (run.status === 'in_progress') {
      statusPill = `<span class="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> In Progress</span>`;
    }

    item.innerHTML = `
      <div class="space-y-1 min-w-0">
        <div class="flex items-center gap-2">
          ${statusPill}
          <h4 class="text-xs font-bold text-white truncate">${run.name || 'Workflow Run'} #${run.run_number}</h4>
        </div>
        <p class="text-[11px] text-[#94a3b8] truncate">${run.head_commit ? run.head_commit.message : 'Push trigger'}</p>
        <div class="flex items-center gap-3 text-[10px] text-[#64748b]">
          <span class="font-mono text-sky-400">${run.head_branch}</span>
          <span>•</span>
          <span>Event: ${run.event}</span>
          <span>•</span>
          <span>${formatDate(run.created_at)}</span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <a href="${run.html_url}" target="_blank" rel="noreferrer" class="px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs font-medium text-[#cbd5e1] border border-[#334155] flex items-center gap-1">
          <span>View on GitHub</span>
          <svg class="w-3 h-3 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
        </a>
      </div>
    `;

    DOM.workflowRunsList.appendChild(item);
  });
}

function setupWorkflowTemplateButtons() {
  document.querySelectorAll('.btn-workflow-template').forEach(btn => {
    btn.addEventListener('click', async () => {
      const templateKey = btn.getAttribute('data-template');
      const template = WORKFLOW_TEMPLATES[templateKey];
      if (!template) return;

      if (!state.octokit || !state.selectedRepo) {
        showToast('অনুগ্রহ করে প্রথমে একটি রিপোজিটরি সিলেক্ট করুন', 'error');
        return;
      }

      const confirmAdd = window.confirm(`আপনি কি "${template.name}" পাইপলাইন কনফিগ (${template.path}) রিপোজিটরিতে পুশ করতে চান?`);
      if (!confirmAdd) return;

      showLoader(`Connecting ${template.name} workflow...`);
      try {
        const encodedContent = utf8_to_b64(template.content);

        // Check if existing
        let currentSha = undefined;
        try {
          const { data: existing } = await state.octokit.rest.repos.getContent({
            owner: state.selectedRepo.owner.login,
            repo: state.selectedRepo.name,
            path: template.path,
            ref: state.selectedBranch
          });
          currentSha = existing.sha;
        } catch (e) {
          // New file
        }

        await state.octokit.rest.repos.createOrUpdateFileContents({
          owner: state.selectedRepo.owner.login,
          repo: state.selectedRepo.name,
          path: template.path,
          message: `Add ${template.name} GitHub Actions workflow`,
          content: encodedContent,
          sha: currentSha,
          branch: state.selectedBranch
        });

        showToast(`Workflow "${template.name}" সফলভাবে যুক্ত ও পুশ হয়েছে!`, 'success', 6000);
        await fetchContents(state.currentPath);
        await fetchWorkflowRuns();

      } catch (error) {
        console.error('Error adding workflow:', error);
        showToast(`Workflow যুক্ত করতে সমস্যা: ${error.message}`, 'error');
      } finally {
        hideLoader();
      }
    });
  });
}

// ----------------------------------------------------
// COMMIT REVERT ENGINE
// ----------------------------------------------------
async function fetchRecentCommits() {
  if (!state.octokit || !state.selectedRepo) return;

  try {
    const { data: commits } = await state.octokit.rest.repos.listCommits({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      sha: state.selectedBranch,
      per_page: 30
    });

    state.recentCommits = commits;
    renderRecentCommits();
    renderHistoryTab();
  } catch (error) {
    console.warn('Error fetching recent commits:', error.message);
  }
}

function renderRecentCommits() {
  if (!DOM.revertRecentCommitsList) return;
  DOM.revertRecentCommitsList.innerHTML = '';

  if (state.recentCommits.length === 0) {
    DOM.revertRecentCommitsList.innerHTML = `<p class="text-xs text-[#64748b]">কোনো সাম্প্রতিক কমিট পাওয়া যায়নি।</p>`;
    return;
  }

  state.recentCommits.slice(0, 8).forEach(c => {
    const item = document.createElement('div');
    item.className = 'p-3 rounded-xl bg-[#0b0f19] hover:bg-[#1e293b] border border-[#1f293d] cursor-pointer flex items-center justify-between gap-3 transition-colors';
    
    item.innerHTML = `
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold text-white truncate">${c.commit.message.split('\n')[0]}</p>
        <div class="flex items-center gap-2 text-[10px] text-[#64748b] mt-1">
          <span class="font-mono text-sky-400">${c.sha.substring(0, 7)}</span>
          <span>•</span>
          <span>${c.commit.author ? c.commit.author.name : 'Unknown'}</span>
          <span>•</span>
          <span>${formatDate(c.commit.author ? c.commit.author.date : '')}</span>
        </div>
      </div>
      <button class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold shrink-0">
        Revert
      </button>
    `;

    item.addEventListener('click', () => {
      DOM.revertShaInput.value = c.sha;
      handleFetchCommitToRevert();
    });

    DOM.revertRecentCommitsList.appendChild(item);
  });
}

function renderHistoryTab() {
  if (!DOM.historyListContainer) return;
  DOM.historyListContainer.innerHTML = '';

  if (state.recentCommits.length === 0) {
    DOM.historyListContainer.innerHTML = `<div class="p-8 text-center text-xs text-[#64748b]">কোনো কমিট হিস্টোরি পাওয়া যায়নি।</div>`;
    return;
  }

  state.recentCommits.forEach(c => {
    const div = document.createElement('div');
    div.className = 'p-4 hover:bg-[#1e293b]/40 flex items-start justify-between gap-4 transition-colors';

    div.innerHTML = `
      <div class="space-y-1 min-w-0">
        <h4 class="text-xs font-bold text-white leading-snug">${c.commit.message.split('\n')[0]}</h4>
        ${c.commit.message.split('\n').length > 1 ? `<p class="text-[11px] text-[#94a3b8] line-clamp-2">${c.commit.message.split('\n').slice(1).join(' ')}</p>` : ''}
        <div class="flex items-center gap-3 text-[11px] text-[#64748b] pt-1">
          <span class="text-[#cbd5e1] font-medium">${c.commit.author ? c.commit.author.name : 'Author'}</span>
          <span>committed on ${formatDate(c.commit.author ? c.commit.author.date : '')}</span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="font-mono text-xs bg-[#0b0f19] text-sky-400 px-2.5 py-1 rounded-md border border-[#1f293d]">${c.sha.substring(0, 7)}</span>
        <button class="btn-quick-revert px-2.5 py-1 rounded-md bg-[#1e293b] hover:bg-rose-500/20 text-[#cbd5e1] hover:text-rose-400 border border-[#334155] text-xs font-medium transition-colors" title="Revert this commit">
          Revert
        </button>
      </div>
    `;

    div.querySelector('.btn-quick-revert').addEventListener('click', () => {
      switchTab('revert');
      DOM.revertShaInput.value = c.sha;
      handleFetchCommitToRevert();
    });

    DOM.historyListContainer.appendChild(div);
  });
}

async function handleFetchCommitToRevert() {
  const sha = DOM.revertShaInput.value.trim();
  if (!sha) {
    showToast('অনুগ্রহ করে একটি Commit SHA দিন', 'error');
    return;
  }

  if (!state.octokit || !state.selectedRepo) {
    showToast('অনুগ্রহ করে প্রথমে একটি রিপোজিটরি সিলেক্ট করুন', 'error');
    return;
  }

  showLoader(`Fetching commit ${sha.substring(0, 7)}...`);
  try {
    const { data: commit } = await state.octokit.rest.repos.getCommit({
      owner: state.selectedRepo.owner.login,
      repo: state.selectedRepo.name,
      ref: sha
    });

    state.revertCommitData = commit;

    DOM.revertCommitMessage.textContent = commit.commit.message;
    DOM.revertCommitAuthor.textContent = commit.commit.author ? commit.commit.author.name : 'Unknown';
    DOM.revertCommitDate.textContent = formatDate(commit.commit.author ? commit.commit.author.date : '');
    DOM.revertCommitShaBadge.textContent = commit.sha.substring(0, 7);
    DOM.revertFilesCountBadge.textContent = `${commit.files ? commit.files.length : 0} files changed`;

    DOM.revertFilesList.innerHTML = '';
    if (commit.files && commit.files.length > 0) {
      commit.files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'p-2.5 rounded-xl bg-[#0b0f19] border border-[#1f293d] text-xs flex items-center justify-between gap-2';
        
        let statusBadge = `<span class="text-emerald-400 font-mono text-[10px]">+${file.additions} -${file.deletions}</span>`;
        if (file.status === 'added') statusBadge = `<span class="text-emerald-400 text-[10px] px-2 py-0.5 rounded bg-emerald-500/10">Added</span>`;
        if (file.status === 'removed') statusBadge = `<span class="text-rose-400 text-[10px] px-2 py-0.5 rounded bg-rose-500/10">Deleted</span>`;
        if (file.status === 'modified') statusBadge = `<span class="text-amber-400 text-[10px] px-2 py-0.5 rounded bg-amber-500/10">Modified</span>`;

        li.innerHTML = `
          <div class="flex items-center gap-2 truncate font-mono">
            <span class="text-white truncate">${file.filename}</span>
          </div>
          ${statusBadge}
        `;
        DOM.revertFilesList.appendChild(li);
      });
    }

    DOM.revertCommitDetails.classList.remove('hidden');
    showToast(`Commit ${sha.substring(0, 7)} ফেচ করা হয়েছে`, 'success');

  } catch (error) {
    console.error('Error fetching commit:', error);
    showToast(`কমিট ফেচ করতে ত্রুটি: ${error.message}`, 'error');
    DOM.revertCommitDetails.classList.add('hidden');
  } finally {
    hideLoader();
  }
}

async function handleExecuteRevert() {
  if (!state.revertCommitData || !state.octokit || !state.selectedRepo) {
    showToast('রিভার্ট করার জন্য কোনো কমিট সিলেক্ট করা নেই', 'error');
    return;
  }

  const commit = state.revertCommitData;
  const originalMessage = commit.commit.message.split('\n')[0];
  const targetSha = commit.sha;
  const parentSha = commit.parents && commit.parents.length > 0 ? commit.parents[0].sha : null;

  if (!parentSha) {
    showToast('এই কমিটটির কোনো Parent commit নেই (initial commit), রিভার্ট সম্ভব নয়।', 'error');
    return;
  }

  const confirmRevert = window.confirm(`আপনি কি "${originalMessage}" (${targetSha.substring(0, 7)}) কমিটটি রিভার্ট করতে চান?`);
  if (!confirmRevert) return;

  showLoader(`Reverting commit ${targetSha.substring(0, 7)}...`);
  try {
    const revertCommitMessage = `Revert "${originalMessage}"\n\nThis reverts commit ${targetSha}.`;

    let revertedCount = 0;
    for (const file of commit.files) {
      if (file.status === 'added') {
        try {
          const { data: currentFile } = await state.octokit.rest.repos.getContent({
            owner: state.selectedRepo.owner.login,
            repo: state.selectedRepo.name,
            path: file.filename,
            ref: state.selectedBranch
          });

          await state.octokit.rest.repos.deleteFile({
            owner: state.selectedRepo.owner.login,
            repo: state.selectedRepo.name,
            path: file.filename,
            message: `Revert added file ${file.filename} (${targetSha.substring(0, 7)})`,
            sha: currentFile.sha,
            branch: state.selectedBranch
          });
          revertedCount++;
        } catch (e) {
          console.warn(`Could not delete added file ${file.filename}:`, e.message);
        }
      } else {
        try {
          const { data: parentFileContent } = await state.octokit.rest.repos.getContent({
            owner: state.selectedRepo.owner.login,
            repo: state.selectedRepo.name,
            path: file.filename,
            ref: parentSha
          });

          let currentSha = undefined;
          try {
            const { data: currentFile } = await state.octokit.rest.repos.getContent({
              owner: state.selectedRepo.owner.login,
              repo: state.selectedRepo.name,
              path: file.filename,
              ref: state.selectedBranch
            });
            currentSha = currentFile.sha;
          } catch (e) {
            // File might not exist currently
          }

          await state.octokit.rest.repos.createOrUpdateFileContents({
            owner: state.selectedRepo.owner.login,
            repo: state.selectedRepo.name,
            path: file.filename,
            message: `${revertCommitMessage}\n\nRestored ${file.filename}`,
            content: parentFileContent.content,
            sha: currentSha,
            branch: state.selectedBranch
          });
          revertedCount++;
        } catch (e) {
          console.error(`Error restoring file ${file.filename}:`, e);
        }
      }
    }

    showToast(`সফলভাবে ${revertedCount}টি ফাইল রিভার্ট ও নতুন কমিট পুশ করা হয়েছে!`, 'success', 6000);
    
    await fetchContents(state.currentPath);
    await fetchRecentCommits();
    await fetchWorkflowRuns();
    DOM.revertCommitDetails.classList.add('hidden');
    DOM.revertShaInput.value = '';

    switchTab('files');

  } catch (error) {
    console.error('Revert execution failed:', error);
    showToast(`রিভার্ট করতে সমস্যা হয়েছে: ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// TABS SWITCHING
// ----------------------------------------------------
function switchTab(tabName) {
  state.currentTab = tabName;

  const allTabBtns = [DOM.tabBtnFiles, DOM.tabBtnUpload, DOM.tabBtnWorkflows, DOM.tabBtnRevert, DOM.tabBtnHistory];
  allTabBtns.forEach(btn => {
    if (!btn) return;
    btn.classList.remove('bg-[#1e293b]', 'text-white', 'shadow-sm');
    btn.classList.add('text-[#94a3b8]');
  });

  const allTabContents = [DOM.tabContentFiles, DOM.tabContentUpload, DOM.tabContentWorkflows, DOM.tabContentRevert, DOM.tabContentHistory];
  allTabContents.forEach(c => {
    if (c) c.classList.add('hidden');
  });

  if (tabName === 'files') {
    DOM.tabBtnFiles.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    DOM.tabBtnFiles.classList.remove('text-[#94a3b8]');
    DOM.tabContentFiles.classList.remove('hidden');
    if (monacoEditorInstance) {
      setTimeout(() => monacoEditorInstance.layout(), 100);
    }
  } else if (tabName === 'upload') {
    DOM.tabBtnUpload.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    DOM.tabBtnUpload.classList.remove('text-[#94a3b8]');
    DOM.tabContentUpload.classList.remove('hidden');
  } else if (tabName === 'workflows') {
    DOM.tabBtnWorkflows.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    DOM.tabBtnWorkflows.classList.remove('text-[#94a3b8]');
    DOM.tabContentWorkflows.classList.remove('hidden');
    fetchWorkflowRuns();
  } else if (tabName === 'revert') {
    DOM.tabBtnRevert.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    DOM.tabBtnRevert.classList.remove('text-[#94a3b8]');
    DOM.tabContentRevert.classList.remove('hidden');
  } else if (tabName === 'history') {
    DOM.tabBtnHistory.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    DOM.tabBtnHistory.classList.remove('text-[#94a3b8]');
    DOM.tabContentHistory.classList.remove('hidden');
    fetchRecentCommits();
  }
}

// ----------------------------------------------------
// MOBILE SIDEBAR CONTROLS
// ----------------------------------------------------
function toggleMobileSidebar() {
  const isOpen = !DOM.repoSidebar.classList.contains('-translate-x-full');
  if (isOpen) {
    closeMobileSidebar();
  } else {
    DOM.repoSidebar.classList.remove('-translate-x-full');
    DOM.sidebarBackdrop.classList.remove('hidden');
  }
}

function closeMobileSidebar() {
  DOM.repoSidebar.classList.add('-translate-x-full');
  DOM.sidebarBackdrop.classList.add('hidden');
}

// ----------------------------------------------------
// TOP EDITOR TOOLBAR ACTIONS (MATCHING REFERENCE UI)
// ----------------------------------------------------
function handleToolNew() {
  if (DOM.newFileModal) {
    DOM.newFileModal.classList.remove('hidden');
    if (DOM.newFilePathInput) DOM.newFilePathInput.focus();
  }
}

function handleToolOpenFile() {
  if (DOM.localFileInput) {
    DOM.localFileInput.click();
  }
}

function handleLocalFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    switchTab('files');
    DOM.editorEmptyState.classList.add('hidden');
    DOM.codeEditor.disabled = false;
    DOM.codeEditor.value = content;
    DOM.editorFileName.textContent = file.name;
    DOM.editorFileSize.textContent = formatBytes(file.size);
    DOM.lineNumbers.classList.remove('hidden');
    
    updateMonacoContent(content, file.name);
    const lang = getLanguageFromFileName(file.name);
    if (DOM.languageSelect) DOM.languageSelect.value = lang;

    state.activeFile = {
      name: file.name,
      path: file.name,
      content: content,
      originalContent: content,
      size: file.size
    };

    showToast(`File "${file.name}" loaded into editor`, 'success');
  };
  reader.readAsText(file);
}

function handleToolOpenFolder() {
  toggleMobileSidebar();
}

function handleToolSave() {
  if (state.activeFile && monacoEditorInstance) {
    const val = monacoEditorInstance.getValue();
    state.activeFile.content = val;
    DOM.codeEditor.value = val;
    checkEditorModified();
    showToast(`Saved changes for ${state.activeFile.name}`, 'success');
  } else {
    showToast('No active file open in editor to save', 'info');
  }
}

function handleToolSaveAs() {
  if (DOM.newFileModal) {
    DOM.newFileModal.classList.remove('hidden');
    if (monacoEditorInstance && DOM.newFileContentInput) {
      DOM.newFileContentInput.value = monacoEditorInstance.getValue();
    }
  }
}

function handleToolSelectAll() {
  switchTab('files');
  if (monacoEditorInstance) {
    const model = monacoEditorInstance.getModel();
    if (model) {
      const fullRange = model.getFullModelRange();
      monacoEditorInstance.setSelection(fullRange);
      monacoEditorInstance.focus();
    }
  } else if (DOM.codeEditor) {
    DOM.codeEditor.focus();
    DOM.codeEditor.select();
  }
  showToast('All code selected', 'info');
}

async function handleToolCopy() {
  let text = '';
  if (monacoEditorInstance) {
    const selection = monacoEditorInstance.getSelection();
    if (selection && !selection.isEmpty()) {
      text = monacoEditorInstance.getModel().getValueInRange(selection);
    } else {
      text = monacoEditorInstance.getValue();
    }
  } else if (DOM.codeEditor) {
    const start = DOM.codeEditor.selectionStart;
    const end = DOM.codeEditor.selectionEnd;
    text = (start !== end) ? DOM.codeEditor.value.substring(start, end) : DOM.codeEditor.value;
  }

  if (text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard!', 'success');
    } catch (e) {
      showToast('Failed to copy to clipboard', 'error');
    }
  } else {
    showToast('Nothing to copy', 'info');
  }
}

async function handleToolCut() {
  if (monacoEditorInstance) {
    const selection = monacoEditorInstance.getSelection();
    if (selection && !selection.isEmpty()) {
      const text = monacoEditorInstance.getModel().getValueInRange(selection);
      await navigator.clipboard.writeText(text);
      monacoEditorInstance.executeEdits('cut', [{ range: selection, text: '' }]);
      showToast('Cut selected text', 'info');
    } else {
      const text = monacoEditorInstance.getValue();
      await navigator.clipboard.writeText(text);
      monacoEditorInstance.setValue('');
      showToast('Cut all code', 'info');
    }
  }
}

async function handleToolPaste() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      if (monacoEditorInstance) {
        const selection = monacoEditorInstance.getSelection();
        monacoEditorInstance.executeEdits('paste', [{ range: selection, text: text, forceMoveMarkers: true }]);
      } else if (DOM.codeEditor) {
        const start = DOM.codeEditor.selectionStart;
        const end = DOM.codeEditor.selectionEnd;
        DOM.codeEditor.value = DOM.codeEditor.value.substring(0, start) + text + DOM.codeEditor.value.substring(end);
      }
      showToast('Pasted text from clipboard', 'info');
    }
  } catch (e) {
    showToast('Clipboard paste permission denied or empty', 'error');
  }
}

function handleLanguageChange(e) {
  const selectedLang = e.target.value;
  if (monacoEditorInstance && window.monaco) {
    const model = monacoEditorInstance.getModel();
    if (model) {
      window.monaco.editor.setModelLanguage(model, selectedLang);
    }
  }
  showToast(`Language set to ${selectedLang.toUpperCase()}`, 'info');
}

function handleToolCloneRepo() {
  if (DOM.cloneRepoModal) {
    DOM.cloneRepoModal.classList.remove('hidden');
    if (DOM.cloneRepoUrlInput) DOM.cloneRepoUrlInput.focus();
  }
}

async function handleCloneRepoSubmit() {
  const rawInput = DOM.cloneRepoUrlInput ? DOM.cloneRepoUrlInput.value.trim() : '';
  if (!rawInput) {
    showToast('Please enter a GitHub repository name or URL', 'error');
    return;
  }

  let clean = rawInput.replace(/https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').trim();
  const parts = clean.split('/').filter(Boolean);
  
  if (parts.length < 2) {
    showToast('Invalid format. Use "owner/repository" or GitHub URL', 'error');
    return;
  }

  const owner = parts[parts.length - 2];
  const repoName = parts[parts.length - 1];

  showLoader(`Cloning ${owner}/${repoName}...`);
  try {
    let repoData = { owner: { login: owner }, name: repoName };
    if (state.octokit) {
      try {
        const { data } = await state.octokit.rest.repos.get({ owner, repo: repoName });
        repoData = data;
      } catch (err) {
        console.warn('Octokit repo fetch fallback:', err);
      }
    }

    state.selectedRepo = repoData;
    DOM.currentRepoOwner.textContent = owner;
    DOM.currentRepoName.textContent = repoName;
    DOM.cloneRepoModal.classList.add('hidden');
    DOM.cloneRepoUrlInput.value = '';

    await fetchContents('');
    showToast(`Repository ${owner}/${repoName} loaded!`, 'success');
  } catch (err) {
    console.error('Clone Repo Error:', err);
    showToast(`Could not clone repository: ${err.message}`, 'error');
  } finally {
    hideLoader();
  }
}

// ----------------------------------------------------
// EVENT LISTENERS INITIALIZATION
// ----------------------------------------------------
function setupEventListeners() {
  // Top Double Toolbar Action Listeners (Matching reference UI)
  if (DOM.btnToolNew) DOM.btnToolNew.addEventListener('click', handleToolNew);
  if (DOM.btnToolOpenFile) DOM.btnToolOpenFile.addEventListener('click', handleToolOpenFile);
  if (DOM.localFileInput) DOM.localFileInput.addEventListener('change', handleLocalFileSelected);
  if (DOM.btnToolOpenFolder) DOM.btnToolOpenFolder.addEventListener('click', handleToolOpenFolder);
  if (DOM.btnToolSave) DOM.btnToolSave.addEventListener('click', handleToolSave);
  if (DOM.btnToolSaveAs) DOM.btnToolSaveAs.addEventListener('click', handleToolSaveAs);
  if (DOM.btnToolSelectAll) DOM.btnToolSelectAll.addEventListener('click', handleToolSelectAll);
  if (DOM.btnToolCopy) DOM.btnToolCopy.addEventListener('click', handleToolCopy);
  if (DOM.btnToolCut) DOM.btnToolCut.addEventListener('click', handleToolCut);
  if (DOM.btnToolPaste) DOM.btnToolPaste.addEventListener('click', handleToolPaste);
  if (DOM.languageSelect) DOM.languageSelect.addEventListener('change', handleLanguageChange);
  if (DOM.btnToolCloneRepo) DOM.btnToolCloneRepo.addEventListener('click', handleToolCloneRepo);
  if (DOM.btnToolCommitPush) {
    DOM.btnToolCommitPush.addEventListener('click', () => {
      switchTab('files');
      if (DOM.commitMessageInput) DOM.commitMessageInput.focus();
    });
  }
  if (DOM.btnToolPullChanges) {
    DOM.btnToolPullChanges.addEventListener('click', async () => {
      if (state.selectedRepo) {
        showLoader('Pulling latest changes...');
        await fetchContents(state.currentPath || '');
        await fetchRecentCommits();
        hideLoader();
        showToast('Pulled latest changes from GitHub', 'success');
      } else {
        showToast('No repository selected to pull', 'info');
      }
    });
  }

  // Clone Repo Modal listeners
  if (DOM.btnCloseCloneRepoModal) DOM.btnCloseCloneRepoModal.addEventListener('click', () => DOM.cloneRepoModal.classList.add('hidden'));
  if (DOM.btnCancelCloneRepo) DOM.btnCancelCloneRepo.addEventListener('click', () => DOM.cloneRepoModal.classList.add('hidden'));
  if (DOM.btnSubmitCloneRepo) DOM.btnSubmitCloneRepo.addEventListener('click', handleCloneRepoSubmit);

  // Auth actions
  DOM.btnGithubLogin.addEventListener('click', handleGithubLogin);
  DOM.btnLogout.addEventListener('click', handleLogout);

  // Mobile sidebar controls
  if (DOM.btnToggleMobileSidebar) DOM.btnToggleMobileSidebar.addEventListener('click', toggleMobileSidebar);
  if (DOM.btnCloseMobileSidebar) DOM.btnCloseMobileSidebar.addEventListener('click', closeMobileSidebar);
  if (DOM.sidebarBackdrop) DOM.sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  // File explorer toggle
  if (DOM.btnToggleExplorer) {
    DOM.btnToggleExplorer.addEventListener('click', () => {
      if (!DOM.fileExplorerPane) return;
      DOM.fileExplorerPane.classList.toggle('hidden');
      if (monacoEditorInstance) {
        setTimeout(() => monacoEditorInstance.layout(), 100);
      }
    });
  }

  // Window resize observer
  window.addEventListener('resize', () => {
    if (monacoEditorInstance) {
      monacoEditorInstance.layout();
    }
  });

  // Modal Openers for New Repository
  const openNewRepoModal = () => {
    DOM.newRepoModal.classList.remove('hidden');
    DOM.newRepoNameInput.focus();
  };
  if (DOM.btnHeaderNewRepo) DOM.btnHeaderNewRepo.addEventListener('click', openNewRepoModal);
  if (DOM.btnSidebarNewRepo) DOM.btnSidebarNewRepo.addEventListener('click', openNewRepoModal);
  if (DOM.btnCloseNewRepoModal) DOM.btnCloseNewRepoModal.addEventListener('click', () => DOM.newRepoModal.classList.add('hidden'));
  if (DOM.btnCancelNewRepo) DOM.btnCancelNewRepo.addEventListener('click', () => DOM.newRepoModal.classList.add('hidden'));
  if (DOM.newRepoForm) DOM.newRepoForm.addEventListener('submit', handleCreateNewRepo);

  // Firebase / Settings modal
  DOM.btnOpenFirebaseSettings.addEventListener('click', () => {
    DOM.firebaseModal.classList.remove('hidden');
  });
  DOM.btnCloseFirebaseModal.addEventListener('click', () => {
    DOM.firebaseModal.classList.add('hidden');
  });

  DOM.btnLoadDefaultConfig.addEventListener('click', () => {
    DOM.firebaseConfigInput.value = JSON.stringify(DEFAULT_FIREBASE_CONFIG, null, 2);
  });

  DOM.btnSaveFirebaseConfig.addEventListener('click', () => {
    try {
      const config = JSON.parse(DOM.firebaseConfigInput.value);
      localStorage.setItem('git_client_firebase_config', JSON.stringify(config));
      showToast('Firebase কনফিগারেশন সেভ হয়েছে!', 'success');
      DOM.firebaseModal.classList.add('hidden');
      initFirebase();
    } catch (e) {
      showToast('ভুল JSON ফরম্যাট! অনুগ্রহ করে সঠিক Firebase Config দিন।', 'error');
    }
  });

  DOM.btnSaveDirectPat.addEventListener('click', () => {
    const token = DOM.directPatInput.value.trim();
    if (!token) {
      showToast('টোকেন প্রদান করুন', 'error');
      return;
    }
    state.githubToken = token;
    localStorage.setItem('git_client_github_token', token);
    DOM.firebaseModal.classList.add('hidden');
    DOM.directPatInput.value = '';
    initOctokit(token);
  });

  if (DOM.btnCopyCallbackUrl && DOM.callbackUrlText) {
    DOM.btnCopyCallbackUrl.addEventListener('click', async () => {
      try {
        const text = DOM.callbackUrlText.textContent.trim();
        await navigator.clipboard.writeText(text);
        showToast('Callback URL কপি করা হয়েছে!', 'success');
      } catch (err) {
        showToast('কপি করা সম্ভব হয়নি', 'error');
      }
    });
  }

  // Repos Search & Filters
  DOM.repoSearchInput.addEventListener('input', filterAndRenderRepos);
  DOM.btnRefreshRepos.addEventListener('click', fetchRepositories);

  DOM.filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.filterButtons.forEach(b => {
        b.classList.remove('bg-[#1e293b]', 'text-white', 'border', 'border-sky-500');
        b.classList.add('bg-transparent', 'text-[#94a3b8]');
      });
      btn.classList.add('bg-[#1e293b]', 'text-white', 'border', 'border-sky-500');
      btn.classList.remove('bg-transparent', 'text-[#94a3b8]');

      state.activeFilter = btn.getAttribute('data-filter');
      filterAndRenderRepos();
    });
  });

  // Branch selector
  DOM.branchSelect.addEventListener('change', (e) => {
    state.selectedBranch = e.target.value;
    DOM.uploadTargetBranchBadge.textContent = state.selectedBranch;
    showToast(`Branch switched to ${state.selectedBranch}`, 'info');
    fetchContents(state.currentPath);
    fetchRecentCommits();
    fetchWorkflowRuns();
  });

  // Main Tabs navigation
  DOM.tabBtnFiles.addEventListener('click', () => switchTab('files'));
  DOM.tabBtnUpload.addEventListener('click', () => switchTab('upload'));
  DOM.tabBtnWorkflows.addEventListener('click', () => switchTab('workflows'));
  DOM.tabBtnRevert.addEventListener('click', () => switchTab('revert'));
  DOM.tabBtnHistory.addEventListener('click', () => switchTab('history'));

  if (DOM.btnRefreshHistory) DOM.btnRefreshHistory.addEventListener('click', fetchRecentCommits);
  if (DOM.btnRefreshWorkflows) DOM.btnRefreshWorkflows.addEventListener('click', fetchWorkflowRuns);

  // Quick upload jump button from Files tab
  if (DOM.btnQuickUpload) {
    DOM.btnQuickUpload.addEventListener('click', () => {
      switchTab('upload');
      if (state.currentPath) {
        DOM.uploadDirPathInput.value = state.currentPath;
      }
    });
  }

  // Code editor listeners
  DOM.codeEditor.addEventListener('input', () => {
    updateLineNumbers();
    checkEditorModified();
  });

  DOM.codeEditor.addEventListener('scroll', () => {
    DOM.lineNumbers.scrollTop = DOM.codeEditor.scrollTop;
  });

  DOM.codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = DOM.codeEditor.selectionStart;
      const end = DOM.codeEditor.selectionEnd;
      DOM.codeEditor.value = DOM.codeEditor.value.substring(0, start) + '  ' + DOM.codeEditor.value.substring(end);
      DOM.codeEditor.selectionStart = DOM.codeEditor.selectionEnd = start + 2;
      checkEditorModified();
    }
  });

  DOM.commitMessageInput.addEventListener('input', updateCommitButtonState);
  DOM.btnCommitPush.addEventListener('click', handleCommitAndPush);

  DOM.btnResetFile.addEventListener('click', () => {
    if (!state.activeFile) return;
    DOM.codeEditor.value = state.activeFile.originalContent;
    if (monacoEditorInstance) {
      monacoEditorInstance.setValue(state.activeFile.originalContent);
    }
    updateLineNumbers();
    checkEditorModified();
    showToast('ফাইল রিসেট করা হয়েছে', 'info');
  });

  DOM.btnTogglePreview.addEventListener('click', () => {
    const isHidden = DOM.previewPanel.classList.contains('hidden');
    if (isHidden) {
      const content = DOM.codeEditor.value;
      DOM.previewPanel.innerHTML = renderSimpleMarkdown(content);
      DOM.previewPanel.classList.remove('hidden');
      DOM.btnTogglePreview.innerHTML = `Code`;
    } else {
      DOM.previewPanel.classList.add('hidden');
      DOM.btnTogglePreview.innerHTML = `Preview`;
    }
  });

  // New file modal
  DOM.btnNewFile.addEventListener('click', () => {
    DOM.newFileModal.classList.remove('hidden');
    DOM.newFilePathInput.focus();
  });
  DOM.btnCloseNewFileModal.addEventListener('click', () => DOM.newFileModal.classList.add('hidden'));
  DOM.btnCancelNewFile.addEventListener('click', () => DOM.newFileModal.classList.add('hidden'));
  DOM.btnSubmitNewFile.addEventListener('click', handleCreateNewFile);

  // Revert handlers
  DOM.btnFetchCommitToRevert.addEventListener('click', handleFetchCommitToRevert);
  DOM.btnExecuteRevert.addEventListener('click', handleExecuteRevert);

  // Upload handlers
  setupUploadHandlers();

  // Workflow templates
  setupWorkflowTemplateButtons();
}

// ----------------------------------------------------
// SIMPLE SAFE MARKDOWN RENDERER
// ----------------------------------------------------
function renderSimpleMarkdown(md) {
  if (!md) return '<p class="text-[#64748b]">Empty file</p>';
  
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

  html = html.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
  html = html.replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>');

  html = html.replace(/\n\n/gim, '</p><p>');
  html = `<p>${html}</p>`;

  return html;
}

// ----------------------------------------------------
// BOOTSTRAP APPLICATION
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initFirebase();
});
