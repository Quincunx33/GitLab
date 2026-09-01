import { CommitInfo, GitHubRepoItem, CommitFilePayload } from '../types';
export type { CommitFilePayload };

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url?: string;
}

export function parseGitHubError(status: number, message: string, defaultMessage: string): Error {
  if (status === 401) {
    return new Error('GitHub Token is invalid or expired. Please sign in again.');
  }
  if (status === 403 || message.toLowerCase().includes('rate limit')) {
    return new Error('GitHub API rate limit exceeded. Please wait a moment or sign in to increase your limit.');
  }
  if (status === 404) {
    return new Error('Repository or resource not found. It might be private or deleted.');
  }
  if (status === 409) {
    return new Error('Conflict occurred. The repository might be empty or out of sync.');
  }
  if (status === 422) {
    return new Error(`Validation failed: ${message}`);
  }
  return new Error(message || defaultMessage);
}

export function parseRepoUrl(input: string): { owner: string; repo: string } | null {
  let cleaned = input.trim();
  cleaned = cleaned.replace(/^https?:\/\/github\.com\//, '');
  cleaned = cleaned.replace(/\.git$/, '');

  const parts = cleaned.split('/');
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}

export async function fetchGitHubRepoTree(
  owner: string,
  repo: string,
  branch: string = 'main',
  token?: string | null
): Promise<GitHubTreeItem[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers }
  );

  if (!res.ok) {
    // Try master branch if main failed
    if (branch === 'main') {
      const fallbackRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`,
        { headers }
      );
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data.tree || [];
      }
    }
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, `Failed to fetch repo tree (${res.status})`);
  }

  const data = await res.json();
  return data.tree || [];
}

export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main',
  token?: string | null
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { headers }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, `Failed to fetch file content for ${path}`);
  }

  const data = await res.json();
  if (data.content) {
    // Decode base64 UTF-8 string correctly
    const binary = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  return '';
}

export async function fetchBranches(
  owner: string,
  repo: string,
  token?: string | null
): Promise<string[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, { headers });
  if (!res.ok) return ['main', 'master'];

  const data = await res.json();
  return data.map((b: any) => b.name);
}

export async function fetchGitHubUser(token: string): Promise<string> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, 'Invalid GitHub token');
  }

  const data = await res.json();
  return data.login || 'GitHub User';
}

export async function createGitHubRepository(
  name: string,
  description: string,
  isPrivate: boolean,
  token: string
): Promise<{ owner: string; repo: string; html_url: string }> {
  const res = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      description,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, err.message, `Failed to create repository (${res.status})`);
  }

  const data = await res.json();
  return {
    owner: data.owner.login,
    repo: data.name,
    html_url: data.html_url,
  };
}

export async function commitMultipleFilesToGitHub(
  owner: string,
  repo: string,
  branch: string,
  files: CommitFilePayload[],
  deletedPaths: string[] = [],
  message?: string,
  token?: string
): Promise<{ commitSha: string; fileCount: number }> {
  if (!token) {
    throw new Error('GitHub Personal Access Token is required to commit and push.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Get current branch ref
  let parentCommitSha: string | null = null;
  let baseTreeSha: string | null = null;

  try {
    const refRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
      { headers }
    );

    if (refRes.ok) {
      const refData = await refRes.json();
      parentCommitSha = refData.object?.sha || null;

      if (parentCommitSha) {
        const commitRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/commits/${parentCommitSha}`,
          { headers }
        );
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          baseTreeSha = commitData.tree?.sha || null;
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch existing branch ref:', e);
  }

  // 2. Prepare Tree items
  const treeItems: Array<{ path: string; mode: string; type: string; sha?: string | null; content?: string }> = [];

  // Add deleted file entries (setting sha to null deletes them from the tree)
  for (const delPath of deletedPaths) {
    const clean = delPath.replace(/^\/+/, '').trim();
    if (clean) {
      treeItems.push({
        path: clean,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }
  }

  // Add files
  for (const file of files) {
    const cleanPath = file.path.replace(/^\/+/, '').trim();
    if (!cleanPath) continue;

    // If file already has a GitHub blob SHA and no modified content, reuse the blob directly
    if (file.sha && file.content === undefined) {
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: file.sha,
      });
      continue;
    }

    const fileContent = file.content ?? '';

    if (file.isBinary || file.encoding === 'base64') {
      // Create binary blob
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: fileContent,
          encoding: 'base64',
        }),
      });

      if (blobRes.ok) {
        const blobData = await blobRes.json();
        treeItems.push({
          path: cleanPath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      }
    } else {
      // Create UTF-8 blob
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: fileContent,
          encoding: 'utf-8',
        }),
      });

      if (blobRes.ok) {
        const blobData = await blobRes.json();
        treeItems.push({
          path: cleanPath,
          mode: '100644',
          type: 'blob',
          sha: blobData.sha,
        });
      } else {
        // Fallback to inline tree content
        treeItems.push({
          path: cleanPath,
          mode: '100644',
          type: 'blob',
          content: fileContent,
        });
      }
    }
  }

  if (treeItems.length === 0) {
    throw new Error('No files or changes to commit.');
  }

  // 3. Create Tree
  const treePayload: any = { tree: treeItems };
  if (baseTreeSha) {
    treePayload.base_tree = baseTreeSha;
  }

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify(treePayload),
  });

  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw parseGitHubError(treeRes.status, err.message, `Failed to create Git tree (${treeRes.status})`);
  }

  const treeData = await treeRes.json();
  const newTreeSha = treeData.sha;

  // 4. Create Commit
  const defaultCommitMsg = `Update ${files.length} file${files.length > 1 ? 's' : ''} - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const commitPayload: any = {
    message: message && message.trim() ? message.trim() : defaultCommitMsg,
    tree: newTreeSha,
    parents: parentCommitSha ? [parentCommitSha] : [],
  };

  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(commitPayload),
  });

  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw parseGitHubError(commitRes.status, err.message, `Failed to create Git commit (${commitRes.status})`);
  }

  const commitData = await commitRes.json();
  const newCommitSha = commitData.sha;

  // 5. Update or Create Branch Ref
  if (parentCommitSha) {
    const updateRefRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha,
          force: true,
        }),
      }
    );

    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}));
      throw parseGitHubError(refRes.status, err.message, `Failed to update branch ${branch} ref`);
    }
  } else {
    // Create new ref
    const createRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: newCommitSha,
      }),
    });

    if (!createRefRes.ok) {
      const err = await createRefRes.json().catch(() => ({}));
      throw parseGitHubError(createRefRes.status, err.message, `Failed to create branch ${branch} ref`);
    }
  }

  return {
    commitSha: newCommitSha,
    fileCount: files.length,
  };
}

export async function commitAndPushFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  token: string,
  sha?: string
): Promise<void> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // Convert content to Base64
  const bytes = new TextEncoder().encode(content);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Content = btoa(binary);

  const body: any = {
    message: message || `Update ${path}`,
    content: base64Content,
    branch,
  };

  if (sha) {
    body.sha = sha;
  } else {
    // Try to get sha if file already exists
    try {
      const fileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        { headers }
      );
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        if (fileData.sha) {
          body.sha = fileData.sha;
        }
      }
    } catch (e) {
      // New file
    }
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, err.message, `Failed to commit file ${path}`);
  }
}

export async function fetchCommitHistory(
  owner: string,
  repo: string,
  branch: string = 'main',
  token?: string | null
): Promise<CommitInfo[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=30`,
    { headers }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, `Failed to fetch commit history (${res.status})`);
  }

  const data = await res.json();
  return data.map((item: any) => ({
    sha: item.sha,
    shortSha: item.sha ? item.sha.substring(0, 7) : '',
    message: item.commit?.message || 'No commit message',
    authorName: item.commit?.author?.name || item.author?.login || 'Unknown',
    authorAvatar: item.author?.avatar_url,
    date: item.commit?.author?.date || '',
    htmlUrl: item.html_url,
    treeSha: item.commit?.tree?.sha,
  }));
}

