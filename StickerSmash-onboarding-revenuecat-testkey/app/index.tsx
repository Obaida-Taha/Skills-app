import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { hasCompletedOnboarding } from '@/lib/onboarding';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding()
      .then(setOnboardingDone)
      .catch(() => setOnboardingDone(false));
  }, []);

  if (authLoading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={user ? '/(tabs)/home' : '/(auth)/login'} />;
}
