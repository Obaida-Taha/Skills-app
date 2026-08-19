import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export async function getMyProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as UserProfile | null;
}

export async function updateMyProfile(
  patch: Partial<
    Pick<
      UserProfile,
      'display_name' | 'username' | 'bio' | 'avatar_url'
    >
  >
): Promise<UserProfile> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('User is not signed in.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}