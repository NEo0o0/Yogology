import { useState, useEffect } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase/client';
import type { Tables } from '../types/database.types';

type Profile = Tables<'profiles'>;

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
}

let cachedAuthState: AuthState = {
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,
};

let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;
const authListeners = new Set<(state: AuthState) => void>();

function emitAuthState(next: AuthState) {
  cachedAuthState = next;
  authListeners.forEach((listener) => listener(next));
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.warn('No User ID to fetch profile');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') {
        console.warn('Profile not found, returning null/default user.');
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('CRITICAL PROFILE ERROR:', error);
    console.log('Attempted User ID:', userId);
    return null;
  }
}

async function initAuthOnce() {
  if (authInitialized) return;
  authInitialized = true;

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      emitAuthState({
        user: session.user,
        profile,
        session,
        loading: false,
        error: null,
      });
    } else {
      emitAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      });
    }
  } catch (error) {
    emitAuthState({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: error as AuthError,
    });
  }

  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('[Auth] Event:', event, 'Session:', !!session);

    // Handle SIGNED_OUT - Clear state and force redirect for cross-tab sync
    if (event === 'SIGNED_OUT') {
      console.log('[Auth] User signed out - clearing state and redirecting');
      emitAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      });
      // Clear any cached data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user-profile');
        // Force redirect to home page to clear stale app state
        window.location.href = '/';
      }
      return;
    }

    // Handle no session (shouldn't happen with proper events, but safety check)
    if (!session?.user) {
      console.log('[Auth] No session/user - clearing state');
      emitAuthState({
        user: null,
        profile: null,
        session: null,
        loading: false,
        error: null,
      });
      return;
    }

    // Handle SIGNED_IN and TOKEN_REFRESHED - Update session and refetch profile
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      console.log('[Auth] Signed in or token refreshed - updating session and fetching profile');
      
      // Immediately update session and user
      emitAuthState({
        ...cachedAuthState,
        user: session.user,
        session,
        loading: true, // Show loading while fetching fresh profile
        error: null,
      });

      // Fetch fresh profile data
      const profile = await fetchProfile(session.user.id);
      emitAuthState({
        user: session.user,
        profile,
        session,
        loading: false,
        error: null,
      });
      return;
    }

    // Handle other events (INITIAL_SESSION, USER_UPDATED, etc.)
    console.log('[Auth] Other event - updating state');
    const hasProfile = cachedAuthState.profile !== null;
    
    emitAuthState({
      ...cachedAuthState,
      user: session.user,
      session,
      loading: !hasProfile,
      error: null,
    });

    const profile = await fetchProfile(session.user.id);
    emitAuthState({
      user: session.user,
      profile,
      session,
      loading: false,
      error: null,
    });
  });

  authSubscription = data.subscription;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(cachedAuthState);

  useEffect(() => {
    let mounted = true;

    authListeners.add((next) => {
      if (mounted) setAuthState(next);
    });

    void initAuthOnce();

    return () => {
      mounted = false;
      authListeners.delete(setAuthState);
    };
  }, []);

  async function checkIsAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  const signUp = async (options: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    contactInfo: string;
    contactPlatform?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: options.email,
        password: options.password,
        options: {
          data: {
            full_name: options.fullName,
            phone: options.phone,
            contact_info: options.contactInfo,
            contact_platform: options.contactPlatform,
          },
        },
      });

      if (error) throw error;

      // Fetch the created profile
      if (data.user) {
        const profile = await fetchProfile(data.user.id);
        return { data: { ...data, profile }, error: null };
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!authState.user) {
      return { data: null, error: new Error('No user logged in') };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single();

      if (error) throw error;

      setAuthState(prev => ({
        ...prev,
        profile: data,
      }));

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Get user role for easy access
  const userRole = authState.profile?.role || 'member';

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    checkIsAdmin,
    isAuthenticated: !!authState.user,
    userRole, // Export the role directly
    isAdmin: userRole === 'admin',
    isStaff: userRole === 'admin' || userRole === 'staff', // Staff includes admin
    isInstructor: userRole === 'instructor',
    isMember: userRole === 'member',
  };
}
