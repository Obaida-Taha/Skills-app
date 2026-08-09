import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

export async function getMyProfile(): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfile;
}

export async function updateMyProfile(
  patch: Partial<
    Pick<
      UserProfile,
      | 'display_name'
      | 'username'
      | 'avatar_url'
      | 'bio'
    >
  >
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

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