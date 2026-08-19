import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Appearance } from 'react-native';

import {
  addCatalogSkillToUser,
  addCustomSkillToUser,
  deleteUserSkill,
  fetchMySkills,
  updateUserSkill,
} from '@/lib/user-skills';

import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { FREE_SKILL_LIMIT } from '@/features/premium/config';
import { PremiumSkillLimitError } from '@/features/premium/errors';

import {
  CatalogSkill,
  UserSkill,
} from '@/types';

type ThemeMode =
  | 'light'
  | 'dark';

type AppState = {
  skills: UserSkill[];

  theme: ThemeMode;

  unlockedAchievementIds: string[];
  achievementsLoaded: boolean;

  addSkill: (
    skill: CatalogSkill
  ) => Promise<void>;

  addCustomSkill: (
    name: string,
    category: string
  ) => Promise<void>;

  updateSkill: (
    id: string,
    patch: Partial<UserSkill>
  ) => Promise<void>;

  removeSkill: (
    id: string
  ) => Promise<void>;

  unlockAchievement: (
    id: string
  ) => void;

  setTheme: (
    theme: ThemeMode
  ) => void;
};

const AppContext =
  createContext<AppState | null>(
    null
  );

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, refreshCustomerInfo } = useSubscription();

  const [skills, setSkills] =
    useState<UserSkill[]>([]);

  const [
    unlockedAchievementIds,
    setUnlockedAchievementIds,
  ] = useState<string[]>([]);

  const [achievementsLoaded, setAchievementsLoaded] =
    useState(false);

  const [theme, setThemeState] =
    useState<ThemeMode>(
      Appearance.getColorScheme() ===
        'dark'
        ? 'dark'
        : 'light'
    );

  // Theme is a device preference, so it is shared across accounts.
  useEffect(() => {
    AsyncStorage.getItem('skillplus.theme')
      .then((savedTheme) => {
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setThemeState(savedTheme);
        }
      })
      .catch((error) => console.warn('Failed to load theme:', error));
  }, []);

  // Achievements are local for now, but isolated per authenticated account.
  useEffect(() => {
    let cancelled = false;
    setAchievementsLoaded(false);

    if (authLoading) return;

    if (!user) {
      setUnlockedAchievementIds([]);
      setAchievementsLoaded(true);
      return;
    }

    AsyncStorage.getItem(`skillplus.achievements.${user.id}`)
      .then((saved) => {
        if (cancelled) return;
        setUnlockedAchievementIds(saved ? JSON.parse(saved) : []);
        setAchievementsLoaded(true);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('Failed to load achievements:', error);
        setUnlockedAchievementIds([]);
        setAchievementsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  /*
   * Skills belong to the authenticated Supabase account.
   * AuthContext is the single source of truth for the session.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadUserSkills() {
      if (authLoading) return;

      if (!user) {
        setSkills([]);
        return;
      }

      try {
        const loadedSkills = await fetchMySkills();
        if (!cancelled) setSkills(loadedSkills);
      } catch (error) {
        if (!cancelled) {
          console.warn('Failed to load user skills:', error);
          setSkills([]);
        }
      }
    }

    loadUserSkills();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!user || !achievementsLoaded) return;

    AsyncStorage.setItem(
      `skillplus.achievements.${user.id}`,
      JSON.stringify(unlockedAchievementIds)
    ).catch((error) => {
      console.warn('Failed to save achievements:', error);
    });
  }, [unlockedAchievementIds, user?.id, achievementsLoaded]);

  const addSkill = async (
    skill: CatalogSkill
  ): Promise<void> => {
    const alreadyAdded =
      skills.some(
        (item) =>
          item.id === skill.id
      );

    if (alreadyAdded) {
      return;
    }

    if (!isPremium && skills.length >= FREE_SKILL_LIMIT) {
      const premiumNow = await refreshCustomerInfo();
      if (!premiumNow) {
        throw new PremiumSkillLimitError();
      }
    }

    try {
      const newSkill =
        await addCatalogSkillToUser(
          skill
        );

      setSkills((current) => [
        newSkill,
        ...current,
      ]);
    } catch (error) {
      console.error(
        'Failed to add skill:',
        error
      );

      throw error;
    }
  };

  const addCustomSkill = async (
    name: string,
    category: string
  ): Promise<void> => {
    if (!isPremium && skills.length >= FREE_SKILL_LIMIT) {
      const premiumNow = await refreshCustomerInfo();
      if (!premiumNow) {
        throw new PremiumSkillLimitError();
      }
    }

    try {
      const newSkill =
        await addCustomSkillToUser(
          name,
          category
        );

      setSkills((current) => [
        newSkill,
        ...current,
      ]);
    } catch (error) {
      console.error(
        'Failed to add custom skill:',
        error
      );

      throw error;
    }
  };

  /*
   * Optimistic update:
   *
   * UI changes immediately,
   * database save happens afterward.
   */
  const updateSkill = async (
    id: string,
    patch: Partial<UserSkill>
  ): Promise<void> => {
    const previousSkills =
      skills;

    setSkills((current) =>
      current.map((skill) =>
        skill.userSkillId === id
          ? {
              ...skill,
              ...patch,
            }
          : skill
      )
    );

    try {
      await updateUserSkill(
        id,
        patch
      );
    } catch (error) {
      console.error(
        'Failed to update skill:',
        error
      );

      /*
       * Try to restore the authoritative
       * state from Supabase.
       */
      try {
        const freshSkills =
          await fetchMySkills();

        setSkills(freshSkills);
      } catch (refreshError) {
        console.error(
          'Failed to refresh user skills:',
          refreshError
        );

        /*
         * If even the refresh fails,
         * restore what the UI had before.
         */
        setSkills(previousSkills);
      }

      throw error;
    }
  };

  const removeSkill = async (
    id: string
  ): Promise<void> => {
    const previousSkills =
      skills;

    setSkills((current) =>
      current.filter(
        (skill) =>
          skill.userSkillId !== id
      )
    );

    try {
      await deleteUserSkill(id);
    } catch (error) {
      console.error(
        'Failed to remove skill:',
        error
      );

      setSkills(
        previousSkills
      );

      throw error;
    }
  };

  const unlockAchievement = (
    id: string
  ) => {
    setUnlockedAchievementIds(
      (current) => {
        if (
          current.includes(id)
        ) {
          return current;
        }

        return [
          ...current,
          id,
        ];
      }
    );
  };

  const setTheme = (
    newTheme: ThemeMode
  ) => {
    setThemeState(
      newTheme
    );

    AsyncStorage.setItem(
      'skillplus.theme',
      newTheme
    ).catch((error) => {
      console.error(
        'Failed to save theme:',
        error
      );
    });
  };

  const value =
    useMemo<AppState>(
      () => ({
        skills,

        theme,

        unlockedAchievementIds,
        achievementsLoaded,

        addSkill,

        addCustomSkill,

        updateSkill,

        removeSkill,

        unlockAchievement,

        setTheme,
      }),
      [
        skills,
        theme,
        unlockedAchievementIds,
        achievementsLoaded,
        isPremium,
        refreshCustomerInfo,
      ]
    );

  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value =
    useContext(AppContext);

  if (!value) {
    throw new Error(
      'AppProvider missing'
    );
  }

  return value;
}

export const palette = (
  dark: boolean
) =>
  dark
    ? {
        bg: '#121212',
        card: '#1A1A1A',
        text: '#FFFFFF',
        muted: '#A3A3A3',

        primary: '#FF6A00',
        secondary: '#FF8C1A',

        border: '#2A2A2A',

        danger: '#FF3B30',
      }
    : {
        bg: '#F7F7F7',
        card: '#FFFFFF',
        text: '#121212',
        muted: '#6B6B6B',

        primary: '#FF6A00',
        secondary: '#FF8C1A',

        border: '#E2E2E2',

        danger: '#D93025',
      };