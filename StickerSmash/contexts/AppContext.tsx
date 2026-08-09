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
  CatalogSkill,
  UserSkill,
} from '@/types';

type ThemeMode = 'light' | 'dark';

type AppState = {
  skills: UserSkill[];
  theme: ThemeMode;

  addSkill: (skill: CatalogSkill) => void;

  addCustomSkill: (
    name: string,
    category: string
  ) => void;

  updateSkill: (
    id: string,
    patch: Partial<UserSkill>
  ) => void;

  removeSkill: (id: string) => void;

  setTheme: (theme: ThemeMode) => void;
};

const AppContext =
  createContext<AppState | null>(null);

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [skills, setSkills] = useState<UserSkill[]>([]);

  const [theme, setThemeState] =
    useState<ThemeMode>(
      Appearance.getColorScheme() === 'dark'
        ? 'dark'
        : 'light'
    );

  useEffect(() => {
    async function loadSavedData() {
      const rows = await AsyncStorage.multiGet([
        'skillplus.skills',
        'skillplus.theme',
      ]);

      const savedSkills = rows[0][1];
      const savedTheme = rows[1][1];

      if (savedSkills) {
        const parsed: UserSkill[] =
          JSON.parse(savedSkills);

        // Makes old saved skills compatible
        // with the new media feature.
        const repaired = parsed.map((skill) => ({
          ...skill,
          media: skill.media ?? [],
        }));

        setSkills(repaired);
      }

      if (savedTheme) {
        setThemeState(
          savedTheme as ThemeMode
        );
      }
    }

    loadSavedData();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(
      'skillplus.skills',
      JSON.stringify(skills)
    );
  }, [skills]);

  const addSkill = (skill: CatalogSkill) => {
    setSkills((current) => {
      const alreadyAdded = current.some(
        (item) => item.id === skill.id
      );

      if (alreadyAdded) {
        return current;
      }

      const newSkill: UserSkill = {
        ...skill,

        userSkillId: `local-${Date.now()}`,

        status: 'in_progress',

        repetitions: 0,
        seconds: 0,
        xp: 0,

        media: [],
      };

      return [...current, newSkill];
    });
  };

  const addCustomSkill = (
    name: string,
    category: string
  ) => {
    addSkill({
      id: `custom-${Date.now()}`,
      name,
      category,
      subCategory: 'Custom',
      difficulty: 'Beginner',
      estimatedHours: '—',
      description:
        'A custom learning goal.',
    });
  };

  const updateSkill = (
    id: string,
    patch: Partial<UserSkill>
  ) => {
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
  };

  const removeSkill = (id: string) => {
    setSkills((current) =>
      current.filter(
        (skill) =>
          skill.userSkillId !== id
      )
    );
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);

    AsyncStorage.setItem(
      'skillplus.theme',
      newTheme
    );
  };

  const value = useMemo(
    () => ({
      skills,
      theme,
      addSkill,
      addCustomSkill,
      updateSkill,
      removeSkill,
      setTheme,
    }),
    [skills, theme]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error(
      'AppProvider missing'
    );
  }

  return value;
}

export const palette = (dark: boolean) =>
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