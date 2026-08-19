export type Difficulty =
  | 'Easy'
  | 'Intermediate'
  | 'Hard'
  | 'Beginner'
  | 'Advanced'
  | string;

export type SkillStatus =
  | 'in_progress'
  | 'paused'
  | 'finished';

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

export type SkillMedia = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  createdAt: string;
  caption?: string;
};

export type UserSkill = CatalogSkill & {
  userSkillId: string;
  status: SkillStatus;
  repetitions: number;
  seconds: number;
  xp: number;

  // Photos and videos documenting the skill
  media: SkillMedia[];
};

export type UserProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
};