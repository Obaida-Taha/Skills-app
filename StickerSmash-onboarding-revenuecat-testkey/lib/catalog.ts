import { supabase } from '@/lib/supabase';
import { CatalogSkill, Difficulty } from '@/types';

type SkillRow = {
  id: string | number;
  category: string;
  subCategory?: string | null;
  sub_category?: string | null;
  name: string;
  difficulty: string;
  estimatedHours?: string | null;
  estimated_hours?: string | null;
  description: string;
  icon?: string | null;
};

export async function fetchCatalogSkills(): Promise<CatalogSkill[]> {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
  console.log('SKILLS LOAD ERROR:', error);
  throw new Error(error.message);
}

  return ((data ?? []) as SkillRow[]).map((row) => ({
    id: String(row.id),
    category: row.category,
    subCategory: row.subCategory ?? row.sub_category ?? 'Other',
    name: row.name,
    difficulty: row.difficulty as Difficulty,
    estimatedHours: row.estimatedHours ?? row.estimated_hours ?? '—',
    description: row.description,
    icon: row.icon ?? null,
  }));
}