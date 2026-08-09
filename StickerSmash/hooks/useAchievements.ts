import { useEffect, useMemo, useState } from 'react';

import { useApp } from '@/contexts/AppContext';

import { getUnlockedAchievements } from '@/features/achievements/achievement-engine';
import { Achievement } from '@/features/achievements/types';

export function useAchievements() {
  const {
    skills,
    unlockedAchievementIds,
    unlockAchievement,
  } = useApp();

  const [
    activeAchievement,
    setActiveAchievement,
  ] = useState<Achievement | null>(null);

  const unlockedNow = useMemo(() => {
    return getUnlockedAchievements(skills);
  }, [skills]);

  useEffect(() => {
    if (activeAchievement) {
      return;
    }

    const newAchievement =
      unlockedNow.find(
        (achievement) =>
          !unlockedAchievementIds.includes(
            achievement.id
          )
      );

    if (!newAchievement) {
      return;
    }

    unlockAchievement(newAchievement.id);

    setActiveAchievement(
      newAchievement
    );
  }, [
    unlockedNow,
    unlockedAchievementIds,
    unlockAchievement,
    activeAchievement,
  ]);

  function closeAchievement() {
    setActiveAchievement(null);
  }

  return {
    activeAchievement,
    closeAchievement,
  };
}