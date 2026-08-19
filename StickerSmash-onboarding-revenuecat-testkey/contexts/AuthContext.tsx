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

type SignUpResult = {
  error: string | null;
  needsVerification: boolean;
};

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
  ) => Promise<SignUpResult>;

  reset: (
    email: string
  ) => Promise<string | null>;

  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<Auth | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  async function handleAuthUrl(
    url: string
  ) {
    try {
      const hashIndex =
        url.indexOf('#');

      if (hashIndex === -1) {
        return;
      }

      const fragment =
        url.substring(
          hashIndex + 1
        );

      const params =
        new URLSearchParams(
          fragment
        );

      const accessToken =
        params.get(
          'access_token'
        );

      const refreshToken =
        params.get(
          'refresh_token'
        );

      const type =
        params.get('type');

      if (
        !accessToken ||
        !refreshToken
      ) {
        console.log(
          'Auth link did not contain session tokens.'
        );

        return;
      }

      const {
        data,
        error,
      } =
        await supabase.auth.setSession(
          {
            access_token:
              accessToken,

            refresh_token:
              refreshToken,
          }
        );

      if (error) {
        console.warn(
          'Failed to create session from deep link:',
          error
        );

        return;
      }

      setSession(
        data.session
      );

      console.log(
        'Supabase deep link successful:',
        type
      );
    } catch (error) {
      console.warn(
        'Error handling auth deep link:',
        error
      );
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function initializeAuth() {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          console.warn(
            'Failed to get Supabase session:',
            error
          );
        }

        if (mounted) {
          setSession(
            data.session ?? null
          );

          setLoading(false);
        }
      } catch (error) {
        console.warn(
          'Failed to initialize Supabase auth:',
          error
        );

        if (mounted) {
          setSession(null);
          setLoading(false);
        }
      }
    }

    initializeAuth();

    const { data } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          newSession
        ) => {
          if (!mounted) {
            return;
          }

          setSession(
            newSession
          );

          setLoading(false);
        }
      );

    return () => {
      mounted = false;

      data.subscription.unsubscribe();
    };
  }, []);

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

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleAuthUrl(url);
        }
      })
      .catch((error) => {
        console.warn(
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
  ): Promise<
    string | null
  > => {
    if (
      !isSupabaseConfigured
    ) {
      return 'Add your Supabase URL and anon key to .env first.';
    }

    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      return error.message;
    }

    setSession(
      data.session
    );

    return null;
  };

  const signUp = async (
    name: string,
    email: string,
    password: string
  ): Promise<SignUpResult> => {
    if (
      !isSupabaseConfigured
    ) {
      return {
        error:
          'Add your Supabase URL and anon key to .env first.',
        needsVerification:
          false,
      };
    }

    const {
      data,
      error,
    } =
      await supabase.auth.signUp(
        {
          email,
          password,

          options: {
            emailRedirectTo:
              'skillplus://auth/callback',

            data: {
              display_name:
                name,
            },
          },
        }
      );

    if (error) {
      return {
        error:
          error.message,

        needsVerification:
          false,
      };
    }

    if (data.session) {
      setSession(
        data.session
      );
    }

    return {
      error: null,

      needsVerification:
        data.session === null,
    };
  };

  const reset = async (
    email: string
  ): Promise<
    string | null
  > => {
    if (
      !isSupabaseConfigured
    ) {
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

    return (
      error?.message ??
      null
    );
  };

  const signOut =
    async (): Promise<void> => {
      const { error } =
        await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        console.warn(
          'Sign out failed:',
          error
        );

        return;
      }

      setSession(null);
    };

  return (
    <AuthContext.Provider
      value={{
        user:
          session?.user ??
          null,

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
    useContext(
      AuthContext
    );

  if (!value) {
    throw new Error(
      'AuthProvider missing'
    );
  }

  return value;
}