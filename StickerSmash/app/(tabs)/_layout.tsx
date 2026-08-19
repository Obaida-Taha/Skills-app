import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import {
  palette,
  useApp,
} from '@/contexts/AppContext';

export default function TabsLayout() {
  const { theme } = useApp();

  const c = palette(
    theme === 'dark'
  );

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor:
          c.primary,

        tabBarInactiveTintColor:
          c.muted,

        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          height: 64,
          paddingBottom: 8,
        },

        tabBarIcon: ({
          color,
          size,
        }) => (
          <Ionicons
            name={
              (
                {
                  home: 'home',
                  skills: 'flash',
                  discover: 'compass',
                  settings: 'settings',
                } as any
              )[route.name] ??
              'ellipse'
            }
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />

      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
        }}
      />

      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
    </Tabs>
  );
}