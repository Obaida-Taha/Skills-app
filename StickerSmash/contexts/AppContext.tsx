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

import { supabase } from '@/lib/supabase';

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
  const [skills, setSkills] =
    useState<UserSkill[]>([]);

  const [
    unlockedAchievementIds,
    setUnlockedAchievementIds,
  ] = useState<string[]>([]);

  const [theme, setThemeState] =
    useState<ThemeMode>(
      Appearance.getColorScheme() ===
        'dark'
        ? 'dark'
        : 'light'
    );

  /*
   * Load local-only preferences.
   *
   * Skills are NOT stored here anymore.
   */
  useEffect(() => {
    async function loadSavedData() {
      try {
        const rows =
          await AsyncStorage.multiGet([
            'skillplus.theme',
            'skillplus.achievements',
          ]);

        const savedTheme =
          rows[0][1];

        const savedAchievements =
          rows[1][1];

        if (savedTheme) {
          setThemeState(
            savedTheme as ThemeMode
          );
        }

        if (savedAchievements) {
          setUnlockedAchievementIds(
            JSON.parse(
              savedAchievements
            )
          );
        }
      } catch (error) {
        console.error(
          'Failed to load local app data:',
          error
        );
      }
    }

    loadSavedData();
  }, []);

  /*
   * Skills belong to the authenticated
   * Supabase account.
   */
  useEffect(() => {
    async function loadUserSkills() {
      try {
        const {
          data: { session },
        } =
          await supabase.auth.getSession();

        if (!session) {
          setSkills([]);
          return;
        }

        const loadedSkills =
          await fetchMySkills();

        setSkills(loadedSkills);
      } catch (error) {
        console.error(
          'Failed to load user skills:',
          error
        );
      }
    }

    loadUserSkills();

    const { data } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (!session) {
            setSkills([]);
            return;
          }

          loadUserSkills();
        }
      );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  /*
   * Achievements are still local.
   * We'll move these to Supabase later.
   */
  useEffect(() => {
    AsyncStorage.setItem(
      'skillplus.achievements',
      JSON.stringify(
        unlockedAchievementIds
      )
    ).catch((error) => {
      console.error(
        'Failed to save achievements:',
        error
      );
    });
  }, [unlockedAchievementIds]);

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