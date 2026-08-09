export type Difficulty =
  | 'Easy'
  | 'Intermediate'
  | 'Hard'
  | 'Beginner'
  | 'Advanced'
  | string;

export type SkillStatus = 'in_progress' | 'paused' | 'finished';

export type CatalogSkill = {
  id: string;
  category: string;
  subCategory: string;
  name: string;
  difficulty: Difficulty;
  estimatedHours: string;
  description: string;
  icon?: string | null;
};

export type UserSkill = CatalogSkill & {
  userSkillId: string;
  status: SkillStatus;
  repetitions: number;
  seconds: number;
  xp: number;
};