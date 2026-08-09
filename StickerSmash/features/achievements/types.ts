export type AchievementId =
  | 'first_skill'
  | 'ten_reps'
  | 'hundred_reps'
  | 'one_hour'
  | 'ten_hours'
  | 'first_finished'
  | 'five_skills'
  | 'thousand_xp'
  | 'five_finished';

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
};