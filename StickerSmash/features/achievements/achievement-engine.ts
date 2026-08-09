import { UserSkill } from '@/types';
import { ACHIEVEMENTS } from './achievements';
import { Achievement, AchievementId } from './types';

export function getUnlockedAchievements(
  skills: UserSkill[]
): Achievement[] {
  const totalXp = skills.reduce(
    (sum, skill) => sum + skill.xp,
    0
  );

  const finishedCount = skills.filter(
    (skill) => skill.status === 'finished'
  ).length;

  const unlocked = new Set<AchievementId>();

  if (skills.length >= 1) {
    unlocked.add('first_skill');
  }

  if (
    skills.some(
      (skill) => skill.repetitions >= 10
    )
  ) {
    unlocked.add('ten_reps');
  }

  if (
    skills.some(
      (skill) => skill.repetitions >= 100
    )
  ) {
    unlocked.add('hundred_reps');
  }

  if (
    skills.some(
      (skill) => skill.seconds >= 3600
    )
  ) {
    unlocked.add('one_hour');
  }

  if (
    skills.some(
      (skill) => skill.seconds >= 36000
    )
  ) {
    unlocked.add('ten_hours');
  }

  if (finishedCount >= 1) {
    unlocked.add('first_finished');
  }

  if (skills.length >= 5) {
    unlocked.add('five_skills');
  }

  if (totalXp >= 1000) {
    unlocked.add('thousand_xp');
  }

  if (finishedCount >= 5) {
    unlocked.add('five_finished');
  }

  return ACHIEVEMENTS.filter((achievement) =>
    unlocked.has(achievement.id)
  );
}