import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  isSupabaseConfigured,
  supabase,
} from '@/lib/supabase';

type Auth = {
  user: User | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<string | null>;

  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<string | null>;

  reset: (
    email: string
  ) => Promise<string | null>;

  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * Handle Supabase links such as:
   *
   * skillplus://auth/callback#access_token=...
   *
   * and:
   *
   * skillplus://reset-password#access_token=...
   */
  async function handleAuthUrl(url: string) {
    try {
      console.log('AUTH DEEP LINK:', url);

      const hashIndex = url.indexOf('#');

      if (hashIndex === -1) {
        return;
      }

      const fragment = url.substring(hashIndex + 1);

      const params = new URLSearchParams(fragment);

      const accessToken =
        params.get('access_token');

      const refreshToken =
        params.get('refresh_token');

      const type =
        params.get('type');

      if (!accessToken || !refreshToken) {
        console.log(
          'Auth link did not contain session tokens.'
        );

        return;
      }

      const { data, error } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

      if (error) {
        console.error(
          'Failed to create session from deep link:',
          error
        );

        return;
      }

      setSession(data.session);

      console.log(
        'Supabase deep link successful:',
        type
      );
    } catch (error) {
      console.error(
        'Error handling auth deep link:',
        error
      );
    }
  }

  /*
   * Initial auth/session setup.
   */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          'Failed to get Supabase session:',
          error
        );

        setLoading(false);
      });

    const { data } =
      supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession);
        }
      );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  /*
   * Listen for Skill+ deep links while
   * the app is already running.
   */
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const subscription =
      Linking.addEventListener(
        'url',
        ({ url }) => {
          handleAuthUrl(url);
        }
      );

    /*
     * Handle a deep link that launched
     * the app from a closed state.
     */
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleAuthUrl(url);
        }
      })
      .catch((error) => {
        console.error(
          'Failed to read initial URL:',
          error
        );
      });

    return () => {
      subscription.remove();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string
  ) => {
    if (!isSupabaseConfigured) {
      return 'Add your Supabase URL and anon key to .env first.';
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    return error?.message ?? null;
  };

  const signUp = async (
    name: string,
    email: string,
    password: string
  ) => {
    if (!isSupabaseConfigured) {
      return 'Add your Supabase URL and anon key to .env first.';
    }

    const { error } =
      await supabase.auth.signUp({
        email,
        password,

        options: {
          emailRedirectTo:
            'skillplus://auth/callback',

          data: {
            display_name: name,
          },
        },
      });

    return error?.message ?? null;
  };

  const reset = async (
    email: string
  ) => {
    if (!isSupabaseConfigured) {
      return 'Add your Supabase URL and anon key to .env first.';
    }

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo:
            'skillplus://reset-password',
        }
      );

    return error?.message ?? null;
  };

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        'Sign out failed:',
        error
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        reset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value =
    useContext(AuthContext);

  if (!value) {
    throw new Error(
      'AuthProvider missing'
    );
  }

  return value;
}