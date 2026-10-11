import { openDB } from 'idb';
import { FileNode, Tab, RepoInfo } from '../types';

const DB_NAME = 'PushFlowDB';
const STORE_NAME = 'workspace';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

export interface WorkspaceState {
  fileStructure: FileNode | null;
  tabs: Tab[];
  activeTabId: string | null;
  repoInfo: RepoInfo | null;
  currentBranch: string;
  stagedChanges: Array<[string, string]>;
  deletedFiles: string[];
}

export async function saveWorkspace(state: WorkspaceState) {
  const db = await dbPromise;
  await db.put(STORE_NAME, state, 'current');
}

export async function loadWorkspace(): Promise<WorkspaceState | null> {
  const db = await dbPromise;
  return await db.get(STORE_NAME, 'current');
}
