// Declaración de tipos para Vite env
interface ImportMetaEnv {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, limit } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { UserProfile } from "./types";

// ── SEC-01: Allowed email domains for registration ──
const ALLOWED_DOMAINS = ['3hrconsultores.com.mx'];

export const isEmailAllowed = (email: string): boolean => {
  if (!ALLOWED_DOMAINS.length) return true; // If empty, allow all
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
};

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Función para crear o actualizar el perfil del usuario en Firestore
export const createOrUpdateUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const now = new Date().toISOString();

  if (!userSnap.exists()) {
    // SEC-01: Validate email domain before allowing profile creation
    if (user.email && !isEmailAllowed(user.email)) {
      throw new Error('DOMAIN_NOT_ALLOWED');
    }

    // New users always get 'user' role.
    // Admin role must be granted manually by an existing admin.
    const role: UserProfile['role'] = 'user';

    const newProfile: Omit<UserProfile, 'photoURL'> & { photoURL?: string } = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      role,
      createdAt: now,
      lastLogin: now,
      preferences: {
        notifications: true,
      },
    };

    if (user.photoURL) {
      newProfile.photoURL = user.photoURL;
    }

    await setDoc(userRef, newProfile);
  } else {
    // Existing user — just update lastLogin
    const updateData: Partial<UserProfile> = {
      lastLogin: now,
      displayName: user.displayName || '',
    };

    if (user.photoURL) {
      updateData.photoURL = user.photoURL;
    }

    await setDoc(userRef, updateData, { merge: true });
  }
};

// Función para obtener el perfil del usuario desde Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }

  return null;
};

// Funciones de autenticación
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  // Actualizar perfil en Firestore al hacer login
  await createOrUpdateUserProfile(userCredential.user);

  return userCredential.user;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  // SEC-01: Validate domain BEFORE creating the Firebase Auth account
  if (!isEmailAllowed(email)) {
    throw { code: 'auth/domain-not-allowed', message: 'Dominio de email no permitido' };
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(userCredential.user, { displayName });
  await createOrUpdateUserProfile(userCredential.user);

  return userCredential.user;
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
};

export const resetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/** Update the current user's display name */
export const updateUserDisplayName = async (name: string): Promise<void> => {
  if (!auth.currentUser) throw new Error('No hay usuario autenticado');
  await updateProfile(auth.currentUser, { displayName: name });
};

export { db, storage, auth };