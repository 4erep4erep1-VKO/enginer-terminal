import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Read from Vite environment variables (import.meta.env) with fallback to firebase-applet-config.json
const getEnvVar = (key: string): string => {
  try {
    return (import.meta as any).env?.[key] || '';
  } catch {
    return '';
  }
};

const jsonConfig = (firebaseConfigJson || {}) as Record<string, string>;

const apiKey = getEnvVar('VITE_FIREBASE_API_KEY') || jsonConfig.apiKey || '';
const authDomain = getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || jsonConfig.authDomain || '';
const projectId = getEnvVar('VITE_FIREBASE_PROJECT_ID') || jsonConfig.projectId || '';
const storageBucket = getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || jsonConfig.storageBucket || '';
const messagingSenderId = getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || jsonConfig.messagingSenderId || '';
const appId = getEnvVar('VITE_FIREBASE_APP_ID') || jsonConfig.appId || '';

export const isFirebaseConfigured = Boolean(apiKey && projectId);

const firebaseConfig = {
  apiKey: apiKey || 'demo-api-key-placeholder',
  authDomain: authDomain || 'demo-app.firebaseapp.com',
  projectId: projectId || 'demo-app-project',
  storageBucket: storageBucket || 'demo-app.appspot.com',
  messagingSenderId: messagingSenderId || '000000000000',
  appId: appId || '1:000000000000:web:0000000000000000000000',
};

let app: FirebaseApp;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initialization warning:', e);
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

// Initialize Firebase Services safely
export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

const dbId = jsonConfig.firestoreDatabaseId;
export const db: Firestore = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where
};

export type { User };
export default app;
