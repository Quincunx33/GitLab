import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
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
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firebase client appears to be offline.');
    }
  }
}

export async function signInWithGitHubOAuth(): Promise<{ user: User; githubAccessToken: string | null }> {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const githubAccessToken = credential?.accessToken || null;

    if (result.user) {
      await saveUserProfile(result.user, result.user.displayName || 'GitHub User');
    }

    return { user: result.user, githubAccessToken };
  } catch (error: any) {
    console.error('GitHub Auth Error:', error);
    throw new Error(error.message || 'Failed to sign in with GitHub via Firebase');
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
