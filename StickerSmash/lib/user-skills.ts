import { supabase } from '@/lib/supabase';

import {
  CatalogSkill,
  UserSkill,
} from '@/types';

type UserSkillRow = {
  id: string;
  user_id: string;
  skill_id: number | null;

  name: string;
  category: string;
  subCategory: string;

  difficulty: string;
  estimatedHours: string;
  description: string;

  status:
    | 'in_progress'
    | 'paused'
    | 'finished';

  repetitions: number;
  seconds: number;
  xp: number;

  created_at: string;
  updated_at: string;
};

function rowToUserSkill(
  row: UserSkillRow
): UserSkill {
  return {
    id:
      row.skill_id !== null
        ? String(row.skill_id)
        : `custom-${row.id}`,

    userSkillId: row.id,

    name: row.name,
    category: row.category,
    subCategory: row.subCategory,

    difficulty: row.difficulty,
    estimatedHours: row.estimatedHours,
    description: row.description,

    status: row.status,

    repetitions: row.repetitions,
    seconds: row.seconds,
    xp: row.xp,

    // Journey media will move to Supabase next.
    media: [],
  };
}

async function getCurrentUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error(
      'User is not signed in.'
    );
  }

  return user.id;
}

export async function fetchMySkills(): Promise<UserSkill[]> {
  const userId =
    await getCurrentUserId();

  const { data, error } =
    await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw error;
  }

  return (
    (data ?? []) as UserSkillRow[]
  ).map(rowToUserSkill);
}

export async function addCatalogSkillToUser(
  skill: CatalogSkill
): Promise<UserSkill> {
  const userId =
    await getCurrentUserId();

  const numericSkillId =
    Number(skill.id);

  if (Number.isNaN(numericSkillId)) {
    throw new Error(
      'Invalid catalog skill ID.'
    );
  }

  const { data, error } =
    await supabase
      .from('user_skills')
      .insert({
        user_id: userId,
        skill_id: numericSkillId,

        name: skill.name,
        category: skill.category,
        subCategory: skill.subCategory,

        difficulty: skill.difficulty,
        estimatedHours:
          skill.estimatedHours,
        description:
          skill.description,

        status: 'in_progress',

        repetitions: 0,
        seconds: 0,
        xp: 0,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return rowToUserSkill(
    data as UserSkillRow
  );
}

export async function addCustomSkillToUser(
  name: string,
  category: string
): Promise<UserSkill> {
  const userId =
    await getCurrentUserId();

  const { data, error } =
    await supabase
      .from('user_skills')
      .insert({
        user_id: userId,
        skill_id: null,

        name,
        category,
        subCategory: 'Custom',

        difficulty: 'Beginner',
        estimatedHours: '—',

        description:
          'A custom learning goal.',

        status: 'in_progress',

        repetitions: 0,
        seconds: 0,
        xp: 0,
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  return rowToUserSkill(
    data as UserSkillRow
  );
}

export async function updateUserSkill(
  userSkillId: string,
  patch: Partial<UserSkill>
): Promise<void> {
  const userId =
    await getCurrentUserId();

  const allowedPatch = {
    ...(patch.status !== undefined
      ? {
          status: patch.status,
        }
      : {}),

    ...(patch.repetitions !== undefined
      ? {
          repetitions:
            patch.repetitions,
        }
      : {}),

    ...(patch.seconds !== undefined
      ? {
          seconds: patch.seconds,
        }
      : {}),

    ...(patch.xp !== undefined
      ? {
          xp: patch.xp,
        }
      : {}),

    updated_at:
      new Date().toISOString(),
  };

  const { error } =
    await supabase
      .from('user_skills')
      .update(allowedPatch)
      .eq('id', userSkillId)
      .eq('user_id', userId);

  if (error) {
    throw error;
  }
}

export async function deleteUserSkill(
  userSkillId: string
): Promise<void> {
  const userId =
    await getCurrentUserId();

  const { error } =
    await supabase
      .from('user_skills')
      .delete()
      .eq('id', userSkillId)
      .eq('user_id', userId);

  if (error) {
    throw error;
  }
}