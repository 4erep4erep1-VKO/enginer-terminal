import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from '../lib/firebaseConfig';

export interface AppUser {
  uid: string;
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInAsDemoUser: (customEmail?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_STORAGE_KEY = 'terminal_auth_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Firebase Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        const mappedUser: AppUser = {
          uid: currentUser.uid,
          id: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Инженер',
          photoURL: currentUser.photoURL,
          user_metadata: {
            full_name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Инженер',
            avatar_url: currentUser.photoURL || undefined
          }
        };
        setUser(mappedUser);
      } else {
        // Fallback: check demo user in localStorage
        const storedDemo = localStorage.getItem(DEMO_USER_STORAGE_KEY);
        if (storedDemo) {
          try {
            setUser(JSON.parse(storedDemo));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.removeItem(DEMO_USER_STORAGE_KEY);
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInAsDemoUser = (customEmail?: string) => {
    const targetEmail = customEmail || 'engineer.vasilich@terminal.io';
    const mockUid = 'usr_demo_terminal_01';
    const mock: AppUser = {
      uid: mockUid,
      id: mockUid,
      email: targetEmail,
      displayName: 'Главный Механик',
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`,
      user_metadata: {
        full_name: 'Главный Механик',
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`
      }
    };
    setUser(mock);
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(mock));
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      firebaseUser: null,
      loading: false,
      signInWithEmail: async () => ({ error: 'Auth not initialized' }),
      signUpWithEmail: async () => ({ error: 'Auth not initialized' }),
      signInWithGoogle: async () => ({ error: 'Auth not initialized' }),
      signInAsDemoUser: () => {},
      signOut: async () => {},
    };
  }
  return context;
};
