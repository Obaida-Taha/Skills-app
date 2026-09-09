import { supabase } from '@/lib/supabase';

export async function deleteMyAccount(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } =
    await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      'You are not signed in.'
    );
  }

  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      'delete-account',
      {
        method: 'POST',
        headers: {
          Authorization:
            `Bearer ${session.access_token}`,
        },
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.success) {
    throw new Error(
      data?.error ??
        'Could not delete account.'
    );
  }
}