export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: Record<string, FileNode>;
  sha?: string;
  loaded?: boolean;
  zipEntry?: any;
}

export interface Tab {
  id: string;
  title: string;
  path: string;
  content: string;
  isModified: boolean;
  language: string;
  sha?: string;
  repo?: string;
}

export interface OutlineItem {
  name: string;
  type: string;
  icon?: string;
  line: number;
  level: number;
}

export type ChangeStatus = 'modified' | 'added' | 'deleted' | 'renamed';

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
  branches?: string[];
}

export interface SyntaxOption {
  label: string;
  value: string;
}

export type SidebarTab = 'explorer' | 'outline' | 'source-control' | 'history';

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  authorName: string;
  authorAvatar?: string;
  date: string;
  htmlUrl: string;
  treeSha?: string;
}

export interface GitHubRepoItem {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  private: boolean;
  html_url: string;
  description: string | null;
  default_branch: string;
  updated_at: string;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
}

export interface CommitFilePayload {
  path: string;
  content?: string;
  sha?: string;
  isBinary?: boolean;
  encoding?: 'utf-8' | 'base64';
}

export interface FileOpModalState {
  isOpen: boolean;
  mode: 'new-file' | 'new-folder' | 'rename' | 'delete' | 'move';
  targetPath: string;
  initialName?: string;
  nodeType?: 'file' | 'folder';
  destinationPath?: string;
}
