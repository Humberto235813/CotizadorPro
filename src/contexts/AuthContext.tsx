import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '../../types';
import {
  onAuthChange,
  loginWithEmail,
  registerWithEmail,
  logout,
  resetPassword,
  getUserProfile,
  updateUserDisplayName,
} from '../../firebase';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleResetPassword: (email: string) => Promise<void>;
  handleUpdateDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = userProfile?.role === 'admin';
  const isPending = userProfile?.status === 'pending';

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const profile = await getUserProfile(u.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email: string, password: string) => {
    await loginWithEmail(email, password);
    toast.success('¡Bienvenido de nuevo!');
  };

  const register = async (email: string, password: string, displayName: string) => {
    await registerWithEmail(email, password, displayName);
    toast.success('¡Cuenta creada! Un administrador debe aprobar tu acceso.');
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al cerrar sesión');
    }
  };

  const handleResetPassword = async (email: string) => {
    await resetPassword(email);
  };

  const handleUpdateDisplayName = async (name: string) => {
    await updateUserDisplayName(name);
    toast.success('Nombre actualizado');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAdmin,
        isPending,
        login,
        register,
        handleLogout,
        handleResetPassword,
        handleUpdateDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
