import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  unitId: string | null;
  hospitalId: string | null;
  isLoading: boolean;
  loginWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  registerAccount: (data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    unitId?: string;
    hospitalId?: string;
  }) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Built-in Demo Credentials Map (Fallback & Instant Testing)
export const DEMO_USERS: Record<string, { pass: string; profile: UserProfile }> = {
  'dispatcher@resqnet.org': {
    pass: 'admin123',
    profile: {
      id: 'usr-disp-1',
      email: 'dispatcher@resqnet.org',
      fullName: 'Chief Dispatcher V. Anand',
      role: 'dispatcher',
    }
  },
  'alpha1@resqnet.org': {
    pass: '1234',
    profile: {
      id: 'usr-resp-1',
      email: 'alpha1@resqnet.org',
      fullName: 'Paramedic Dr. Priya Raman',
      role: 'responder',
      unitId: 'unit-1', // Ambulance Alpha-1
    }
  },
  'squad9@resqnet.org': {
    pass: '9999',
    profile: {
      id: 'usr-resp-3',
      email: 'squad9@resqnet.org',
      fullName: 'Capt. Ramesh (Fire Rescue)',
      role: 'responder',
      unitId: 'unit-3', // Fire Rescue Squad-9
    }
  },
  'patrol7@resqnet.org': {
    pass: '7777',
    profile: {
      id: 'usr-resp-4',
      email: 'patrol7@resqnet.org',
      fullName: 'Insp. Karthik (Police Patrol)',
      role: 'responder',
      unitId: 'unit-4', // Police Patrol Cruiser-7
    }
  },
  'apollo@resqnet.org': {
    pass: 'hospital123',
    profile: {
      id: 'usr-hosp-2',
      email: 'apollo@resqnet.org',
      fullName: 'Apollo ER Triage Director',
      role: 'hospital',
      hospitalId: 'hosp-2', // Apollo Main Hospital
    }
  },
  'rgggh@resqnet.org': {
    pass: 'hospital123',
    profile: {
      id: 'usr-hosp-1',
      email: 'rgggh@resqnet.org',
      fullName: 'RGGGH Trauma Center Staff',
      role: 'hospital',
      hospitalId: 'hosp-1', // Rajiv Gandhi Govt General Hospital
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('resqnet_auth_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and listen to Supabase Auth state if configured
  useEffect(() => {
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user) {
          supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profileData }) => {
              if (profileData) {
                const loadedProfile: UserProfile = {
                  id: profileData.id,
                  email: session.user.email || '',
                  fullName: profileData.full_name || 'Staff User',
                  role: profileData.role,
                  unitId: profileData.unit_id,
                  hospitalId: profileData.hospital_id,
                };
                setUser(loadedProfile);
                localStorage.setItem('resqnet_auth_user', JSON.stringify(loadedProfile));
              }
            });
        }
        setIsLoading(false);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session && session.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            const loadedProfile: UserProfile = {
              id: profileData.id,
              email: session.user.email || '',
              fullName: profileData.full_name || 'Staff User',
              role: profileData.role,
              unitId: profileData.unit_id,
              hospitalId: profileData.hospital_id,
            };
            setUser(loadedProfile);
            localStorage.setItem('resqnet_auth_user', JSON.stringify(loadedProfile));
          }
        } else if (!session && isSupabaseConfigured) {
          setUser(null);
          localStorage.removeItem('resqnet_auth_user');
        }
        setIsLoading(false);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Try Supabase Auth first if configured
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password: pass });
        if (error) {
          console.warn('Supabase auth attempt failed, checking local and demo accounts:', error.message);
        } else if (data.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileData) {
            const loadedProfile: UserProfile = {
              id: profileData.id,
              email: data.user.email || normalizedEmail,
              fullName: profileData.full_name || 'Staff User',
              role: profileData.role,
              unitId: profileData.unit_id,
              hospitalId: profileData.hospital_id,
            };
            setUser(loadedProfile);
            localStorage.setItem('resqnet_auth_user', JSON.stringify(loadedProfile));
            setIsLoading(false);
            return { success: true, role: loadedProfile.role };
          }
        }
      } catch (err) {
        console.error('Supabase signIn error:', err);
      }
    }

    // 2. Check Custom Registered Users (saved locally)
    const customUsersRaw = localStorage.getItem('resqnet_custom_users');
    if (customUsersRaw) {
      try {
        const customUsers: Record<string, { pass: string; profile: UserProfile }> = JSON.parse(customUsersRaw);
        const registered = customUsers[normalizedEmail];
        if (registered && registered.pass === pass) {
          setUser(registered.profile);
          localStorage.setItem('resqnet_auth_user', JSON.stringify(registered.profile));
          setIsLoading(false);
          return { success: true, role: registered.profile.role };
        }
      } catch {
        // safe catch
      }
    }

    // 3. Demo User Fallback check
    const demo = DEMO_USERS[normalizedEmail];
    if (demo && demo.pass === pass) {
      setUser(demo.profile);
      localStorage.setItem('resqnet_auth_user', JSON.stringify(demo.profile));
      setIsLoading(false);
      return { success: true, role: demo.profile.role };
    }

    setIsLoading(false);
    return { success: false, error: 'Invalid email or password. Please check your credentials or create an account.' };
  };

  const registerAccount = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: UserRole;
    unitId?: string;
    hospitalId?: string;
  }): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    const normalizedEmail = data.email.toLowerCase().trim();

    if (!normalizedEmail || !data.password || !data.fullName) {
      setIsLoading(false);
      return { success: false, error: 'Please complete all required fields.' };
    }

    if (data.password.length < 4) {
      setIsLoading(false);
      return { success: false, error: 'Password must be at least 4 characters.' };
    }

    const newUserId = `usr-${Date.now().toString().slice(-6)}`;
    const newProfile: UserProfile = {
      id: newUserId,
      email: normalizedEmail,
      fullName: data.fullName.trim(),
      role: data.role,
      unitId: data.role === 'responder' ? (data.unitId || 'unit-1') : undefined,
      hospitalId: data.role === 'hospital' ? (data.hospitalId || 'hosp-2') : undefined,
    };

    // 1. Supabase Auth Registration if configured
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: data.password,
          options: {
            data: {
              full_name: newProfile.fullName,
              role: newProfile.role,
              unit_id: newProfile.unitId,
              hospital_id: newProfile.hospitalId,
            }
          }
        });

        if (authError) {
          console.warn('Supabase sign-up error, saving to local accounts:', authError.message);
        } else if (authData.user) {
          newProfile.id = authData.user.id;
          await supabase.from('profiles').upsert({
            id: authData.user.id,
            full_name: newProfile.fullName,
            role: newProfile.role,
            unit_id: newProfile.unitId,
            hospital_id: newProfile.hospitalId,
            updated_at: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error('Supabase registration error:', err);
      }
    }

    // 2. Save into persistent custom users map
    try {
      const customUsersRaw = localStorage.getItem('resqnet_custom_users');
      const customUsers = customUsersRaw ? JSON.parse(customUsersRaw) : {};
      customUsers[normalizedEmail] = {
        pass: data.password,
        profile: newProfile
      };
      localStorage.setItem('resqnet_custom_users', JSON.stringify(customUsers));
    } catch {
      // safe catch
    }

    // 3. Set as currently logged-in user
    setUser(newProfile);
    localStorage.setItem('resqnet_auth_user', JSON.stringify(newProfile));
    setIsLoading(false);

    return { success: true, role: newProfile.role };
  };

  const logout = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Supabase sign out error:', err);
      }
    }
    setUser(null);
    localStorage.removeItem('resqnet_auth_user');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        unitId: user?.unitId || null,
        hospitalId: user?.hospitalId || null,
        isLoading,
        loginWithPassword,
        registerAccount,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
