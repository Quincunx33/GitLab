import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('repo');
githubProvider.addScope('user');
githubProvider.addScope('read:user');

export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'test'));
  } catch (error) {
    // Graceful connectivity probe; ignore network/offline probe errors
  }
}

export function formatAuthError(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  const code = error.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in cancelled. The GitHub login popup was closed.';
  }
  if (code === 'auth/popup-blocked') {
    return 'The login popup was blocked by your browser. Please allow popups for this site.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Another authentication popup is already active.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection failed. Please check your internet connection.';
  }
  return error.message || 'Failed to authenticate with GitHub via OAuth.';
}

export async function signInWithGitHubOAuth(): Promise<{ user: User; githubAccessToken: string | null }> {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const githubAccessToken = credential?.accessToken || null;

    if (result.user) {
      const screenName = (result.user as any).reloadUserInfo?.screenName || result.user.displayName || 'GitHub User';
      await saveUserProfile(result.user, screenName);
    }

    return { user: result.user, githubAccessToken };
  } catch (error: any) {
    console.error('GitHub Auth Error:', error);
    throw new Error(formatAuthError(error));
  }
}

export async function reconnectGitHubOAuth(): Promise<{ user: User; githubAccessToken: string | null }> {
  try {
    let result;
    if (auth.currentUser) {
      try {
        result = await reauthenticateWithPopup(auth.currentUser, githubProvider);
      } catch (reauthErr: any) {
        if (reauthErr?.code === 'auth/popup-closed-by-user' || reauthErr?.code === 'auth/popup-blocked') {
          throw reauthErr;
        }
        result = await signInWithPopup(auth, githubProvider);
      }
    } else {
      result = await signInWithPopup(auth, githubProvider);
    }

    const credential = GithubAuthProvider.credentialFromResult(result);
    const githubAccessToken = credential?.accessToken || null;

    if (result.user) {
      const screenName = (result.user as any).reloadUserInfo?.screenName || result.user.displayName || 'GitHub User';
      await saveUserProfile(result.user, screenName);
    }

    return { user: result.user, githubAccessToken };
  } catch (error: any) {
    console.error('GitHub Re-auth Error:', error);
    throw new Error(formatAuthError(error));
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function saveUserProfile(user: User, githubUsername?: string) {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous User',
        email: user.email || '',
        photoURL: user.photoURL || '',
        githubUsername: githubUsername || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Failed to save user profile in Firestore:', e);
  }
}

export { onAuthStateChanged, type User };
