import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { palette, useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TabsLayout() {
  const { theme } = useApp();
  const { user, loading } = useAuth();
  const c = palette(theme === 'dark');

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          height: 64,
          paddingBottom: 8,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={
              ({
                home: 'home',
                skills: 'flash',
                discover: 'compass',
                settings: 'settings',
              } as const)[route.name as 'home' | 'skills' | 'discover' | 'settings'] ?? 'ellipse'
            }
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="skills" options={{ title: 'Skills' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
