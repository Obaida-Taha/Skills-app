import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppText } from '@/components/UI';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (user) {
      router.replace('/');
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />

      <AppText style={styles.text}>
        Verifying your account...
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  text: {
    fontWeight: '700',
  },
});