export async function fetchUserRepositories(token: string): Promise<GitHubRepoItem[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator,organization_member',
    { headers }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, `Failed to fetch repositories (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchPublicUserRepos(username: string): Promise<GitHubRepoItem[]> {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw parseGitHubError(res.status, errData.message, `Failed to fetch public repositories (${res.status})`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function revertRepositoryToCommit(
  owner: string,
  repo: string,
  branch: string,
  targetCommitSha: string,
  targetTreeSha: string,
  token: string
): Promise<{ newCommitSha: string }> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Get current branch ref to use as parent
  const refRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`,
    { headers }
  );
  if (!refRes.ok) {
    throw new Error(`Failed to get current branch ref for ${branch}`);
  }
  const refData = await refRes.json();
  const parentCommitSha = refData.object.sha;

  // 2. Create a new commit using the old commit's tree
  const commitPayload = {
    message: `Revert to commit ${targetCommitSha.substring(0, 7)}`,
    tree: targetTreeSha,
    parents: [parentCommitSha],
  };

  const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify(commitPayload),
  });

  if (!commitRes.ok) {
    const errData = await commitRes.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to create revert commit.');
  }

  const commitData = await commitRes.json();
  const newCommitSha = commitData.sha;

  // 3. Update the branch ref
  const updateRefRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitSha }),
    }
  );

  if (!updateRefRes.ok) {
    throw new Error('Failed to update branch reference to revert commit.');
  }

  return { newCommitSha };
}
