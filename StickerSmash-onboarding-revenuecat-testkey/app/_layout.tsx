import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AchievementHost } from '@/components/AchievementHost';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

function Root() {
  const { theme } = useApp();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <AchievementHost />
    </>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <AppProvider>
          <Root />
        </AppProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}
