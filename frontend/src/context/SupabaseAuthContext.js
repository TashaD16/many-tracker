import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase';

const SupabaseAuthContext = createContext();

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUser(session.user);
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) {
        setUser(session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      // If profile doesn't exist, create it
      if (error.code === 'PGRST116') {
        // Profile not found, will be created on first use
        setProfile(null);
      }
    }
  };

  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0]
          }
        }
      });

      if (error) throw error;

      // Create user profile in User table after successful signup
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('User')
            .insert({
              id: data.user.id,
              email: data.user.email,
              name: name || email.split('@')[0],
              password: '' // Supabase handles password via auth.users
            });

          if (profileError) {
            // If profile already exists or other error, log but don't fail signup
            console.warn('Profile creation warning:', profileError);
          }
        } catch (profileErr) {
          console.warn('Could not create profile immediately:', profileErr);
          // Profile will be created on first login if needed
        }
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }

      return { user: data.user, session: data.session };
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error } = await supabase
        .from('User')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        supabase
      }}
    >
      {children}
    </SupabaseAuthContext.Provider>
  );
};
