import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, getMe, updateMe } from '@/lib/api';

interface Profile {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  session: { token: string } | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('token');
        if (saved) {
          setSession({ token: saved });
          const data = await getMe(saved);
          setProfile(data.user);
        }
      } catch (e) {
        console.error('Auth init failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user } = await login(email, password);
    await AsyncStorage.setItem('token', token);
    setSession({ token });
    setProfile(user);
  };

  const signUp = async (email: string, password: string, name: string) => {
    await register(email, password, name);
    await signIn(email, password);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (_email: string) => {
    // Not implemented in backend yet; no-op to keep flow working
    return;
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!session?.token) throw new Error('Not authenticated');
    const data = await updateMe(session.token, { name: updates.name ?? undefined });
    setProfile(data.user);
  };

  const refreshProfile = async () => {
    if (session?.token) {
      const data = await getMe(session.token);
      setProfile(data.user);
    }
  };

  const value = {
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
