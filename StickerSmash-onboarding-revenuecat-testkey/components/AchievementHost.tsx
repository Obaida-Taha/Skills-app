
import { AchievementPopup } from '@/features/achievements/AchievementPopup';
import { useAchievements } from '@/hooks/useAchievements';

export function AchievementHost() {
  const {
    activeAchievement,
    closeAchievement,
  } = useAchievements();

  return (
    <AchievementPopup
      achievement={activeAchievement}
      onClose={closeAchievement}
    />
  );
}