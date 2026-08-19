import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'skillplus.onboarding.completed.v1';

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

// Handy during development if you want to see onboarding again.
export async function resetOnboarding(): Promise<void> {
  await AsyncStorage.removeItem(ONBOARDING_KEY);
}
