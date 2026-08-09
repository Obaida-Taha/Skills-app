import { supabase } from '@/lib/supabase';
import { SkillMedia } from '@/types';

type SkillMediaRow = {
  id: string;
  user_id: string;
  user_skill_id: string;
  type: 'image' | 'video';
  storage_path: string;
  created_at: string;
};

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('User is not signed in.');
  }

  return user.id;
}

async function createMediaSignedUrl(
  storagePath: string
): Promise<string> {
  const { data, error } =
    await supabase.storage
      .from('skill-media')
      .createSignedUrl(
        storagePath,
        60 * 60
      );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export async function fetchSkillMedia(
  userSkillId: string
): Promise<SkillMedia[]> {
  const userId =
    await getCurrentUserId();

  const { data, error } =
    await supabase
      .from('skill_media')
      .select('*')
      .eq('user_id', userId)
      .eq(
        'user_skill_id',
        userSkillId
      )
      .order('created_at', {
        ascending: true,
      });

  if (error) {
    throw error;
  }

  const rows =
    (data ?? []) as SkillMediaRow[];

  const media =
    await Promise.all(
      rows.map(async (row) => ({
        id: row.id,

        type: row.type,

        uri:
          await createMediaSignedUrl(
            row.storage_path
          ),

        createdAt:
          row.created_at,
      }))
    );

  return media;
}

export async function uploadSkillMedia(
  userSkillId: string,
  localUri: string,
  type: 'image' | 'video'
): Promise<SkillMedia> {
  const userId =
    await getCurrentUserId();

  const extension =
    localUri
      .split('.')
      .pop()
      ?.split('?')[0]
      ?.toLowerCase() ||
    (type === 'video'
      ? 'mp4'
      : 'jpg');

  const filename =
    `${Date.now()}-` +
    `${Math.random()
      .toString(36)
      .slice(2)}.` +
    extension;

  const storagePath =
    `${userId}/${userSkillId}/${filename}`;

  const response =
    await fetch(localUri);

  const arrayBuffer =
    await response.arrayBuffer();

  const contentType = (() => {
    if (type === 'video') {
      if (extension === 'mov') return 'video/quicktime';
      if (extension === 'm4v') return 'video/x-m4v';
      return 'video/mp4';
    }

    if (extension === 'png') return 'image/png';
    if (extension === 'heic' || extension === 'heif') return 'image/heic';
    if (extension === 'webp') return 'image/webp';
    return 'image/jpeg';
  })();

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from('skill-media')
      .upload(
        storagePath,
        arrayBuffer,
        {
          contentType,
          upsert: false,
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: mediaRow,
    error: rowError,
  } =
    await supabase
      .from('skill_media')
      .insert({
        user_id: userId,

        user_skill_id:
          userSkillId,

        type,

        storage_path:
          storagePath,
      })
      .select()
      .single();

  if (rowError) {
    await supabase.storage
      .from('skill-media')
      .remove([
        storagePath,
      ]);

    throw rowError;
  }

  const row =
    mediaRow as SkillMediaRow;

  const signedUrl =
    await createMediaSignedUrl(
      row.storage_path
    );

  return {
    id: row.id,
    type: row.type,
    uri: signedUrl,
    createdAt:
      row.created_at,
  };
}

export async function deleteSkillMedia(
  mediaId: string
): Promise<void> {
  const userId =
    await getCurrentUserId();

  const {
    data,
    error,
  } =
    await supabase
      .from('skill_media')
      .select('storage_path')
      .eq('id', mediaId)
      .eq('user_id', userId)
      .single();

  if (error) {
    throw error;
  }

  // Remove the database row first so a Storage cleanup failure cannot
  // leave a broken media item visible in the app.
  const { error: rowError } = await supabase
    .from('skill_media')
    .delete()
    .eq('id', mediaId)
    .eq('user_id', userId);

  if (rowError) {
    throw rowError;
  }

  const { error: storageError } = await supabase.storage
    .from('skill-media')
    .remove([data.storage_path]);

  if (storageError) {
    console.warn('Media row deleted but Storage cleanup failed:', storageError);
  }
}